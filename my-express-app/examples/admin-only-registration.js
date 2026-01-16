// Admin-Only Registration Example
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Remove public registration endpoint
// app.post('/auth/register', registerUser); // ❌ Remove this

// Admin-only user creation
app.post('/admin/create-user', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, email, password, role = 'user' } = req.body;
        
        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and password are required'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Create new user
        const user = new User({ name, email, password, role });
        await user.save();

        res.status(201).json({
            success: true,
            message: 'User created successfully by admin',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    isActive: user.isActive,
                    createdAt: user.createdAt
                }
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating user',
            error: error.message
        });
    }
});

// Users must be created by admin, then they can login normally
app.post('/auth/login', loginUser); // ✅ Keep login endpoint