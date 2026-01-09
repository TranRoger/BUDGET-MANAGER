#!/bin/bash

# Quick rebuild script for mobile service with CPU optimizations

echo "🔧 Rebuilding mobile service with CPU optimizations..."
echo ""

# Stop current mobile container
echo "1️⃣ Stopping current mobile service..."
docker-compose stop mobile
docker-compose rm -f mobile

# Rebuild without cache
echo ""
echo "2️⃣ Building optimized mobile image..."
docker-compose build mobile --no-cache

# Start mobile service
echo ""
echo "3️⃣ Starting optimized mobile service..."
docker-compose up -d mobile

# Wait for startup
echo ""
echo "⏳ Waiting for Expo to start..."
sleep 15

# Show status
echo ""
echo "📊 Mobile service status:"
docker-compose ps mobile

# Show CPU usage
echo ""
echo "📈 CPU usage:"
docker stats budget-manager-mobile --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# Show logs
echo ""
echo "📋 Recent logs:"
docker-compose logs --tail=20 mobile

echo ""
echo "✅ Mobile rebuild complete!"
echo ""
echo "💡 Tips:"
echo "   - Monitor CPU: docker stats budget-manager-mobile"
echo "   - View logs: docker-compose logs -f mobile"
echo "   - Stop when not needed: ./manage-mobile.sh stop"
echo "   - Check tunnel URL: docker-compose logs mobile | grep 'exp://'"
