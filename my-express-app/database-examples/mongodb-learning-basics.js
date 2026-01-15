// Simple MongoDB learning script - Run this to understand basic operations
const mongoose = require('mongoose');

// Connect to MongoDB
async function learnMongoDB() {
    try {
        // 1. Connect to database
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect('mongodb://localhost:27017/node-learning-test');
        console.log('✅ Connected to MongoDB!');

        // 2. Define a simple schema
        const userSchema = new mongoose.Schema({
            name: { type: String, required: true },
            email: { type: String, required: true, unique: true },
            age: { type: Number, min: 0 },
            createdAt: { type: Date, default: Date.now }
        });

        const User = mongoose.model('User', userSchema);

        // Clear existing data for fresh start
        console.log('🧹 Cleaning up existing data for fresh start...');
        await User.deleteMany({});
        console.log('✅ Database cleared');

        // 3. CREATE - Add new users
        console.log('\n📝 Creating users...');
        
        const user1 = new User({
            name: 'Vinay Singh',
            email: 'vinay@example.com',
            age: 25
        });
        await user1.save();
        console.log('✅ User 1 created:', user1.name);

        const user2 = await User.create({
            name: 'John Doe',
            email: 'john@example.com',
            age: 30
        });
        console.log('✅ User 2 created:', user2.name);

        // 4. READ - Find users
        console.log('\n📖 Reading users...');
        
        const allUsers = await User.find();
        console.log(`📊 Total users found: ${allUsers.length}`);
        allUsers.forEach(user => {
            console.log(`  - ${user.name} (${user.email}) - Age: ${user.age}`);
        });

        // Find specific user
        const specificUser = await User.findOne({ email: 'vinay@example.com' });
        console.log('\n🔍 Found specific user:', specificUser.name);

        // Find users with conditions
        const youngUsers = await User.find({ age: { $lt: 30 } }); // Less than 30
        console.log(`👶 Users younger than 30: ${youngUsers.length}`);

        // 5. UPDATE - Modify user
        console.log('\n✏️ Updating user...');
        const updatedUser = await User.findByIdAndUpdate(
            user1._id,
            { age: 26, name: 'Vinay Singh (Updated)' },
            { new: true } // Return updated document
        );
        console.log('✅ User updated:', updatedUser.name, 'Age:', updatedUser.age);

        // 6. DELETE - Remove user
        console.log('\n🗑️ Deleting user...');
        const deletedUser = await User.findByIdAndDelete(user2._id);
        console.log('✅ User deleted:', deletedUser.name);

        // 7. Check final state
        console.log('\n📊 Final user count:');
        const finalUsers = await User.find();
        console.log(`Remaining users: ${finalUsers.length}`);
        finalUsers.forEach(user => {
            console.log(`  - ${user.name} (${user.email})`);
        });

        console.log('\n🎉 MongoDB learning complete!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        // Always close the connection
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed');
    }
}

// Run the learning function
console.log('🚀 Starting MongoDB Learning Script...');
console.log('📚 This script will demonstrate basic CRUD operations\n');

learnMongoDB();