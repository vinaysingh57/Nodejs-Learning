#!/usr/bin/env node
const mongoose = require('mongoose');
const { config } = require('./config/environment');

async function checkDatabase() {
    try {
        // Connect to MongoDB
        console.log(`🔍 Connecting to: ${config.database.uri}`);
        const conn = await mongoose.connect(config.database.uri);
        
        console.log(`✅ Connected to MongoDB: ${conn.connection.host}`);
        console.log(`📊 Database Name: ${conn.connection.name}`);
        
        // List all collections in the current database
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`\n📋 Collections in '${conn.connection.name}' database:`);
        
        if (collections.length === 0) {
            console.log('   No collections found in this database');
        } else {
            for (const collection of collections) {
                const count = await mongoose.connection.db.collection(collection.name).countDocuments();
                console.log(`   📁 ${collection.name} (${count} documents)`);
            }
        }
        
        // Check if users collection exists and show some data
        const userCollectionExists = collections.some(col => col.name === 'users');
        if (userCollectionExists) {
            console.log(`\n👥 Users Collection Details:`);
            const userCount = await mongoose.connection.db.collection('users').countDocuments();
            console.log(`   📊 Total Users: ${userCount}`);
            
            if (userCount > 0) {
                // Get first few users (without passwords)
                const sampleUsers = await mongoose.connection.db.collection('users')
                    .find({}, { projection: { password: 0 } })
                    .limit(3)
                    .toArray();
                
                console.log(`   📝 Sample Users:`);
                sampleUsers.forEach((user, index) => {
                    console.log(`      ${index + 1}. ${user.name} (${user.email}) - Role: ${user.role || 'user'}`);
                });
            }
        }
        
        // Check other possible database names
        console.log(`\n🔍 Checking for other databases...`);
        const admin = mongoose.connection.db.admin();
        const databases = await admin.listDatabases();
        
        console.log(`📊 All Databases on this MongoDB server:`);
        databases.databases.forEach(db => {
            const current = db.name === conn.connection.name ? ' (CURRENT)' : '';
            console.log(`   🗄️  ${db.name}${current} - Size: ${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB`);
        });
        
        console.log(`\n✨ Database check completed!`);
        
    } catch (error) {
        console.error('❌ Error checking database:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('🔒 Connection closed.');
    }
}

// Run the check
checkDatabase();