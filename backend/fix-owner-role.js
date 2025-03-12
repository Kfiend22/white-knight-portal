// fix-owner-role.js
// Script to fix the owner user role in the MongoDB database

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

// Function to fix owner role
const fixOwnerRole = async () => {
  try {
    // Find owner user
    const owner = await User.findOne({ username: 'owner' });
    
    if (!owner) {
      console.log('Owner user not found');
      process.exit(1);
    }
    
    console.log(`Found owner user: ${owner.username}`);
    console.log('Current user data:');
    console.log(`- primaryRole: ${owner.primaryRole}`);
    console.log(`- role: ${owner.role}`);
    console.log(`- secondaryRoles:`, owner.secondaryRoles);
    console.log(`- permissions:`, owner.permissions);
    
    // Update owner role fields
    const updates = {
      primaryRole: 'OW', // Ensure uppercase
      role: 'OW', // Set legacy role field for backward compatibility
      secondaryRoles: {
        ...(owner.secondaryRoles || {}),
        admin: true // Ensure admin role is set
      }
    };
    
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
      updates.permissions = {};
    } else {
      updates.permissions = { ...owner.permissions };
    }
    
    // Owner should have access to all pages and actions
    updates.permissions.pages = allPages;
    updates.permissions.actions = allActions;
    
    // Add audit log entry
    const auditEntry = {
      action: 'fix-owner-role',
      timestamp: new Date(),
      details: { 
        method: 'fix-owner-role.js',
        changes: 'Fixed owner role and permissions'
      }
    };
    
    if (!owner.auditLog) {
      updates.auditLog = [auditEntry];
    } else {
      updates.auditLog = [...owner.auditLog, auditEntry];
    }
    
    // Update the owner user
    const updatedOwner = await User.findOneAndUpdate(
      { username: 'owner' },
      { $set: updates },
      { new: true }
    );
    
    console.log('Owner user updated successfully');
    console.log('Updated user data:');
    console.log(`- primaryRole: ${updatedOwner.primaryRole}`);
    console.log(`- role: ${updatedOwner.role}`);
    console.log(`- secondaryRoles:`, updatedOwner.secondaryRoles);
    console.log(`- permissions:`, updatedOwner.permissions);
    
    process.exit(0);
  } catch (error) {
    console.error('Error fixing owner role:', error);
    process.exit(1);
  }
};

// Run the update
fixOwnerRole();
