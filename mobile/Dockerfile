# Use Node.js 20 Alpine as base image
FROM node:20-alpine

# Install dependencies required for Expo and React Native
RUN apk add --no-cache \
    bash \
    git \
    openssh

# Install @expo/ngrok globally for tunnel support
RUN npm install -g @expo/ngrok@^4.1.0

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Make start script executable
RUN chmod +x start-expo.sh

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Create necessary directories for Expo
RUN mkdir -p /app/.expo /app/node_modules/.cache

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose Expo ports
# 19000 - Expo DevTools
# 19001 - Expo Metro Bundler
# 19002 - Expo Web
EXPOSE 19000 19001 19002

# Set environment variables
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
ENV EXPO_NO_TELEMETRY=1
ENV NODE_ENV=production
ENV CI=1
ENV METRO_MAX_WORKERS=1
ENV UV_THREADPOOL_SIZE=2

# Start Expo using wrapper script
CMD ["sh", "./start-expo.sh"]
