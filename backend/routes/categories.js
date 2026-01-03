const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { body } = require('express-validator');
const { validateRequest } = require('../middleware/validation');
const { NotFoundError } = require('../utils/errors');

const categoryValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('type').isIn(['income', 'expense']).withMessage('Type must be either income or expense'),
  body('icon').optional(),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color format'),
  validateRequest
];

// Get all categories
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const result = await db.query(
    `SELECT * FROM categories 
     WHERE user_id = $1 OR user_id IS NULL 
     ORDER BY name`,
    [req.userId]
  );
  res.json({ success: true, data: result.rows });
}));

// Create custom category
router.post('/', authenticate, categoryValidation, asyncHandler(async (req, res) => {
  const { name, type, icon, color } = req.body;
  const result = await db.query(
    `INSERT INTO categories (user_id, name, type, icon, color)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [req.userId, name, type, icon, color]
  );
  res.status(201).json({ success: true, data: result.rows[0] });
}));

// Update category
router.put('/:id', authenticate, categoryValidation, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, type, icon, color } = req.body;
  const result = await db.query(
    `UPDATE categories 
     SET name = $1, type = $2, icon = $3, color = $4
     WHERE id = $5 AND user_id = $6 RETURNING *`,
    [name, type, icon, color, id, req.userId]
  );
  
  if (result.rows.length === 0) {
    throw new NotFoundError('Category not found');
  }
  
  res.json({ success: true, data: result.rows[0] });
}));

// Delete category
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await db.query(
    'DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING *',
    [id, req.userId]
  );
  
  if (result.rows.length === 0) {
    throw new NotFoundError('Category not found');
  }
  
  res.json({ success: true, message: 'Category deleted successfully' });
}));

module.exports = router;
