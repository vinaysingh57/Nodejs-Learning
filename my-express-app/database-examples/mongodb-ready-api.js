const express = require('express');
const app = express();
const port = 3002;

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

// Temporary in-memory storage (will be replaced with MongoDB later)
let tasks = [
    {
        _id: '1',
        title: 'Learn MongoDB Basics',
        description: 'Understand schemas, models, and CRUD operations',
        completed: false,
        priority: 'high',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        _id: '2',
        title: 'Set up MongoDB Connection',
        description: 'Install and configure MongoDB with Mongoose',
        completed: false,
        priority: 'medium',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

let nextId = 3;

// Root route - API documentation
app.get('/', (req, res) => {
    res.json({
        message: 'MongoDB-Ready Tasks API - Learning Node.js with Database (Currently using in-memory storage)',
        version: '1.0.0',
        status: 'MongoDB connection pending - using temporary storage',
        endpoints: {
            'GET /tasks': 'Get all tasks',
            'POST /tasks': 'Create a new task',
            'GET /tasks/:id': 'Get a specific task',
            'PUT /tasks/:id': 'Update a specific task',
            'DELETE /tasks/:id': 'Delete a specific task',
            'GET /tasks/priority/:priority': 'Get tasks by priority (low, medium, high)',
            'GET /tasks/completed': 'Get all completed tasks',
            'GET /tasks/pending': 'Get all pending tasks'
        },
        nextStep: 'Install and configure MongoDB to enable database persistence'
    });
});

// GET /tasks - Get all tasks
app.get('/tasks', (req, res) => {
    try {
        console.log('Fetching all tasks...');
        
        let filteredTasks = [...tasks];
        
        // Filter by completed status
        if (req.query.completed !== undefined) {
            const isCompleted = req.query.completed === 'true';
            filteredTasks = filteredTasks.filter(task => task.completed === isCompleted);
        }
        
        // Filter by priority
        if (req.query.priority) {
            filteredTasks = filteredTasks.filter(task => 
                task.priority.toLowerCase() === req.query.priority.toLowerCase()
            );
        }
        
        console.log(`Found ${filteredTasks.length} tasks`);
        res.json({
            success: true,
            count: filteredTasks.length,
            data: filteredTasks,
            note: 'Using in-memory storage - data will be lost on server restart'
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
app.post('/tasks', (req, res) => {
    try {
        console.log('Creating new task:', req.body);
        
        // Validation
        if (!req.body.title || req.body.title.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Title is required'
            });
        }
        
        if (req.body.title.length > 100) {
            return res.status(400).json({
                success: false,
                error: 'Title cannot exceed 100 characters'
            });
        }
        
        const newTask = {
            _id: nextId.toString(),
            title: req.body.title.trim(),
            description: req.body.description ? req.body.description.trim() : '',
            completed: false,
            priority: req.body.priority ? req.body.priority.toLowerCase() : 'medium',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Validate priority
        if (!['low', 'medium', 'high'].includes(newTask.priority)) {
            return res.status(400).json({
                success: false,
                error: 'Priority must be one of: low, medium, high'
            });
        }
        
        tasks.push(newTask);
        nextId++;
        
        console.log('Task created successfully:', newTask._id);
        res.status(201).json({
            success: true,
            message: 'Task created successfully',
            data: newTask,
            note: 'Using in-memory storage - data will be lost on server restart'
        });
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while creating task',
            details: error.message
        });
    }
});

// GET /tasks/:id - Get a specific task
app.get('/tasks/:id', (req, res) => {
    try {
        console.log(`Fetching task with ID: ${req.params.id}`);
        
        const task = tasks.find(t => t._id === req.params.id);
        
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
        res.status(500).json({
            success: false,
            error: 'Server error while fetching task',
            details: error.message
        });
    }
});

// PUT /tasks/:id - Update a specific task
app.put('/tasks/:id', (req, res) => {
    try {
        console.log(`Updating task with ID: ${req.params.id}`);
        
        const taskIndex = tasks.findIndex(t => t._id === req.params.id);
        
        if (taskIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Task not found'
            });
        }
        
        const task = tasks[taskIndex];
        
        // Update fields if provided
        if (req.body.title !== undefined) {
            if (!req.body.title.trim()) {
                return res.status(400).json({
                    success: false,
                    error: 'Title cannot be empty'
                });
            }
            task.title = req.body.title.trim();
        }
        
        if (req.body.description !== undefined) {
            task.description = req.body.description.trim();
        }
        
        if (req.body.completed !== undefined) {
            task.completed = Boolean(req.body.completed);
        }
        
        if (req.body.priority !== undefined) {
            const priority = req.body.priority.toLowerCase();
            if (!['low', 'medium', 'high'].includes(priority)) {
                return res.status(400).json({
                    success: false,
                    error: 'Priority must be one of: low, medium, high'
                });
            }
            task.priority = priority;
        }
        
        task.updatedAt = new Date().toISOString();
        
        console.log('Task updated successfully:', task.title);
        res.json({
            success: true,
            message: 'Task updated successfully',
            data: task
        });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while updating task',
            details: error.message
        });
    }
});

// DELETE /tasks/:id - Delete a specific task
app.delete('/tasks/:id', (req, res) => {
    try {
        console.log(`Deleting task with ID: ${req.params.id}`);
        
        const taskIndex = tasks.findIndex(t => t._id === req.params.id);
        
        if (taskIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Task not found'
            });
        }
        
        const deletedTask = tasks.splice(taskIndex, 1)[0];
        
        console.log('Task deleted successfully:', deletedTask.title);
        res.json({
            success: true,
            message: 'Task deleted successfully',
            data: deletedTask
        });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while deleting task',
            details: error.message
        });
    }
});

// GET /tasks/priority/:priority - Get tasks by priority
app.get('/tasks/priority/:priority', (req, res) => {
    try {
        const priority = req.params.priority.toLowerCase();
        console.log(`Fetching ${priority} priority tasks`);
        
        if (!['low', 'medium', 'high'].includes(priority)) {
            return res.status(400).json({
                success: false,
                error: 'Priority must be low, medium, or high'
            });
        }
        
        const filteredTasks = tasks.filter(task => task.priority === priority);
        
        console.log(`Found ${filteredTasks.length} ${priority} priority tasks`);
        res.json({
            success: true,
            priority: priority,
            count: filteredTasks.length,
            data: filteredTasks
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
app.get('/tasks/completed', (req, res) => {
    try {
        console.log('Fetching completed tasks');
        
        const completedTasks = tasks.filter(task => task.completed === true);
        
        console.log(`Found ${completedTasks.length} completed tasks`);
        res.json({
            success: true,
            count: completedTasks.length,
            data: completedTasks
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
app.get('/tasks/pending', (req, res) => {
    try {
        console.log('Fetching pending tasks');
        
        const pendingTasks = tasks.filter(task => task.completed === false);
        
        console.log(`Found ${pendingTasks.length} pending tasks`);
        res.json({
            success: true,
            count: pendingTasks.length,
            data: pendingTasks
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
    console.log(`🚀 Tasks API server running on http://localhost:${port}`);
    console.log(`📋 Visit http://localhost:${port}/ for API documentation`);
    console.log(`⚠️  Currently using in-memory storage`);
    console.log(`📝 Next step: Install MongoDB and switch to database storage`);
    console.log(`\n🧪 Test the API with:`);
    console.log(`   curl http://localhost:${port}/tasks`);
    console.log(`   curl -X POST http://localhost:${port}/tasks -H "Content-Type: application/json" -d '{"title":"Test task","priority":"high"}'`);
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT. Shutting down gracefully...');
    console.log('✅ Server closed.');
    process.exit(0);
});