// Registration Approval Example
// Add to User Schema
const userSchema = new mongoose.Schema({
    // ... existing fields
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'suspended'],
        default: 'pending'
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvedAt: {
        type: Date
    }
});

// Modified registration - users are pending by default
app.post('/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const user = new User({
            name,
            email,
            password,
            status: 'pending' // ⏳ Waiting for approval
        });

        await user.save();

        // Notify admins of new registration
        await notifyAdminsOfNewRegistration(user);

        res.status(201).json({
            success: true,
            message: 'Registration submitted successfully! Your account is pending admin approval.',
            data: {
                email: user.email,
                status: 'pending'
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    }
});

// Modified login - check approval status
app.post('/auth/login', async (req, res) => {
    try {
        // ... existing password validation ...

        // Check approval status
        if (user.status === 'pending') {
            return res.status(403).json({
                success: false,
                message: 'Your account is pending admin approval'
            });
        }

        if (user.status === 'rejected') {
            return res.status(403).json({
                success: false,
                message: 'Your account registration was rejected'
            });
        }

        if (user.status === 'suspended') {
            return res.status(403).json({
                success: false,
                message: 'Your account has been suspended'
            });
        }

        // Only approved users can login
        if (user.status !== 'approved') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // ... rest of login logic ...
    } catch (error) {
        // Error handling
    }
});

// Admin endpoint to approve/reject users
app.put('/admin/users/:userId/status', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const { status, reason } = req.body; // 'approved', 'rejected', 'suspended'

        if (!['approved', 'rejected', 'suspended'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.status = status;
        user.approvedBy = req.user.id;
        user.approvedAt = new Date();

        await user.save();

        // Send notification email to user
        await sendStatusUpdateEmail(user.email, status, reason);

        res.json({
            success: true,
            message: `User ${status} successfully`,
            data: {
                userId: user._id,
                email: user.email,
                status: user.status,
                approvedBy: req.user.name
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update user status',
            error: error.message
        });
    }
});

// Admin endpoint to list pending registrations
app.get('/admin/pending-users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const pendingUsers = await User.find({ status: 'pending' })
            .select('-password -refreshTokens')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: {
                count: pendingUsers.length,
                users: pendingUsers
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pending users',
            error: error.message
        });
    }
});