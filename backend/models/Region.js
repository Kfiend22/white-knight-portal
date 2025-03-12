// File: backend/models/Region.js

const mongoose = require('mongoose');

const regionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  // Countries included in this region
  countries: [{
    type: String,
    required: true
  }],
  // States/provinces included in this region
  states: [{
    country: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    }
  }],
  // Creator of the region (usually the Owner)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Active status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Region = mongoose.model('Region', regionSchema);
module.exports = Region;
