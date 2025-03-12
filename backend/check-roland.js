// check-roland.js
// Script to check if Roland White user exists in the database

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/white-knight-portal')
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Import User model
const User = require('./models/userModel');

// Function to check if Roland White user exists
const checkRolandUser = async () => {
  try {
    console.log('Checking if Roland White user exists...');
    
    // Find all users
    const users = await User.find({});
    
    console.log(`Found ${users.length} users in the database`);
    
    // List all usernames
    console.log('User list:');
    users.forEach(user => {
      console.log(`- ${user.username} (${user.firstName} ${user.lastName})`);
    });
    
    // Find Roland White user specifically
    const roland = await User.findOne({ username: 'd6367734' });
    
    if (roland) {
      console.log('\nFound Roland White user:');
      console.log(`Username: ${roland.username}`);
      console.log(`Name: ${roland.firstName} ${roland.lastName}`);
      console.log(`Email: ${roland.email}`);
      console.log(`Primary Role: ${roland.primaryRole}`);
      console.log(`Secondary Roles: ${JSON.stringify(roland.secondaryRoles)}`);
      console.log(`Permissions: ${JSON.stringify(roland.permissions)}`);
    } else {
      console.log('\nRoland White user not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking Roland White user:', error);
    process.exit(1);
  }
};

// Run the check
checkRolandUser();
