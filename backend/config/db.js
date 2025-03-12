const mongoose = require('mongoose');
const connectDB = async () => {
  const MONGODB_URI = 'mongodb://localhost/white-knight-portal';
  
  const connection = await mongoose.connect(MONGODB_URI);
  console.log('MongoDB Connected');
  return connection;
};

module.exports = connectDB;