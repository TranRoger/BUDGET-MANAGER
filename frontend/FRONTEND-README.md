# Budget Manager Frontend

React TypeScript application for Budget Manager - a personal finance management tool.

## ✨ Features

- **Authentication**: Login and Register pages with JWT
- **Dashboard**: Financial overview with income, expense, and savings summary
- **Transactions**: Add, view, edit, and delete transactions
- **Budgets**: Create and manage budgets by category
- **Reports**: Visual analytics and spending insights
- **AI Chat**: Interactive financial assistant powered by Google Cloud AI

## 🛠️ Tech Stack

- **React 19** with **TypeScript**
- **React Router v6** for navigation
- **Axios** for API calls
- **date-fns** for date formatting
- **React Icons** for icons
- **Recharts** for charts (ready to use)

## 📁 Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── Card.tsx
│   ├── Navbar.tsx
│   ├── ProtectedRoute.tsx
│   └── TransactionList.tsx
├── context/           # React Context providers
│   └── AuthContext.tsx
├── hooks/             # Custom React hooks
│   ├── useTransactions.ts
│   └── useBudgets.ts
├── pages/             # Page components
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Dashboard.tsx
│   ├── Transactions.tsx
│   ├── Budgets.tsx
│   ├── Reports.tsx
│   └── AIChat.tsx
├── services/          # API service layer
│   ├── api.ts
│   ├── authService.ts
│   ├── transactionService.ts
│   ├── budgetService.ts
│   ├── categoryService.ts
│   ├── reportService.ts
│   └── aiService.ts
├── utils/             # Utility functions
│   └── formatters.ts
├── App.tsx            # Main app with routing
└── index.tsx          # Entry point
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- Backend API running on port 5000

### Installation

```bash
# Install dependencies
npm install

# Create .env file
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env

# Start development server
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

## 📱 Pages & Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/login` | Login | User login page |
| `/register` | Register | User registration page |
| `/` | Dashboard | Main dashboard with financial summary |
| `/transactions` | Transactions | Manage income and expenses |
| `/budgets` | Budgets | Create and track budgets |
| `/reports` | Reports | Analytics and charts |
| `/ai-chat` | AIChat | AI financial assistant |

## 🎨 Styling

- Custom CSS with modern design
- Gradient backgrounds
- Responsive layout
- Card-based UI
- Color-coded transactions (green for income, red for expense)

## 🔐 Authentication

The app uses JWT token authentication:
- Token stored in localStorage
- Automatic token injection in API requests
- Protected routes redirect to login if not authenticated
- Auto-logout on 401 responses

## 📊 Components

### Card
Reusable card component with optional title and custom styling.

### Navbar
Main navigation bar with links and logout button.

### TransactionList
Display list of transactions with edit/delete actions.

### ProtectedRoute
Wrapper component for routes requiring authentication.

## 🔧 Custom Hooks

### useTransactions
Manages transaction state with CRUD operations and auto-refresh.

### useBudgets
Manages budget state with CRUD operations.

## 🌐 API Integration

All API calls are centralized in service files:
- Automatic authentication header injection
- Error handling with redirects
- TypeScript interfaces for type safety

## 📝 Environment Variables

Create a `.env` file:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## 🏗️ Building for Production

```bash
# Create production build
npm run build

# The build folder contains optimized files
```

## 🎯 Future Enhancements

- [ ] Add charts with Recharts
- [ ] Dark mode support
- [ ] Responsive mobile design
- [ ] Export reports to PDF
- [ ] Multi-language support (i18n)
- [ ] Notification system
- [ ] Advanced filtering
- [ ] Recurring transactions
- [ ] Category icons picker

## 🐛 Known Issues

- Need to implement actual charts in Reports page
- AI chat history not persisted
- No mobile-optimized layout yet

## 📚 Learn More

- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [React Router](https://reactrouter.com/)

## 📄 License

ISC License
