// migrate-users.js
// Script to migrate existing users to the new schema

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

// Function to migrate users
const migrateUsers = async () => {
  try {
    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users to migrate`);

    // Process each user
    for (const user of users) {
      console.log(`Migrating user: ${user.username || user.email || user._id}`);

      // Map legacy role to primary role
      if (user.role && !user.primaryRole) {
        user.primaryRole = user.role;
        console.log(`  - Mapped role ${user.role} to primaryRole`);
      }

      // Set secondary roles based on legacy role
      if (!user.secondaryRoles) {
        user.secondaryRoles = {
          admin: false,
          dispatcher: false,
          answeringService: false,
          driver: false
        };

        // Map legacy roles to secondary roles
        if (user.role === 'MN') {
          user.secondaryRoles.admin = true;
          console.log(`  - Set admin secondary role for Manager`);
        } else if (user.role === 'DP') {
          user.secondaryRoles.dispatcher = true;
          console.log(`  - Set dispatcher secondary role for Dispatcher`);
        } else if (user.role === 'DV') {
          user.secondaryRoles.driver = true;
          console.log(`  - Set driver secondary role for Driver`);
        }
      }

      // Map name fields
      if (user.ownerFirstName && !user.firstName) {
        user.firstName = user.ownerFirstName;
        console.log(`  - Mapped ownerFirstName to firstName`);
      }

      if (user.ownerLastName && !user.lastName) {
        user.lastName = user.ownerLastName;
        console.log(`  - Mapped ownerLastName to lastName`);
      }

      // Map vendor ID
      if (user.vendorId && !user.vendorNumber) {
        user.vendorNumber = user.vendorId;
        console.log(`  - Mapped vendorId to vendorNumber`);
      }

      // Map address fields
      if (!user.address) {
        user.address = {
          street1: user.facilityAddress1 || '',
          street2: user.facilityAddress2 || '',
          city: user.facilityCity || '',
          state: user.facilityState || '',
          zip: user.facilityZip || '',
          country: user.facilityCountry || 'US'
        };
        console.log(`  - Created address object from facility fields`);
      }

      // Map regions
      if (user.region && (!user.regions || user.regions.length === 0)) {
        user.regions = [user.region];
        console.log(`  - Added region to regions array`);
      }

      // Initialize or update audit log
      if (!user.auditLog || !Array.isArray(user.auditLog)) {
        user.auditLog = [];
      }
      
      // Add migration entry to audit log
      user.auditLog.push({
        action: 'migrate',
        timestamp: new Date(),
        details: { method: 'migrate-users.js' }
      });
      console.log(`  - Updated audit log`);

      // Set default values for new fields
      if (user.isActive === undefined) {
        user.isActive = true;
        console.log(`  - Set default isActive to true`);
      }

      if (user.isOnDuty === undefined && (user.secondaryRoles?.driver || user.role === 'DV')) {
        user.isOnDuty = false;
        console.log(`  - Set default isOnDuty to false for driver`);
      }

      // Save the updated user
      await user.save();
      console.log(`  - User migrated successfully`);
    }

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

// Run the migration
migrateUsers();
