const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

// Get all transactions
router.get('/', authenticate, async (req, res) => {
  try {
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
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create transaction
router.post('/', authenticate, async (req, res) => {
  try {
    const { amount, type, category_id, description, date, tags } = req.body;
    const result = await db.query(
      `INSERT INTO transactions (user_id, amount, type, category_id, description, date, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.userId, amount, type, category_id, description, date, tags]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update transaction
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, type, category_id, description, date, tags } = req.body;
    const result = await db.query(
      `UPDATE transactions 
       SET amount = $1, type = $2, category_id = $3, description = $4, date = $5, tags = $6
       WHERE id = $7 AND user_id = $8 RETURNING *`,
      [amount, type, category_id, description, date, tags, id, req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete transaction
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
