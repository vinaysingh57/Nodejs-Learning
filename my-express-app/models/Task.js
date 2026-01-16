const mongoose = require('mongoose');

// Define the Task schema
const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    completed: {
        type: Boolean,
        default: false
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
        lowercase: true
    },
    dueDate: {
        type: Date
    },
    tags: [{
        type: String,
        trim: true
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Add methods to the schema
taskSchema.methods.markComplete = function() {
    this.completed = true;
    return this.save();
};

taskSchema.methods.markIncomplete = function() {
    this.completed = false;
    return this.save();
};

// Add static methods to the schema
taskSchema.statics.findByPriority = function(priority) {
    return this.find({ priority: priority.toLowerCase() });
};

taskSchema.statics.findCompleted = function() {
    return this.find({ completed: true });
};

taskSchema.statics.findPending = function() {
    return this.find({ completed: false });
};

taskSchema.statics.findByUser = function(userId) {
    return this.find({ createdBy: userId });
};

taskSchema.statics.findPublic = function() {
    return this.find({ isPublic: true });
};

// Create and export the model
const Task = mongoose.model('Task', taskSchema);

module.exports = Task;