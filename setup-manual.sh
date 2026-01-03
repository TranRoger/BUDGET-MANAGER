#!/bin/bash

# Budget Manager - Manual Setup Script (Without Docker)

echo "🚀 Budget Manager - Manual Setup"
echo "================================="

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher. Current: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) is installed"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL 15 or higher."
    exit 1
fi

echo "✅ PostgreSQL is installed"

# Database setup
echo ""
echo "📊 Setting up database..."
echo "Creating database 'budget_manager'..."

# Create database
createdb budget_manager 2>/dev/null || echo "Database may already exist"

# Run schema
echo "Running database schema..."
psql -d budget_manager -f database/schema.sql

echo "✅ Database setup complete"

# Backend setup
echo ""
echo "⚙️  Setting up backend..."
cd backend

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "📝 Created backend/.env - Please update with your configuration"
fi

echo "Installing backend dependencies..."
npm install

cd ..

# Frontend setup
echo ""
echo "🎨 Setting up frontend..."
cd frontend

if [ ! -f ".env" ]; then
    echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
    echo "📝 Created frontend/.env"
fi

echo "Installing frontend dependencies..."
npm install

cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 To start the application:"
echo ""
echo "1. Start the backend (in one terminal):"
echo "   cd backend"
echo "   npm run dev"
echo ""
echo "2. Start the frontend (in another terminal):"
echo "   cd frontend"
echo "   npm start"
echo ""
echo "3. Access the application:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:5000"
echo ""
echo "📝 Don't forget to configure:"
echo "   - backend/.env (Google Cloud credentials, JWT secret)"
echo "   - credentials/service-account-key.json (for AI features)"
