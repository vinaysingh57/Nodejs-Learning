# MongoDB Setup Guide for Node.js Learning

## Prerequisites
- Node.js installed on your system
- Basic understanding of Express.js and REST APIs

## Step 1: Install MongoDB

### Option A: Install MongoDB Community Edition (Recommended)
1. **Ubuntu/Debian:**
   ```bash
   # Import MongoDB public key
   curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
   
   # Add MongoDB repository
   echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
   
   # Update package database
   sudo apt-get update
   
   # Install MongoDB
   sudo apt-get install -y mongodb-org
   
   # Start MongoDB service
   sudo systemctl start mongod
   sudo systemctl enable mongod
   ```

2. **macOS (using Homebrew):**
   ```bash
   brew tap mongodb/brew
   brew install mongodb-community
   brew services start mongodb/brew/mongodb-community
   ```

3. **Windows:**
   - Download MongoDB Community Edition from https://www.mongodb.com/try/download/community
   - Run the installer and follow the setup wizard
   - MongoDB will start automatically as a Windows service

### Option B: Use MongoDB Atlas (Cloud - Free Tier Available)
1. Go to https://www.mongodb.com/atlas
2. Sign up for free account
3. Create a free cluster
4. Get your connection string
5. Update connection string in `mongodb-connection.js`

## Step 2: Install Node.js Dependencies
```bash
cd /var/www/html/node-learning/my-express-app
npm install mongoose
```

## Step 3: Verify MongoDB Installation
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Or connect using MongoDB shell
mongosh
```

## Step 4: Test the Setup

### 4.1 Start your MongoDB Tasks API
```bash
cd /var/www/html/node-learning/my-express-app/database-examples
node mongodb-tasks-api.js
```

### 4.2 Test with curl commands
```bash
# Get API documentation
curl http://localhost:3002/

# Create a new task
curl -X POST http://localhost:3002/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Learn MongoDB",
    "description": "Complete MongoDB integration with Node.js",
    "priority": "high"
  }'

# Get all tasks
curl http://localhost:3002/tasks

# Get tasks by priority
curl http://localhost:3002/tasks/priority/high
```

## Step 5: Understanding the Code Structure

### Connection Management (`mongodb-connection.js`)
- Establishes connection to MongoDB
- Handles connection events (connected, error, disconnected)
- Provides connection and disconnection functions

### Data Modeling (`models/Task.js`)
- Defines schema structure using Mongoose
- Sets up validation rules
- Adds custom methods (instance and static methods)
- Automatically adds timestamps

### API Routes (`mongodb-tasks-api.js`)
- Full CRUD operations (Create, Read, Update, Delete)
- Error handling with proper HTTP status codes
- Validation error handling
- Query filtering and sorting
- Custom endpoints for specific operations

## Common MongoDB/Mongoose Concepts to Learn

### 1. Schema Definition
```javascript
const schema = new mongoose.Schema({
  field: {
    type: String,
    required: true,
    maxlength: 100
  }
});
```

### 2. CRUD Operations
- **Create**: `new Model(data).save()` or `Model.create(data)`
- **Read**: `Model.find()`, `Model.findById()`, `Model.findOne()`
- **Update**: `Model.findByIdAndUpdate()`, `Model.updateOne()`
- **Delete**: `Model.findByIdAndDelete()`, `Model.deleteOne()`

### 3. Query Building
```javascript
// Find with conditions
Model.find({ status: 'active' })

// Sort and limit
Model.find().sort({ createdAt: -1 }).limit(10)

// Field selection
Model.find().select('title description')
```

### 4. Validation
- Built-in validators: required, min, max, enum
- Custom validators
- Pre and post middleware hooks

## Troubleshooting

### MongoDB Connection Issues
1. **Check if MongoDB is running:**
   ```bash
   sudo systemctl status mongod
   ```

2. **Check MongoDB logs:**
   ```bash
   sudo tail -f /var/log/mongodb/mongod.log
   ```

3. **Default MongoDB port:** 27017

### Common Errors
- **Connection refused**: MongoDB service not running
- **Validation errors**: Check your schema requirements
- **CastError**: Invalid ObjectId format

## Next Steps for Learning
1. ✅ **Current**: Basic CRUD operations with MongoDB
2. 🔄 **Next**: Learn aggregation pipelines
3. 🔄 **After**: Implement user authentication
4. 🔄 **Advanced**: Learn indexing and performance optimization

## Useful MongoDB Commands
```bash
# Connect to MongoDB shell
mongosh

# Show databases
show dbs

# Use database
use node-learning

# Show collections
show collections

# Find all documents in a collection
db.tasks.find()

# Find with pretty formatting
db.tasks.find().pretty()

# Count documents
db.tasks.countDocuments()

# Drop collection (be careful!)
db.tasks.drop()
```