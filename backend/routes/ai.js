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

// Get spending recommendations
router.get('/recommendations', authenticate, async (req, res) => {
  try {
    const { userId } = req;
    const recommendations = await aiService.getSpendingRecommendations(userId);
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

// Generate personalized financial plan!!!!!!!
router.get('/plan', authenticate, async (req, res) => {
  try {
    const plan = await aiService.generatePersonalizedPlan(req.userId);
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});