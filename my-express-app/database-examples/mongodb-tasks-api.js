const express = require('express');
const mongoose = require('mongoose');
const { connectDB } = require('./mongodb-connection');
const Task = require('../models/Task');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { config } = require('../config/environment');

const app = express();
const port = 3002; // Different port to avoid conflicts

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
});

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Root route - API documentation
app.get('/', (req, res) => {
    res.json({
        message: 'MongoDB Tasks API with JWT Authentication - Learning Node.js',
        version: '1.0.0',
        authentication: {
            'POST /auth/register': 'Register a new user',
            'POST /auth/login': 'Login user and get JWT token',
            'GET /auth/me': 'Get current user info (requires token)'
        },
        endpoints: {
            'GET /tasks': 'Get all user tasks (requires token)',
            'POST /tasks': 'Create a new task (requires token)',
            'GET /tasks/:id': 'Get a specific task (requires token)',
            'PUT /tasks/:id': 'Update a specific task (requires token)',
            'DELETE /tasks/:id': 'Delete a specific task (requires token)',
            'GET /tasks/priority/:priority': 'Get tasks by priority (requires token)',
            'GET /tasks/completed': 'Get all completed tasks (requires token)',
            'GET /tasks/pending': 'Get all pending tasks (requires token)',
            'PATCH /tasks/:id/complete': 'Mark task as complete (requires token)',
            'PATCH /tasks/:id/incomplete': 'Mark task as incomplete (requires token)'
        },
        usage: {
            'Authentication': 'Send JWT token in Authorization header: Bearer <token>',
            'Register': 'POST /auth/register with name, email, password',
            'Login': 'POST /auth/login with email, password'
        },
        database: 'MongoDB with Mongoose ODM'
    });
});

// Authentication Routes

// POST /auth/register - Register new user
app.post('/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'User already exists with this email'
            });
        }
        
        // Create new user
        const user = new User({ name, email, password });
        await user.save();
        
        // Generate JWT token
        const token = user.generateAccessToken();
        
        console.log('New user registered:', user.email);
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        
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
            error: 'Server error during registration'
        });
    }
});

// POST /auth/login - Login user
app.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }
        
        // Find user by email
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }
        
        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }
        
        // Generate JWT token
        const token = user.generateAccessToken();
        
        console.log('User logged in:', user.email);
        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error during login'
        });
    }
});

// GET /auth/me - Get current user info
app.get('/auth/me', authenticateToken, async (req, res) => {
    res.json({
        success: true,
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            createdAt: req.user.createdAt
        }
    });
});

// GET /tasks - Get all tasks with optional filtering (PROTECTED)
app.get('/tasks', authenticateToken, async (req, res) => {
    try {
        console.log('Fetching all tasks from MongoDB...');
        
        // Build query based on query parameters (only user's tasks)
        let query = { createdBy: req.user._id };
        if (req.query.completed !== undefined) {
            query.completed = req.query.completed === 'true';
        }
        if (req.query.priority) {
            query.priority = req.query.priority.toLowerCase();
        }
        
        const tasks = await Task.find(query).sort({ createdAt: -1 }); // Sort by newest first
        
        console.log(`Found ${tasks.length} tasks`);
        res.json({
            success: true,
            count: tasks.length,
            data: tasks
        });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while fetching tasks',
            details: error.message
        });
    }
});

// POST /tasks - Create a new task (PROTECTED)
app.post('/tasks', authenticateToken, async (req, res) => {
    try {
        console.log('Creating new task for user:', req.user.email);
        
        const taskData = {
            title: req.body.title,
            description: req.body.description,
            priority: req.body.priority || 'medium',
            dueDate: req.body.dueDate,
            tags: req.body.tags || [],
            createdBy: req.user._id // Assign task to authenticated user
        };
        
        const task = new Task(taskData);
        const savedTask = await task.save();
        
        console.log('Task created successfully:', savedTask._id);
        res.status(201).json({
            success: true,
            message: 'Task created successfully',
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
            details: error.message
        });
    }
});

// GET /tasks/:id - Get a specific task (PROTECTED)
app.get('/tasks/:id', authenticateToken, async (req, res) => {
    try {
        console.log(`Fetching task with ID: ${req.params.id} for user: ${req.user.email}`);
        
        const task = await Task.findOne({ _id: req.params.id, createdBy: req.user._id });
        
        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Task not found'
            });
        }
        
        console.log('Task found:', task.title);
        res.json({
            success: true,
            data: task
        });
    } catch (error) {
        console.error('Error fetching task:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                error: 'Invalid task ID format'
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Server error while fetching task',
            details: error.message
        });
    }
});

// PUT /tasks/:id - Update a specific task (PROTECTED)
app.put('/tasks/:id', authenticateToken, async (req, res) => {
    try {
        console.log(`Updating task with ID: ${req.params.id} for user: ${req.user.email}`);
        
        const updateData = {
            title: req.body.title,
            description: req.body.description,
            completed: req.body.completed,
            priority: req.body.priority,
            dueDate: req.body.dueDate,
            tags: req.body.tags
        };
        
        // Remove undefined fields
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) {
                delete updateData[key];
            }
        });
        
        const task = await Task.findOneAndUpdate(
            { _id: req.params.id, createdBy: req.user._id }, // Only allow updating own tasks
            updateData,
            { 
                new: true,        // Return updated document
                runValidators: true  // Run schema validation
            }
        );
        
        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Task not found'
            });
        }
        
        console.log('Task updated successfully:', task.title);
        res.json({
            success: true,
            message: 'Task updated successfully',
            data: task
        });
    } catch (error) {
        console.error('Error updating task:', error);
        
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validationErrors
            });
        }
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                error: 'Invalid task ID format'
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Server error while updating task',
            details: error.message
        });
    }
});

// DELETE /tasks/:id - Delete a specific task (PROTECTED)
app.delete('/tasks/:id', authenticateToken, async (req, res) => {
    try {
        console.log(`Deleting task with ID: ${req.params.id} for user: ${req.user.email}`);
        
        const task = await Task.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
        
        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Task not found'
            });
        }
        
        console.log('Task deleted successfully:', task.title);
        res.json({
            success: true,
            message: 'Task deleted successfully',
            data: task
        });
    } catch (error) {
        console.error('Error deleting task:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                error: 'Invalid task ID format'
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Server error while deleting task',
            details: error.message
        });
    }
});

// GET /tasks/priority/:priority - Get tasks by priority (PROTECTED)
app.get('/tasks/priority/:priority', authenticateToken, async (req, res) => {
    try {
        const priority = req.params.priority.toLowerCase();
        console.log(`Fetching ${priority} priority tasks for user: ${req.user.email}`);
        
        if (!['low', 'medium', 'high'].includes(priority)) {
            return res.status(400).json({
                success: false,
                error: 'Priority must be low, medium, or high'
            });
        }
        
        const tasks = await Task.find({ priority: priority, createdBy: req.user._id });
        
        console.log(`Found ${tasks.length} ${priority} priority tasks`);
        res.json({
            success: true,
            priority: priority,
            count: tasks.length,
            data: tasks
        });
    } catch (error) {
        console.error('Error fetching tasks by priority:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while fetching tasks by priority',
            details: error.message
        });
    }
});

// GET /tasks/completed - Get all completed tasks (PROTECTED)
app.get('/tasks/completed', authenticateToken, async (req, res) => {
    try {
        console.log(`Fetching completed tasks for user: ${req.user.email}`);
        
        const tasks = await Task.find({ completed: true, createdBy: req.user._id });
        
        console.log(`Found ${tasks.length} completed tasks`);
        res.json({
            success: true,
            count: tasks.length,
            data: tasks
        });
    } catch (error) {
        console.error('Error fetching completed tasks:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while fetching completed tasks',
            details: error.message
        });
    }
});

// GET /tasks/pending - Get all pending tasks (PROTECTED)
app.get('/tasks/pending', authenticateToken, async (req, res) => {
    try {
        console.log(`Fetching pending tasks for user: ${req.user.email}`);
        
        const tasks = await Task.find({ completed: false, createdBy: req.user._id });
        
        console.log(`Found ${tasks.length} pending tasks`);
        res.json({
            success: true,
            count: tasks.length,
            data: tasks
        });
    } catch (error) {
        console.error('Error fetching pending tasks:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while fetching pending tasks',
            details: error.message
        });
    }
});

// PATCH /tasks/:id/complete - Mark task as complete (PROTECTED)
app.patch('/tasks/:id/complete', authenticateToken, async (req, res) => {
    try {
        console.log(`Marking task ${req.params.id} as complete for user: ${req.user.email}`);
        
        const task = await Task.findOne({ _id: req.params.id, createdBy: req.user._id });
        
        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Task not found'
            });
        }
        
        await task.markComplete();
        
        console.log('Task marked as complete:', task.title);
        res.json({
            success: true,
            message: 'Task marked as complete',
            data: task
        });
    } catch (error) {
        console.error('Error marking task as complete:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                error: 'Invalid task ID format'
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Server error while marking task as complete',
            details: error.message
        });
    }
});

// PATCH /tasks/:id/incomplete - Mark task as incomplete (PROTECTED)
app.patch('/tasks/:id/incomplete', authenticateToken, async (req, res) => {
    try {
        console.log(`Marking task ${req.params.id} as incomplete for user: ${req.user.email}`);
        
        const task = await Task.findOne({ _id: req.params.id, createdBy: req.user._id });
        
        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Task not found'
            });
        }
        
        await task.markIncomplete();
        
        console.log('Task marked as incomplete:', task.title);
        res.json({
            success: true,
            message: 'Task marked as incomplete',
            data: task
        });
    } catch (error) {
        console.error('Error marking task as incomplete:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                error: 'Invalid task ID format'
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Server error while marking task as incomplete',
            details: error.message
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
    });
});

// Handle 404 routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        availableRoutes: '/ for API documentation'
    });
});

// Start the server
app.listen(port, () => {
    console.log(`🚀 MongoDB Tasks API server running on http://localhost:${port}`);
    console.log(`📋 Visit http://localhost:${port}/ for API documentation`);
    console.log(`🗄️  Connected to MongoDB database: node-learning`);
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