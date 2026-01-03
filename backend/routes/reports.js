const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

// Get financial summary
router.get('/summary', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const incomeResult = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as total_income 
       FROM transactions 
       WHERE user_id = $1 AND type = 'income' AND date BETWEEN $2 AND $3`,
      [req.userId, startDate, endDate]
    );
    
    const expenseResult = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as total_expense 
       FROM transactions 
       WHERE user_id = $1 AND type = 'expense' AND date BETWEEN $2 AND $3`,
      [req.userId, startDate, endDate]
    );
    
    const categoryBreakdown = await db.query(
      `SELECT c.name, c.type, COALESCE(SUM(t.amount), 0) as total
       FROM categories c
       LEFT JOIN transactions t ON c.id = t.category_id AND t.user_id = $1 AND t.date BETWEEN $2 AND $3
       WHERE c.user_id = $1 OR c.user_id IS NULL
       GROUP BY c.id, c.name, c.type
       ORDER BY total DESC`,
      [req.userId, startDate, endDate]
    );

    res.json({
      totalIncome: parseFloat(incomeResult.rows[0].total_income),
      totalExpense: parseFloat(expenseResult.rows[0].total_expense),
      netSavings: parseFloat(incomeResult.rows[0].total_income) - parseFloat(expenseResult.rows[0].total_expense),
      categoryBreakdown: categoryBreakdown.rows
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get spending trends
router.get('/trends', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'month' } = req.query;
    
    let dateFormat;
    switch (groupBy) {
      case 'day':
        dateFormat = 'YYYY-MM-DD';
        break;
      case 'week':
        dateFormat = 'YYYY-WW';
        break;
      case 'month':
        dateFormat = 'YYYY-MM';
        break;
      default:
        dateFormat = 'YYYY-MM';
    }

    const result = await db.query(
      `SELECT 
         TO_CHAR(date, $1) as period,
         type,
         COALESCE(SUM(amount), 0) as total
       FROM transactions
       WHERE user_id = $2 AND date BETWEEN $3 AND $4
       GROUP BY period, type
       ORDER BY period`,
      [dateFormat, req.userId, startDate, endDate]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get budget performance
router.get('/budget-performance', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
         b.id,
         b.amount as budget_amount,
         c.name as category_name,
         COALESCE(SUM(t.amount), 0) as spent,
         b.period,
         b.start_date,
         b.end_date
       FROM budgets b
       LEFT JOIN categories c ON b.category_id = c.id
       LEFT JOIN transactions t ON t.category_id = b.category_id 
         AND t.user_id = b.user_id 
         AND t.date BETWEEN b.start_date AND b.end_date
         AND t.type = 'expense'
       WHERE b.user_id = $1
       GROUP BY b.id, c.name
       ORDER BY b.created_at DESC`,
      [req.userId]
    );

    const budgetPerformance = result.rows.map(row => ({
      ...row,
      spent: parseFloat(row.spent),
      budget_amount: parseFloat(row.budget_amount),
      remaining: parseFloat(row.budget_amount) - parseFloat(row.spent),
      percentage: (parseFloat(row.spent) / parseFloat(row.budget_amount)) * 100
    }));

    res.json(budgetPerformance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
