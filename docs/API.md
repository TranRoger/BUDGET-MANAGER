# Budget Manager API Reference

## Base URL
```
http://localhost:5000/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### Transactions

#### Get All Transactions
```http
GET /api/transactions?startDate=2024-01-01&endDate=2024-12-31&type=expense&categoryId=1
```

**Query Parameters:**
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date
- `type` (optional): Filter by type (income/expense)
- `categoryId` (optional): Filter by category

**Response:**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "amount": 150.50,
    "type": "expense",
    "category_id": 4,
    "description": "Grocery shopping",
    "date": "2024-01-15",
    "tags": ["food", "essentials"],
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

#### Create Transaction
```http
POST /api/transactions
```

**Request Body:**
```json
{
  "amount": 150.50,
  "type": "expense",
  "category_id": 4,
  "description": "Grocery shopping",
  "date": "2024-01-15",
  "tags": ["food", "essentials"]
}
```

#### Update Transaction
```http
PUT /api/transactions/:id
```

#### Delete Transaction
```http
DELETE /api/transactions/:id
```

### Budgets

#### Get All Budgets
```http
GET /api/budgets
```

**Response:**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "category_id": 4,
    "amount": 600.00,
    "period": "monthly",
    "start_date": "2024-01-01",
    "end_date": "2024-01-31"
  }
]
```

#### Create Budget
```http
POST /api/budgets
```

**Request Body:**
```json
{
  "category_id": 4,
  "amount": 600.00,
  "period": "monthly",
  "start_date": "2024-01-01",
  "end_date": "2024-01-31"
}
```

### Categories

#### Get All Categories
```http
GET /api/categories
```

**Response:**
```json
[
  {
    "id": 1,
    "user_id": null,
    "name": "Salary",
    "type": "income",
    "icon": "💼",
    "color": "#4CAF50"
  }
]
```

#### Create Custom Category
```http
POST /api/categories
```

**Request Body:**
```json
{
  "name": "Freelance Projects",
  "type": "income",
  "icon": "💻",
  "color": "#2196F3"
}
```

### Reports

#### Get Financial Summary
```http
GET /api/reports/summary?startDate=2024-01-01&endDate=2024-12-31
```

**Response:**
```json
{
  "totalIncome": 5000.00,
  "totalExpense": 3500.50,
  "netSavings": 1499.50,
  "categoryBreakdown": [
    {
      "name": "Food & Dining",
      "type": "expense",
      "total": 600.00
    }
  ]
}
```

#### Get Spending Trends
```http
GET /api/reports/trends?startDate=2024-01-01&endDate=2024-12-31&groupBy=month
```

**Query Parameters:**
- `groupBy`: day, week, or month

**Response:**
```json
[
  {
    "period": "2024-01",
    "type": "expense",
    "total": 3500.50
  }
]
```

#### Get Budget Performance
```http
GET /api/reports/budget-performance
```

**Response:**
```json
[
  {
    "id": 1,
    "budget_amount": 600.00,
    "category_name": "Food & Dining",
    "spent": 450.25,
    "remaining": 149.75,
    "percentage": 75.04,
    "period": "monthly",
    "start_date": "2024-01-01",
    "end_date": "2024-01-31"
  }
]
```

### AI Features

#### Get Financial Insights
```http
POST /api/ai/insights
```

**Response:**
```json
{
  "insights": "Based on your spending patterns...",
  "generatedAt": "2024-01-15T10:30:00Z"
}
```

#### Chat with AI Assistant
```http
POST /api/ai/chat
```

**Request Body:**
```json
{
  "message": "How can I reduce my food expenses?",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Hello"
    },
    {
      "role": "assistant",
      "content": "Hi! How can I help you with your budget today?"
    }
  ]
}
```

**Response:**
```json
{
  "message": "Here are some tips to reduce food expenses...",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Get Spending Recommendations
```http
GET /api/ai/recommendations
```

**Response:**
```json
{
  "recommendations": [
    {
      "category": "Food & Dining",
      "recommendation": "Consider meal planning to reduce food waste",
      "potential_savings": 150.00
    }
  ],
  "generatedAt": "2024-01-15T10:30:00Z"
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "errors": [
    {
      "msg": "Invalid email",
      "param": "email"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "message": "Authentication required"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": {
    "message": "Internal Server Error"
  }
}
```

## Rate Limiting

API rate limiting is not currently implemented but should be added for production.

## Pagination

For endpoints that return lists, pagination can be implemented using query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
