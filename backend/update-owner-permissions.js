// update-owner-permissions.js
// Script to update the owner user's permissions

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

// Function to update owner permissions
const updateOwnerPermissions = async () => {
  try {
    console.log('Starting to update Roland White permissions...');
    // Find Roland White user
    const owner = await User.findOne({ username: 'd6367734' });
    
    if (!owner) {
      console.log('Roland White user not found');
      process.exit(1);
    }
    
    console.log(`Found Roland White user: ${owner.username}`);
    
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
    if (!owner.permissions) {
      owner.permissions = {};
    }
    
    // Owner should have access to all pages and actions
    owner.permissions.pages = allPages;
    owner.permissions.actions = allActions;
    
    // Add audit log entry
    if (!owner.auditLog) {
      owner.auditLog = [];
    }
    
    owner.auditLog.push({
      action: 'update-permissions',
      timestamp: new Date(),
      details: { 
        method: 'update-owner-permissions.js',
        changes: 'Updated permissions for owner user'
      }
    });
    
    // Save the updated user
    await owner.save();
    console.log('Owner permissions updated successfully');
    
    // Also update Cline user if it exists
    const cline = await User.findOne({ username: 'Cline' });
    
    if (cline) {
      console.log(`Found Cline user: ${cline.username}`);
      
      // Update permissions
      if (!cline.permissions) {
        cline.permissions = {};
      }
      
      // Cline should have access to all pages and actions
      cline.permissions.pages = allPages;
      cline.permissions.actions = allActions;
      
      // Add audit log entry
      if (!cline.auditLog) {
        cline.auditLog = [];
      }
      
      cline.auditLog.push({
        action: 'update-permissions',
        timestamp: new Date(),
        details: { 
          method: 'update-owner-permissions.js',
          changes: 'Updated permissions for Cline user'
        }
      });
      
      // Save the updated user
      await cline.save();
      console.log('Cline permissions updated successfully');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating owner permissions:', error);
    process.exit(1);
  }
};

// Run the update
updateOwnerPermissions();
