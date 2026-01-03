# Budget Manager - Setup Guide

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v15 or higher)
- Docker & Docker Compose (optional, recommended)
- Google Cloud account (for AI features)

## Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd BUDGET-MANAGER
   ```

2. **Set up Google Cloud credentials**
   - Create a Google Cloud project
   - Enable Vertex AI API
   - Create a service account and download the JSON key
   - Create a `credentials` folder in the project root
   - Place your service account key as `credentials/service-account-key.json`

3. **Create environment file**
   ```bash
   cp backend/.env.example backend/.env
   ```
   
   Update the `.env` file with your Google Cloud project ID:
   ```
   GOOGLE_CLOUD_PROJECT_ID=your-project-id
   ```

4. **Start all services**
   ```bash
   docker-compose up --build
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Database: localhost:5432

## Manual Setup (Without Docker)

### 1. Database Setup

```bash
# Create PostgreSQL database
createdb budget_manager

# Run schema
psql -d budget_manager -f database/schema.sql

# (Optional) Load sample data
psql -d budget_manager -f database/seed.sql
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update .env with your configuration
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=budget_manager
# DB_USER=postgres
# DB_PASSWORD=your_password
# PORT=5000
# JWT_SECRET=your_jwt_secret
# GOOGLE_CLOUD_PROJECT_ID=your-project-id
# GOOGLE_APPLICATION_CREDENTIALS=../credentials/service-account-key.json

# Start development server
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env

# Start development server
npm start
```

## Google Cloud AI Setup

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select an existing one

2. **Enable Vertex AI API**
   ```bash
   gcloud services enable aiplatform.googleapis.com
   ```

3. **Create Service Account**
   ```bash
   gcloud iam service-accounts create budget-manager-ai \
     --display-name="Budget Manager AI Service"
   
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:budget-manager-ai@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/aiplatform.user"
   
   gcloud iam service-accounts keys create credentials/service-account-key.json \
     --iam-account=budget-manager-ai@YOUR_PROJECT_ID.iam.gserviceaccount.com
   ```

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### User Endpoints

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Transaction Endpoints

- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Budget Endpoints

- `GET /api/budgets` - Get all budgets
- `POST /api/budgets` - Create budget
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget

### Category Endpoints

- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create custom category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Report Endpoints

- `GET /api/reports/summary` - Get financial summary
- `GET /api/reports/trends` - Get spending trends
- `GET /api/reports/budget-performance` - Get budget performance

### AI Endpoints

- `POST /api/ai/insights` - Get AI financial insights
- `POST /api/ai/chat` - Chat with AI assistant
- `GET /api/ai/recommendations` - Get spending recommendations

## Development

### Backend Development

```bash
cd backend
npm run dev  # Start with nodemon (auto-reload)
```

### Frontend Development

```bash
cd frontend
npm start  # Start React development server
```

### Database Migrations

Create new migration files in `database/migrations/` folder.

### Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## Deployment

### Production Build

```bash
# Build frontend
cd frontend
npm run build

# The build folder can be served by any static hosting service
```

### Environment Variables for Production

Make sure to update all environment variables for production:
- Use strong JWT secret
- Use production database credentials
- Update CORS settings in backend
- Set NODE_ENV to "production"

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Verify database exists: `psql -l`

### Google Cloud AI Issues
- Verify service account has correct permissions
- Check credentials file path
- Ensure Vertex AI API is enabled

### Port Already in Use
```bash
# Find and kill process using port 5000
lsof -ti:5000 | xargs kill -9

# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9
```

## Support

For issues and questions, please create an issue in the repository.
