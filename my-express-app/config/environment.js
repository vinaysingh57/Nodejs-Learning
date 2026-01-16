// Environment Configuration Module
require('dotenv').config(); // Load environment variables from .env file

// Environment configuration with defaults and validation
const config = {
    // Database Configuration
    database: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/node-learning',
        name: process.env.DB_NAME || 'node-learning'
    },
    
    // Server Configuration
    server: {
        port: parseInt(process.env.PORT) || 3002,
        environment: process.env.NODE_ENV || 'development',
        apiVersion: process.env.API_VERSION || 'v1',
        baseUrl: process.env.API_BASE_URL || 'http://localhost:3002'
    },
    
    // Security Configuration
    security: {
        jwtSecret: process.env.JWT_SECRET || 'fallback-secret-key',
        apiKey: process.env.API_KEY || 'fallback-api-key'
    },
    
    // Email Configuration
    email: {
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT) || 587,
        user: process.env.SMTP_USER || '',
        password: process.env.SMTP_PASS || ''
    },
    
    // Feature Flags
    features: {
        enableLogging: process.env.ENABLE_LOGGING === 'true',
        enableCors: process.env.ENABLE_CORS === 'true',
        enableRateLimiting: process.env.ENABLE_RATE_LIMITING === 'true'
    },
    
    // External APIs
    externalApis: {
        weatherApiKey: process.env.WEATHER_API_KEY || '',
        paymentSecretKey: process.env.PAYMENT_SECRET_KEY || ''
    }
};

// Validation function
const validateConfig = () => {
    const errors = [];
    
    // Check required environment variables
    if (!process.env.MONGODB_URI && process.env.NODE_ENV === 'production') {
        errors.push('MONGODB_URI is required in production');
    }
    
    if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
        errors.push('JWT_SECRET is required in production');
    }
    
    if (config.server.port < 1 || config.server.port > 65535) {
        errors.push('PORT must be between 1 and 65535');
    }
    
    if (errors.length > 0) {
        console.error('❌ Configuration validation failed:');
        errors.forEach(error => console.error(`  - ${error}`));
        process.exit(1);
    }
    
    console.log('✅ Configuration validation passed');
};

// Display current configuration (hide sensitive data)
const displayConfig = () => {
    console.log('📊 Current Configuration:');
    console.log(`  Environment: ${config.server.environment}`);
    console.log(`  Port: ${config.server.port}`);
    console.log(`  Database: ${config.database.name}`);
    console.log(`  Database URI: ${config.database.uri.replace(/\/\/.*@/, '//***:***@')}`); // Hide credentials
    console.log(`  CORS Enabled: ${config.features.enableCors}`);
    console.log(`  Logging Enabled: ${config.features.enableLogging}`);
    console.log(`  JWT Secret: ${config.security.jwtSecret ? '***configured***' : 'not set'}`);
};

// Environment-specific settings
const isDevelopment = () => config.server.environment === 'development';
const isProduction = () => config.server.environment === 'production';
const isTest = () => config.server.environment === 'test';

module.exports = {
    config,
    validateConfig,
    displayConfig,
    isDevelopment,
    isProduction,
    isTest
};