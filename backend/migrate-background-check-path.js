// backend/migrate-background-check-path.js
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') }); // Load .env from backend directory
const mongoose = require('mongoose');
const Application = require('./models/Application'); // Adjust path if necessary
const connectDB = require('./config/db'); // Adjust path if necessary

const migrateData = async () => {
  try {
    await connectDB();
    console.log('MongoDB Connected for migration...');

    const filter = {
      backgroundCheckPath: { $exists: true, $ne: null, $ne: "" }, // Old path exists and is not empty
      $or: [
        { "backgroundCheck.path": { $exists: false } }, // New path doesn't exist
        { "backgroundCheck.path": null },             // New path is null
        { "backgroundCheck.path": "" }                // New path is empty
      ]
    };

    const update = [
      {
        $set: {
          // Ensure backgroundCheck object exists if it doesn't
          backgroundCheck: { 
            $ifNull: ["$backgroundCheck", {}] 
          }
        }
      },
      {
        $set: {
          // Set the new path using the value from the old path
          "backgroundCheck.path": "$backgroundCheckPath" 
        }
      },
      {
        $unset: "backgroundCheckPath" // Remove the old field
      }
    ];

    console.log("Finding applications needing migration...");
    const result = await Application.updateMany(filter, update);

    console.log(`Migration complete. ${result.matchedCount} documents matched the filter.`);
    console.log(`${result.modifiedCount} documents were successfully updated.`);

    if (result.matchedCount > result.modifiedCount) {
        console.warn(`Warning: ${result.matchedCount - result.modifiedCount} documents matched but were not modified. This might indicate an issue or that they were already partially migrated.`);
    }

  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB Disconnected.');
  }
};

migrateData();
