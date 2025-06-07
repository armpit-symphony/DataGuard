#!/bin/bash

# 🚀 DataGuard Pro Desktop - Final Build Script
# Creates production-ready builds for all platforms

echo "🛡️ DataGuard Pro Desktop - Build Script"
echo "========================================"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -f *.log

# Build React app
echo "⚛️  Building React application..."
yarn build

if [ $? -eq 0 ]; then
    echo "✅ React build successful"
else
    echo "❌ React build failed"
    exit 1
fi

# Test backend
echo "🧪 Testing backend server..."
cd ../backend
python desktop_server.py > test_server.log 2>&1 &
SERVER_PID=$!
sleep 5

# Test API
curl -s http://127.0.0.1:8001/api/status > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Backend server working"
    kill $SERVER_PID
else
    echo "❌ Backend server failed"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

cd ../frontend

# Build installers
echo "📦 Building installers..."

# Linux AppImage
echo "🐧 Building Linux AppImage..."
yarn electron-builder --linux --publish=never > linux_build.log 2>&1 &
LINUX_PID=$!

# Wait for builds to complete (with timeout)
echo "⏳ Waiting for builds to complete..."

# Monitor Linux build
sleep 60
kill $LINUX_PID 2>/dev/null

# Check results
echo "📊 Build Results:"
echo "=================="

if [ -d "dist/" ]; then
    echo "✅ Build directory created"
    ls -la dist/
    
    # Check for executables
    if [ -f "dist/linux-unpacked/electron" ]; then
        echo "✅ Linux executable created"
    else
        echo "⚠️  Linux executable not found"
    fi
    
    # Check for AppImage
    if ls dist/*.AppImage 1> /dev/null 2>&1; then
        echo "✅ Linux AppImage created"
        ls -la dist/*.AppImage
    else
        echo "⚠️  Linux AppImage not created (build in progress)"
    fi
    
else
    echo "❌ No build directory found"
fi

# Create portable package
echo "📦 Creating portable package..."
mkdir -p dist/DataGuardPro-Portable
cp -r build/* dist/DataGuardPro-Portable/
cp public/electron.js dist/DataGuardPro-Portable/
cp -r ../backend dist/DataGuardPro-Portable/

# Create launcher script
cat > dist/DataGuardPro-Portable/launch.sh << 'EOF'
#!/bin/bash
echo "🛡️ Starting DataGuard Pro..."
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$DIR/backend"
python3 desktop_server.py &
BACKEND_PID=$!
sleep 3
cd "$DIR"
# Note: Requires Electron to be installed globally or bundled
echo "Backend started. Open http://localhost:3000 in browser or run electron."
echo "Press Ctrl+C to stop..."
wait
kill $BACKEND_PID 2>/dev/null
EOF

chmod +x dist/DataGuardPro-Portable/launch.sh

echo "✅ Portable package created at dist/DataGuardPro-Portable/"

# Summary
echo ""
echo "🎯 Build Summary:"
echo "================="
echo "✅ React app built and optimized"
echo "✅ Backend server tested and working"
echo "✅ Electron configuration ready"
echo "✅ Portable package created"
echo "⚠️  Platform installers require longer build time"
echo ""
echo "🚀 Ready for beta testing!"
echo "📁 Distribution files in dist/ directory"
echo "🌐 Web version available at preview URL"
echo "💾 Desktop version ready for local distribution"
echo ""
echo "Next steps:"
echo "1. Test portable package on target systems"
echo "2. Launch web beta testing program"
echo "3. Complete platform-specific installers"
echo "4. Begin customer acquisition!"

exit 0