#!/bin/bash

# Cleanup script to reduce inode usage in Budget Manager project

echo "🧹 Starting cleanup to reduce inode usage..."

# Function to safely remove directories
safe_remove() {
    if [ -d "$1" ]; then
        echo "Removing $1..."
        rm -rf "$1"
        echo "✅ Removed $1"
    else
        echo "⏭️  Skipping $1 (not found)"
    fi
}

# Navigate to project root
cd "$(dirname "$0")"

echo ""
echo "📦 Removing node_modules directories..."
safe_remove "backend/node_modules"
safe_remove "frontend/node_modules"
safe_remove "mobile/node_modules"
safe_remove "ai-service/node_modules"

echo ""
echo "🏗️  Removing build artifacts..."
safe_remove "frontend/build"
safe_remove "backend/dist"
safe_remove "mobile/dist"
safe_remove "mobile/.expo"
safe_remove "mobile/.expo-shared"

echo ""
echo "📝 Removing log files..."
safe_remove "backend/logs"
find . -type f -name "*.log" -delete 2>/dev/null || true
echo "✅ Log files removed"

echo ""
echo "🗑️  Removing cache directories..."
safe_remove ".cache"
safe_remove "frontend/.cache"
safe_remove "backend/.cache"
safe_remove "mobile/.cache"
safe_remove ".nyc_output"
safe_remove "coverage"

echo ""
echo "🧪 Removing test artifacts..."
safe_remove "frontend/coverage"
safe_remove "backend/coverage"

echo ""
echo "🐳 Cleaning Docker resources (optional)..."
read -p "Do you want to clean Docker build cache? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker builder prune -f
    echo "✅ Docker build cache cleaned"
fi

echo ""
echo "📊 Current inode usage:"
echo "Files: $(find . -type f 2>/dev/null | wc -l)"
echo "Directories: $(find . -type d 2>/dev/null | wc -l)"

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "💡 To reinstall dependencies:"
echo "   cd backend && npm install"
echo "   cd frontend && npm install"
echo "   cd mobile && npm install"
echo ""
echo "🐳 To rebuild Docker containers:"
echo "   docker-compose build --no-cache"
