// Invite-Only Registration Example
const crypto = require('crypto');

// Invitation Schema
const inviteSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    inviteToken: {
        type: String,
        required: true,
        unique: true
    },
    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    used: {
        type: Boolean,
        default: false
    },
    expiresAt: {
        type: Date,
        required: true
    }
}, { timestamps: true });

const Invite = mongoose.model('Invite', inviteSchema);

// Admin creates invitation
app.post('/admin/invite-user', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { email } = req.body;
        
        // Check if already invited or user exists
        const existingInvite = await Invite.findOne({ email });
        const existingUser = await User.findOne({ email });
        
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        if (existingInvite && !existingInvite.used) {
            return res.status(400).json({
                success: false,
                message: 'Invitation already sent to this email'
            });
        }

        // Create invitation
        const inviteToken = crypto.randomBytes(32).toString('hex');
        const invite = new Invite({
            email,
            inviteToken,
            invitedBy: req.user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        });

        await invite.save();

        // Send invitation email (implement sendInviteEmail function)
        await sendInviteEmail(email, inviteToken);

        res.status(201).json({
            success: true,
            message: 'Invitation sent successfully',
            data: { email, inviteToken }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to send invitation',
            error: error.message
        });
    }
});

// Registration with invite token
app.post('/auth/register', async (req, res) => {
    try {
        const { name, email, password, inviteToken } = req.body;

        if (!inviteToken) {
            return res.status(400).json({
                success: false,
                message: 'Invitation token required'
            });
        }

        // Validate invitation
        const invite = await Invite.findOne({
            email: email.toLowerCase(),
            inviteToken,
            used: false,
            expiresAt: { $gt: new Date() }
        });

        if (!invite) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired invitation'
            });
        }

        // Create user
        const user = new User({ name, email, password });
        await user.save();

        // Mark invitation as used
        invite.used = true;
        await invite.save();

        // Generate tokens
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        res.status(201).json({
            success: true,
            message: 'Registration successful with invitation',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                },
                tokens: { accessToken, refreshToken }
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