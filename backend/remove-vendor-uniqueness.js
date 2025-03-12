// Script to remove uniqueness constraints on vendorId and vendorNumber fields
const mongoose = require('mongoose');
require('dotenv').config();

const DB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/white-knight-portal';

async function removeUniqueIndexes() {
  try {
    // Connect to the database
    await mongoose.connect(DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    
    // Get the users collection
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Get all indexes
    const indexes = await usersCollection.indexes();
    console.log('Current indexes:', indexes);
    
    // Check for uniqueness constraints on vendorId and vendorNumber
    const vendorIdIndex = indexes.find(index => 
      index.key && index.key.vendorId && index.unique
    );
    
    const vendorNumberIndex = indexes.find(index => 
      index.key && index.key.vendorNumber && index.unique
    );
    
    // Drop unique indexes if they exist
    if (vendorIdIndex) {
      console.log('Dropping unique index on vendorId');
      await usersCollection.dropIndex(vendorIdIndex.name);
      console.log('Successfully dropped unique index on vendorId');
    } else {
      console.log('No unique index found on vendorId');
    }
    
    if (vendorNumberIndex) {
      console.log('Dropping unique index on vendorNumber');
      await usersCollection.dropIndex(vendorNumberIndex.name);
      console.log('Successfully dropped unique index on vendorNumber');
    } else {
      console.log('No unique index found on vendorNumber');
    }
    
    // Optionally create non-unique indexes
    console.log('Creating non-unique indexes on vendorId and vendorNumber...');
    await usersCollection.createIndex({ vendorId: 1 }, { unique: false });
    await usersCollection.createIndex({ vendorNumber: 1 }, { unique: false });
    
    console.log('Updated indexes:', await usersCollection.indexes());
    
    console.log('Database updated successfully');
  } catch (error) {
    console.error('Error updating database:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the function
removeUniqueIndexes();
