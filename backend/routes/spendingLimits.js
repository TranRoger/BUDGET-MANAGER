const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { body } = require('express-validator');
const { validateRequest } = require('../middleware/validation');
const { NotFoundError } = require('../utils/errors');

const spendingLimitValidation = [
  body('category_id').isInt({ min: 1 }).withMessage('Valid category is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('period').isIn(['daily', 'weekly', 'monthly', 'yearly']).withMessage('Invalid period'),
  body('start_date').isISO8601().withMessage('Valid start date is required'),
  body('end_date').isISO8601().withMessage('Valid end date is required'),
  validateRequest
];

// Get all spending limits
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const result = await db.query(
    `SELECT sl.*, c.name as category_name, c.icon, c.color, c.type
     FROM spending_limits sl
     JOIN categories c ON sl.category_id = c.id
     WHERE sl.user_id = $1 
     ORDER BY sl.created_at DESC`,
    [req.userId]
  );
  res.json({ success: true, data: result.rows });
}));

// Get spending limit with actual spending
router.get('/with-spending', authenticate, asyncHandler(async (req, res) => {
  const result = await db.query(
    `SELECT 
      sl.*,
      c.name as category_name,
      c.icon,
      c.color,
      COALESCE(SUM(t.amount), 0) as spent
     FROM spending_limits sl
     JOIN categories c ON sl.category_id = c.id
     LEFT JOIN transactions t ON t.category_id = sl.category_id 
       AND t.user_id = sl.user_id
       AND t.type = 'expense'
       AND t.date >= sl.start_date
       AND t.date <= sl.end_date
     WHERE sl.user_id = $1
     GROUP BY sl.id, c.name, c.icon, c.color
     ORDER BY sl.created_at DESC`,
    [req.userId]
  );
  res.json({ success: true, data: result.rows });
}));

// Create spending limit
router.post('/', authenticate, spendingLimitValidation, asyncHandler(async (req, res) => {
  const { category_id, amount, period, start_date, end_date } = req.body;
  
  // Check if category is expense type
  const categoryCheck = await db.query(
    'SELECT type FROM categories WHERE id = $1',
    [category_id]
  );
  
  if (categoryCheck.rows.length === 0) {
    throw new NotFoundError('Category not found');
  }
  
  if (categoryCheck.rows[0].type !== 'expense') {
    return res.status(400).json({ 
      success: false, 
      message: 'Spending limits can only be set for expense categories' 
    });
  }
  
  const result = await db.query(
    `INSERT INTO spending_limits (user_id, category_id, amount, period, start_date, end_date)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [req.userId, category_id, amount, period, start_date, end_date]
  );
  res.status(201).json({ success: true, data: result.rows[0] });
}));

// Update spending limit
router.put('/:id', authenticate, spendingLimitValidation, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { category_id, amount, period, start_date, end_date } = req.body;
  const result = await db.query(
    `UPDATE spending_limits 
     SET category_id = $1, amount = $2, period = $3, start_date = $4, end_date = $5
     WHERE id = $6 AND user_id = $7 RETURNING *`,
    [category_id, amount, period, start_date, end_date, id, req.userId]
  );
  
  if (result.rows.length === 0) {
    throw new NotFoundError('Spending limit not found');
  }
  
  res.json({ success: true, data: result.rows[0] });
}));

// Delete spending limit
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await db.query(
    'DELETE FROM spending_limits WHERE id = $1 AND user_id = $2 RETURNING *',
    [id, req.userId]
  );
  
  if (result.rows.length === 0) {
    throw new NotFoundError('Spending limit not found');
  }
  
  res.json({ success: true, message: 'Spending limit deleted successfully' });
}));

module.exports = router;
