const { VertexAI } = require('@google-cloud/vertexai');
const db = require('../config/database');

// Initialize Vertex AI
const vertexAI = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT_ID,
  location: process.env.VERTEX_AI_LOCATION
});

const model = 'gemini-pro';

// Generate financial insights using AI
async function generateFinancialInsights(userId) {
  try {
    // Get user's financial data
    const transactions = await db.query(
      `SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC LIMIT 100`,
      [userId]
    );

    const budgets = await db.query(
      `SELECT b.*, c.name as category_name 
       FROM budgets b 
       LEFT JOIN categories c ON b.category_id = c.id 
       WHERE b.user_id = $1`,
      [userId]
    );

    // Prepare data summary for AI
    const dataSummary = {
      totalTransactions: transactions.rows.length,
      recentTransactions: transactions.rows.slice(0, 10),
      budgets: budgets.rows
    };

    // Create prompt for AI
    const prompt = `Analyze the following financial data and provide insights:
    
${JSON.stringify(dataSummary, null, 2)}

Please provide:
1. Spending pattern analysis
2. Budget adherence insights
3. Recommendations for improvement
4. Potential savings opportunities

Format the response as JSON with these sections.`;

    const generativeModel = vertexAI.preview.getGenerativeModel({
      model: model,
    });

    const result = await generativeModel.generateContent(prompt);
    const response = result.response;
    
    return {
      insights: response.candidates[0].content.parts[0].text,
      generatedAt: new Date()
    };
  } catch (error) {
    console.error('Error generating insights:', error);
    throw new Error('Failed to generate AI insights');
  }
}

// Chat with AI assistant
async function chatWithAssistant(userId, message, conversationHistory = []) {
  try {
    // Get user context
    const userContext = await db.query(
      `SELECT 
         (SELECT COUNT(*) FROM transactions WHERE user_id = $1) as total_transactions,
         (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE user_id = $1 AND type = 'income') as total_income,
         (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE user_id = $1 AND type = 'expense') as total_expense
      `,
      [userId]
    );

    const context = `User's financial context: ${JSON.stringify(userContext.rows[0])}`;

    // Build conversation
    const conversation = [
      {
        role: 'user',
        parts: [{ text: `${context}\n\nYou are a helpful financial assistant. Help the user with their budget management questions.` }]
      },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      })),
      {
        role: 'user',
        parts: [{ text: message }]
      }
    ];

    const generativeModel = vertexAI.preview.getGenerativeModel({
      model: model,
    });

    const chat = generativeModel.startChat({
      history: conversation.slice(0, -1)
    });

    const result = await chat.sendMessage(message);
    const response = result.response;

    return {
      message: response.candidates[0].content.parts[0].text,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Error in chat:', error);
    throw new Error('Failed to process chat message');
  }
}

// Get spending recommendations
async function getSpendingRecommendations(userId) {
  try {
    // Get spending patterns
    const spendingData = await db.query(
      `SELECT 
         c.name as category,
         SUM(t.amount) as total,
         COUNT(*) as transaction_count
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = $1 AND t.type = 'expense'
       GROUP BY c.name
       ORDER BY total DESC`,
      [userId]
    );

    const prompt = `Based on this spending data, provide 5 specific recommendations to optimize spending:

${JSON.stringify(spendingData.rows, null, 2)}

Format response as JSON array of recommendations with 'category', 'recommendation', and 'potential_savings' fields.`;

    const generativeModel = vertexAI.preview.getGenerativeModel({
      model: model,
    });

    const result = await generativeModel.generateContent(prompt);
    const response = result.response;

    return {
      recommendations: response.candidates[0].content.parts[0].text,
      generatedAt: new Date()
    };
  } catch (error) {
    console.error('Error generating recommendations:', error);
    throw new Error('Failed to generate recommendations');
  }
}

module.exports = {
  generateFinancialInsights,
  chatWithAssistant,
  getSpendingRecommendations
};
