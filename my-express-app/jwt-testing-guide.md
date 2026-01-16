# JWT Authentication Testing Guide

## 🔐 JWT Authentication API Testing

Your JWT API is running on **http://localhost:3002**

### 📋 Available Endpoints

#### 🔓 Public Endpoints (No Authentication Required)
- `GET /` - API documentation
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh access token
- `GET /jwt/decode` - Decode JWT tokens (development only)

#### 🔒 Protected Endpoints (Authentication Required)
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `POST /auth/change-password` - Change password
- `POST /auth/logout` - Logout (invalidate refresh token)
- `GET /tasks` - Get user tasks
- `POST /tasks` - Create new task
- `GET /admin/users` - Admin only: List all users
- `DELETE /admin/users/:id` - Admin only: Delete user

### 🧪 Step-by-Step Testing

#### Step 1: Register a New User
```bash
curl -X POST http://localhost:3002/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com", 
    "password": "securePassword123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    },
    "tokens": {
      "accessToken": "eyJ...",
      "refreshToken": "eyJ..."
    }
  }
}
```

#### Step 2: Login with Existing User
```bash
curl -X POST http://localhost:3002/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securePassword123"
  }'
```

#### Step 3: Access Protected Route
```bash
# Replace YOUR_ACCESS_TOKEN with the token from registration/login
curl -X GET http://localhost:3002/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Step 4: Create a Task
```bash
curl -X POST http://localhost:3002/tasks \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Learn JWT Authentication",
    "description": "Complete the JWT tutorial",
    "priority": "high"
  }'
```

#### Step 5: Get User Tasks
```bash
curl -X GET http://localhost:3002/tasks \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Step 6: Update Profile
```bash
curl -X PUT http://localhost:3002/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "bio": "Learning Node.js and JWT"
  }'
```

#### Step 7: Change Password
```bash
curl -X POST http://localhost:3002/auth/change-password \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "securePassword123",
    "newPassword": "newSecurePassword456"
  }'
```

#### Step 8: Refresh Token
```bash
# When access token expires, use refresh token
curl -X POST http://localhost:3002/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

#### Step 9: Logout
```bash
curl -X POST http://localhost:3002/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

### 🛠️ Development Tools

#### Decode JWT Token (Development Only)
```bash
curl -X GET "http://localhost:3002/jwt/decode?token=YOUR_JWT_TOKEN"
```

#### Test with Browser
Visit: http://localhost:3002

### 🧪 Testing Different Scenarios

#### Test Invalid Credentials
```bash
curl -X POST http://localhost:3002/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "wrongpassword"
  }'
```

#### Test Without Token
```bash
curl -X GET http://localhost:3002/profile
```

#### Test with Invalid Token
```bash
curl -X GET http://localhost:3002/profile \
  -H "Authorization: Bearer invalid_token_here"
```

#### Test Admin Endpoints (Create Admin User First)
1. Register user with admin role through database or API
2. Test admin endpoints:
```bash
curl -X GET http://localhost:3002/admin/users \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

### 🔍 Understanding JWT Flow

1. **Registration/Login**: User provides credentials → Server validates → Returns JWT tokens
2. **API Requests**: Client sends access token in Authorization header
3. **Token Validation**: Server verifies token signature and expiration
4. **Token Refresh**: When access token expires, use refresh token to get new one
5. **Logout**: Server invalidates refresh token

### 📊 Token Structure

**Access Token** (15 minutes):
- Contains user ID, email, role
- Used for API authentication
- Short-lived for security

**Refresh Token** (7 days):
- Contains minimal user data
- Used only to generate new access tokens
- Longer-lived but can be revoked

### 🛡️ Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT token-based authentication
- ✅ Refresh token rotation
- ✅ Role-based access control
- ✅ Input validation
- ✅ Error handling
- ✅ CORS enabled
- ✅ Environment variables for secrets

### 🎯 Common HTTP Status Codes

- `200` - Success
- `201` - Created (registration, new task)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid credentials, no token)
- `403` - Forbidden (valid token but insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

### 🔧 Troubleshooting

#### Token Expired Error
- Use refresh token to get new access token
- Re-login if refresh token is also expired

#### Invalid Token Error
- Check if token is properly formatted
- Ensure token is sent in Authorization header: `Bearer YOUR_TOKEN`

#### Connection Issues
- Verify API is running on http://localhost:3002
- Check MongoDB connection

---

## 🚀 Next Steps

1. Test all endpoints manually using curl or a REST client
2. Build a simple frontend to consume this API
3. Learn about token storage (httpOnly cookies vs localStorage)
4. Implement social login (Google, GitHub)
5. Add email verification
6. Implement rate limiting
7. Add API documentation with Swagger