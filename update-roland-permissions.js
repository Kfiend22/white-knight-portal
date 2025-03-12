// update-roland-permissions.js
// Script to update Roland White's permissions

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
const User = require('./backend/models/userModel');

// Function to update Roland White's permissions
const updateRolandPermissions = async () => {
  try {
    // Find Roland White user by username
    const roland = await User.findOne({ username: 'd6367734' });
    
    if (!roland) {
      console.log('Roland White user not found');
      process.exit(1);
    }
    
    console.log(`Found Roland White user: ${roland.username}`);
    
    // Define all available pages
    const allPages = [
      'Dashboard',
      'Submissions',
      'Regions',
      'Settings',
      'Payments',
      'Users',
      'Performance'
    ];
    
    // Define all available actions
    const allActions = [
      'create_user',
      'edit_user',
      'delete_user',
      'create_job',
      'edit_job',
      'delete_job',
      'assign_job',
      'view_reports',
      'manage_settings',
      'manage_regions'
    ];
    
    // Update permissions
    if (!roland.permissions) {
      roland.permissions = {};
    }
    
    // Roland should have access to all pages and actions
    roland.permissions.pages = allPages;
    roland.permissions.actions = allActions;
    
    // Add audit log entry
    if (!roland.auditLog) {
      roland.auditLog = [];
    }
    
    roland.auditLog.push({
      action: 'update-permissions',
      timestamp: new Date(),
      details: { 
        method: 'update-roland-permissions.js',
        changes: 'Updated permissions for Roland White user'
      }
    });
    
    // Save the updated user
    await roland.save();
    console.log('Roland White permissions updated successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating Roland White permissions:', error);
    process.exit(1);
  }
};

// Run the update
updateRolandPermissions();
