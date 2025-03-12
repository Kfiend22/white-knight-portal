// update-owner-role.js
// Script to update the owner user to have admin secondary role

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

// Function to update owner role
const updateOwnerRole = async () => {
  try {
    // Find owner user
    const owner = await User.findOne({ username: 'owner' });
    
    if (!owner) {
      console.log('Owner user not found');
      process.exit(1);
    }
    
    console.log(`Found owner user: ${owner.username}`);
    
    // Update secondary roles
    if (!owner.secondaryRoles) {
      owner.secondaryRoles = {};
    }
    
    owner.secondaryRoles.admin = true;
    
    // Add audit log entry
    if (!owner.auditLog) {
      owner.auditLog = [];
    }
    
    owner.auditLog.push({
      action: 'update-role',
      timestamp: new Date(),
      details: { 
        method: 'update-owner-role.js',
        changes: 'Set admin secondary role to true'
      }
    });
    
    // Save the updated user
    await owner.save();
    console.log('Owner user updated successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating owner role:', error);
    process.exit(1);
  }
};

// Run the update
updateOwnerRole();
