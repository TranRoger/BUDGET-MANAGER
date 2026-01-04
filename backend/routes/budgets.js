const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { body } = require('express-validator');
const { validateRequest } = require('../middleware/validation');
const { NotFoundError } = require('../utils/errors');

const budgetValidation = [
  body('category_id').isInt({ min: 1 }).withMessage('Valid category is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('period').isIn(['daily', 'weekly', 'monthly', 'yearly']).withMessage('Invalid period'),
  body('start_date').isISO8601().withMessage('Valid start date is required'),
  body('end_date').isISO8601().withMessage('Valid end date is required'),
  validateRequest
];

// Get all budgets
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const result = await db.query(
    'SELECT * FROM budgets WHERE user_id = $1 ORDER BY created_at DESC',
    [req.userId]
  );
  res.json({ success: true, data: result.rows });
}));

// Create budget
router.post('/', authenticate, budgetValidation, asyncHandler(async (req, res) => {
  const { category_id, amount, period, start_date, end_date } = req.body;
  
  // Start transaction
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    // Create budget
    const budgetResult = await client.query(
      `INSERT INTO budgets (user_id, category_id, amount, period, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.userId, category_id, amount, period, start_date, end_date]
    );
    
    const budget = budgetResult.rows[0];
    
    // Get category info
    const categoryResult = await client.query(
      'SELECT name, type FROM categories WHERE id = $1',
      [category_id]
    );
    
    if (categoryResult.rows.length === 0) {
      throw new Error('Category not found');
    }
    
    const category = categoryResult.rows[0];
    
    // Auto-create income transactions based on period
    const transactions = [];
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    let currentDate = new Date(startDate);
    let transactionAmount = amount;
    let description = `Thu nhập từ ${category.name}`;
    
    // Generate transactions based on period
    switch(period) {
      case 'daily':
        // Create daily transactions
        while (currentDate <= endDate) {
          transactions.push({
            date: new Date(currentDate).toISOString().split('T')[0],
            amount: transactionAmount,
            description: `${description} (Hàng ngày)`
          });
          currentDate.setDate(currentDate.getDate() + 1);
          
          // Limit to avoid too many transactions
          if (transactions.length >= 365) break;
        }
        break;
        
      case 'weekly':
        // Create weekly transactions
        while (currentDate <= endDate) {
          transactions.push({
            date: new Date(currentDate).toISOString().split('T')[0],
            amount: transactionAmount,
            description: `${description} (Hàng tuần)`
          });
          currentDate.setDate(currentDate.getDate() + 7);
          
          if (transactions.length >= 52) break;
        }
        break;
        
      case 'monthly':
        // Create monthly transactions
        while (currentDate <= endDate) {
          transactions.push({
            date: new Date(currentDate).toISOString().split('T')[0],
            amount: transactionAmount,
            description: `${description} (Hàng tháng)`
          });
          currentDate.setMonth(currentDate.getMonth() + 1);
          
          if (transactions.length >= 12) break;
        }
        break;
        
      case 'yearly':
        // Create yearly transaction
        transactions.push({
          date: start_date,
          amount: transactionAmount,
          description: `${description} (Hàng năm)`
        });
        break;
    }
    
    // Insert all transactions
    for (const txn of transactions) {
      await client.query(
        `INSERT INTO transactions (user_id, amount, type, category_id, description, date)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [req.userId, txn.amount, 'income', category_id, txn.description, txn.date]
      );
    }
    
    await client.query('COMMIT');
    
    res.status(201).json({ 
      success: true, 
      data: budget,
      transactionsCreated: transactions.length,
      message: `Đã tạo ngân sách và ${transactions.length} giao dịch thu nhập`
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

// Update budget
router.put('/:id', authenticate, budgetValidation, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { category_id, amount, period, start_date, end_date } = req.body;
  const result = await db.query(
    `UPDATE budgets 
     SET category_id = $1, amount = $2, period = $3, start_date = $4, end_date = $5
     WHERE id = $6 AND user_id = $7 RETURNING *`,
    [category_id, amount, period, start_date, end_date, id, req.userId]
  );
  
  if (result.rows.length === 0) {
    throw new NotFoundError('Budget not found');
  }
  
  res.json({ success: true, data: result.rows[0] });
}));

// Delete budget
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await db.query(
    'DELETE FROM budgets WHERE id = $1 AND user_id = $2 RETURNING *',
    [id, req.userId]
  );
  
  if (result.rows.length === 0) {
    throw new NotFoundError('Budget not found');
  }
  
  res.json({ success: true, message: 'Budget deleted successfully' });
}));

module.exports = router;
