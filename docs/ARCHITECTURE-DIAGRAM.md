# Architecture Diagram - User-Configurable AI Settings

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            BUDGET MANAGER                                │
│                    User-Configurable AI Settings                         │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React + TypeScript)                    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────┐            │
│  │   Dashboard    │  │   Settings     │  │    AI Chat      │            │
│  │   Component    │  │   Component    │  │   Component     │            │
│  └────────┬───────┘  └────────┬───────┘  └────────┬────────┘            │
│           │                   │                    │                     │
│           │         ┌─────────▼──────────┐         │                     │
│           │         │  Settings Page UI  │         │                     │
│           │         │ ┌────────────────┐ │         │                     │
│           │         │ │ API Key Input  │ │         │                     │
│           │         │ │ (Password)     │ │         │                     │
│           │         │ └────────────────┘ │         │                     │
│           │         │ ┌────────────────┐ │         │                     │
│           │         │ │ Model Dropdown │ │         │                     │
│           │         │ │ • 2.0-flash    │ │         │                     │
│           │         │ │ • 1.5-flash    │ │         │                     │
│           │         │ │ • 1.5-pro      │ │         │                     │
│           │         │ └────────────────┘ │         │                     │
│           │         │ ┌────────────────┐ │         │                     │
│           │         │ │ Test | Save    │ │         │                     │
│           │         │ └────────────────┘ │         │                     │
│           │         └─────────┬──────────┘         │                     │
│           │                   │                    │                     │
└───────────┼───────────────────┼────────────────────┼─────────────────────┘
            │                   │                    │
            │    ┌──────────────▼────────────────────▼──────────┐
            │    │         Axios API Client                     │
            │    │  • Authorization: Bearer <JWT>               │
            │    │  • baseURL: http://localhost:5000/api        │
            │    └──────────────┬───────────────────────────────┘
            │                   │
═══════════════════════════════════════════════════════════════════════════
            │                   │          HTTP/REST
═══════════════════════════════════════════════════════════════════════════
            │                   │
┌───────────▼───────────────────▼───────────────────────────────────────────┐
│                       BACKEND (Node.js + Express)                         │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │                     Auth Middleware (JWT)                          │   │
│  │  • Verify Token                                                    │   │
│  │  • Extract userId, email, role                                     │   │
│  └────────────────────────────┬───────────────────────────────────────┘   │
│                               │                                            │
│  ┌────────────────────────────▼───────────────────────────────────────┐   │
│  │                      Routes (auth.js)                              │   │
│  │                                                                    │   │
│  │  GET /api/auth/settings                                           │   │
│  │    → SELECT ai_api_key, ai_model FROM users WHERE id = userId     │   │
│  │                                                                    │   │
│  │  PUT /api/auth/settings                                           │   │
│  │    → UPDATE users SET ai_api_key=$1, ai_model=$2 WHERE id=userId  │   │
│  │                                                                    │   │
│  │  POST /api/auth/test-ai-key                                       │   │
│  │    → GoogleGenerativeAI(apiKey).generateContent("Xin chào")      │   │
│  │                                                                    │   │
│  │  POST /api/ai/plan/generate                                       │   │
│  │    → aiService.generateSpendingPlan(userId, ...)                  │   │
│  └────────────────────────────┬───────────────────────────────────────┘   │
│                               │                                            │
│  ┌────────────────────────────▼───────────────────────────────────────┐   │
│  │                  AI Service (aiService.js)                         │   │
│  │                                                                    │   │
│  │  async getUserAIConfig(userId) {                                  │   │
│  │    const result = await db.query(                                 │   │
│  │      'SELECT ai_api_key, ai_model FROM users WHERE id = $1',      │   │
│  │      [userId]                                                     │   │
│  │    );                                                             │   │
│  │    return {                                                       │   │
│  │      apiKey: result.ai_api_key || process.env.GOOGLE_AI_API_KEY, │   │
│  │      modelName: result.ai_model || 'gemini-2.0-flash-exp'        │   │
│  │    };                                                             │   │
│  │  }                                                                │   │
│  │                                                                    │   │
│  │  async getModelForUser(userId) {                                  │   │
│  │    const { apiKey, modelName } = await getUserAIConfig(userId);   │   │
│  │    const genAI = new GoogleGenerativeAI(apiKey);                 │   │
│  │    return genAI.getGenerativeModel({ model: modelName });        │   │
│  │  }                                                                │   │
│  │                                                                    │   │
│  │  • generateFinancialInsights(userId)                              │   │
│  │  • chatWithAssistant(userId, message)                             │   │
│  │  • generateSpendingPlan(userId, ...)                              │   │
│  │  • updateSpendingPlan(userId, planId, ...)                        │   │
│  └────────────────────────────┬───────────────────────────────────────┘   │
│                               │                                            │
└───────────────────────────────┼────────────────────────────────────────────┘
                                │
═══════════════════════════════════════════════════════════════════════════
                                │        PostgreSQL Wire Protocol
═══════════════════════════════════════════════════════════════════════════
                                │
┌───────────────────────────────▼────────────────────────────────────────────┐
│                      DATABASE (PostgreSQL 15)                              │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        users TABLE                                   │  │
│  │                                                                      │  │
│  │  id  │ email           │ name  │ role  │ ai_api_key    │ ai_model   │  │
│  │──────┼─────────────────┼───────┼───────┼───────────────┼────────────│  │
│  │  1   │ admin@budget.com│ Admin │ admin │ AIzaSy...     │ 2.0-flash  │  │
│  │  2   │ demo@example.com│ Demo  │ user  │ AIzaSy...     │ 1.5-flash  │  │
│  │  3   │ user@test.com   │ User  │ user  │ NULL          │ 2.0-flash  │  │
│  │      │                 │       │       │ (uses system) │            │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  INDEX: idx_users_ai_settings ON users(id)                          │  │
│  │         WHERE ai_api_key IS NOT NULL                                │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════
                         External API Calls
═══════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────┐
│                      Google AI Studio API                                │
│                  https://generativelanguage.googleapis.com                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  User 1's API Key  →  gemini-2.0-flash-exp                              │
│    Quota: 1,500 requests/day, 1M tokens/day                             │
│                                                                           │
│  User 2's API Key  →  gemini-1.5-flash                                  │
│    Quota: 1,500 requests/day, 1M tokens/day                             │
│                                                                           │
│  System API Key    →  gemini-2.0-flash-exp (fallback)                   │
│    Quota: 1,500 requests/day, 1M tokens/day                             │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Each user has INDEPENDENT quota                                │    │
│  │  No sharing, no bottleneck                                      │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════
                         Data Flow Example
═══════════════════════════════════════════════════════════════════════════

Step 1: User visits Settings page
  Frontend → GET /api/auth/settings
  Backend → SELECT ai_api_key, ai_model FROM users WHERE id = userId
  Response → { aiApiKey: "AIzaSy...", aiModel: "gemini-2.0-flash-exp" }

Step 2: User saves new API key
  Frontend → PUT /api/auth/settings { aiApiKey: "AIza...", aiModel: "1.5-flash" }
  Backend → UPDATE users SET ai_api_key=$1, ai_model=$2 WHERE id=userId
  Response → { success: true, message: "Đã cập nhật cài đặt AI" }

Step 3: User tests connection
  Frontend → POST /api/auth/test-ai-key { aiApiKey: "...", aiModel: "..." }
  Backend → new GoogleGenerativeAI(apiKey).generateContent("Xin chào")
  Google AI API → Returns test response
  Response → { success: true, message: "API key hợp lệ!" }

Step 4: User generates spending plan
  Frontend → POST /api/ai/plan/generate { monthlyIncome: 10000000, ... }
  Backend → aiService.generateSpendingPlan(userId, ...)
    ├─ getUserAIConfig(userId)
    ├─ Query database for user's api_key and ai_model
    ├─ Initialize GoogleGenerativeAI(user's key)
    ├─ Create model with user's preferred model
    └─ Generate plan using user's independent quota
  Response → { plan: "...", summary: "..." }


═══════════════════════════════════════════════════════════════════════════
                         Security Flow
═══════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────┐
│  1. User authenticates → JWT token issued                                │
│     Token contains: { userId, email, role }                              │
│                                                                           │
│  2. All API requests include:                                            │
│     Authorization: Bearer <JWT>                                          │
│                                                                           │
│  3. Backend middleware:                                                  │
│     • Verifies JWT signature                                             │
│     • Extracts userId from token                                         │
│     • Attaches req.userId to request                                     │
│                                                                           │
│  4. Settings endpoints:                                                  │
│     • Only return/update current user's data                             │
│     • WHERE clause: user_id = req.userId                                 │
│     • User A CANNOT access User B's API key                              │
│                                                                           │
│  5. AI Service:                                                          │
│     • Fetches API key based on req.userId                                │
│     • Each request uses correct user's credentials                       │
│     • No cross-user contamination                                        │
│                                                                           │
│  6. API keys:                                                            │
│     • Stored in database (plain text - TODO: encrypt)                    │
│     • Transmitted over HTTPS only                                        │
│     • Not logged or exposed in responses                                 │
│     • Masked in UI (password field)                                      │
└─────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════
                         Key Design Decisions
═══════════════════════════════════════════════════════════════════════════

✅ Per-User Storage:
   Store in users table (not separate settings table)
   → Simple, efficient joins, one query per request

✅ Fallback Strategy:
   User key → System key → Error
   → System still works if users don't configure

✅ Model Selection:
   3 models (2.0-flash, 1.5-flash, 1.5-pro)
   → Balance between choice and simplicity

✅ Test Before Save:
   Optional test button validates key
   → Prevents saving invalid keys

✅ No Encryption (Current):
   Plain text storage
   → Simpler implementation, acceptable for demo
   → Recommended: Add AES-256 encryption for production

✅ Frontend State:
   Load on mount, save on button click
   → Clear user action, no auto-save confusion

✅ Backend Refactoring:
   Helper functions: getUserAIConfig(), getModelForUser()
   → Single source of truth, easy to maintain


═══════════════════════════════════════════════════════════════════════════
                         Technologies Used
═══════════════════════════════════════════════════════════════════════════

Frontend:
  • React 18
  • TypeScript
  • React Router v6
  • Axios
  • CSS3 (Gradients, Animations)

Backend:
  • Node.js 20
  • Express.js
  • @google/generative-ai SDK
  • bcryptjs
  • jsonwebtoken
  • pg (PostgreSQL client)

Database:
  • PostgreSQL 15
  • Alpine Linux base

Infrastructure:
  • Docker
  • Docker Compose
  • Multi-stage builds
