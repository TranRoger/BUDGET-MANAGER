#!/bin/bash

# Frontend Quick Test Script

echo "🧪 Testing Frontend Setup..."
echo "=============================="
echo ""

cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check .env file
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
    echo "✅ .env created"
else
    echo "✅ .env file exists"
fi

echo ""
echo "📊 Frontend Statistics:"
echo "----------------------"
echo "TypeScript files: $(find src -name '*.tsx' -o -name '*.ts' | grep -v test | wc -l)"
echo "CSS files: $(find src -name '*.css' | wc -l)"
echo "Components: $(find src/components -name '*.tsx' | wc -l)"
echo "Pages: $(find src/pages -name '*.tsx' | wc -l)"
echo "Services: $(find src/services -name '*.ts' | wc -l)"
echo ""

echo "🎨 Project Structure:"
echo "--------------------"
tree src -I 'node_modules|*.test.*' -L 2 2>/dev/null || ls -R src/

echo ""
echo "🚀 Starting Frontend..."
echo "----------------------"
echo "Opening http://localhost:3000 in 3 seconds..."
echo ""

sleep 3

# Start the development server
npm start
