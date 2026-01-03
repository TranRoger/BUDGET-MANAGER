#!/bin/bash

# Budget Manager - Quick Setup Script

echo "🚀 Budget Manager - Quick Setup"
echo "================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Check for Google Cloud credentials
if [ ! -d "credentials" ]; then
    echo "⚠️  Creating credentials directory..."
    mkdir -p credentials
    echo "📝 Please add your Google Cloud service account key as:"
    echo "   credentials/service-account-key.json"
    echo ""
    read -p "Press Enter after adding credentials, or Ctrl+C to exit..."
fi

if [ ! -f "credentials/service-account-key.json" ]; then
    echo "⚠️  Warning: Google Cloud credentials not found!"
    echo "   AI features will not work without credentials."
    echo "   Place your service account key at: credentials/service-account-key.json"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Create .env file for backend if it doesn't exist
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating backend .env file..."
    cp backend/.env.example backend/.env
    
    echo "⚙️  Please update backend/.env with your configuration:"
    echo "   - GOOGLE_CLOUD_PROJECT_ID"
    echo "   - JWT_SECRET (use a strong random string)"
    echo ""
    read -p "Press Enter to continue..."
fi

# Create .env file for frontend if it doesn't exist
if [ ! -f "frontend/.env" ]; then
    echo "📝 Creating frontend .env file..."
    echo "REACT_APP_API_URL=http://localhost:5000/api" > frontend/.env
fi

echo ""
echo "🐳 Building and starting Docker containers..."
echo "This may take a few minutes on first run..."
echo ""

# Build and start containers
docker-compose up --build -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo ""
    echo "✅ Budget Manager is now running!"
    echo ""
    echo "📍 Access the application:"
    echo "   Frontend:  http://localhost:3000"
    echo "   Backend:   http://localhost:5000"
    echo "   Database:  localhost:5432"
    echo ""
    echo "📊 View logs:"
    echo "   docker-compose logs -f"
    echo ""
    echo "🛑 Stop the application:"
    echo "   docker-compose down"
    echo ""
else
    echo "❌ Something went wrong. Check logs with:"
    echo "   docker-compose logs"
fi
