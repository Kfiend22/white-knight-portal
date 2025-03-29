require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') }); // Load main .env file
const mongoose = require('mongoose');
const connectDB = require('./config/db'); // Use the correct path to the Mongoose connection function
const Rate = require('./models/Rate'); // Adjust path if necessary

const migrateGoaRate = async () => {
  console.log('Connecting to database...');
  await connectDB();
  console.log('Database connected.');

  try {
    console.log('Starting GOA rate migration...');
    const filter = { serviceType: 'goneOnArrival' };
    const update = { $set: { rate: 50 } }; // Set rate to 50

    const result = await Rate.updateMany(filter, update);

    console.log(`GOA rate migration completed.`);
    console.log(`Documents matched: ${result.matchedCount}`);
    console.log(`Documents modified: ${result.modifiedCount}`);

  } catch (error) {
    console.error('Error during GOA rate migration:', error);
  } finally {
    console.log('Disconnecting from database...');
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
};

migrateGoaRate();
