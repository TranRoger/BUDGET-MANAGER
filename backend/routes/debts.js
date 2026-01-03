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
    'SELECT * FROM debts WHERE user_id = $1 ORDER BY due_date ASC NULLS LAST, created_at DESC',
    [req.userId]
  );
  res.json(result.rows);
}));

// Get single debt
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const result = await db.query(
    'SELECT * FROM debts WHERE id = $1 AND user_id = $2',
    [req.params.id, req.userId]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Debt not found' });
  }
  
  res.json(result.rows[0]);
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
