const mongoose = require('mongoose');
const connectDB = require('./config/db'); // Correct path to Mongoose connection logic
const Application = require('./models/Application'); // Path is correct

// Copy the SERVICE_CATEGORIES definition from RatesTab.js
// This is needed to map serviceType to the correct dutyLevel
const SERVICE_CATEGORIES = {
  rates: [
    { id: 'minorRoadService', label: 'Minor Road Service', appliesTo: ['light', 'medium', 'heavy'] },
    { id: 'lockouts', label: 'Lockouts', appliesTo: ['light', 'medium', 'heavy'] },
    { id: 'enrouteForRoadServicesOnly', label: 'En Route for Road Services Only', appliesTo: ['light', 'medium', 'heavy'], isMileage: true },
    { id: 'goneOnArrival', label: 'Gone on Arrival (GOA)', appliesTo: ['light', 'medium', 'heavy'] },
    { id: 'jumpStart', label: 'Jump Start', appliesTo: ['light', 'medium', 'heavy'] },
    { id: 'tireChange', label: 'Tire Change', appliesTo: ['light', 'medium', 'heavy'] },
    { id: 'fuelDelivery', label: 'Fuel Delivery', appliesTo: ['light', 'medium', 'heavy'] },
    { id: 'batteryTest', label: 'Battery Test', appliesTo: ['all'] },
    { id: 'batteryReplacement', label: 'Battery Replacement', appliesTo: ['all'] },
    { id: 'tow', label: 'Tow', appliesTo: ['light'] },
    { id: 'towMedium', label: 'Tow Medium', appliesTo: ['medium'] },
    { id: 'towHeavy', label: 'Tow Heavy', appliesTo: ['heavy'] },
    { id: 'mileage', label: 'Mileage [M]', appliesTo: ['light'], isMileage: true },
    { id: 'mileageMedium', label: 'Mileage Medium [M]', appliesTo: ['medium'], isMileage: true },
    { id: 'mileageHeavy', label: 'Mileage Heavy [M]', appliesTo: ['heavy'], isMileage: true },
    { id: 'enrouteMileage', label: 'Enroute Mileage (M)', appliesTo: ['light'], isMileage: true },
    { id: 'enrouteMileageMedium', label: 'Enroute Mileage Medium (M)', appliesTo: ['medium'], isMileage: true },
    { id: 'enrouteMileageHeavy', label: 'Enroute Mileage Heavy (M)', appliesTo: ['heavy'], isMileage: true },
    { id: 'winching', label: 'Winching', appliesTo: ['light', 'medium', 'heavy'] },
    { id: 'recovery', label: 'Recovery', appliesTo: ['light', 'medium', 'heavy'] },
    { id: 'labor', label: 'Labor [L]', appliesTo: ['all'] },
    { id: 'storage', label: 'Storage [S]', appliesTo: ['light', 'medium', 'heavy'] },
    { id: 'waitingTime', label: 'Waiting Time', appliesTo: ['all'] },
    { id: 'standbyTime', label: 'Standby Time', appliesTo: ['all'] },
    { id: 'flatbed', label: 'Flatbed', appliesTo: ['light', 'medium', 'heavy'] },
    { id: 'motorcycleTow', label: 'Motorcycle Tow', appliesTo: ['light'] },
    { id: 'accidentTow', label: 'Accident Tow', appliesTo: ['light', 'medium', 'heavy'] },
    { id: 'secondaryTowing', label: 'Secondary Towing', appliesTo: ['light', 'medium', 'heavy'] },
    { id: 'illegallyParkedTow', label: 'Illegally Parked Tow', appliesTo: ['light', 'medium', 'heavy'] },
    { id: 'roadService', label: 'Road Service', appliesTo: ['road'] },
  ],
  additionalCharges: [
    { id: 'dollies', label: 'Dollies', appliesTo: ['additional'] },
    { id: 'skates', label: 'Skates', appliesTo: ['additional'] },
    { id: 'goJacks', label: 'Go Jacks', appliesTo: ['additional'] },
    { id: 'driveShaftRemoval', label: 'Drive Shaft Removal', appliesTo: ['additional'] },
    { id: 'airBagRecoveryUnit', label: 'Air Bag Recovery Unit', appliesTo: ['additional'] },
    { id: 'cleanUpFee', label: 'Clean Up Fee', appliesTo: ['additional'] },
    { id: 'oilDry', label: 'Oil Dry', appliesTo: ['additional'] },
    { id: 'tarp', label: 'Tarp', appliesTo: ['additional'] },
    { id: 'escort', label: 'Escort', appliesTo: ['additional'] },
    { id: 'extraManHelpers', label: 'Extra Man-Helpers', appliesTo: ['additional'] },
    { id: 'deadheadMiles', label: 'Deadhead Miles [M]', appliesTo: ['additional'], isMileage: true },
    { id: 'storageHeavy', label: 'Storage Heavy [S]', appliesTo: ['additional'] },
    { id: 'storageOutdoors', label: 'Storage Outdoors [S]', appliesTo: ['additional'] },
    { id: 'storageIndoors', label: 'Storage Indoors [S]', appliesTo: ['additional'] },
    { id: 'storageMedium', label: 'Storage Medium [S]', appliesTo: ['additional'] },
    { id: 'administrationFee', label: 'Administration Fee', appliesTo: ['additional'] },
    { id: 'fuelSurcharge', label: 'Fuel Surcharge', appliesTo: ['additional'] },
    { id: 'gateFee', label: 'Gate fee', appliesTo: ['additional'] },
    { id: 'releaseFee', label: 'Release Fee', appliesTo: ['additional'] },
    { id: 'processingFee', label: 'Processing Fee', appliesTo: ['additional'] },
    { id: 'permits', label: 'Permits', appliesTo: ['additional'] },
    { id: 'tolls', label: 'Tolls', appliesTo: ['additional'] },
    { id: 'paidOutCharges', label: 'Paid Out Charges', appliesTo: ['additional'] },
    { id: 'disposal', label: 'Disposal', appliesTo: ['additional'] },
    { id: 'pickUpKey', label: 'Pick up Key', appliesTo: ['additional'] },
    { id: 'miscellaneous', label: 'Miscellaneous', appliesTo: ['additional'] },
    { id: 'serviceUnknown', label: 'Service Unknown', appliesTo: ['additional'] },
  ]
};

// Flatten the categories for easier lookup
const ALL_SERVICE_TYPES_MAP = [
  ...SERVICE_CATEGORIES.rates,
  ...SERVICE_CATEGORIES.additionalCharges
].reduce((map, service) => {
  map[service.id] = service;
  return map;
}, {});

const DUTY_LEVELS_ENUM = ['light', 'medium', 'heavy', 'road', 'additional', 'all'];

const migrateRates = async () => {
  await connectDB();
  console.log('Connected to MongoDB...');

  let updatedApplicationsCount = 0;
  let updatedRatesCount = 0;

  try {
    const applications = await Application.find({});
    console.log(`Found ${applications.length} applications to process.`);

    for (const app of applications) {
      let applicationModified = false;
      if (app.facilities && app.facilities.length > 0) {
        for (const facility of app.facilities) {
          if (facility.rates && facility.rates.length > 0) {
            for (const rate of facility.rates) {
              // Check if dutyLevel is missing or invalid
              if (!rate.dutyLevel || !DUTY_LEVELS_ENUM.includes(rate.dutyLevel)) {
                const serviceDefinition = ALL_SERVICE_TYPES_MAP[rate.serviceType];
                if (serviceDefinition && serviceDefinition.appliesTo && serviceDefinition.appliesTo.length > 0) {
                  // Assign the first applicable duty level (usually correct, esp. for 'additional')
                  const correctDutyLevel = serviceDefinition.appliesTo[0];
                  if (DUTY_LEVELS_ENUM.includes(correctDutyLevel)) {
                    console.log(`Updating rate for App ${app._id}, Facility ${facility._id}, Service ${rate.serviceType}: Setting dutyLevel to '${correctDutyLevel}'`);
                    rate.dutyLevel = correctDutyLevel;
                    applicationModified = true;
                    updatedRatesCount++;
                  } else {
                    console.warn(`Could not determine valid dutyLevel for Service ${rate.serviceType}. Found '${correctDutyLevel}' in definition.`);
                  }
                } else {
                  console.warn(`No service definition found for Service ${rate.serviceType}. Cannot determine dutyLevel.`);
                }
              }
            }
          }
        }
      }

      if (applicationModified) {
        try {
          await app.save();
          updatedApplicationsCount++;
          console.log(`Successfully saved updates for Application ${app._id}`);
        } catch (saveError) {
          console.error(`Error saving Application ${app._id}:`, saveError);
        }
      }
    }

    console.log('\n--- Migration Summary ---');
    console.log(`Processed ${applications.length} applications.`);
    console.log(`Updated ${updatedRatesCount} rates across ${updatedApplicationsCount} applications.`);

  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

migrateRates();
