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

// Get current active plan
router.get('/plan/current', authenticate, async (req, res) => {
  try {
    const { userId } = req;
    const plan = await aiService.getCurrentPlan(userId);
    res.json(plan);
  } catch (error) {
    console.error('Error getting current plan:', error);
    res.status(500).json({ message: error.message });
  }
});

// Calculate monthly income from active budgets
router.get('/calculate-income', authenticate, async (req, res) => {
  try {
    const { userId } = req;
    const monthlyIncome = await aiService.calculateMonthlyIncome(userId);
    res.json({ 
      success: true, 
      monthlyIncome,
      message: monthlyIncome > 0 
        ? 'Đã tính thu nhập từ ngân sách' 
        : 'Không tìm thấy ngân sách thu nhập nào đang hoạt động'
    });
  } catch (error) {
    console.error('Error calculating monthly income:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Generate spending plan with user input
router.post('/plan', authenticate, async (req, res) => {
  try {
    const { userId } = req;
    const { monthlyIncome, targetDate, notes } = req.body;
    
    if (!targetDate) {
      return res.status(400).json({ 
        message: 'Vui lòng cung cấp ngày kết thúc kế hoạch' 
      });
    }
    
    // monthlyIncome is now optional - will be auto-calculated if not provided
    const plan = await aiService.generateSpendingPlan(userId, monthlyIncome || 0, targetDate, notes);
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update existing plan with new requirements
router.put('/plan/:id', authenticate, async (req, res) => {
  try {
    const { userId } = req;
    const { id } = req.params;
    const { updateRequest } = req.body;
    
    if (!updateRequest) {
      return res.status(400).json({ 
        message: 'Vui lòng cung cấp yêu cầu cập nhật' 
      });
    }
    
    const updatedPlan = await aiService.updateSpendingPlan(userId, id, updateRequest);
    res.json(updatedPlan);
  } catch (error) {
    console.error('Error updating plan:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;