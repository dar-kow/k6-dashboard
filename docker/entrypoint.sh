#!/bin/sh
# This script serves as an entrypoint for the backend container

set -e

# Print environment info for debugging
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "FRONTEND_URL: $FRONTEND_URL"

# Check if directories exist
echo "Checking for directories..."
ls -la /
ls -la /app
ls -la /k6-tests

# Check if results directories exist
if [ -d "/k6-tests/results" ]; then
  echo "Found /k6-tests/results directory"
  ls -la /k6-tests/results
  
  # Check if /results exists and is empty
  if [ -d "/results" ] && [ -z "$(ls -A /results)" ]; then
    echo "Creating symbolic links for test results dirs..."
    
    # Create symlinks for all result directories
    for dir in /k6-tests/results/*/; do
      if [ -d "$dir" ]; then
        dirname=$(basename "$dir")
        echo "Creating symlink for $dirname"
        ln -sf "$dir" "/results/$dirname"
      fi
    done
    
    echo "Symlinks created:"
    ls -la /results
  else
    echo "Warning: /results is not empty or doesn't exist. Skipping symlinks."
    ls -la /results
  fi
else
  echo "Warning: /k6-tests/results directory not found"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "/app/node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Execute the provided command (likely npm run dev or npm start)
echo "Starting command: $@"
exec "$@"