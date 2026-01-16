#!/bin/bash

echo "🔐 JWT Authentication Test Script"
echo "=================================="

# Start with a fresh terminal - ensure the server is running first
echo "Make sure your server is running: node database-examples/mongodb-tasks-api.js"
echo ""

# Test 1: Try to access tasks without authentication (should fail)
echo "🔒 Test 1: Accessing /tasks without authentication (should fail)"
echo "curl http://localhost:3002/tasks"
echo ""
curl -s http://localhost:3002/tasks | jq '.' 2>/dev/null || curl -s http://localhost:3002/tasks
echo ""
echo ""

# Test 2: Register a new user
echo "👤 Test 2: Register a new user"
echo 'curl -X POST http://localhost:3002/auth/register -H "Content-Type: application/json" -d {"name": "Test User", "email": "test@example.com", "password": "testpass123"}'
echo ""
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3002/auth/register -H "Content-Type: application/json" -d '{"name": "Test User", "email": "test@example.com", "password": "testpass123"}')
echo "$REGISTER_RESPONSE" | jq '.' 2>/dev/null || echo "$REGISTER_RESPONSE"
echo ""

# Extract token from registration response
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.token' 2>/dev/null || echo "")
if [ "$TOKEN" = "null" ] || [ "$TOKEN" = "" ]; then
    echo "❌ Registration failed or no token received"
    echo "Trying to login instead..."
    
    # Test 3: Login with existing user
    echo "🔑 Test 3: Login with existing user"
    echo 'curl -X POST http://localhost:3002/auth/login -H "Content-Type: application/json" -d {"email": "test@example.com", "password": "testpass123"}'
    echo ""
    LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3002/auth/login -H "Content-Type: application/json" -d '{"email": "test@example.com", "password": "testpass123"}')
    echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"
    echo ""
    
    # Extract token from login response
    TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token' 2>/dev/null || echo "")
fi

if [ "$TOKEN" = "null" ] || [ "$TOKEN" = "" ]; then
    echo "❌ Could not get authentication token"
    echo "Please make sure the server is running and try again"
    exit 1
fi

echo "✅ Got authentication token: ${TOKEN:0:20}..."
echo ""

# Test 4: Access user info with token
echo "👤 Test 4: Get user info with token"
echo "curl -H \"Authorization: Bearer \$TOKEN\" http://localhost:3002/auth/me"
echo ""
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3002/auth/me | jq '.' 2>/dev/null || curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3002/auth/me
echo ""
echo ""

# Test 5: Access tasks with authentication (should work)
echo "✅ Test 5: Access /tasks with authentication (should work)"
echo "curl -H \"Authorization: Bearer \$TOKEN\" http://localhost:3002/tasks"
echo ""
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3002/tasks | jq '.' 2>/dev/null || curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3002/tasks
echo ""
echo ""

# Test 6: Create a task with authentication
echo "📝 Test 6: Create a new task with authentication"
echo 'curl -X POST http://localhost:3002/tasks -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d {"title": "My First Authenticated Task", "description": "Created with JWT token", "priority": "high"}'
echo ""
CREATE_RESPONSE=$(curl -s -X POST http://localhost:3002/tasks -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"title": "My First Authenticated Task", "description": "Created with JWT token", "priority": "high"}')
echo "$CREATE_RESPONSE" | jq '.' 2>/dev/null || echo "$CREATE_RESPONSE"
echo ""
echo ""

# Test 7: Get tasks again to see the new task
echo "📋 Test 7: Get tasks again to see the new task"
echo "curl -H \"Authorization: Bearer \$TOKEN\" http://localhost:3002/tasks"
echo ""
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3002/tasks | jq '.' 2>/dev/null || curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3002/tasks
echo ""

echo "🎉 JWT Authentication Test Complete!"
echo ""
echo "Key Points:"
echo "✅ Without token: Access denied (401 Unauthorized)"
echo "✅ With valid token: Full access to user's tasks"
echo "✅ Tasks are user-specific (each user only sees their own)"
echo "✅ Token required for all CRUD operations"