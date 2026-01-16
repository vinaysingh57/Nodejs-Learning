#!/usr/bin/env node
const mongoose = require('mongoose');
const User = require('./models/User');
const { config } = require('./config/environment');

async function listAllUsers() {
    try {
        // Connect to MongoDB
        await mongoose.connect(config.database.uri);
        console.log(`📊 Connected to database: ${mongoose.connection.name}\n`);

        // Fetch all users (without passwords)
        const users = await User.find({}).select('-password -refreshTokens');
        
        console.log(`👥 All Registered Users (${users.length} total):`);
        console.log('=' .repeat(80));
        
        users.forEach((user, index) => {
            console.log(`${index + 1}. 📧 ${user.email}`);
            console.log(`   👤 Name: ${user.name}`);
            console.log(`   🎭 Role: ${user.role || 'user'}`);
            console.log(`   ✅ Active: ${user.isActive ? 'Yes' : 'No'}`);
            console.log(`   📅 Created: ${user.createdAt?.toLocaleString() || 'Unknown'}`);
            console.log(`   🕐 Last Updated: ${user.updatedAt?.toLocaleString() || 'Unknown'}`);
            if (user.lastLogin) {
                console.log(`   🔐 Last Login: ${user.lastLogin.toLocaleString()}`);
            }
            console.log('   ' + '-'.repeat(40));
        });
        
    } catch (error) {
        console.error('❌ Error fetching users:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('🔒 Database connection closed.');
    }
}

// Run the list
listAllUsers();