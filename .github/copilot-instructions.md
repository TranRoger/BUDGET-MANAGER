# Budget Manager - AI Coding Assistant Instructions

## Project Overview

Budget Manager is a full-stack personal finance management app with AI-powered insights. **Key architectural decision**: Single-user mode (no multi-user authentication) - the app is designed for individual use with a hardcoded `user_id = 1`.

**Tech Stack**: 
- **Frontend Web**: React + TypeScript
- **Frontend Mobile**: React Native (Expo) + NativeWind (iOS)
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **AI**: Google Gemini AI (per-user API keys)
- **Deployment**: Docker Compose

## Architecture & Data Flow

### Three-Tier Architecture
```
Frontend (Web/Mobile) → Backend (Express API) → PostgreSQL Database
                      ↓
                Google Gemini AI (per-user API keys)
```

### Critical Design Patterns

**1. User-Specific AI Configuration** ([aiService.js](backend/services/aiService.js))
- Each user stores their own `ai_api_key` and `ai_model` in the `users` table
- `getUserAIConfig(userId)` fetches user's config, falls back to `process.env.GOOGLE_AI_API_KEY`
- `getModelForUser(userId)` creates a Gemini AI instance with user's settings
- **Why**: Users get their own quota, no shared rate limits

**2. Single-User Mode** ([NO-AUTH-MODE.md](NO-AUTH-MODE.md))
- Authentication middleware ([middleware/auth.js](backend/middleware/auth.js)) auto-passes with `req.userId = 1`
- Frontend ([AuthContext.tsx](frontend/src/context/AuthContext.tsx)) uses hardcoded default user
- **No `/api/auth/login` or `/api/auth/register` routes** - they were removed
- Redirects from `/login` and `/register` go to `/dashboard`

**3. AI Response Caching** ([aiService.js](backend/services/aiService.js#L37-L60))
- In-memory Map cache for insights (30min), recommendations (1hr), plans (24hr)
- Check cache with `getCached(cacheType, userId)` before calling Gemini API
- Reduces API costs and improves response time

## Development Workflows

### Local Development Setup

**Quick start** (Docker - recommended):
```bash
./start.sh  # Handles Docker setup, DB init with schema/seed
```

**Manual setup**:
```bash
./setup-manual.sh  # Install deps, set up .env files
cd backend && npm run dev      # Starts nodemon on port 5000
cd frontend && npm start       # Starts React dev server on port 3000
```

### Database Migrations
- **Schema**: [database/schema.sql](database/schema.sql) - auto-runs on Docker init
- **Seed data**: [database/seed.sql](database/seed.sql) - creates default categories and user
- **Manual changes**: Edit SQL files, recreate containers with `docker-compose down -v && docker-compose up`

### Environment Variables

**Backend** ([backend/.env](backend/.env)):
```env
DB_HOST=postgres          # Docker service name or localhost
JWT_SECRET=...            # Not actively used (single-user mode)
GOOGLE_AI_API_KEY=...     # System fallback if user has no key
```

**Frontend** ([frontend/.env](frontend/.env)):
```env
REACT_APP_API_URL=/api    # Uses nginx proxy in production, direct in dev
```

## Code Conventions

### Backend API Patterns

**Route structure** ([backend/routes/](backend/routes/)):
- All routes use `authenticate` middleware (auto-passes with userId=1)
- Use `asyncHandler` wrapper for error handling (see [utils/asyncHandler.js](backend/utils/asyncHandler.js))
- Return format: `{ success: true/false, data: {...}, message: "..." }`

**Example route** ([routes/ai.js](backend/routes/ai.js)):
```javascript
router.post('/chat', authenticate, async (req, res) => {
  const { message, conversationHistory } = req.body;
  const { userId } = req;  // Always 1 in single-user mode
  const response = await aiService.chatWithAssistant(userId, message, conversationHistory);
  res.json(response);
});
```

**Database queries** ([config/database.js](config/database.js)):
- Use parameterized queries: `db.query('SELECT * FROM users WHERE id = $1', [userId])`
- Connection pool already configured (max 20 connections)

### Frontend API Patterns

**Service layer** ([frontend/src/services/](frontend/src/services/)):
- All API calls go through Axios instance ([api.ts](frontend/src/services/api.ts))
- Base URL is `/api` (proxied by nginx in Docker, direct in dev)
- **No Authorization header** - removed in single-user mode
- Auto-redirect to `/login` on 401 (but `/login` redirects to `/dashboard` anyway)

**Example service** ([services/aiService.ts](frontend/src/services/aiService.ts)):
```typescript
export const aiService = {
  chat: (message: string, history: any[]) => 
    api.post('/ai/chat', { message, conversationHistory: history })
};
```

### Component Structure

**Pages** ([frontend/src/pages/](frontend/src/pages/)):
- Use custom hooks: `useBudgets()`, `useTransactions()` for data fetching
- State management via React Context ([AuthContext.tsx](frontend/src/context/AuthContext.tsx))
- **No authentication checks needed** - all pages accessible

**AI Chat** ([pages/AIChat.tsx](frontend/src/pages/AIChat.tsx)):
- Uses `react-markdown` with `remark-gfm` for rendering AI responses
- Function calling: AI can add transactions/debts/goals directly to DB
- Conversation history stored in component state (not persisted)

## Integration Points

### Google Gemini AI Integration

**User configuration flow** ([AI-SETTINGS-GUIDE.md](AI-SETTINGS-GUIDE.md)):
1. User gets API key from https://aistudio.google.com/app/apikey
2. Saves in Settings page → `PUT /api/auth/settings`
3. Stored in `users.ai_api_key` and `users.ai_model` columns
4. All AI calls use `getModelForUser(userId)` to get user-specific instance

**Supported models** (order of recommendation):
- `gemini-2.0-flash-exp` (default) - fastest
- `gemini-1.5-flash` - balanced
- `gemini-1.5-pro` - highest quality

**AI features**:
- Financial insights ([aiService.js](backend/services/aiService.js#L65))
- Chat assistant with function calling ([aiService.js](backend/services/aiService.js#L200))
- Spending plan generation ([aiService.js](backend/services/aiService.js#L400))

### Docker Deployment

**docker-compose.yml** structure:
- `postgres` service: Auto-initializes with schema.sql and seed.sql
- `backend` service: Depends on postgres, exposes port 5000
- `frontend` service: Built from React app, served via nginx proxy
- Shared network: `budget-manager-network`

**Starting/stopping**:
```bash
./start.sh              # Full setup + start
docker-compose up -d    # Start in background
docker-compose logs -f  # View logs
docker-compose down     # Stop (keeps data)
docker-compose down -v  # Stop + delete volumes (fresh start)
```

## Common Tasks

### Adding a new API endpoint
1. Create route in [backend/routes/](backend/routes/) (use existing as template)
2. Add service function in [backend/services/](backend/services/) if needed
3. Import and mount route in [server.js](backend/server.js)
4. Add corresponding function in [frontend/src/services/](frontend/src/services/)

### Modifying AI behavior
- Edit prompts in [aiService.js](backend/services/aiService.js)
- Function calling definitions are in `chatWithAssistant()` function
- Adjust cache TTL in `CACHE_TTL` object (line 43)

### Database schema changes
1. Modify [database/schema.sql](database/schema.sql)
2. Recreate containers: `docker-compose down -v && docker-compose up`
3. For production: Write migration script (no framework used)

### Testing AI features
- Get free API key from https://aistudio.google.com/app/apikey
- Set in backend/.env as `GOOGLE_AI_API_KEY`
- Or configure per-user in Settings page UI
- Test endpoint: `POST /api/auth/test-ai-key` with `{ apiKey: "..." }`

## Important Files Reference

- [server.js](backend/server.js) - API entry point, route mounting, middleware order
- [aiService.js](backend/services/aiService.js) - All AI logic, function calling, caching
- [schema.sql](database/schema.sql) - Database structure (8 tables)
- [middleware/auth.js](backend/middleware/auth.js) - Auto-authenticates with userId=1
- [App.tsx](frontend/src/App.tsx) - React routes, redirects
- [NO-AUTH-MODE.md](NO-AUTH-MODE.md) - Why/how authentication was removed

## Vietnamese Language Support

UI and API responses use **Vietnamese** by default. Error messages, AI prompts, and user-facing text are in Vietnamese. Keep this convention when adding new features.

## Mobile App (React Native + NativeWind)

### Setup & Architecture

**Location**: [mobile/](mobile/) directory  
**Framework**: Expo (React Native)  
**Styling**: NativeWind (Tailwind CSS for React Native)  
**Navigation**: React Navigation (Native Stack)

### Project Structure
```
mobile/
├── src/
│   ├── screens/         # Dashboard, Transactions, AIChat, Budgets, Settings
│   ├── services/        # API layer (same pattern as web)
│   ├── context/         # AuthContext (single-user mode)
│   ├── navigation/      # AppNavigator with stack navigation
│   ├── types/           # TypeScript interfaces
│   ├── utils/           # formatCurrency, formatDate helpers
│   └── constants/       # theme.ts (colors, spacing)
├── App.tsx              # Entry point with providers
├── tailwind.config.js   # NativeWind configuration
└── babel.config.js      # Includes nativewind/babel plugin
```

### Running Mobile App

**iOS Simulator**:
```bash
cd mobile && npm run ios
```

**Expo Go (physical device)**:
```bash
cd mobile && npm start
# Scan QR code with Expo Go app
```

**Critical**: Change API_URL in [mobile/src/services/api.ts](mobile/src/services/api.ts) from `localhost` to your machine's IP address (e.g., `http://192.168.1.100:5000/api`) because mobile devices/simulators cannot access `localhost`.

### NativeWind Usage

NativeWind allows using Tailwind className syntax:
```tsx
<View className="flex-1 bg-gray-50 p-4">
  <Text className="text-xl font-bold text-blue-600">Hello</Text>
</View>
```

**Configuration files**:
- [tailwind.config.js](mobile/tailwind.config.js) - Tailwind config with custom colors
- [babel.config.js](mobile/babel.config.js) - Must include `nativewind/babel` plugin
- [app.d.ts](mobile/app.d.ts) - TypeScript types for NativeWind

### Mobile-Specific Patterns

**API Service** ([mobile/src/services/api.ts](mobile/src/services/api.ts)):
- Same structure as web, but no JWT token (single-user mode)
- Uses `__DEV__` to switch between development and production URLs
- Network error handling for mobile connectivity issues

**Navigation** ([mobile/src/navigation/AppNavigator.tsx](mobile/src/navigation/AppNavigator.tsx)):
- Native Stack Navigator with 5 screens
- Vietnamese screen titles
- Blue header theme matching brand colors

**Screens** ([mobile/src/screens/](mobile/src/screens/)):
- **DashboardScreen**: Overview with balance cards, quick actions, recent transactions
- **TransactionsScreen**: Filter tabs (All/Income/Expense), scrollable list
- **AIChatScreen**: Chat UI with message bubbles, KeyboardAvoidingView for iOS
- **BudgetsScreen**: List of budgets with category names
- **SettingsScreen**: AI API key configuration, model selection

**Context** ([mobile/src/context/AuthContext.tsx](mobile/src/context/AuthContext.tsx)):
- Same single-user pattern as web
- Falls back to default user if API fails
- Used by all screens to access user info

### Mobile Development Tips

1. **Testing with backend**: 
   - Start backend: `cd backend && npm run dev`
   - Get your IP: `ifconfig | grep inet` (macOS/Linux)
   - Update API_URL in api.ts

2. **Clearing cache**:
   ```bash
   npm start -- --clear
   ```

3. **Dependencies issues**:
   ```bash
   npx expo install --fix
   ```

4. **Building for production**:
   ```bash
   npm install -g eas-cli
   eas build --platform ios
   ```
