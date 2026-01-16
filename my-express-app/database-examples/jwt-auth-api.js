// Complete JWT Authentication API with MongoDB
const express = require('express');
const mongoose = require('mongoose');
const { config, validateConfig, displayConfig, isDevelopment } = require('../config/environment');
const { connectDB } = require('./mongodb-connection');

// Import routes and middleware
const authRoutes = require('../routes/auth');
const taskRoutes = require('../routes/tasks');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const app = express();

// Validate configuration on startup
validateConfig();
displayConfig();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
if (config.features.enableCors) {
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        
        // Handle preflight requests
        if (req.method === 'OPTIONS') {
            res.sendStatus(200);
        } else {
            next();
        }
    });
    console.log('✅ CORS middleware enabled');
}

// Request logging middleware
if (config.features.enableLogging) {
    app.use((req, res, next) => {
        const timestamp = new Date().toISOString();
        const method = req.method;
        const path = req.path;
        const userAgent = req.get('User-Agent') || 'Unknown';
        const ip = req.ip || req.connection.remoteAddress;
        
        console.log(`${timestamp} - ${method} ${path} - IP: ${ip} - UA: ${userAgent}`);
        next();
    });
    console.log('✅ Request logging enabled');
}

// Root route - API documentation
app.get('/', (req, res) => {
    res.json({
        message: `JWT Authentication API - Environment: ${config.server.environment}`,
        version: config.server.apiVersion,
        baseUrl: config.server.baseUrl,
        database: config.database.name,
        features: {
            corsEnabled: config.features.enableCors,
            loggingEnabled: config.features.enableLogging,
            authentication: 'JWT with Refresh Tokens'
        },
        endpoints: {
            // Authentication endpoints
            'POST /auth/register': 'User registration',
            'POST /auth/login': 'User login',
            'POST /auth/refresh': 'Refresh access token',
            'POST /auth/logout': 'Logout (invalidate refresh token)',
            'GET /auth/me': 'Get current user profile (requires auth)',
            'PUT /auth/profile': 'Update user profile (requires auth)',
            'PUT /auth/change-password': 'Change password (requires auth)',
            
            // Task endpoints
            'GET /tasks': 'Get all tasks (optional auth)',
            'POST /tasks': 'Create a new task (requires auth)',
            'GET /tasks/:id': 'Get a specific task (optional auth)',
            'PUT /tasks/:id': 'Update a specific task (requires auth)',
            'DELETE /tasks/:id': 'Delete a specific task (requires auth)',
            'GET /tasks/my/stats': 'Get user task statistics (requires auth)',
            'GET /tasks/user/:userId': 'Get tasks by user (admin only)',
            
            // Utility endpoints
            'GET /users': 'Get all users (admin only)',
            'GET /health': 'API health check'
        },
        authentication: {
            type: 'JWT Bearer Token',
            headerFormat: 'Authorization: Bearer <token>',
            tokenExpiry: '15 minutes (access token)',
            refreshTokenExpiry: '7 days',
            roles: ['user', 'admin', 'moderator']
        }
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: config.server.environment,
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        uptime: Math.floor(process.uptime()) + ' seconds'
    });
});

// Mount authentication routes
app.use('/auth', authRoutes);

// Mount task routes
app.use('/tasks', taskRoutes);

// Admin-only endpoint to get all users
app.get('/users', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const User = require('../models/User');
        
        const users = await User.find({})
            .select('-refreshTokens')
            .sort({ createdAt: -1 });
        
        res.json({
            success: true,
            count: users.length,
            data: users,
            requestedBy: {
                id: req.user._id,
                name: req.user.name,
                role: req.user.role
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch users',
            details: isDevelopment() ? error.message : 'Internal server error'
        });
    }
});

// JWT Learning endpoint (development only)
if (isDevelopment()) {
    app.get('/jwt/decode', (req, res) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.startsWith('Bearer ') 
            ? authHeader.slice(7) 
            : null;

        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'No token provided',
                message: 'Provide token in Authorization header: Bearer <token>'
            });
        }

        try {
            const jwt = require('jsonwebtoken');
            const decoded = jwt.decode(token, { complete: true });
            
            res.json({
                success: true,
                message: 'Token decoded successfully (not verified)',
                data: {
                    header: decoded.header,
                    payload: decoded.payload,
                    signature: decoded.signature ? 'present' : 'missing'
                },
                note: 'This endpoint only decodes the token, it does not verify its signature'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: 'Invalid token format',
                details: error.message
            });
        }
    });

    console.log('🔧 Development mode - JWT decode endpoint available at /jwt/decode');
}

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    
    // JWT errors
    if (error.name === 'UnauthorizedError') {
        return res.status(401).json({
            success: false,
            error: 'Invalid token',
            message: 'Please provide a valid JWT token'
        });
    }
    
    // MongoDB errors
    if (error.name === 'MongoError' || error.name === 'MongooseError') {
        return res.status(500).json({
            success: false,
            error: 'Database error',
            message: isDevelopment() ? error.message : 'Database operation failed'
        });
    }
    
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: isDevelopment() ? error.message : 'Something went wrong'
    });
});

// Handle 404 routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        message: `Cannot ${req.method} ${req.path}`,
        availableRoutes: [
            '/ - API documentation',
            '/auth/* - Authentication endpoints',
            '/tasks/* - Task management endpoints',
            '/health - Health check'
        ]
    });
});

// Start the server
app.listen(config.server.port, () => {
    console.log(`🚀 JWT Authentication API running on http://localhost:${config.server.port}`);
    console.log(`📋 Environment: ${config.server.environment}`);
    console.log(`🗄️  Database: ${config.database.name}`);
    console.log(`🔐 JWT Authentication: Enabled`);
    console.log(`📝 Visit http://localhost:${config.server.port}/ for API documentation`);
    
    if (isDevelopment()) {
        console.log(`\n🔧 Development mode endpoints:`);
        console.log(`   GET /jwt/decode - Decode JWT tokens`);
        console.log(`\n🧪 Test authentication with:`);
        console.log(`   curl -X POST http://localhost:${config.server.port}/auth/register \\`);
        console.log(`     -H "Content-Type: application/json" \\`);
        console.log(`     -d '{"name":"Test User","email":"test@example.com","password":"password123"}'`);
    }
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT. Graceful shutdown...');
    try {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
});