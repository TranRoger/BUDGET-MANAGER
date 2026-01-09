#!/bin/bash

echo "========================================="
echo "Starting Expo (CPU Optimized for 1 vCPU)"
echo "========================================="

# Set Node.js to use minimal CPU
export UV_THREADPOOL_SIZE=2
export NODE_OPTIONS="--max-old-space-size=384 --optimize-for-size"

# Start Expo in production mode with minimal features
# --no-dev: Disable dev mode features (reduces CPU)
# --minify: Enable minification (one-time cost, faster runtime)
# --tunnel: Enable tunnel mode for external access
npx expo start --tunnel --no-dev --minify --non-interactive 2>&1 | tee /tmp/expo.log &

# Wait for tunnel to be ready
sleep 10

# Try to extract and display the tunnel URL
echo ""
echo "========================================="
echo "CONNECTION INFORMATION:"
echo "========================================="

# Check for tunnel URL in the output
if grep -q "exp://" /tmp/expo.log 2>/dev/null; then
    echo "Tunnel URL found in logs:"
    grep "exp://" /tmp/expo.log | head -1
fi

# Display Metro Bundler URL
echo "Metro Bundler: http://localhost:8081"
echo ""
echo "To connect:"
echo "1. Open Expo Go app on your phone"
echo "2. Tap 'Enter URL manually'"
echo "3. Check the logs above for the exp:// URL"
echo "   OR run: docker-compose logs mobile | grep 'exp://'"
echo ""
echo "NOTE: Running in production mode for CPU optimization"
echo "========================================="
echo ""

# Keep the process running
wait
