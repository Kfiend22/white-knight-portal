const mongoose = require('mongoose');

/**
 * Vehicle Schema
 * Represents a truck or vehicle in the fleet
 */
const vehicleSchema = mongoose.Schema({
  // Basic vehicle information
  name: {
    type: String,
    required: [true, 'Vehicle name is required']
  },
  make: String,
  model: String,
  year: String,
  type: {
    type: String,
    required: [true, 'Vehicle type is required'],
    enum: ['Flatbed', 'Wheel Lift', 'Light Duty', 'Medium Duty', 'Heavy Duty', 
           'Super Heavy', 'Service Truck', 'Covered Flatbed', 'Flatbed + Straps', 'Other']
  },
  
  // Driver assignment
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  driverName: String,
  
  // Vendor information (who owns the vehicle)
  vendorId: {
    type: String,
    required: [true, 'Vendor ID is required']
  },
  
  // Status tracking
  status: {
    type: String, 
    default: 'Off Duty',
    enum: ['On Duty', 'Off Duty', 'Maintenance', 'Out of Service']
  },
  
  // Location data for map tracking
  lat: {
    type: Number,
    default: 0
  },
  lng: {
    type: Number,
    default: 0
  },
  
  // For future use - documents and images
  documents: [String],
  images: [String],

  // Auditing metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Add timestamp for updates
vehicleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
