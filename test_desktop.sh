#!/bin/bash

# DataGuard Pro Desktop Test Script
echo "🚀 Testing DataGuard Pro Desktop Application..."

echo "📡 Starting backend server..."
cd /app/backend
python desktop_server.py > desktop_server.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

echo "🔍 Testing backend connection..."
curl -s http://127.0.0.1:8001/api/status | jq

echo "📊 Testing data brokers..."
curl -s http://127.0.0.1:8001/api/data-brokers | jq '. | length'

echo "👤 Testing user creation..."
USER_ID=$(curl -s -X POST "http://127.0.0.1:8001/api/users" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "first_name": "Test",
    "last_name": "User",
    "email": "test@example.com",
    "current_address": "123 Test St, Test City, CA 12345"
  }' | jq -r '.id')

echo "User created with ID: $USER_ID"

echo "📋 Testing bulk removal requests..."
curl -s -X POST "http://127.0.0.1:8001/api/removal-requests/bulk-create/$USER_ID" | jq

echo "📈 Testing removal summary..."
curl -s -X GET "http://127.0.0.1:8001/api/removal-requests/summary/$USER_ID" | jq

echo "📧 Testing manual instructions..."
curl -s -X GET "http://127.0.0.1:8001/api/manual-instructions/$USER_ID" | jq '.checklist.total_manual_brokers'

echo "✅ Desktop backend tests completed!"

# Note: Frontend electron test would be:
# cd /app/frontend 
# yarn electron-dev

echo "🎯 To test the full desktop app:"
echo "1. cd /app/frontend"
echo "2. yarn build"  
echo "3. yarn electron"

# Cleanup
kill $BACKEND_PID 2>/dev/null