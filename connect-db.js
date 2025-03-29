// MongoDB connection script
// This file is used by start-white-knight.bat to connect to the database

// Connect to the white-knight-portal database
db = db.getSiblingDB('white-knight-portal');

// Print confirmation message
print('');
print('Connected to white-knight-portal database');
print('MongoDB shell ready for use');
print('');
