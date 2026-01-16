const express = require('express');
const User = require('../models/User');
const { authenticateToken, verifyRefreshToken } = require('../middleware/auth');
const { config, isDevelopment } = require('../config/environment');

const router = express.Router();

// POST /auth/register - User Registration
router.post('/register', async (req, res) => {
    try {
        console.log('Registration attempt:', { email: req.body.email, name: req.body.name });

        const { name, email, password, role } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                required: ['name', 'email', 'password']
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 6 characters long'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'User already exists',
                message: 'An account with this email already exists'
            });
        }

        // Create new user
        const userData = { name, email, password };
        
        // Only allow role assignment in development or by admins
        if (role && (isDevelopment() || req.user?.role === 'admin')) {
            userData.role = role;
        }

        const user = new User(userData);
        await user.save();

        // Generate tokens
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        
        // Save refresh token
        await user.save();

        console.log('User registered successfully:', user.email);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: user.toJSON(),
                tokens: {
                    accessToken,
                    refreshToken,
                    tokenType: 'Bearer',
                    expiresIn: '15m'
                }
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

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                error: 'Duplicate field value',
                message: 'User with this email already exists'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Registration failed',
            message: isDevelopment() ? error.message : 'Internal server error'
        });
    }
});

// POST /auth/login - User Login
router.post('/login', async (req, res) => {
    try {
        console.log('Login attempt:', { email: req.body.email });

        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }

        // Find user by email (include password field)
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials',
                message: 'No account found with this email address'
            });
        }

        // Check if account is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                error: 'Account deactivated',
                message: 'Your account has been deactivated. Please contact support.'
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials',
                message: 'Incorrect password'
            });
        }

        // Clean expired refresh tokens
        user.cleanExpiredRefreshTokens();

        // Generate new tokens
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        console.log('User logged in successfully:', user.email);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: user.toJSON(),
                tokens: {
                    accessToken,
                    refreshToken,
                    tokenType: 'Bearer',
                    expiresIn: '15m'
                }
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed',
            message: isDevelopment() ? error.message : 'Internal server error'
        });
    }
});

// POST /auth/refresh - Refresh Access Token
router.post('/refresh', verifyRefreshToken, async (req, res) => {
    try {
        console.log('Token refresh attempt:', { userId: req.user._id });

        const user = req.user;
        const oldRefreshToken = req.refreshToken;

        // Remove the old refresh token
        user.refreshTokens = user.refreshTokens.filter(
            tokenObj => tokenObj.token !== oldRefreshToken
        );

        // Generate new tokens
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        await user.save();

        console.log('Tokens refreshed successfully:', user.email);

        res.json({
            success: true,
            message: 'Tokens refreshed successfully',
            data: {
                tokens: {
                    accessToken,
                    refreshToken,
                    tokenType: 'Bearer',
                    expiresIn: '15m'
                }
            }
        });

    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({
            success: false,
            error: 'Token refresh failed',
            message: isDevelopment() ? error.message : 'Internal server error'
        });
    }
});

// POST /auth/logout - Logout (invalidate refresh token)
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        console.log('Logout attempt:', { userId: req.user._id });

        const user = req.user;
        const { refreshToken } = req.body;

        if (refreshToken) {
            // Remove specific refresh token
            user.refreshTokens = user.refreshTokens.filter(
                tokenObj => tokenObj.token !== refreshToken
            );
        } else {
            // Remove all refresh tokens (logout from all devices)
            user.refreshTokens = [];
        }

        await user.save();

        console.log('User logged out successfully:', user.email);

        res.json({
            success: true,
            message: refreshToken ? 'Logged out successfully' : 'Logged out from all devices'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            error: 'Logout failed',
            message: isDevelopment() ? error.message : 'Internal server error'
        });
    }
});

// GET /auth/me - Get Current User Profile
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        
        res.json({
            success: true,
            data: {
                user: user.toJSON(),
                tokenInfo: {
                    issuedAt: new Date(req.user.iat * 1000),
                    expiresAt: new Date(req.user.exp * 1000)
                }
            }
        });

    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch profile',
            message: isDevelopment() ? error.message : 'Internal server error'
        });
    }
});

// PUT /auth/profile - Update User Profile
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        console.log('Profile update attempt:', { userId: req.user._id });

        const user = req.user;
        const { name, email } = req.body;

        // Update allowed fields
        if (name !== undefined) {
            user.name = name;
        }

        if (email !== undefined && email !== user.email) {
            // Check if new email is already taken
            const existingUser = await User.findOne({ email, _id: { $ne: user._id } });
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    error: 'Email already taken',
                    message: 'Another user already has this email address'
                });
            }
            user.email = email;
        }

        await user.save();

        console.log('Profile updated successfully:', user.email);

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: user.toJSON()
            }
        });

    } catch (error) {
        console.error('Profile update error:', error);

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
            error: 'Profile update failed',
            message: isDevelopment() ? error.message : 'Internal server error'
        });
    }
});

// PUT /auth/change-password - Change Password
router.put('/change-password', authenticateToken, async (req, res) => {
    try {
        console.log('Password change attempt:', { userId: req.user._id });

        const user = await User.findByEmail(req.user.email); // Get user with password
        const { currentPassword, newPassword } = req.body;

        // Validation
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                error: 'Current password and new password are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'New password must be at least 6 characters long'
            });
        }

        // Verify current password
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(401).json({
                success: false,
                error: 'Invalid current password'
            });
        }

        // Update password (will be hashed by pre-save middleware)
        user.password = newPassword;
        
        // Invalidate all refresh tokens (force re-login on all devices)
        user.refreshTokens = [];
        
        await user.save();

        console.log('Password changed successfully:', user.email);

        res.json({
            success: true,
            message: 'Password changed successfully. Please login again on all devices.'
        });

    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({
            success: false,
            error: 'Password change failed',
            message: isDevelopment() ? error.message : 'Internal server error'
        });
    }
});

module.exports = router;