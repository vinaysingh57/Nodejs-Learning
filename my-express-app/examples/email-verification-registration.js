// Email Verification Registration Example
const crypto = require('crypto');
const nodemailer = require('nodemailer'); // npm install nodemailer

// Modified User Schema (add to models/User.js)
const userSchema = new mongoose.Schema({
    // ... existing fields
    isVerified: {
        type: Boolean,
        default: false // ❌ Users start unverified
    },
    verificationToken: {
        type: String,
        default: null
    },
    verificationTokenExpires: {
        type: Date,
        default: null
    }
});

// Registration with email verification
app.post('/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Create user but mark as unverified
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const user = new User({
            name,
            email,
            password,
            isVerified: false, // ❌ Not verified yet
            verificationToken,
            verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
        });

        await user.save();

        // Send verification email
        await sendVerificationEmail(user.email, verificationToken);

        res.status(201).json({
            success: true,
            message: 'Registration successful! Please check your email to verify your account.',
            data: {
                email: user.email,
                message: 'Verification email sent'
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

// Email verification endpoint
app.get('/auth/verify/:token', async (req, res) => {
    try {
        const { token } = req.params;
        
        const user = await User.findOne({
            verificationToken: token,
            verificationTokenExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification token'
            });
        }

        // Activate user
        user.isVerified = true;
        user.verificationToken = null;
        user.verificationTokenExpires = null;
        await user.save();

        res.json({
            success: true,
            message: 'Email verified successfully! You can now login.'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Verification failed',
            error: error.message
        });
    }
});

// Modified login to check verification
app.post('/auth/login', async (req, res) => {
    try {
        // ... existing login code ...
        
        // Check if user is verified
        if (!user.isVerified) {
            return res.status(401).json({
                success: false,
                message: 'Please verify your email before logging in'
            });
        }

        // ... rest of login logic ...
    } catch (error) {
        // Error handling
    }
});

async function sendVerificationEmail(email, token) {
    const transporter = nodemailer.createTransporter({
        // Your email configuration
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const verificationUrl = `http://localhost:3002/auth/verify/${token}`;
    
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify Your Account',
        html: `
            <h2>Welcome! Please verify your account</h2>
            <p>Click the link below to verify your email:</p>
            <a href="${verificationUrl}">Verify Account</a>
            <p>This link expires in 24 hours.</p>
        `
    });
}