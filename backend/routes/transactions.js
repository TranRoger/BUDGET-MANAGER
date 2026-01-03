const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { body } = require('express-validator');
const { validateRequest } = require('../middleware/validation');
const { NotFoundError } = require('../utils/errors');

const transactionValidation = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('type').isIn(['income', 'expense']).withMessage('Type must be either income or expense'),
  body('category_id').isInt({ min: 1 }).withMessage('Valid category is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  validateRequest
];

// Get all transactions
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { startDate, endDate, type, categoryId } = req.query;
  let query = 'SELECT * FROM transactions WHERE user_id = $1';
  const params = [req.userId];

  if (startDate) {
    params.push(startDate);
    query += ` AND date >= $${params.length}`;
  }
  if (endDate) {
    params.push(endDate);
    query += ` AND date <= $${params.length}`;
  }
  if (type) {
    params.push(type);
    query += ` AND type = $${params.length}`;
  }
  if (categoryId) {
    params.push(categoryId);
    query += ` AND category_id = $${params.length}`;
  }

  query += ' ORDER BY date DESC';

  const result = await db.query(query, params);
  res.json({ success: true, data: result.rows });
}));

// Create transaction
router.post('/', authenticate, transactionValidation, asyncHandler(async (req, res) => {
  const { amount, type, category_id, description, date, tags } = req.body;
  const result = await db.query(
    `INSERT INTO transactions (user_id, amount, type, category_id, description, date, tags)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [req.userId, amount, type, category_id, description, date, tags]
  );
  res.status(201).json({ success: true, data: result.rows[0] });
}));

// Update transaction
router.put('/:id', authenticate, transactionValidation, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount, type, category_id, description, date, tags } = req.body;
  const result = await db.query(
    `UPDATE transactions 
     SET amount = $1, type = $2, category_id = $3, description = $4, date = $5, tags = $6
     WHERE id = $7 AND user_id = $8 RETURNING *`,
    [amount, type, category_id, description, date, tags, id, req.userId]
  );
  
  if (result.rows.length === 0) {
    throw new NotFoundError('Transaction not found');
  }
  
  res.json({ success: true, data: result.rows[0] });
}));

// Delete transaction
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await db.query(
    'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING *',
    [id, req.userId]
  );
  
  if (result.rows.length === 0) {
    throw new NotFoundError('Transaction not found');
  }
  
  res.json({ success: true, message: 'Transaction deleted successfully' });
}));

module.exports = router;
