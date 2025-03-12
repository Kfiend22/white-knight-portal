// update-cline-role.js
// Script to update the Cline user to have admin secondary role

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

// Function to update Cline role
const updateClineRole = async () => {
  try {
    // Find Cline user
    const cline = await User.findOne({ username: 'Cline' });
    
    if (!cline) {
      console.log('Cline user not found');
      process.exit(1);
    }
    
    console.log(`Found Cline user: ${cline.username}`);
    
    // Update secondary roles
    if (!cline.secondaryRoles) {
      cline.secondaryRoles = {};
    }
    
    cline.secondaryRoles.admin = true;
    
    // Add audit log entry
    if (!cline.auditLog) {
      cline.auditLog = [];
    }
    
    cline.auditLog.push({
      action: 'update-role',
      timestamp: new Date(),
      details: { 
        method: 'update-cline-role.js',
        changes: 'Set admin secondary role to true'
      }
    });
    
    // Save the updated user
    await cline.save();
    console.log('Cline user updated successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating Cline role:', error);
    process.exit(1);
  }
};

// Run the update
updateClineRole();
