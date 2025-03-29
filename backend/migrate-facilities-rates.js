const mongoose = require('mongoose');
const connectDB = require('./config/db'); // Ensure this path is correct
const Application = require('./models/Application'); // Ensure this path is correct
const Facility = require('./models/Facility'); // Ensure this path is correct
const Rate = require('./models/Rate'); // Ensure this path is correct

// --- Data Structures (copied for reference/validation) ---
const DUTY_LEVELS_ENUM = ['light', 'medium', 'heavy', 'road', 'additional', 'all'];
const SERVICE_CATEGORIES = { // Needed to infer dutyLevel if missing
  rates: [
    { id: 'minorRoadService', appliesTo: ['light', 'medium', 'heavy'] }, { id: 'lockouts', appliesTo: ['light', 'medium', 'heavy'] },
    { id: 'enrouteForRoadServicesOnly', appliesTo: ['light', 'medium', 'heavy'], isMileage: true }, { id: 'goneOnArrival', appliesTo: ['light', 'medium', 'heavy'] },
    { id: 'jumpStart', appliesTo: ['light', 'medium', 'heavy'] }, { id: 'tireChange', appliesTo: ['light', 'medium', 'heavy'] },
    { id: 'fuelDelivery', appliesTo: ['light', 'medium', 'heavy'] }, { id: 'batteryTest', appliesTo: ['all'] },
    { id: 'batteryReplacement', appliesTo: ['all'] }, { id: 'tow', appliesTo: ['light'] }, { id: 'towMedium', appliesTo: ['medium'] },
    { id: 'towHeavy', appliesTo: ['heavy'] }, { id: 'mileage', appliesTo: ['light'], isMileage: true },
    { id: 'mileageMedium', appliesTo: ['medium'], isMileage: true }, { id: 'mileageHeavy', appliesTo: ['heavy'], isMileage: true },
    { id: 'enrouteMileage', appliesTo: ['light'], isMileage: true }, { id: 'enrouteMileageMedium', appliesTo: ['medium'], isMileage: true },
    { id: 'enrouteMileageHeavy', appliesTo: ['heavy'], isMileage: true }, { id: 'winching', appliesTo: ['light', 'medium', 'heavy'] },
    { id: 'recovery', appliesTo: ['light', 'medium', 'heavy'] }, { id: 'labor', appliesTo: ['all'] },
    { id: 'storage', appliesTo: ['light', 'medium', 'heavy'] }, { id: 'waitingTime', appliesTo: ['all'] },
    { id: 'standbyTime', appliesTo: ['all'] }, { id: 'flatbed', appliesTo: ['light', 'medium', 'heavy'] },
    { id: 'motorcycleTow', appliesTo: ['light'] }, { id: 'accidentTow', appliesTo: ['light', 'medium', 'heavy'] },
    { id: 'secondaryTowing', appliesTo: ['light', 'medium', 'heavy'] }, { id: 'illegallyParkedTow', appliesTo: ['light', 'medium', 'heavy'] },
    { id: 'roadService', appliesTo: ['road'] },
  ],
  additionalCharges: [
    { id: 'dollies', appliesTo: ['additional'] }, { id: 'skates', appliesTo: ['additional'] }, { id: 'goJacks', appliesTo: ['additional'] },
    { id: 'driveShaftRemoval', appliesTo: ['additional'] }, { id: 'airBagRecoveryUnit', appliesTo: ['additional'] },
    { id: 'cleanUpFee', appliesTo: ['additional'] }, { id: 'oilDry', appliesTo: ['additional'] }, { id: 'tarp', appliesTo: ['additional'] },
    { id: 'escort', appliesTo: ['additional'] }, { id: 'extraManHelpers', appliesTo: ['additional'] },
    { id: 'deadheadMiles', appliesTo: ['additional'], isMileage: true }, { id: 'storageHeavy', appliesTo: ['additional'] },
    { id: 'storageOutdoors', appliesTo: ['additional'] }, { id: 'storageIndoors', appliesTo: ['additional'] },
    { id: 'storageMedium', appliesTo: ['additional'] }, { id: 'administrationFee', appliesTo: ['additional'] },
    { id: 'fuelSurcharge', appliesTo: ['additional'] }, { id: 'gateFee', appliesTo: ['additional'] },
    { id: 'releaseFee', appliesTo: ['additional'] }, { id: 'processingFee', appliesTo: ['additional'] },
    { id: 'permits', appliesTo: ['additional'] }, { id: 'tolls', appliesTo: ['additional'] },
    { id: 'paidOutCharges', appliesTo: ['additional'] }, { id: 'disposal', appliesTo: ['additional'] },
    { id: 'pickUpKey', appliesTo: ['additional'] }, { id: 'miscellaneous', appliesTo: ['additional'] },
    { id: 'serviceUnknown', appliesTo: ['additional'] },
  ]
};
const ALL_SERVICE_TYPES_MAP = [
  ...SERVICE_CATEGORIES.rates,
  ...SERVICE_CATEGORIES.additionalCharges
].reduce((map, service) => {
  map[service.id] = service;
  return map;
}, {});
// --- End Data Structures ---

const migrateData = async () => {
  await connectDB();
  console.log('Connected to MongoDB...');

  let applicationsProcessed = 0;
  let facilitiesMigrated = 0;
  let ratesMigrated = 0;
  let applicationsToUpdate = []; // To store applications needing embedded data removal

  try {
    // Fetch applications, explicitly selecting the potentially existing embedded 'facilities'
    // Mongoose might not select fields not in the schema by default, hence the lean() and manual check.
    const applications = await Application.find({}).lean(); // Use lean() for plain JS objects
    console.log(`Found ${applications.length} application documents.`);

    for (const app of applications) {
      applicationsProcessed++;
      // Check if the deprecated 'facilities' field actually exists on this document
      if (!app.facilities || !Array.isArray(app.facilities) || app.facilities.length === 0) {
        console.log(`Application ${app._id}: No embedded facilities found or array is empty. Skipping.`);
        continue;
      }

      console.log(`Application ${app._id}: Found ${app.facilities.length} embedded facilities. Processing...`);
      let applicationNeedsUpdate = false; // Flag to track if this app needs its embedded array cleared

      for (const embeddedFacility of app.facilities) {
        try {
          // 1. Create new Facility document
          const newFacilityData = {
            applicationId: app._id,
            facilityName: embeddedFacility.facilityName,
            address1: embeddedFacility.address1,
            address2: embeddedFacility.address2,
            city: embeddedFacility.city,
            state: embeddedFacility.state,
            zip: embeddedFacility.zip,
            coveredZipCodes: embeddedFacility.coveredZipCodes || [],
            contactName: embeddedFacility.contactName,
            contactPhone: embeddedFacility.contactPhone,
            contactEmail: embeddedFacility.contactEmail,
            schedule: embeddedFacility.schedule, // Copy schedule object
            // createdAt will be set by default
          };
          const newFacility = await Facility.create(newFacilityData);
          facilitiesMigrated++;
          console.log(`  - Created Facility ${newFacility._id} for embedded facility in App ${app._id}`);

          // 2. Prepare Rate documents for this new facility
          const ratesToInsert = [];
          if (embeddedFacility.rates && Array.isArray(embeddedFacility.rates)) {
            for (const embeddedRate of embeddedFacility.rates) {
              let dutyLevel = embeddedRate.dutyLevel;

              // Attempt to fix missing/invalid dutyLevel
              if (!dutyLevel || !DUTY_LEVELS_ENUM.includes(dutyLevel)) {
                const serviceDefinition = ALL_SERVICE_TYPES_MAP[embeddedRate.serviceType];
                if (serviceDefinition?.appliesTo?.length > 0) {
                  const inferredDutyLevel = serviceDefinition.appliesTo[0];
                  if (DUTY_LEVELS_ENUM.includes(inferredDutyLevel)) {
                    console.log(`    - Rate Service ${embeddedRate.serviceType}: Inferring dutyLevel as '${inferredDutyLevel}'`);
                    dutyLevel = inferredDutyLevel;
                  } else {
                     console.warn(`    - Rate Service ${embeddedRate.serviceType}: Could not determine valid dutyLevel. Found '${inferredDutyLevel}' in definition. Skipping rate.`);
                     continue; // Skip this rate
                  }
                } else {
                  console.warn(`    - Rate Service ${embeddedRate.serviceType}: No service definition found. Skipping rate.`);
                  continue; // Skip this rate
                }
              }

              ratesToInsert.push({
                applicationId: app._id,
                facilityId: newFacility._id, // Link to the NEWLY created facility
                serviceType: embeddedRate.serviceType,
                rate: embeddedRate.rate,
                freeMiles: embeddedRate.freeMiles || 0,
                dutyLevel: dutyLevel,
                // createdAt will be set by default
              });
            }
          }

          // 3. Bulk insert rates for the new facility
          if (ratesToInsert.length > 0) {
            await Rate.insertMany(ratesToInsert);
            ratesMigrated += ratesToInsert.length;
            console.log(`    - Inserted ${ratesToInsert.length} rates for Facility ${newFacility._id}`);
          } else {
             console.log(`    - No valid rates found to insert for Facility ${newFacility._id}`);
          }
          
          applicationNeedsUpdate = true; // Mark that this application had embedded data processed

        } catch (facilityError) {
          console.error(`  - Error processing facility for App ${app._id}:`, facilityError);
          // Continue to the next facility within the same application
        }
      } // End loop through embedded facilities

      // If migration for this app's facilities was successful, add its ID to the list for cleanup
      if (applicationNeedsUpdate) {
          applicationsToUpdate.push(app._id);
      }

    } // End loop through applications

    // --- Optional Cleanup Step ---
    if (applicationsToUpdate.length > 0) {
        console.log(`\nAttempting to remove embedded 'facilities' array from ${applicationsToUpdate.length} applications...`);
        try {
            const updateResult = await Application.updateMany(
                { _id: { $in: applicationsToUpdate } },
                { $unset: { facilities: "" } } // Remove the facilities field
            );
            console.log(`Cleanup result: ${updateResult.modifiedCount} applications updated.`);
        } catch (cleanupError) {
            console.error("Error during cleanup step:", cleanupError);
        }
    } else {
        console.log("\nNo applications required cleanup of embedded facilities array.");
    }


    console.log('\n--- Migration Summary ---');
    console.log(`Processed ${applicationsProcessed} application documents.`);
    console.log(`Migrated ${facilitiesMigrated} facilities to the 'facilities' collection.`);
    console.log(`Migrated ${ratesMigrated} rates to the 'rates' collection.`);

  } catch (error) {
    console.error('Error during migration script:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

migrateData();
