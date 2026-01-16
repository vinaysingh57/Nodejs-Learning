const express = require('express');
const Task = require('../models/Task');
const { authenticateToken, authorizeRoles, optionalAuth } = require('../middleware/auth');
const { isDevelopment } = require('../config/environment');

const router = express.Router();

// GET /tasks - Get all tasks (with optional authentication)
router.get('/', optionalAuth, async (req, res) => {
    try {
        console.log('Fetching tasks for user:', req.user ? req.user.email : 'anonymous');
        
        // Build query based on query parameters and user access
        let query = {};
        
        // If user is authenticated, they can see their own tasks
        // If user is admin, they can see all tasks
        if (req.user) {
            if (req.user.role !== 'admin') {
                // Regular users can only see their own tasks
                query.createdBy = req.user._id;
            }
            // Admin can see all tasks (no additional filter)
        } else {
            // Anonymous users can see public tasks only
            query.isPublic = true;
        }

        // Add filters from query parameters
        if (req.query.completed !== undefined) {
            query.completed = req.query.completed === 'true';
        }
        if (req.query.priority) {
            query.priority = req.query.priority.toLowerCase();
        }
        
        const tasks = await Task.find(query)
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });
        
        console.log(`Found ${tasks.length} tasks`);
        
        res.json({
            success: true,
            count: tasks.length,
            data: tasks,
            user: req.user ? { 
                id: req.user._id, 
                name: req.user.name, 
                role: req.user.role 
            } : null
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

// POST /tasks - Create a new task (authentication required)
router.post('/', authenticateToken, async (req, res) => {
    try {
        console.log('Creating new task for user:', req.user.email, req.body);
        
        const taskData = {
            title: req.body.title,
            description: req.body.description,
            priority: req.body.priority || 'medium',
            dueDate: req.body.dueDate,
            tags: req.body.tags || [],
            isPublic: req.body.isPublic || false,
            createdBy: req.user._id // Automatically set the creator
        };
        
        const task = new Task(taskData);
        const savedTask = await task.populate('createdBy', 'name email');
        await savedTask.save();
        
        console.log('Task created successfully:', savedTask._id);
        
        res.status(201).json({
            success: true,
            message: 'Task created successfully',
            data: savedTask,
            createdBy: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email
            }
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

// GET /tasks/:id - Get a specific task
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        console.log(`Fetching task with ID: ${req.params.id} for user:`, req.user ? req.user.email : 'anonymous');
        
        const task = await Task.findById(req.params.id).populate('createdBy', 'name email');
        
        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Task not found'
            });
        }

        // Check access permissions
        const canAccess = task.isPublic || 
                         (req.user && task.createdBy._id.equals(req.user._id)) ||
                         (req.user && req.user.role === 'admin');

        if (!canAccess) {
            return res.status(403).json({
                success: false,
                error: 'Access denied',
                message: 'You do not have permission to view this task'
            });
        }
        
        console.log('Task found:', task.title);
        res.json({
            success: true,
            data: task,
            canEdit: req.user && (task.createdBy._id.equals(req.user._id) || req.user.role === 'admin')
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
            details: isDevelopment() ? error.message : 'Internal server error'
        });
    }
});

// PUT /tasks/:id - Update a specific task (owner or admin only)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        console.log(`Updating task with ID: ${req.params.id} by user:`, req.user.email);
        
        const task = await Task.findById(req.params.id);
        
        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Task not found'
            });
        }

        // Check if user can edit this task (owner or admin)
        const canEdit = task.createdBy.equals(req.user._id) || req.user.role === 'admin';
        
        if (!canEdit) {
            return res.status(403).json({
                success: false,
                error: 'Permission denied',
                message: 'You can only edit your own tasks'
            });
        }
        
        const updateData = {
            title: req.body.title,
            description: req.body.description,
            completed: req.body.completed,
            priority: req.body.priority,
            dueDate: req.body.dueDate,
            tags: req.body.tags,
            isPublic: req.body.isPublic
        };
        
        // Remove undefined fields
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) {
                delete updateData[key];
            }
        });
        
        const updatedTask = await Task.findByIdAndUpdate(
            req.params.id,
            updateData,
            { 
                new: true,
                runValidators: true
            }
        ).populate('createdBy', 'name email');
        
        console.log('Task updated successfully:', updatedTask.title);
        res.json({
            success: true,
            message: 'Task updated successfully',
            data: updatedTask,
            updatedBy: {
                id: req.user._id,
                name: req.user.name,
                role: req.user.role
            }
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
            details: isDevelopment() ? error.message : 'Internal server error'
        });
    }
});

// DELETE /tasks/:id - Delete a specific task (owner or admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        console.log(`Deleting task with ID: ${req.params.id} by user:`, req.user.email);
        
        const task = await Task.findById(req.params.id);
        
        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Task not found'
            });
        }

        // Check if user can delete this task (owner or admin)
        const canDelete = task.createdBy.equals(req.user._id) || req.user.role === 'admin';
        
        if (!canDelete) {
            return res.status(403).json({
                success: false,
                error: 'Permission denied',
                message: 'You can only delete your own tasks'
            });
        }
        
        await Task.findByIdAndDelete(req.params.id);
        
        console.log('Task deleted successfully:', task.title);
        res.json({
            success: true,
            message: 'Task deleted successfully',
            data: task,
            deletedBy: {
                id: req.user._id,
                name: req.user.name,
                role: req.user.role
            }
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
            details: isDevelopment() ? error.message : 'Internal server error'
        });
    }
});

// GET /tasks/user/:userId - Get tasks by specific user (admin only)
router.get('/user/:userId', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        console.log(`Admin fetching tasks for user: ${req.params.userId}`);
        
        const tasks = await Task.find({ createdBy: req.params.userId })
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });
        
        console.log(`Found ${tasks.length} tasks for user`);
        
        res.json({
            success: true,
            count: tasks.length,
            data: tasks,
            requestedBy: {
                id: req.user._id,
                name: req.user.name,
                role: req.user.role
            }
        });
    } catch (error) {
        console.error('Error fetching user tasks:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while fetching user tasks',
            details: isDevelopment() ? error.message : 'Internal server error'
        });
    }
});

// GET /tasks/my/stats - Get current user's task statistics
router.get('/my/stats', authenticateToken, async (req, res) => {
    try {
        console.log('Fetching task statistics for user:', req.user.email);
        
        const userId = req.user._id;
        
        const stats = await Task.aggregate([
            { $match: { createdBy: userId } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    completed: { 
                        $sum: { $cond: [{ $eq: ['$completed', true] }, 1, 0] } 
                    },
                    pending: { 
                        $sum: { $cond: [{ $eq: ['$completed', false] }, 1, 0] } 
                    },
                    highPriority: { 
                        $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } 
                    },
                    mediumPriority: { 
                        $sum: { $cond: [{ $eq: ['$priority', 'medium'] }, 1, 0] } 
                    },
                    lowPriority: { 
                        $sum: { $cond: [{ $eq: ['$priority', 'low'] }, 1, 0] } 
                    }
                }
            }
        ]);

        const result = stats[0] || {
            total: 0, completed: 0, pending: 0,
            highPriority: 0, mediumPriority: 0, lowPriority: 0
        };
        
        res.json({
            success: true,
            data: {
                statistics: result,
                completionRate: result.total > 0 ? 
                    Math.round((result.completed / result.total) * 100) : 0,
                user: {
                    id: req.user._id,
                    name: req.user.name,
                    email: req.user.email
                }
            }
        });
    } catch (error) {
        console.error('Error fetching task statistics:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while fetching statistics',
            details: isDevelopment() ? error.message : 'Internal server error'
        });
    }
});

module.exports = router;