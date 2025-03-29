const mongoose = require('mongoose');

const RateSchema = new mongoose.Schema({
  applicationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Application', 
    required: true 
  },
  facilityId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Facility', 
    required: true 
  },
  serviceType: { 
    type: String, 
    required: true 
  },
  rate: { 
    type: Number, 
    required: true 
  },
  freeMiles: { // Add freeMiles field
    type: Number,
    default: 0 // Default to 0 if not provided
  },
  dutyLevel: { // Add dutyLevel field
    type: String, 
    enum: ['light', 'medium', 'heavy', 'road', 'additional', 'all'], // Define possible levels
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Rate', RateSchema);
