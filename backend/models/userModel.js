// File: backend/models/userModel.js

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  vendorId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  companyName: {
    type: String,
    default: ''
  },
  ownerFirstName: {
    type: String,
    required: true,
    trim: true
  },
  ownerLastName: {
    type: String,
    required: true,
    trim: true
  },
  facilityCountry: {
    type: String,
    required: true
  },
  facilityAddress1: {
    type: String,
    required: true
  },
  facilityAddress2: {
    type: String,
    default: ''
  },
  facilityCity: {
    type: String,
    required: true
  },
  facilityState: {
    type: String,
    required: true
  },
  facilityZip: {
    type: String,
    required: true
  },
  territories: {
    zipCodes: {
      type: [String], // An array of strings
      default: [],
      required: true,
    }
  },
  superAdmin: {
    type: Number,
    default: 1
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);
module.exports = User;
