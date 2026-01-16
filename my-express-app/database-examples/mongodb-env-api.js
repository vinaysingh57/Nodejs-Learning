// Environment-Aware MongoDB Tasks API
const express = require('express');
const mongoose = require('mongoose');
const { config, validateConfig, displayConfig, isDevelopment } = require('../config/environment');
const { connectDB } = require('./mongodb-connection');
const Task = require('../models/Task');

const app = express();

// Validate configuration on startup
validateConfig();

// Display current configuration
displayConfig();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conditional CORS middleware (based on environment variable)
if (config.features.enableCors) {
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        next();
    });
    console.log('✅ CORS middleware enabled');
}

// Conditional request logging middleware
if (config.features.enableLogging) {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
    });
    console.log('✅ Request logging enabled');
}

// Environment info endpoint
app.get('/env', (req, res) => {
    // Only show environment info in development
    if (!isDevelopment()) {
        return res.status(403).json({
            success: false,
            error: 'Environment information not available in production'
        });
    }

    res.json({
        success: true,
        environment: {
            nodeEnv: config.server.environment,
            port: config.server.port,
            database: config.database.name,
            features: config.features,
            // Don't expose sensitive information
            hasJwtSecret: !!config.security.jwtSecret,
            hasApiKey: !!config.security.apiKey
        },
        processEnv: {
            nodeVersion: process.version,
            platform: process.platform,
            uptime: Math.floor(process.uptime()) + ' seconds'
        }
    });
});

// Root route - API documentation with environment-aware features
app.get('/', (req, res) => {
    res.json({
        message: `MongoDB Tasks API - Environment: ${config.server.environment}`,
        version: config.server.apiVersion,
        baseUrl: config.server.baseUrl,
        database: config.database.name,
        features: {
            corsEnabled: config.features.enableCors,
            loggingEnabled: config.features.enableLogging,
            rateLimitingEnabled: config.features.enableRateLimiting
        },
        endpoints: {
            'GET /': 'API documentation',
            'GET /env': 'Environment information (development only)',
            'GET /tasks': 'Get all tasks',
            'POST /tasks': 'Create a new task',
            'GET /tasks/:id': 'Get a specific task',
            'PUT /tasks/:id': 'Update a specific task',
            'DELETE /tasks/:id': 'Delete a specific task',
            'GET /tasks/priority/:priority': 'Get tasks by priority',
            'GET /tasks/completed': 'Get completed tasks',
            'GET /tasks/pending': 'Get pending tasks'
        }
    });
});

// Example of using environment variables in route logic
app.get('/config', (req, res) => {
    // Check if API key is provided (example of API key authentication)
    const providedApiKey = req.headers['x-api-key'] || req.query.apiKey;
    
    if (config.security.apiKey && providedApiKey !== config.security.apiKey) {
        return res.status(401).json({
            success: false,
            error: 'Invalid API key'
        });
    }

    res.json({
        success: true,
        message: 'Configuration accessed successfully',
        config: {
            environment: config.server.environment,
            version: config.server.apiVersion,
            features: config.features,
            // Hide sensitive data
            databaseConfigured: !!config.database.uri,
            emailConfigured: !!(config.email.user && config.email.password)
        }
    });
});

// GET /tasks - Get all tasks
app.get('/tasks', async (req, res) => {
    try {
        if (config.features.enableLogging) {
            console.log('Fetching all tasks from MongoDB...');
        }
        
        // Build query based on query parameters
        let query = {};
        if (req.query.completed !== undefined) {
            query.completed = req.query.completed === 'true';
        }
        if (req.query.priority) {
            query.priority = req.query.priority.toLowerCase();
        }
        
        const tasks = await Task.find(query).sort({ createdAt: -1 });
        
        if (config.features.enableLogging) {
            console.log(`Found ${tasks.length} tasks`);
        }
        
        res.json({
            success: true,
            environment: config.server.environment,
            count: tasks.length,
            data: tasks
        });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while fetching tasks',
            details: isDevelopment() ? error.message : 'Internal server error'
        });
    }
});

// POST /tasks - Create a new task
app.post('/tasks', async (req, res) => {
    try {
        if (config.features.enableLogging) {
            console.log('Creating new task:', req.body);
        }
        
        const taskData = {
            title: req.body.title,
            description: req.body.description,
            priority: req.body.priority || 'medium',
            dueDate: req.body.dueDate,
            tags: req.body.tags || []
        };
        
        const task = new Task(taskData);
        const savedTask = await task.save();
        
        if (config.features.enableLogging) {
            console.log('Task created successfully:', savedTask._id);
        }
        
        res.status(201).json({
            success: true,
            message: 'Task created successfully',
            environment: config.server.environment,
            data: savedTask
        });
    } catch (error) {
        console.error('Error creating task:', error);
        
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validationErrors
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Server error while creating task',
            details: isDevelopment() ? error.message : 'Internal server error'
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: isDevelopment() ? error.message : 'Something went wrong'
    });
});

// Handle 404 routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        environment: config.server.environment,
        availableRoutes: '/ for API documentation'
    });
});

// Start the server using environment variable for port
app.listen(config.server.port, () => {
    console.log(`🚀 Tasks API server running on http://localhost:${config.server.port}`);
    console.log(`📋 Environment: ${config.server.environment}`);
    console.log(`🗄️  Database: ${config.database.name}`);
    console.log(`📝 Visit http://localhost:${config.server.port}/ for API documentation`);
    
    if (isDevelopment()) {
        console.log(`🔧 Development mode - Extra endpoints available:`);
        console.log(`   GET /env - Environment information`);
        console.log(`   GET /config - Configuration details`);
    }
});

// Handle process termination
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