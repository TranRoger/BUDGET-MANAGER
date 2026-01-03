const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

// Get all categories
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM categories 
       WHERE user_id = $1 OR user_id IS NULL 
       ORDER BY name`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create custom category
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, type, icon, color } = req.body;
    const result = await db.query(
      `INSERT INTO categories (user_id, name, type, icon, color)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.userId, name, type, icon, color]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update category
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, icon, color } = req.body;
    const result = await db.query(
      `UPDATE categories 
       SET name = $1, type = $2, icon = $3, color = $4
       WHERE id = $5 AND user_id = $6 RETURNING *`,
      [name, type, icon, color, id, req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete category
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
