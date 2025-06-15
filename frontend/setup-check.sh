#!/bin/bash

echo "DataGuard Pro - Desktop Application Setup Verification"
echo "====================================================="
echo

# Check if we're in the right directory
echo "🔍 Checking current directory..."
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the /app/frontend directory"
    echo "   cd /app/frontend"
    exit 1
fi
echo "✅ In correct directory: $(pwd)"
echo

# Check if dependencies are installed
echo "🔍 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "❌ Error: node_modules not found. Installing dependencies..."
    yarn install
fi
echo "✅ Dependencies installed"
echo

# Check if electron-is-dev is available
echo "🔍 Checking electron-is-dev module..."
if npm list electron-is-dev >/dev/null 2>&1; then
    echo "✅ electron-is-dev module found"
else
    echo "❌ Error: electron-is-dev module not found"
    echo "   Installing missing dependency..."
    yarn add electron-is-dev
fi
echo

# Check if build directory exists
echo "🔍 Checking build directory..."
if [ ! -d "build" ]; then
    echo "⚠️  Build directory not found. Creating production build..."
    yarn build
fi
echo "✅ Build directory exists"
echo

# Check backend server
echo "🔍 Checking backend server..."
if curl -s http://localhost:8001/api/ >/dev/null 2>&1; then
    echo "✅ Backend server is running"
else
    echo "⚠️  Backend server not responding. You may need to start it manually."
    echo "   For development: Backend should be running via supervisor"
    echo "   For production: cd /app/backend && python server_desktop.py"
fi
echo

echo "🚀 Setup verification complete!"
echo
echo "Available commands:"
echo "  yarn electron       - Run desktop app (production mode)"
echo "  yarn electron-dev   - Run desktop app (development mode)"
echo "  yarn start          - Run web version in browser"
echo "  yarn build          - Build for production"
echo "  yarn dist           - Package for distribution"
echo
echo "If you're still getting errors, make sure to:"
echo "1. Run commands from /app/frontend directory"
echo "2. Ensure backend server is running"
echo "3. Use 'yarn electron' instead of 'electron .'"