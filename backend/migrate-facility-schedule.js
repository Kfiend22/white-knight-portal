// migrate-facility-schedule.js
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Application = require('./models/Application');

const migrateFacilitySchedules = async () => {
  await connectDB();
  console.log('MongoDB Connected for facility schedule migration...');

  let appsProcessed = 0;
  let facilitiesMigrated = 0;
  let errorCount = 0;

  try {
    // Find applications that have facilities which might need migration
    // (i.e., facilities exist and either have operationalHours or lack the new schedule field)
    const applicationsWithFacilities = await Application.find({
      'facilities': { $exists: true, $ne: [] } // Find apps with non-empty facilities array
    });

    console.log(`Found ${applicationsWithFacilities.length} applications with facilities to check.`);

    for (const app of applicationsWithFacilities) {
      appsProcessed++;
      let appNeedsSave = false;

      for (let i = 0; i < app.facilities.length; i++) {
        const facility = app.facilities[i];
        let facilityNeedsUpdate = false;

        // Check if schedule object exists
        if (!facility.schedule) {
          facility.schedule = {
            open247: false, // Default to false
            sameEveryDay: false,
            sameTimeSelectedDays: false,
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
          console.log(`Initialized schedule for facility ${facility._id} in app ${app._id}`);
          facilityNeedsUpdate = true;
        } else {
           // Ensure sameTimeSelectedDays exists if schedule already exists
           if (facility.schedule.sameTimeSelectedDays === undefined) {
              facility.schedule.sameTimeSelectedDays = false;
              facilityNeedsUpdate = true;
              console.log(`Added sameTimeSelectedDays to facility ${facility._id} in app ${app._id}`);
           }
        }


        // Check if old operationalHours field exists
        if (facility.operationalHours !== undefined) {
          if (facility.operationalHours) {
            console.log(`Note: Facility ${facility._id} in app ${app._id} had old operationalHours: "${facility.operationalHours}". Manual review/entry might be needed.`);
          }
          // Mark for removal - Mongoose handles removal of undefined fields on save if not explicitly $unset
          facility.operationalHours = undefined;
          facilityNeedsUpdate = true;
        }

        if (facilityNeedsUpdate) {
          facilitiesMigrated++;
          appNeedsSave = true;
          // Mark the facilities array as modified so Mongoose saves the changes
          app.markModified('facilities');
        }
      } // End loop through facilities

      if (appNeedsSave) {
        try {
          await app.save();
          console.log(`Successfully updated facilities schedule for application ${app._id}`);
        } catch (saveErr) {
          console.error(`Error saving application ${app._id} after facility migration:`, saveErr.message);
          errorCount++;
        }
      } else {
         console.log(`Application ${app._id} facilities did not require schedule migration.`);
      }

    } // End loop through applications

    console.log(`\nFacility Schedule Migration Summary:`);
    console.log(`- Applications Processed: ${appsProcessed}`);
    console.log(`- Facilities Migrated/Updated: ${facilitiesMigrated}`);
    console.log(`- Errors encountered during save: ${errorCount}`);

  } catch (error) {
    console.error('Error during facility migration process:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB Disconnected.');
  }
};

migrateFacilitySchedules();
