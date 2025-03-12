// fix-owner-mongodb.js
// Direct MongoDB update script for the owner user

// This script contains the MongoDB commands to update the owner user
// Run these commands in the MongoDB shell or using a MongoDB client

/*
// Connect to the database
use white-knight-portal

// Update the owner user
db.users.updateOne(
  { username: "owner" },
  {
    $set: {
      primaryRole: "OW",
      role: "OW",
      "secondaryRoles.admin": true,
      permissions: {
        pages: [
          "Dashboard",
          "Submissions",
          "Regions",
          "Settings",
          "Payments",
          "Users",
          "Performance"
        ],
        actions: [
          "create_user",
          "edit_user",
          "delete_user",
          "create_job",
          "edit_job",
          "delete_job",
          "assign_job",
          "view_reports",
          "manage_settings",
          "manage_regions"
        ]
      }
    },
    $push: {
      auditLog: {
        action: "fix-owner-role",
        timestamp: new Date(),
        details: {
          method: "fix-owner-mongodb.js",
          changes: "Fixed owner role and permissions"
        }
      }
    }
  }
)

// Verify the update
db.users.findOne({ username: "owner" })
*/

// For use with mongoose in Node.js:
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

// Function to fix owner role directly with MongoDB operations
const fixOwnerRole = async () => {
  try {
    // Get the MongoDB connection
    const db = mongoose.connection.db;
    
    // Update the owner user
    const result = await db.collection('users').updateOne(
      { username: "owner" },
      {
        $set: {
          primaryRole: "OW",
          role: "OW",
          "secondaryRoles.admin": true,
          permissions: {
            pages: [
              "Dashboard",
              "Submissions",
              "Regions",
              "Settings",
              "Payments",
              "Users",
              "Performance"
            ],
            actions: [
              "create_user",
              "edit_user",
              "delete_user",
              "create_job",
              "edit_job",
              "delete_job",
              "assign_job",
              "view_reports",
              "manage_settings",
              "manage_regions"
            ]
          }
        },
        $push: {
          auditLog: {
            action: "fix-owner-role",
            timestamp: new Date(),
            details: {
              method: "fix-owner-mongodb.js",
              changes: "Fixed owner role and permissions"
            }
          }
        }
      }
    );
    
    console.log('Update result:', result);
    
    // Verify the update
    const updatedOwner = await db.collection('users').findOne({ username: "owner" });
    console.log('Updated owner user:');
    console.log(`- primaryRole: ${updatedOwner.primaryRole}`);
    console.log(`- role: ${updatedOwner.role}`);
    console.log(`- secondaryRoles:`, updatedOwner.secondaryRoles);
    console.log(`- permissions:`, updatedOwner.permissions);
    
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error fixing owner role:', error);
    mongoose.connection.close();
    process.exit(1);
  }
};

// Run the update
fixOwnerRole();
