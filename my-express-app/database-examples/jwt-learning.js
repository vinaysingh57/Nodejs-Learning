// JWT Authentication Learning Script
console.log('🔐 Learning JWT Authentication in Node.js\n');

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

console.log('═'.repeat(60));
console.log('🎯 PART 1: Understanding JWT Structure');
console.log('═'.repeat(60));

// Example JWT payload
const payload = {
    id: '12345',
    email: 'user@example.com',
    role: 'user',
    name: 'John Doe',
    iat: Math.floor(Date.now() / 1000), // Issued at
    exp: Math.floor(Date.now() / 1000) + (15 * 60) // Expires in 15 minutes
};

const secret = 'your-super-secret-key-here';

console.log('📋 JWT Payload:');
console.log(JSON.stringify(payload, null, 2));

// Create JWT token
const token = jwt.sign(payload, secret, {
    issuer: 'node-learning-api',
    audience: 'node-learning-client'
});

console.log('\n🔑 Generated JWT Token:');
console.log(token);

// Decode token (without verification)
const decoded = jwt.decode(token, { complete: true });
console.log('\n📖 Decoded JWT Structure:');
console.log('Header:', JSON.stringify(decoded.header, null, 2));
console.log('Payload:', JSON.stringify(decoded.payload, null, 2));
console.log('Signature:', decoded.signature ? 'Present' : 'Missing');

console.log('\n═'.repeat(60));
console.log('🔒 PART 2: Password Hashing with bcrypt');
console.log('═'.repeat(60));

async function demonstratePasswordHashing() {
    const plainPassword = 'mySecurePassword123';
    
    console.log(`📝 Original Password: ${plainPassword}`);
    
    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    
    console.log(`🧂 Salt: ${salt}`);
    console.log(`🔐 Hashed Password: ${hashedPassword}`);
    
    // Verify password
    const isMatch1 = await bcrypt.compare(plainPassword, hashedPassword);
    const isMatch2 = await bcrypt.compare('wrongPassword', hashedPassword);
    
    console.log(`✅ Correct password verification: ${isMatch1}`);
    console.log(`❌ Wrong password verification: ${isMatch2}`);
}

demonstratePasswordHashing().then(() => {
    console.log('\n═'.repeat(60));
    console.log('⚡ PART 3: JWT Token Verification');
    console.log('═'.repeat(60));
    
    try {
        // Verify with correct secret
        const verified = jwt.verify(token, secret, {
            issuer: 'node-learning-api',
            audience: 'node-learning-client'
        });
        
        console.log('✅ Token verified successfully:');
        console.log('User ID:', verified.id);
        console.log('Email:', verified.email);
        console.log('Role:', verified.role);
        console.log('Issued at:', new Date(verified.iat * 1000).toISOString());
        console.log('Expires at:', new Date(verified.exp * 1000).toISOString());
        
    } catch (error) {
        console.log('❌ Token verification failed:', error.message);
    }
    
    console.log('\n🚫 Testing with wrong secret:');
    try {
        jwt.verify(token, 'wrong-secret');
    } catch (error) {
        console.log('Expected error:', error.message);
    }
    
    console.log('\n═'.repeat(60));
    console.log('⏰ PART 4: Token Expiration Demo');
    console.log('═'.repeat(60));
    
    // Create a token that expires in 1 second
    const shortToken = jwt.sign(
        { id: '12345', email: 'test@example.com' },
        secret,
        { expiresIn: '1s' }
    );
    
    console.log('🕐 Created token with 1-second expiry');
    
    // Verify immediately
    try {
        jwt.verify(shortToken, secret);
        console.log('✅ Token valid immediately after creation');
    } catch (error) {
        console.log('❌ Unexpected error:', error.message);
    }
    
    // Wait 2 seconds and try again
    setTimeout(() => {
        try {
            jwt.verify(shortToken, secret);
            console.log('❌ This should not happen - token should be expired');
        } catch (error) {
            console.log('✅ Expected expiration error:', error.message);
        }
        
        console.log('\n═'.repeat(60));
        console.log('🏗️ PART 5: JWT Best Practices');
        console.log('═'.repeat(60));
        
        console.log('✅ DO:');
        console.log('  • Use HTTPS in production');
        console.log('  • Keep tokens short-lived (15-30 minutes)');
        console.log('  • Use refresh tokens for long-term access');
        console.log('  • Store secrets securely (environment variables)');
        console.log('  • Implement proper token expiration');
        console.log('  • Validate tokens on every request');
        console.log('  • Use strong, unique secrets');
        console.log('  • Include minimal necessary claims');
        
        console.log('\n❌ DON\'T:');
        console.log('  • Store sensitive data in JWT payload');
        console.log('  • Use weak or predictable secrets');
        console.log('  • Store JWTs in localStorage (XSS risk)');
        console.log('  • Create tokens that never expire');
        console.log('  • Trust client-side token validation');
        console.log('  • Include passwords in JWT payload');
        console.log('  • Use JWT for session storage');
        
        console.log('\n═'.repeat(60));
        console.log('🔄 PART 6: Access vs Refresh Tokens');
        console.log('═'.repeat(60));
        
        // Access token (short-lived)
        const accessToken = jwt.sign(
            {
                id: '12345',
                email: 'user@example.com',
                role: 'user',
                type: 'access'
            },
            secret,
            { expiresIn: '15m' }
        );
        
        // Refresh token (long-lived)
        const refreshToken = jwt.sign(
            {
                id: '12345',
                type: 'refresh'
            },
            secret + 'refresh', // Different secret for refresh tokens
            { expiresIn: '7d' }
        );
        
        console.log('🎫 Access Token (15 min expiry):');
        console.log('Purpose: API requests, contains user data');
        console.log('Length:', accessToken.length, 'characters');
        
        console.log('\n🔄 Refresh Token (7 day expiry):');
        console.log('Purpose: Generate new access tokens, minimal data');
        console.log('Length:', refreshToken.length, 'characters');
        
        console.log('\n💡 Token Flow:');
        console.log('1. User logs in → Receive both tokens');
        console.log('2. Use access token for API requests');
        console.log('3. When access token expires → Use refresh token');
        console.log('4. Get new access token → Continue API requests');
        console.log('5. When refresh token expires → User logs in again');
        
        console.log('\n═'.repeat(60));
        console.log('🧪 PART 7: Middleware Simulation');
        console.log('═'.repeat(60));
        
        // Simulate Express middleware
        function authenticateToken(req, res, next) {
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];
            
            if (!token) {
                return res.status(401).json({ error: 'Access token required' });
            }
            
            try {
                const user = jwt.verify(token, secret);
                req.user = user;
                next();
            } catch (error) {
                return res.status(403).json({ error: 'Invalid token' });
            }
        }
        
        // Simulate request object
        const mockRequest = {
            headers: {
                'authorization': `Bearer ${accessToken}`
            }
        };
        
        const mockResponse = {
            status: (code) => ({
                json: (data) => console.log(`Response ${code}:`, data)
            })
        };
        
        const mockNext = () => console.log('✅ Middleware passed - user authenticated');
        
        console.log('🔍 Testing middleware with valid token:');
        authenticateToken(mockRequest, mockResponse, mockNext);
        console.log('Authenticated user:', mockRequest.user?.email);
        
        console.log('\n🔍 Testing middleware with invalid token:');
        const invalidRequest = {
            headers: {
                'authorization': 'Bearer invalid-token'
            }
        };
        authenticateToken(invalidRequest, mockResponse, () => {});
        
        console.log('\n═'.repeat(60));
        console.log('✨ JWT Authentication Learning Complete!');
        console.log('═'.repeat(60));
        
        console.log('\n🚀 Next Steps:');
        console.log('1. Run the complete JWT API: node database-examples/jwt-auth-api.js');
        console.log('2. Test registration: POST /auth/register');
        console.log('3. Test login: POST /auth/login');
        console.log('4. Use tokens to access protected routes');
        console.log('5. Try the refresh token flow');
        
    }, 2000);
}).catch(error => {
    console.error('Error in demonstration:', error);
});