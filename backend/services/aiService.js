const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../config/database');

// Initialize Google AI with API Key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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

    const result = await model.generateContent(prompt);
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

// Chat with AI assistant with function calling
async function chatWithAssistant(userId, message, conversationHistory = []) {
  try {
    // Get user context
    const [recentTransactions, budgets, debts, goals] = await Promise.all([
      db.query(
        'SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC LIMIT 10',
        [userId]
      ),
      db.query(
        'SELECT * FROM budgets WHERE user_id = $1',
        [userId]
      ),
      db.query(
        'SELECT * FROM debts WHERE user_id = $1',
        [userId]
      ),
      db.query(
        'SELECT * FROM financial_goals WHERE user_id = $1',
        [userId]
      )
    ]);

    const context = `You are a helpful financial assistant with access to the user's financial data.

Current Financial Overview:
- Recent Transactions: ${recentTransactions.rows.length} transactions
- Active Budgets: ${budgets.rows.length}
- Total Debts: ${debts.rows.length}
- Financial Goals: ${goals.rows.length}

You can help users:
1. Add transactions when they mention spending or income
2. Create debts when they talk about loans or money owed
3. Set financial goals when they mention saving targets
4. Provide financial advice and insights

When the user mentions a financial transaction, debt, or goal, you should use the appropriate function to add it to their database.`;

    // Define available functions for AI
    const functions = [
      {
        name: 'add_transaction',
        description: 'Add a new income or expense transaction to the database',
        parameters: {
          type: 'object',
          properties: {
            amount: {
              type: 'number',
              description: 'The transaction amount (positive number)'
            },
            type: {
              type: 'string',
              enum: ['income', 'expense'],
              description: 'Whether this is income or expense'
            },
            description: {
              type: 'string',
              description: 'Description of the transaction'
            },
            date: {
              type: 'string',
              description: 'Transaction date in YYYY-MM-DD format. Use today if not specified.'
            },
            category_id: {
              type: 'number',
              description: 'Category ID (default: 1 for general)'
            }
          },
          required: ['amount', 'type', 'description']
        }
      },
      {
        name: 'add_debt',
        description: 'Add a new debt/loan to track',
        parameters: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name of the debt (e.g., Credit Card, Car Loan)'
            },
            amount: {
              type: 'number',
              description: 'Total debt amount'
            },
            interest_rate: {
              type: 'number',
              description: 'Interest rate percentage (optional)'
            },
            due_date: {
              type: 'string',
              description: 'Due date in YYYY-MM-DD format (optional)'
            },
            description: {
              type: 'string',
              description: 'Additional notes about the debt'
            }
          },
          required: ['name', 'amount']
        }
      },
      {
        name: 'add_goal',
        description: 'Create a new financial goal',
        parameters: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name of the goal (e.g., Emergency Fund, Vacation)'
            },
            target_amount: {
              type: 'number',
              description: 'Target amount to save'
            },
            current_amount: {
              type: 'number',
              description: 'Current saved amount (default: 0)'
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'Priority level'
            },
            deadline: {
              type: 'string',
              description: 'Target deadline in YYYY-MM-DD format (optional)'
            },
            description: {
              type: 'string',
              description: 'Why this goal is important'
            }
          },
          required: ['name', 'target_amount']
        }
      }
    ];

    const modelWithTools = genAI.getGenerativeModel({
      model: 'gemini-pro',
      tools: [{ functionDeclarations: functions }]
    });

    // Build conversation
    const chat = modelWithTools.startChat({
      generationConfig: { temperature: 0.7 },
      history: [
        {
          role: 'user',
          parts: [{ text: context }]
        },
        {
          role: 'model',
          parts: [{ text: 'I understand. I\'m your financial assistant and I can help you track transactions, debts, and goals. Just tell me about your financial activities and I\'ll help you manage them.' }]
        },
        ...conversationHistory.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        }))
      ]
    });

    const result = await chat.sendMessage(message);
    const response = result.response;
    
    // Check if AI wants to call a function
    const functionCalls = response.candidates[0]?.content?.parts?.filter(part => part.functionCall);
    
    if (functionCalls && functionCalls.length > 0) {
      const functionResults = [];
      
      for (const functionCall of functionCalls) {
        const { name, args } = functionCall.functionCall;
        let functionResult;
        
        try {
          switch (name) {
            case 'add_transaction':
              functionResult = await addTransaction(userId, args);
              break;
            case 'add_debt':
              functionResult = await addDebt(userId, args);
              break;
            case 'add_goal':
              functionResult = await addGoal(userId, args);
              break;
            default:
              functionResult = { error: 'Unknown function' };
          }
          
          functionResults.push({
            functionCall: { name, args },
            functionResponse: {
              name,
              response: functionResult
            }
          });
        } catch (error) {
          functionResults.push({
            functionCall: { name, args },
            functionResponse: {
              name,
              response: { error: error.message }
            }
          });
        }
      }
      
      // Send function results back to AI for final response
      const finalResult = await chat.sendMessage([
        { functionResponse: functionResults[0].functionResponse }
      ]);
      
      return {
        message: finalResult.response.candidates[0].content.parts[0].text,
        functionCalls: functionResults
      };
    }
    
    // No function call, just return the response
    return {
      message: response.candidates[0].content.parts[0].text
    };
  } catch (error) {
    console.error('Error in chat:', error);
    throw new Error('Failed to process chat message');
  }
}

// Helper functions to add data
async function addTransaction(userId, args) {
  const { amount, type, description, date, category_id } = args;
  const transactionDate = date || new Date().toISOString().split('T')[0];
  
  const result = await db.query(
    `INSERT INTO transactions (user_id, amount, type, category_id, description, date)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, amount, type, category_id || 1, description, transactionDate]
  );
  
  return {
    success: true,
    transaction: result.rows[0],
    message: `Added ${type} of $${amount} for ${description}`
  };
}

async function addDebt(userId, args) {
  const { name, amount, interest_rate, due_date, description } = args;
  
  const result = await db.query(
    `INSERT INTO debts (user_id, name, amount, interest_rate, due_date, description)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, name, amount, interest_rate || null, due_date || null, description || null]
  );
  
  return {
    success: true,
    debt: result.rows[0],
    message: `Added debt: ${name} for $${amount}`
  };
}

async function addGoal(userId, args) {
  const { name, target_amount, current_amount, priority, deadline, description } = args;
  
  const result = await db.query(
    `INSERT INTO financial_goals (user_id, name, target_amount, current_amount, priority, deadline, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [userId, name, target_amount, current_amount || 0, priority || 'medium', deadline || null, description || null]
  );
  
  return {
    success: true,
    goal: result.rows[0],
    message: `Created goal: ${name} with target of $${target_amount}`
  };
}

// Get smart spending recommendations based on income, debts, and fixed expenses
async function getSpendingRecommendations(userId) {
  try {
    // Gather comprehensive financial data
    const [incomeData, debtData, expenseData, goalData, fixedExpenses] = await Promise.all([
      // Monthly income (last 30 days)
      db.query(
        `SELECT COALESCE(SUM(amount), 0) as total_income 
         FROM transactions 
         WHERE user_id = $1 AND type = 'income' AND date > NOW() - INTERVAL '30 days'`,
        [userId]
      ),
      // Total debts with interest
      db.query(
        `SELECT 
          COALESCE(SUM(amount), 0) as total_debt,
          COALESCE(AVG(interest_rate), 0) as avg_interest_rate,
          COUNT(*) as debt_count
         FROM debts 
         WHERE user_id = $1`,
        [userId]
      ),
      // Monthly expenses by category
      db.query(
        `SELECT 
          c.name as category,
          SUM(t.amount) as total,
          COUNT(*) as transaction_count,
          AVG(t.amount) as avg_amount
         FROM transactions t
         JOIN categories c ON t.category_id = c.id
         WHERE t.user_id = $1 AND t.type = 'expense' AND t.date > NOW() - INTERVAL '30 days'
         GROUP BY c.name
         ORDER BY total DESC`,
        [userId]
      ),
      // Financial goals
      db.query(
        `SELECT 
          COUNT(*) as total_goals,
          COALESCE(SUM(target_amount - current_amount), 0) as remaining_amount,
          COALESCE(SUM(target_amount), 0) as total_target
         FROM financial_goals 
         WHERE user_id = $1`,
        [userId]
      ),
      // Get recurring/fixed expenses (categorized as Rent, Utilities, Insurance, etc.)
      db.query(
        `SELECT 
          c.name as category,
          SUM(t.amount) as monthly_amount
         FROM transactions t
         JOIN categories c ON t.category_id = c.id
         WHERE t.user_id = $1 
         AND t.type = 'expense'
         AND c.name IN ('Rent', 'Utilities', 'Insurance', 'Subscriptions', 'Loan Payment')
         AND t.date > NOW() - INTERVAL '30 days'
         GROUP BY c.name`,
        [userId]
      )
    ]);

    const monthlyIncome = parseFloat(incomeData.rows[0].total_income);
    const totalDebt = parseFloat(debtData.rows[0].total_debt);
    const avgInterestRate = parseFloat(debtData.rows[0].avg_interest_rate);
    const expenses = expenseData.rows;
    const goals = goalData.rows[0];
    const fixed = fixedExpenses.rows;

    const totalMonthlyExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.total), 0);
    const totalFixedExpenses = fixed.reduce((sum, f) => sum + parseFloat(f.monthly_amount), 0);
    const discretionarySpending = totalMonthlyExpenses - totalFixedExpenses;

    const prompt = `You are a financial advisor. Analyze this user's financial situation and provide smart, actionable spending recommendations.

FINANCIAL OVERVIEW:
Monthly Income: $${monthlyIncome.toFixed(2)}
Total Monthly Expenses: $${totalMonthlyExpenses.toFixed(2)}
Net Monthly: $${(monthlyIncome - totalMonthlyExpenses).toFixed(2)}

FIXED EXPENSES (${fixed.length} categories, Total: $${totalFixedExpenses.toFixed(2)}):
${fixed.map(f => `- ${f.category}: $${parseFloat(f.monthly_amount).toFixed(2)}`).join('\n')}

VARIABLE EXPENSES (Discretionary: $${discretionarySpending.toFixed(2)}):
${expenses.filter(e => !fixed.find(f => f.category === e.category))
  .map(e => `- ${e.category}: $${parseFloat(e.total).toFixed(2)} (${e.transaction_count} transactions, avg $${parseFloat(e.avg_amount).toFixed(2)})`).join('\n')}

DEBTS:
Total Debt: $${totalDebt.toFixed(2)}
Average Interest Rate: ${avgInterestRate.toFixed(2)}%
Number of Debts: ${debtData.rows[0].debt_count}

FINANCIAL GOALS:
Active Goals: ${goals.total_goals}
Total Target: $${parseFloat(goals.total_target).toFixed(2)}
Amount Needed: $${parseFloat(goals.remaining_amount).toFixed(2)}

TASK: Provide exactly 5 specific, personalized recommendations. Each recommendation should:
1. Target a specific spending category or financial behavior
2. Include a concrete action the user can take
3. Estimate potential monthly savings or financial benefit
4. Be realistic and actionable

Consider:
- The 50/30/20 rule (50% needs, 30% wants, 20% savings)
- Debt repayment priority (high interest first)
- Emergency fund recommendations (3-6 months expenses)
- Goal achievement timeline
- Areas of overspending vs income

Return ONLY a JSON array with this exact structure:
[
  {
    "title": "Short recommendation title",
    "description": "Detailed explanation of the recommendation",
    "category": "Affected spending category or 'General'",
    "potential_savings": 150.50,
    "priority": "high|medium|low",
    "action": "Specific action to take"
  }
]`;

    const modelForRecommendations = genAI.getGenerativeModel({
      model: 'gemini-pro',
      generationConfig: {
        temperature: 0.7,
        responseMimeType: 'application/json'
      }
    });

    const result = await modelForRecommendations.generateContent(prompt);
    const response = result.response;
    let recommendations = [];
    
    try {
      const text = response.candidates[0].content.parts[0].text;
      recommendations = JSON.parse(text);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      recommendations = [
        {
          title: "Review Your Spending",
          description: "Track your expenses more carefully to identify savings opportunities",
          category: "General",
          potential_savings: 0,
          priority: "medium",
          action: "Use the AI assistant to log all transactions"
        }
      ];
    }

    return {
      recommendations,
      summary: {
        monthlyIncome,
        totalMonthlyExpenses,
        netMonthly: monthlyIncome - totalMonthlyExpenses,
        totalDebt,
        discretionarySpending,
        savingsRate: monthlyIncome > 0 ? ((monthlyIncome - totalMonthlyExpenses) / monthlyIncome * 100) : 0
      },
      generatedAt: new Date()
    };
  } catch (error) {
    console.error('Error generating recommendations:', error);
    throw new Error('Failed to generate recommendations');
  }
}

// Thêm hàm mới để AI lập lộ trình
async function generatePersonalizedPlan(userId) {
  try {
    // 1. Lấy dữ liệu Thu nhập (Income) - Lấy trung bình 3 tháng gần nhất hoặc cấu hình cứng
    const incomeData = await db.query(
      `SELECT SUM(amount) as total_income FROM transactions 
       WHERE user_id = $1 AND type = 'income' AND date > NOW() - INTERVAL '30 days'`,
      [userId]
    );

    // 2. Lấy dữ liệu Nợ (Debts) - Đã có bảng debts
    const debts = await db.query(`SELECT * FROM debts WHERE user_id = $1`, [userId]);

    // 3. Lấy Khoản cố định (Fixed Expenses) - Dựa vào flag is_fixed mới thêm
    const fixedExpenses = await db.query(
      `SELECT c.name, AVG(t.amount) as avg_amount 
       FROM transactions t 
       JOIN categories c ON t.category_id = c.id 
       WHERE t.user_id = $1 AND c.type = 'expense' AND c.is_fixed = true 
       GROUP BY c.name`,
      [userId]
    );

    // 4. Lấy Dự định (Goals) - Bảng mới
    const goals = await db.query(`SELECT * FROM financial_goals WHERE user_id = $1`, [userId]);

    // Tổng hợp Context cho AI
    const financialContext = {
      monthlyIncome: incomeData.rows[0].total_income || 0,
      debts: debts.rows,
      fixedExpenses: fixedExpenses.rows,
      goals: goals.rows,
      currentDate: new Date().toISOString().split('T')[0]
    };

    // Tạo Prompt chuyên sâu cho vai trò Financial Advisor
    const prompt = `
      Act as a strict but helpful Personal Financial Advisor. 
      I will provide my financial data. Your goal is to create a detailed **Spending Roadmap**.
      
      DATA:
      ${JSON.stringify(financialContext, null, 2)}

      REQUEST:
      1. Calculate "Discretionary Income" (Income - Fixed Expenses - Minimum Debt Payments).
      2. Allocate the Discretionary Income towards Goals and Debt Payoff based on priority (Avalanche or Snowball method for debts).
      3. Create a strict budget for variable spending (Food, Entertainment, etc.).
      4. Provide a week-by-week roadmap for the next month.
      
      Output format: Markdown. Be specific with numbers.
    `;

    const result = await model.generateContent(prompt);
    
    return {
      roadmap: result.response.candidates[0].content.parts[0].text,
      generatedAt: new Date()
    };

  } catch (error) {
    console.error('Error generating plan:', error);
    throw error;
  }
}

module.exports = {
  generateFinancialInsights,
  chatWithAssistant,
  getSpendingRecommendations,
  generatePersonalizedPlan
};
