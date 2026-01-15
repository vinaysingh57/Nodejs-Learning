const express = require('express');
const mongoose = require('mongoose');
const { connectDB } = require('./mongodb-connection');
const Task = require('../models/Task');

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
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
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
        message: 'MongoDB Tasks API - Learning Node.js with Database',
        version: '1.0.0',
        endpoints: {
            'GET /tasks': 'Get all tasks',
            'POST /tasks': 'Create a new task',
            'GET /tasks/:id': 'Get a specific task',
            'PUT /tasks/:id': 'Update a specific task',
            'DELETE /tasks/:id': 'Delete a specific task',
            'GET /tasks/priority/:priority': 'Get tasks by priority (low, medium, high)',
            'GET /tasks/completed': 'Get all completed tasks',
            'GET /tasks/pending': 'Get all pending tasks',
            'PATCH /tasks/:id/complete': 'Mark task as complete',
            'PATCH /tasks/:id/incomplete': 'Mark task as incomplete'
        },
        database: 'MongoDB with Mongoose ODM'
    });
});

// GET /tasks - Get all tasks with optional filtering
app.get('/tasks', async (req, res) => {
    try {
        console.log('Fetching all tasks from MongoDB...');
        
        // Build query based on query parameters
        let query = {};
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

// POST /tasks - Create a new task
app.post('/tasks', async (req, res) => {
    try {
        console.log('Creating new task:', req.body);
        
        const taskData = {
            title: req.body.title,
            description: req.body.description,
            priority: req.body.priority || 'medium',
            dueDate: req.body.dueDate,
            tags: req.body.tags || []
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

// GET /tasks/:id - Get a specific task
app.get('/tasks/:id', async (req, res) => {
    try {
        console.log(`Fetching task with ID: ${req.params.id}`);
        
        const task = await Task.findById(req.params.id);
        
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

// PUT /tasks/:id - Update a specific task
app.put('/tasks/:id', async (req, res) => {
    try {
        console.log(`Updating task with ID: ${req.params.id}`);
        
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
        
        const task = await Task.findByIdAndUpdate(
            req.params.id,
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

// DELETE /tasks/:id - Delete a specific task
app.delete('/tasks/:id', async (req, res) => {
    try {
        console.log(`Deleting task with ID: ${req.params.id}`);
        
        const task = await Task.findByIdAndDelete(req.params.id);
        
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

// GET /tasks/priority/:priority - Get tasks by priority
app.get('/tasks/priority/:priority', async (req, res) => {
    try {
        const priority = req.params.priority.toLowerCase();
        console.log(`Fetching ${priority} priority tasks`);
        
        if (!['low', 'medium', 'high'].includes(priority)) {
            return res.status(400).json({
                success: false,
                error: 'Priority must be low, medium, or high'
            });
        }
        
        const tasks = await Task.findByPriority(priority);
        
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

// GET /tasks/completed - Get all completed tasks
app.get('/tasks/completed', async (req, res) => {
    try {
        console.log('Fetching completed tasks');
        
        const tasks = await Task.findCompleted();
        
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

// GET /tasks/pending - Get all pending tasks
app.get('/tasks/pending', async (req, res) => {
    try {
        console.log('Fetching pending tasks');
        
        const tasks = await Task.findPending();
        
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

// PATCH /tasks/:id/complete - Mark task as complete
app.patch('/tasks/:id/complete', async (req, res) => {
    try {
        console.log(`Marking task ${req.params.id} as complete`);
        
        const task = await Task.findById(req.params.id);
        
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

// PATCH /tasks/:id/incomplete - Mark task as incomplete
app.patch('/tasks/:id/incomplete', async (req, res) => {
    try {
        console.log(`Marking task ${req.params.id} as incomplete`);
        
        const task = await Task.findById(req.params.id);
        
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