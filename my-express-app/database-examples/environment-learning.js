// Environment Variables Learning Script
console.log('🚀 Learning Environment Variables in Node.js\n');

// Before loading dotenv
console.log('📋 BEFORE loading .env file:');
console.log('  PORT from process.env:', process.env.PORT);
console.log('  MONGODB_URI from process.env:', process.env.MONGODB_URI);
console.log('  NODE_ENV from process.env:', process.env.NODE_ENV);

// Load environment variables from .env file
require('dotenv').config();

console.log('\n✅ AFTER loading .env file:');
console.log('  PORT from process.env:', process.env.PORT);
console.log('  MONGODB_URI from process.env:', process.env.MONGODB_URI);
console.log('  NODE_ENV from process.env:', process.env.NODE_ENV);

console.log('\n📊 All Environment Variables from .env:');
console.log('─'.repeat(50));

// Display all environment variables from our .env file
const envVars = [
    'MONGODB_URI',
    'DB_NAME',
    'PORT',
    'NODE_ENV',
    'API_VERSION',
    'API_BASE_URL',
    'JWT_SECRET',
    'API_KEY',
    'SMTP_HOST',
    'SMTP_PORT',
    'ENABLE_LOGGING',
    'ENABLE_CORS'
];

envVars.forEach(varName => {
    const value = process.env[varName];
    // Hide sensitive information
    let displayValue = value;
    if (varName.includes('SECRET') || varName.includes('PASS') || varName.includes('KEY')) {
        displayValue = value ? '***hidden***' : 'not set';
    }
    console.log(`  ${varName}: ${displayValue}`);
});

console.log('\n🔧 Working with Environment Variables:');
console.log('─'.repeat(50));

// Example 1: Using environment variables with defaults
const port = process.env.PORT || 3000;
const environment = process.env.NODE_ENV || 'development';
console.log(`  Server will run on port: ${port}`);
console.log(`  Environment: ${environment}`);

// Example 2: Type conversion (env vars are always strings)
const enableLogging = process.env.ENABLE_LOGGING === 'true';
const smtpPort = parseInt(process.env.SMTP_PORT) || 587;
console.log(`  Logging enabled: ${enableLogging} (boolean)`);
console.log(`  SMTP Port: ${smtpPort} (number)`);

// Example 3: Building URLs from environment variables
const baseUrl = process.env.API_BASE_URL || `http://localhost:${port}`;
const apiUrl = `${baseUrl}/api/${process.env.API_VERSION || 'v1'}`;
console.log(`  Base URL: ${baseUrl}`);
console.log(`  API URL: ${apiUrl}`);

console.log('\n🏭 Environment-Specific Behavior:');
console.log('─'.repeat(50));

// Environment-specific logic
switch (environment) {
    case 'development':
        console.log('  📝 Development mode:');
        console.log('    - Detailed error messages');
        console.log('    - Debug logging enabled');
        console.log('    - CORS allowed from all origins');
        break;
    case 'production':
        console.log('  🚀 Production mode:');
        console.log('    - Minimal error messages');
        console.log('    - Essential logging only');
        console.log('    - Strict CORS policy');
        break;
    case 'test':
        console.log('  🧪 Test mode:');
        console.log('    - Test database');
        console.log('    - Mock external services');
        console.log('    - Minimal logging');
        break;
    default:
        console.log('  ❓ Unknown environment');
}

console.log('\n🔐 Security Best Practices:');
console.log('─'.repeat(50));
console.log('  ✅ Never commit .env files to version control');
console.log('  ✅ Use .env.example to document required variables');
console.log('  ✅ Validate required environment variables on startup');
console.log('  ✅ Use different .env files for different environments');
console.log('  ✅ Rotate secrets regularly in production');

console.log('\n📁 File Structure:');
console.log('─'.repeat(50));
console.log('  .env                 <- Your actual environment variables (DO NOT COMMIT)');
console.log('  .env.example         <- Template for other developers (COMMIT THIS)');
console.log('  .env.development     <- Development-specific variables');
console.log('  .env.production      <- Production-specific variables');
console.log('  .env.test            <- Test-specific variables');

console.log('\n🛠️  Common Use Cases:');
console.log('─'.repeat(50));
console.log('  • Database connection strings');
console.log('  • API keys for third-party services');
console.log('  • JWT secrets for authentication');
console.log('  • Email service credentials');
console.log('  • Feature flags (enable/disable features)');
console.log('  • Port numbers and host configurations');
console.log('  • Debug and logging levels');

console.log('\n🚨 Common Mistakes to Avoid:');
console.log('─'.repeat(50));
console.log('  ❌ Hardcoding sensitive values in source code');
console.log('  ❌ Committing .env files to Git');
console.log('  ❌ Using production secrets in development');
console.log('  ❌ Not validating required environment variables');
console.log('  ❌ Exposing secrets in error messages or logs');

console.log('\n✨ Environment Variables Learning Complete!');
console.log('Next steps:');
console.log('  1. Run: node database-examples/mongodb-env-api.js');
console.log('  2. Test: curl http://localhost:3002/env');
console.log('  3. Try changing values in .env file and restart');