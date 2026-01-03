const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { body } = require('express-validator');
const { validateRequest } = require('../middleware/validation');

const goalValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('target_amount').isFloat({ min: 0.01 }).withMessage('Target amount must be greater than 0'),
  body('current_amount').optional().isFloat({ min: 0 }).withMessage('Current amount must be 0 or greater'),
  body('deadline').optional().isISO8601().withMessage('Valid date is required'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
  validateRequest
];

// Get all goals
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const result = await db.query(
    `SELECT * FROM financial_goals 
     WHERE user_id = $1 
     ORDER BY 
       CASE priority 
         WHEN 'high' THEN 1 
         WHEN 'medium' THEN 2 
         WHEN 'low' THEN 3 
       END,
       deadline ASC NULLS LAST,
       created_at DESC`,
    [req.userId]
  );
  res.json(result.rows);
}));

// Get single goal
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const result = await db.query(
    'SELECT * FROM financial_goals WHERE id = $1 AND user_id = $2',
    [req.params.id, req.userId]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Goal not found' });
  }
  
  res.json(result.rows[0]);
}));

// Create goal
router.post('/', authenticate, goalValidation, asyncHandler(async (req, res) => {
  const { name, target_amount, current_amount, deadline, priority, description } = req.body;
  
  const result = await db.query(
    `INSERT INTO financial_goals (user_id, name, target_amount, current_amount, deadline, priority, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      req.userId, 
      name, 
      target_amount, 
      current_amount || 0, 
      deadline || null, 
      priority || 'medium',
      description || null
    ]
  );
  
  res.status(201).json(result.rows[0]);
}));

// Update goal
router.put('/:id', authenticate, goalValidation, asyncHandler(async (req, res) => {
  const { name, target_amount, current_amount, deadline, priority, description } = req.body;
  
  const result = await db.query(
    `UPDATE financial_goals 
     SET name = $1, target_amount = $2, current_amount = $3, deadline = $4, priority = $5, description = $6, updated_at = CURRENT_TIMESTAMP
     WHERE id = $7 AND user_id = $8
     RETURNING *`,
    [name, target_amount, current_amount, deadline || null, priority, description || null, req.params.id, req.userId]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Goal not found' });
  }
  
  res.json(result.rows[0]);
}));

// Delete goal
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const result = await db.query(
    'DELETE FROM financial_goals WHERE id = $1 AND user_id = $2 RETURNING id',
    [req.params.id, req.userId]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Goal not found' });
  }
  
  res.json({ message: 'Goal deleted successfully' });
}));

// Update goal progress (add/subtract amount)
router.patch('/:id/progress', authenticate, asyncHandler(async (req, res) => {
  const { amount } = req.body;
  
  if (!amount || isNaN(amount)) {
    return res.status(400).json({ message: 'Valid amount is required' });
  }
  
  const result = await db.query(
    `UPDATE financial_goals 
     SET current_amount = GREATEST(0, current_amount + $1), updated_at = CURRENT_TIMESTAMP
     WHERE id = $2 AND user_id = $3
     RETURNING *`,
    [amount, req.params.id, req.userId]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Goal not found' });
  }
  
  res.json(result.rows[0]);
}));

// Get goal statistics
router.get('/stats/summary', authenticate, asyncHandler(async (req, res) => {
  const result = await db.query(
    `SELECT 
      COUNT(*) as total_goals,
      COALESCE(SUM(target_amount), 0) as total_target,
      COALESCE(SUM(current_amount), 0) as total_saved,
      COALESCE(SUM(target_amount - current_amount), 0) as total_remaining,
      COUNT(CASE WHEN current_amount >= target_amount THEN 1 END) as completed_goals
     FROM financial_goals 
     WHERE user_id = $1`,
    [req.userId]
  );
  
  res.json(result.rows[0]);
}));

module.exports = router;
