const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { config } = require('../config/environment');

// User Schema with authentication features
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false // Don't include password in queries by default
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'moderator'],
        default: 'user'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    },
    refreshTokens: [{
        token: String,
        createdAt: { type: Date, default: Date.now },
        expiresAt: Date
    }]
}, {
    timestamps: true
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
    // Only hash password if it's been modified (or is new)
    if (!this.isModified('password')) {
        return next();
    }

    try {
        // Hash password with cost of 12
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

// Instance method to generate JWT Access Token
userSchema.methods.generateAccessToken = function() {
    const payload = {
        id: this._id,
        email: this.email,
        role: this.role,
        name: this.name
    };

    return jwt.sign(
        payload,
        config.security.jwtSecret,
        { 
            expiresIn: '15m', // Short-lived access token
            issuer: 'node-learning-api',
            audience: 'node-learning-client'
        }
    );
};

// Instance method to generate JWT Refresh Token
userSchema.methods.generateRefreshToken = function() {
    const payload = {
        id: this._id,
        type: 'refresh'
    };

    const refreshToken = jwt.sign(
        payload,
        config.security.jwtSecret + 'refresh',
        { 
            expiresIn: '7d', // Long-lived refresh token
            issuer: 'node-learning-api',
            audience: 'node-learning-client'
        }
    );

    // Store refresh token in database
    this.refreshTokens.push({
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    return refreshToken;
};

// Instance method to clean expired refresh tokens
userSchema.methods.cleanExpiredRefreshTokens = function() {
    this.refreshTokens = this.refreshTokens.filter(
        tokenObj => tokenObj.expiresAt > new Date()
    );
};

// Static method to find user by email (including password for login)
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email }).select('+password');
};

// Static method to find user by refresh token
userSchema.statics.findByRefreshToken = function(refreshToken) {
    return this.findOne({ 
        'refreshTokens.token': refreshToken,
        'refreshTokens.expiresAt': { $gt: new Date() }
    });
};

// Transform toJSON to hide sensitive information
userSchema.methods.toJSON = function() {
    const userObject = this.toObject();
    delete userObject.password;
    delete userObject.refreshTokens;
    return userObject;
};

// Pre-remove middleware to clean up related data
userSchema.pre('remove', async function(next) {
    // Here you could remove user's tasks, etc.
    console.log(`Cleaning up data for user: ${this.email}`);
    next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;