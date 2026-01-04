const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const aiService = require('../services/aiService');

// Get AI financial insights
router.post('/insights', authenticate, async (req, res) => {
  try {
    const { userId } = req;
    const insights = await aiService.generateFinancialInsights(userId);
    res.json(insights);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Chat with AI assistant
router.post('/chat', authenticate, async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;
    const { userId } = req;
    
    const response = await aiService.chatWithAssistant(userId, message, conversationHistory);
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate spending plan with user input
router.post('/plan', authenticate, async (req, res) => {
  try {
    const { userId } = req;
    const { monthlyIncome, targetDate, notes } = req.body;
    
    if (!monthlyIncome || !targetDate) {
      return res.status(400).json({ 
        message: 'Vui lòng cung cấp thu nhập hàng tháng và ngày kết thúc kế hoạch' 
      });
    }
    
    const plan = await aiService.generateSpendingPlan(userId, monthlyIncome, targetDate, notes);
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;