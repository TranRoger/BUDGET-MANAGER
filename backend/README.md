# Budget Manager Backend

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 15+
- **Authentication**: JWT (JSON Web Tokens)
- **AI Integration**: Google Cloud Vertex AI
- **Validation**: express-validator
- **Security**: bcrypt for password hashing

## Project Structure

```
backend/
├── config/
│   └── database.js          # Database connection configuration
├── middleware/
│   └── auth.js              # JWT authentication middleware
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── users.js             # User management routes
│   ├── transactions.js      # Transaction CRUD routes
│   ├── budgets.js           # Budget management routes
│   ├── categories.js        # Category management routes
│   ├── reports.js           # Financial reports routes
│   └── ai.js                # AI features routes
├── services/
│   └── aiService.js         # Google Cloud AI service integration
├── .env.example             # Environment variables template
├── .gitignore
├── package.json
├── Dockerfile
└── server.js                # Main application entry point
```

## API Routes

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Users
- `GET /api/users/profile` - Get user profile (protected)
- `PUT /api/users/profile` - Update user profile (protected)

### Transactions
- `GET /api/transactions` - List transactions with filters (protected)
- `POST /api/transactions` - Create transaction (protected)
- `PUT /api/transactions/:id` - Update transaction (protected)
- `DELETE /api/transactions/:id` - Delete transaction (protected)

### Budgets
- `GET /api/budgets` - List budgets (protected)
- `POST /api/budgets` - Create budget (protected)
- `PUT /api/budgets/:id` - Update budget (protected)
- `DELETE /api/budgets/:id` - Delete budget (protected)

### Categories
- `GET /api/categories` - List categories (protected)
- `POST /api/categories` - Create custom category (protected)
- `PUT /api/categories/:id` - Update category (protected)
- `DELETE /api/categories/:id` - Delete category (protected)

### Reports
- `GET /api/reports/summary` - Financial summary (protected)
- `GET /api/reports/trends` - Spending trends (protected)
- `GET /api/reports/budget-performance` - Budget performance (protected)

### AI Features
- `POST /api/ai/insights` - Generate financial insights (protected)
- `POST /api/ai/chat` - Chat with AI assistant (protected)
- `GET /api/ai/recommendations` - Get recommendations (protected)

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=budget_manager
DB_USER=postgres
DB_PASSWORD=your_password

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your_jwt_secret_key

# Google Cloud AI
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_APPLICATION_CREDENTIALS=./path/to/service-account-key.json
VERTEX_AI_LOCATION=us-central1
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode with auto-reload
npm run dev

# Run in production mode
npm start

# Run tests
npm test
```

## Security Features

- Password hashing with bcrypt
- JWT-based authentication
- Input validation with express-validator
- Protected routes with authentication middleware
- CORS enabled for frontend integration

## Database Integration

The application uses PostgreSQL with the `pg` library. Connection pooling is configured in `config/database.js`.

## AI Service Integration

The AI service uses Google Cloud Vertex AI (Gemini Pro model) to provide:
- Financial insights based on spending patterns
- Conversational AI chatbot for financial advice
- Personalized spending recommendations

## Error Handling

Global error handling middleware catches all errors and returns appropriate HTTP status codes and messages.

## Future Enhancements

- Rate limiting
- API versioning
- Pagination for list endpoints
- Advanced filtering and sorting
- Webhook support
- Email notifications
- Two-factor authentication
