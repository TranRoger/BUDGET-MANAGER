const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

// Get all budgets
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM budgets WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create budget
router.post('/', authenticate, async (req, res) => {
  try {
    const { category_id, amount, period, start_date, end_date } = req.body;
    const result = await db.query(
      `INSERT INTO budgets (user_id, category_id, amount, period, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.userId, category_id, amount, period, start_date, end_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update budget
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { category_id, amount, period, start_date, end_date } = req.body;
    const result = await db.query(
      `UPDATE budgets 
       SET category_id = $1, amount = $2, period = $3, start_date = $4, end_date = $5
       WHERE id = $6 AND user_id = $7 RETURNING *`,
      [category_id, amount, period, start_date, end_date, id, req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete budget
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'DELETE FROM budgets WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
