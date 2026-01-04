const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../config/database');

// Initialize Google AI with API Key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// Simple in-memory cache to reduce API calls
const cache = {
  recommendations: new Map(), // userId -> { data, timestamp }
  insights: new Map(),
  plan: new Map()
};

// Cache TTL (Time To Live) in milliseconds
const CACHE_TTL = {
  recommendations: 60 * 60 * 1000, // 1 hour
  insights: 30 * 60 * 1000, // 30 minutes
  plan: 24 * 60 * 60 * 1000 // 24 hours
};

// Helper function to check cache
function getCached(cacheType, key) {
  const cached = cache[cacheType].get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL[cacheType]) {
    console.log(`Cache HIT for ${cacheType}:${key}`);
    return cached.data;
  }
  console.log(`Cache MISS for ${cacheType}:${key}`);
  return null;
}

// Helper function to set cache
function setCache(cacheType, key, data) {
  cache[cacheType].set(key, { data, timestamp: Date.now() });
}

// Generate financial insights using AI
async function generateFinancialInsights(userId) {
  try {
    // Check cache first
    const cached = getCached('insights', userId);
    if (cached) return cached;

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
    
    const insights = {
      insights: response.candidates[0].content.parts[0].text,
      generatedAt: new Date()
    };
    
    // Cache the result
    setCache('insights', userId, insights);
    return insights;
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

    const context = `Bạn là trợ lý tài chính thông minh có quyền truy cập vào dữ liệu tài chính của người dùng.

Tổng quan tài chính hiện tại:
- Giao dịch gần đây: ${recentTransactions.rows.length} giao dịch
- Ngân sách đang hoạt động: ${budgets.rows.length}
- Tổng nợ: ${debts.rows.length}
- Mục tiêu tài chính: ${goals.rows.length}

Bạn có thể giúp người dùng:
1. Thêm giao dịch khi họ đề cập đến chi tiêu hoặc thu nhập
2. Tạo khoản nợ khi họ nói về các khoản vay hoặc tiền nợ
3. Đặt mục tiêu tài chính khi họ đề cập đến mục tiêu tiết kiệm
4. Cung cấp lời khuyên và phân tích tài chính

Khi người dùng đề cập đến giao dịch, nợ hoặc mục tiêu tài chính, bạn nên sử dụng chức năng phù hợp để thêm vào cơ sở dữ liệu của họ.

Hãy trả lời bằng tiếng Việt một cách tự nhiên và thân thiện.`;

    // Define available functions for AI
    const functions = [
      {
        name: 'add_transaction',
        description: 'Thêm giao dịch thu nhập hoặc chi tiêu mới vào cơ sở dữ liệu',
        parameters: {
          type: 'object',
          properties: {
            amount: {
              type: 'number',
              description: 'Số tiền giao dịch (số dương)'
            },
            type: {
              type: 'string',
              enum: ['income', 'expense'],
              description: 'Loại: thu nhập (income) hoặc chi tiêu (expense)'
            },
            description: {
              type: 'string',
              description: 'Mô tả giao dịch'
            },
            date: {
              type: 'string',
              description: 'Ngày giao dịch định dạng YYYY-MM-DD. Dùng hôm nay nếu không chỉ định.'
            },
            category_id: {
              type: 'number',
              description: 'ID danh mục (mặc định: 1 cho chung)'
            }
          },
          required: ['amount', 'type', 'description']
        }
      },
      {
        name: 'add_debt',
        description: 'Thêm khoản nợ/vay mới để theo dõi',
        parameters: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Tên khoản nợ (ví dụ: Thẻ tín dụng, Vay mua xe)'
            },
            amount: {
              type: 'number',
              description: 'Tổng số tiền nợ'
            },
            interest_rate: {
              type: 'number',
              description: 'Lãi suất phần trăm (tùy chọn)'
            },
            due_date: {
              type: 'string',
              description: 'Ngày đến hạn định dạng YYYY-MM-DD (tùy chọn)'
            },
            description: {
              type: 'string',
              description: 'Ghi chú bổ sung về khoản nợ'
            }
          },
          required: ['name', 'amount']
        }
      },
      {
        name: 'add_goal',
        description: 'Tạo mục tiêu tài chính mới',
        parameters: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Tên mục tiêu (ví dụ: Quỹ khẩn cấp, Du lịch)'
            },
            target_amount: {
              type: 'number',
              description: 'Số tiền mục tiêu cần tiết kiệm'
            },
            current_amount: {
              type: 'number',
              description: 'Số tiền đã tiết kiệm hiện tại (mặc định: 0)'
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'Mức độ ưu tiên'
            },
            deadline: {
              type: 'string',
              description: 'Thời hạn mục tiêu định dạng YYYY-MM-DD (tùy chọn)'
            },
            description: {
              type: 'string',
              description: 'Tại sao mục tiêu này quan trọng'
            }
          },
          required: ['name', 'target_amount']
        }
      }
    ];

    const modelWithTools = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
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
          parts: [{ text: 'Tôi hiểu rồi. Tôi là trợ lý tài chính của bạn và tôi có thể giúp bạn theo dõi giao dịch, nợ và mục tiêu. Hãy cho tôi biết về các hoạt động tài chính của bạn và tôi sẽ giúp bạn quản lý chúng.' }]
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

// Tạo kế hoạch chi tiêu cá nhân hóa với input từ người dùng
async function generateSpendingPlan(userId, monthlyIncome, targetDate, notes = '') {
  try {
    // Calculate timeframe from current date to target date
    const currentDate = new Date();
    const endDate = new Date(targetDate);
    const diffTime = Math.abs(endDate - currentDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.round(diffDays / 30);
    
    let timeframeText = '';
    if (diffDays <= 7) timeframeText = `${diffDays} ngày`;
    else if (diffDays <= 30) timeframeText = `${Math.ceil(diffDays / 7)} tuần`;
    else if (diffMonths <= 12) timeframeText = `${diffMonths} tháng`;
    else timeframeText = `${Math.round(diffMonths / 12)} năm`;
    
    // Check cache first
    const cacheKey = `${userId}_${monthlyIncome}_${targetDate}_${notes.substring(0, 50)}`;
    const cached = getCached('plan', cacheKey);
    if (cached) {
      console.log('Cache HIT: Spending plan');
      return cached;
    }
    
    console.log('Cache MISS: Spending plan - generating new plan...');

    // Gather user's financial data
    const [debtData, expenseData, goalData, fixedExpenses] = await Promise.all([
      db.query(
        `SELECT * FROM debts WHERE user_id = $1 ORDER BY interest_rate DESC`,
        [userId]
      ),
      db.query(
        `SELECT 
          c.name as category,
          SUM(t.amount) as total,
          COUNT(*) as transaction_count
         FROM transactions t
         JOIN categories c ON t.category_id = c.id
         WHERE t.user_id = $1 AND t.type = 'expense' AND t.date > NOW() - INTERVAL '30 days'
         GROUP BY c.name
         ORDER BY total DESC`,
        [userId]
      ),
      db.query(
        `SELECT * FROM financial_goals WHERE user_id = $1 ORDER BY priority DESC, deadline ASC`,
        [userId]
      ),
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

    const debts = debtData.rows;
    const expenses = expenseData.rows;
    const goals = goalData.rows;
    const fixed = fixedExpenses.rows;

    const totalMonthlyExpenses = expenses.reduce((sum, e) => sum + Number.parseFloat(e.total), 0);
    const totalFixedExpenses = fixed.reduce((sum, f) => sum + Number.parseFloat(f.monthly_amount), 0);
    const totalDebt = debts.reduce((sum, d) => sum + Number.parseFloat(d.amount), 0);

    const prompt = `Bạn là chuyên gia tư vấn tài chính cá nhân. Hãy tạo một kế hoạch chi tiêu CHI TIẾT và THỰC TẾ cho người dùng.

THÔNG TIN TÀI CHÍNH:
Thu nhập hàng tháng: ${monthlyIncome.toLocaleString('vi-VN')} VNĐ
Tổng chi tiêu hàng tháng hiện tại: ${totalMonthlyExpenses.toLocaleString('vi-VN')} VNĐ
Khoản chi cố định: ${totalFixedExpenses.toLocaleString('vi-VN')} VNĐ
Tổng nợ: ${totalDebt.toLocaleString('vi-VN')} VNĐ

CHI TIẾT CHI TIÊU CỐ ĐỊNH:
${fixed.map(f => `- ${f.category}: ${Number.parseFloat(f.monthly_amount).toLocaleString('vi-VN')} VNĐ`).join('\n')}

CHI TIẾT CHI TIÊU BIẾN ĐỘNG:
${expenses.filter(e => !fixed.some(f => f.category === e.category))
  .map(e => `- ${e.category}: ${Number.parseFloat(e.total).toLocaleString('vi-VN')} VNĐ (${e.transaction_count} giao dịch)`).join('\n')}

CÁC KHOẢN NỢ:
${debts.map(d => `- ${d.name}: ${Number.parseFloat(d.amount).toLocaleString('vi-VN')} VNĐ (Lãi suất: ${d.interest_rate || 0}%)`).join('\n')}

MỤC TIÊU TÀI CHÍNH:
${goals.map(g => `- ${g.name}: Mục tiêu ${Number.parseFloat(g.target_amount).toLocaleString('vi-VN')} VNĐ, đã có ${Number.parseFloat(g.current_amount).toLocaleString('vi-VN')} VNĐ (Ưu tiên: ${g.priority})`).join('\n')}

KHOẢNG THỜI GIAN LẬP KẾ HOẠCH: ${timeframeText} (từ ${currentDate.toLocaleDateString('vi-VN')} đến ${endDate.toLocaleDateString('vi-VN')})

GHI CHÚ TỪ NGƯỜI DÙNG:
${notes || 'Không có ghi chú bổ sung'}

YÊU CẦU:
1. Phân tích tình hình tài chính hiện tại
2. Tính toán số tiền khả dụng sau khi trừ chi tiêu cố định và nhu cầu thiết yếu
3. Đưa ra KẾ HOẠCH DUY NHẤT, CHI TIẾT theo ${timeframeText}:
   - Phân bổ ngân sách cho từng tuần/tháng
   - Ưu tiên trả nợ (nợ lãi suất cao trước)
   - Kế hoạch tiết kiệm cho mục tiêu
   - Khuyến nghị cắt giảm chi tiêu
   - Kế hoạch dự phòng khẩn cấp (3-6 tháng chi tiêu)
4. Đưa ra lộ trình cụ thể, TỪNG BƯỚC, dễ thực hiện
5. Bao gồm các mốc kiểm tra tiến độ

Hãy trả lời bằng TIẾNG VIỆT, sử dụng định dạng Markdown với:
- Tiêu đề rõ ràng
- Bảng số liệu
- Danh sách check
- Highlight các con số quan trọng

Hãy thực tế, khả thi và động viên người dùng!`;

    const result = await model.generateContent(prompt);
    
    const plan = {
      plan: result.response.candidates[0].content.parts[0].text,
      targetDate,
      monthlyIncome,
      notes,
      summary: {
        totalMonthlyExpenses,
        totalFixedExpenses,
        totalDebt,
        availableFunds: monthlyIncome - totalFixedExpenses,
        goalCount: goals.length,
        debtCount: debts.length
      },
      generatedAt: new Date()
    };
    
    // Cache the result
    setCache('plan', cacheKey, plan);
    return plan;
  } catch (error) {
    console.error('Error generating plan:', error);
    throw new Error('Failed to generate spending plan');
  }
}

// Deprecated - Keep for backward compatibility
async function getSpendingRecommendations(userId) {
  try {
    return await generateSpendingPlan(userId, 10000000, '1 tháng');
  } catch (error) {
    console.error('Error generating recommendations:', error);
    throw new Error('Failed to generate recommendations');
  }
}

// Deprecated - Keep for backward compatibility
async function generatePersonalizedPlan(userId) {
  try {
    // Check cache first
    const cached = getCached('plan', userId);
    if (cached) return cached;

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
    
    const plan = {
      roadmap: result.response.candidates[0].content.parts[0].text,
      generatedAt: new Date()
    };
    
    // Cache the result
    setCache('plan', userId, plan);
    return plan;

  } catch (error) {
    console.error('Error generating plan:', error);
    throw error;
  }
}

module.exports = {
  generateFinancialInsights,
  chatWithAssistant,
  generateSpendingPlan,
  getSpendingRecommendations, // Deprecated
  generatePersonalizedPlan // Deprecated
};
