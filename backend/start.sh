#!/bin/bash

echo "🚀 Starting K6 Dashboard Backend..."

# Print environment info
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"  
echo "FRONTEND_URL: $FRONTEND_URL"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if we're in development mode
if [ "$NODE_ENV" = "development" ]; then
    echo "🔧 Starting in development mode..."
    npm run dev
else
    echo "🏭 Starting in production mode..."
    
    # Build if needed
    if [ ! -d "dist" ]; then
        echo "🔨 Building TypeScript..."
        npm run build
    fi
    
    npm start
fi