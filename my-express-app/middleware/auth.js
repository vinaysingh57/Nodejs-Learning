const jwt = require('jsonwebtoken');
const { config } = require('../config/environment');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.startsWith('Bearer ') 
            ? authHeader.slice(7) 
            : null;

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Access token is required',
                message: 'Please provide a valid JWT token in Authorization header'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, config.security.jwtSecret, {
            issuer: 'node-learning-api',
            audience: 'node-learning-client'
        });

        // Get fresh user data from database
        const user = await User.findById(decoded.id);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User not found',
                message: 'The user associated with this token no longer exists'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                error: 'Account deactivated',
                message: 'Your account has been deactivated'
            });
        }

        // Add user info to request object
        req.user = user;
        req.token = token;
        next();

    } catch (error) {
        console.error('Token verification failed:', error.message);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token expired',
                message: 'Your session has expired. Please login again.',
                expiredAt: error.expiredAt
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Invalid token',
                message: 'The provided token is invalid'
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Authentication failed',
            message: 'An error occurred during authentication'
        });
    }
};

// Middleware to check specific roles
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
                message: 'Please login first'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: 'Insufficient permissions',
                message: `Access denied. Required roles: ${roles.join(', ')}`,
                userRole: req.user.role
            });
        }

        next();
    };
};

// Middleware for optional authentication (user data if token present)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.startsWith('Bearer ') 
            ? authHeader.slice(7) 
            : null;

        if (!token) {
            // No token provided, continue without user data
            req.user = null;
            return next();
        }

        // Verify token
        const decoded = jwt.verify(token, config.security.jwtSecret, {
            issuer: 'node-learning-api',
            audience: 'node-learning-client'
        });

        // Get user data
        const user = await User.findById(decoded.id);
        req.user = user && user.isActive ? user : null;
        req.token = token;

    } catch (error) {
        // Token invalid, continue without user data
        req.user = null;
    }

    next();
};

// Middleware to verify refresh token
const verifyRefreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                error: 'Refresh token is required'
            });
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, config.security.jwtSecret + 'refresh', {
            issuer: 'node-learning-api',
            audience: 'node-learning-client'
        });

        // Find user with this refresh token
        const user = await User.findByRefreshToken(refreshToken);

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid refresh token',
                message: 'Refresh token not found or expired'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                error: 'Account deactivated'
            });
        }

        req.user = user;
        req.refreshToken = refreshToken;
        next();

    } catch (error) {
        console.error('Refresh token verification failed:', error.message);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Refresh token expired',
                message: 'Please login again'
            });
        }

        return res.status(401).json({
            success: false,
            error: 'Invalid refresh token'
        });
    }
};

// Utility function to extract user info from token (without DB lookup)
const getUserFromToken = (token) => {
    try {
        const decoded = jwt.verify(token, config.security.jwtSecret, {
            issuer: 'node-learning-api',
            audience: 'node-learning-client'
        });
        return decoded;
    } catch (error) {
        return null;
    }
};

module.exports = {
    authenticateToken,
    authorizeRoles,
    optionalAuth,
    verifyRefreshToken,
    getUserFromToken
};