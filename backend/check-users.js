// check-users.js
// Script to check the users in the database

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

const fs = require('fs');
const path = require('path');

// Function to check users
const checkUsers = async () => {
  try {
    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    // Create output string
    let output = `Found ${users.length} users\n`;

    // Display user information
    for (const user of users) {
      output += `\nUser: ${user.username || user.email || user._id}\n`;
      output += `  - Primary Role: ${user.primaryRole || 'Not set'}\n`;
      output += `  - Legacy Role: ${user.role || 'Not set'}\n`;
      output += `  - Secondary Roles: ${JSON.stringify(user.secondaryRoles || {})}\n`;
      output += `  - Vendor Number: ${user.vendorNumber || 'Not set'}\n`;
      output += `  - Legacy Vendor ID: ${user.vendorId || 'Not set'}\n`;
      output += `  - First Name: ${user.firstName || 'Not set'}\n`;
      output += `  - Last Name: ${user.lastName || 'Not set'}\n`;
      output += `  - Legacy First Name: ${user.ownerFirstName || 'Not set'}\n`;
      output += `  - Legacy Last Name: ${user.ownerLastName || 'Not set'}\n`;
      output += `  - Is Active: ${user.isActive !== false ? 'Yes' : 'No'}\n`;
      output += `  - Is On Duty: ${user.isOnDuty ? 'Yes' : 'No'}\n`;
      output += `  - Audit Log: ${user.auditLog ? user.auditLog.length + ' entries' : 'Not set'}\n`;
    }

    // Write output to file
    const outputPath = path.join(__dirname, 'user-check-results.txt');
    fs.writeFileSync(outputPath, output);
    console.log(`Results written to ${outputPath}`);

    process.exit(0);
  } catch (error) {
    console.error('Error checking users:', error);
    process.exit(1);
  }
};

// Run the check
checkUsers();
