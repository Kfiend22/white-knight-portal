// migrate-application-schedule.js
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Application = require('./models/Application');

const migrateApplications = async () => {
  await connectDB();
  console.log('MongoDB Connected for migration...');

  let updatedCount = 0;
  let errorCount = 0;

  try {
    // Find applications needing migration
    const applicationsToMigrate = await Application.find({
      $or: [
        { 'services.open247': { $type: 'string' } }, // Find string type for open247
        { 'services.hoursOfOperation': { $exists: true } } // Find docs with old field
      ]
    });

    console.log(`Found ${applicationsToMigrate.length} applications potentially needing migration.`);

    for (const app of applicationsToMigrate) {
      try {
        let needsUpdate = false;
        const servicesUpdate = { ...app.services.toObject() }; // Work with a plain object copy

        // 1. Migrate open247 from string to boolean
        if (typeof servicesUpdate.open247 === 'string') {
          servicesUpdate.open247 = servicesUpdate.open247.toLowerCase() === 'true';
          console.log(`Migrated open247 for ${app._id} to boolean: ${servicesUpdate.open247}`);
          needsUpdate = true;
        } else if (servicesUpdate.open247 === undefined || servicesUpdate.open247 === null) {
           // Ensure it has a default boolean value if missing
           servicesUpdate.open247 = false;
           needsUpdate = true;
        }


        // 2. Initialize schedule if it doesn't exist
        if (!servicesUpdate.schedule) {
          servicesUpdate.schedule = {
            sameEveryDay: false,
            everyDayOpen: '',
            everyDayClose: '',
            days: {
              monday: { isOpen: false, open: '', close: '' },
              tuesday: { isOpen: false, open: '', close: '' },
              wednesday: { isOpen: false, open: '', close: '' },
              thursday: { isOpen: false, open: '', close: '' },
              friday: { isOpen: false, open: '', close: '' },
              saturday: { isOpen: false, open: '', close: '' },
              sunday: { isOpen: false, open: '', close: '' }
            }
          };
          console.log(`Initialized schedule for ${app._id}`);
          needsUpdate = true;
        }

        // 3. Log old hoursOfOperation if it exists (manual parsing is too complex)
        if (servicesUpdate.hoursOfOperation !== undefined) {
          if (servicesUpdate.hoursOfOperation) {
             console.log(`Note: App ${app._id} had old hoursOfOperation value: "${servicesUpdate.hoursOfOperation}". Manual review/entry might be needed.`);
          }
          // Prepare to remove the old field using $unset
        }

        if (needsUpdate || servicesUpdate.hoursOfOperation !== undefined) {
          const updateOps = { $set: { 'services': servicesUpdate } };
          if (servicesUpdate.hoursOfOperation !== undefined) {
            // Important: Unset the old field AFTER potentially using its value
            updateOps.$unset = { 'services.hoursOfOperation': "" };
            // We also need to remove it from the object we are setting to avoid conflicts
            delete servicesUpdate.hoursOfOperation;
            updateOps.$set.services = servicesUpdate; // Update the set operation
          }

          await Application.updateOne({ _id: app._id }, updateOps);
          console.log(`Successfully updated application ${app._id}`);
          updatedCount++;
        } else {
           console.log(`Application ${app._id} did not require schema migration updates.`);
        }

      } catch (err) {
        console.error(`Error migrating application ${app._id}:`, err.message);
        errorCount++;
      }
    }

    console.log(`\nMigration Summary:`);
    console.log(`- Successfully updated: ${updatedCount}`);
    console.log(`- Errors encountered: ${errorCount}`);

  } catch (error) {
    console.error('Error during migration process:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB Disconnected.');
  }
};

migrateApplications();
