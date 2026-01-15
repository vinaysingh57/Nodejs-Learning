const mongoose = require('mongoose');

// MongoDB connection function
const connectDB = async () => {
    try {
        // Connect to MongoDB (local installation)
        // Default MongoDB URL for local installation
        const conn = await mongoose.connect('mongodb://localhost:27017/node-learning');

        console.log(`MongoDB Connected: ${conn.connection.host}`);
        console.log(`Database Name: ${conn.connection.name}`);
        
        // Listen for connection events
        mongoose.connection.on('connected', () => {
            console.log('Mongoose connected to MongoDB');
        });

        mongoose.connection.on('error', (err) => {
            console.log('Mongoose connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('Mongoose disconnected');
        });

        return conn;
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
        process.exit(1);
    }
};

// Close database connection
const closeDB = async () => {
    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    } catch (error) {
        console.error('Error closing MongoDB connection:', error);
    }
};

module.exports = { connectDB, closeDB };