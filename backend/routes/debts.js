const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { body } = require('express-validator');
const { validateRequest } = require('../middleware/validation');

const debtValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('interest_rate').optional().isFloat({ min: 0, max: 100 }).withMessage('Interest rate must be between 0 and 100'),
  body('due_date').optional().isISO8601().withMessage('Valid date is required'),
  validateRequest
];

// Get all debts
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const result = await db.query(
    `SELECT d.*, 
      COALESCE(d.amount - d.paid_amount, d.amount) as remaining_amount
     FROM debts d
     WHERE d.user_id = $1 
     ORDER BY due_date ASC NULLS LAST, created_at DESC`,
    [req.userId]
  );
  res.json(result.rows);
}));

// Get single debt
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const result = await db.query(
    `SELECT d.*, 
      COALESCE(d.amount - d.paid_amount, d.amount) as remaining_amount
     FROM debts d
     WHERE d.id = $1 AND d.user_id = $2`,
    [req.params.id, req.userId]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Debt not found' });
  }
  
  res.json(result.rows[0]);
}));

// Get transactions for a specific debt
router.get('/:id/transactions', authenticate, asyncHandler(async (req, res) => {
  const result = await db.query(
    `SELECT dt.* 
     FROM debt_transactions dt
     JOIN debts d ON dt.debt_id = d.id
     WHERE dt.debt_id = $1 AND d.user_id = $2
     ORDER BY dt.date DESC, dt.created_at DESC`,
    [req.params.id, req.userId]
  );
  res.json(result.rows);
}));

// Add transaction to a debt (payment or increase)
router.post('/:id/transactions', authenticate, [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('type').isIn(['payment', 'increase']).withMessage('Type must be payment or increase'),
  body('date').optional().isISO8601().withMessage('Valid date is required'),
  body('description').optional().trim(),
  validateRequest
], asyncHandler(async (req, res) => {
  const { amount, type, description, date } = req.body;
  const debtId = req.params.id;
  const transactionDate = date || new Date().toISOString().split('T')[0];
  
  // Verify debt belongs to user and get debt name
  const debtCheck = await db.query(
    'SELECT id, name FROM debts WHERE id = $1 AND user_id = $2',
    [debtId, req.userId]
  );
  
  if (debtCheck.rows.length === 0) {
    return res.status(404).json({ message: 'Debt not found' });
  }
  
  const debtName = debtCheck.rows[0].name;
  
  // Begin transaction
  await db.query('BEGIN');
  
  try {
    // Insert debt transaction
    const debtTransactionResult = await db.query(
      `INSERT INTO debt_transactions (user_id, debt_id, amount, type, description, date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.userId, debtId, amount, type, description || null, transactionDate]
    );
    
    // Get appropriate category for the transaction
    // payment -> expense (Debt Payment category)
    // increase -> income (Loan/Debt Increase category)
    const categoryName = type === 'payment' ? 'Debt Payment' : 'Loan/Debt Increase';
    const transactionType = type === 'payment' ? 'expense' : 'income';
    
    const categoryResult = await db.query(
      `SELECT id FROM categories WHERE name = $1 AND type = $2 LIMIT 1`,
      [categoryName, transactionType]
    );
    
    const categoryId = categoryResult.rows[0]?.id || 1; // fallback to default
    
    // Create corresponding transaction in transactions table
    const transactionDescription = description || 
      (type === 'payment' ? `Trả nợ: ${debtName}` : `Tăng nợ: ${debtName}`);
    
    await db.query(
      `INSERT INTO transactions (user_id, amount, type, category_id, description, date)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.userId, amount, transactionType, categoryId, transactionDescription, transactionDate]
    );
    
    await db.query('COMMIT');
    
    res.status(201).json(debtTransactionResult.rows[0]);
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
}));

// Update debt transaction
router.put('/:id/transactions/:transactionId', authenticate, [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('type').isIn(['payment', 'increase']).withMessage('Type must be payment or increase'),
  body('date').optional().isISO8601().withMessage('Valid date is required'),
  body('description').optional().trim(),
  validateRequest
], asyncHandler(async (req, res) => {
  const { amount, type, description, date } = req.body;
  const { id: debtId, transactionId } = req.params;
  const newDate = date || new Date().toISOString().split('T')[0];
  
  await db.query('BEGIN');
  
  try {
    // Get old debt transaction info
    const oldTransInfo = await db.query(
      `SELECT dt.*, d.name as debt_name
       FROM debt_transactions dt
       JOIN debts d ON dt.debt_id = d.id
       WHERE dt.id = $1 AND dt.debt_id = $2 AND d.user_id = $3`,
      [transactionId, debtId, req.userId]
    );
    
    if (oldTransInfo.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    const oldTrans = oldTransInfo.rows[0];
    const debtName = oldTrans.debt_name;
    
    // Update debt transaction
    const result = await db.query(
      `UPDATE debt_transactions 
       SET amount = $1, type = $2, description = $3, date = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [amount, type, description || null, newDate, transactionId]
    );
    
    // Delete old transaction from transactions table
    const oldTransType = oldTrans.type === 'payment' ? 'expense' : 'income';
    const oldTransDesc = oldTrans.description || 
      (oldTrans.type === 'payment' ? `Trả nợ: ${debtName}` : `Tăng nợ: ${debtName}`);
    
    await db.query(
      `DELETE FROM transactions 
       WHERE user_id = $1 
       AND amount = $2 
       AND type = $3 
       AND date = $4
       AND description = $5
       LIMIT 1`,
      [req.userId, oldTrans.amount, oldTransType, oldTrans.date, oldTransDesc]
    );
    
    // Create new transaction
    const newTransType = type === 'payment' ? 'expense' : 'income';
    const categoryName = type === 'payment' ? 'Debt Payment' : 'Loan/Debt Increase';
    
    const categoryResult = await db.query(
      `SELECT id FROM categories WHERE name = $1 AND type = $2 LIMIT 1`,
      [categoryName, newTransType]
    );
    
    const categoryId = categoryResult.rows[0]?.id || 1;
    const newTransDesc = description || 
      (type === 'payment' ? `Trả nợ: ${debtName}` : `Tăng nợ: ${debtName}`);
    
    await db.query(
      `INSERT INTO transactions (user_id, amount, type, category_id, description, date)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.userId, amount, newTransType, categoryId, newTransDesc, newDate]
    );
    
    await db.query('COMMIT');
    
    res.json(result.rows[0]);
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
}));

// Delete debt transaction
router.delete('/:id/transactions/:transactionId', authenticate, asyncHandler(async (req, res) => {
  const { id: debtId, transactionId } = req.params;
  
  await db.query('BEGIN');
  
  try {
    // Get debt transaction info before deleting
    const debtTransInfo = await db.query(
      `SELECT dt.*, d.name as debt_name
       FROM debt_transactions dt
       JOIN debts d ON dt.debt_id = d.id
       WHERE dt.id = $1 AND dt.debt_id = $2 AND d.user_id = $3`,
      [transactionId, debtId, req.userId]
    );
    
    if (debtTransInfo.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    const { amount, type, date, debt_name, description } = debtTransInfo.rows[0];
    
    // Delete debt transaction
    await db.query(
      'DELETE FROM debt_transactions WHERE id = $1',
      [transactionId]
    );
    
    // Delete corresponding transaction from transactions table
    const transactionType = type === 'payment' ? 'expense' : 'income';
    const transactionDescription = description || 
      (type === 'payment' ? `Trả nợ: ${debt_name}` : `Tăng nợ: ${debt_name}`);
    
    await db.query(
      `DELETE FROM transactions 
       WHERE user_id = $1 
       AND amount = $2 
       AND type = $3 
       AND date = $4
       AND description = $5
       LIMIT 1`,
      [req.userId, amount, transactionType, date, transactionDescription]
    );
    
    await db.query('COMMIT');
    
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
}));

// Create debt
router.post('/', authenticate, debtValidation, asyncHandler(async (req, res) => {
  const { name, amount, interest_rate, due_date, description } = req.body;
  
  const result = await db.query(
    `INSERT INTO debts (user_id, name, amount, interest_rate, due_date, description)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [req.userId, name, amount, interest_rate || null, due_date || null, description || null]
  );
  
  res.status(201).json(result.rows[0]);
}));

// Update debt
router.put('/:id', authenticate, debtValidation, asyncHandler(async (req, res) => {
  const { name, amount, interest_rate, due_date, description } = req.body;
  
  const result = await db.query(
    `UPDATE debts 
     SET name = $1, amount = $2, interest_rate = $3, due_date = $4, description = $5, updated_at = CURRENT_TIMESTAMP
     WHERE id = $6 AND user_id = $7
     RETURNING *`,
    [name, amount, interest_rate || null, due_date || null, description || null, req.params.id, req.userId]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Debt not found' });
  }
  
  res.json(result.rows[0]);
}));

// Delete debt
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const result = await db.query(
    'DELETE FROM debts WHERE id = $1 AND user_id = $2 RETURNING id',
    [req.params.id, req.userId]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Debt not found' });
  }
  
  res.json({ message: 'Debt deleted successfully' });
}));

// Get debt statistics
router.get('/stats/summary', authenticate, asyncHandler(async (req, res) => {
  const result = await db.query(
    `SELECT 
      COUNT(*) as total_debts,
      COALESCE(SUM(amount), 0) as total_amount,
      COALESCE(AVG(interest_rate), 0) as avg_interest_rate
     FROM debts 
     WHERE user_id = $1`,
    [req.userId]
  );
  
  res.json(result.rows[0]);
}));

module.exports = router;
