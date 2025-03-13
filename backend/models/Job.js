const mongoose = require('mongoose');

const vehicleSchema = mongoose.Schema({
  year: { type: String, required: true },
  make: { type: String, required: true },
  model: { type: String, required: true },
  color: { type: String },
  license: { type: String },
  vin: { type: String },
  odometer: { type: String }
});

const contactSchema = mongoose.Schema({
  name: { type: String, required: true },
  number: { type: String, required: true }
});

// Optional contact schema for dropoff contact
const optionalContactSchema = mongoose.Schema({
  name: { type: String },
  number: { type: String }
});

const jobSchema = mongoose.Schema({
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  account: { type: String },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerEmail: { type: String },
  service: { type: String, required: true },
  serviceLocation: {
    street: { type: String, required: true, maxlength: 30 },
    city: { type: String, required: true, maxlength: 26 },
    state: { type: String, required: true, maxlength: 2 },
    zip: { type: String, required: true },
    country: { type: String, required: true, default: 'USA' }
  },
  dropoffLocation: {
    street: { type: String, maxlength: 30 },
    city: { type: String, maxlength: 26 },
    state: { type: String, maxlength: 2 },
    zip: { type: String },
    country: { type: String, default: 'USA' }
  },
  vehicle: vehicleSchema,
  classType: { type: String, required: true },
  eta: { type: String, required: true },
  pickupContact: contactSchema, // Required
  dropoffContact: optionalContactSchema, // Optional
  notes: { type: String },
  // Array of user IDs who can view this job
  visibleTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { 
    type: String, 
    enum: [
      'Pending', 
      'Pending Acceptance', // New status for when job is assigned but not accepted
      'In-Progress', 
      'Scheduled', 
      'Completed', 
      'Canceled', 
      'Waiting', 
      'Accepted', 
      'Dispatched', 
      'En Route', 
      'On Site',
      'Awaiting Approval', // For GOA approval workflow
      'Rejected' // For rejected GOA requests or driver rejection
    ], 
    default: 'Pending' 
  },
  payment: { type: Number, default: 0 },
  paymentType: { type: String },
  paymentSubmitted: { type: Boolean, default: false }, // Track if payment has been submitted
  po: { type: String, unique: true }, // Purchase Order number (8-digit number)
  created: { type: String }, // Time displayed in the UI (e.g., "09:45")
  createdAt: { type: Date, default: Date.now }, // Actual timestamp for sorting
  
  // Driver assignment fields
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to the driver user
  driver: { type: String }, // Driver name (for display purposes)
  truck: { type: String }, // Truck assigned to the job
  assignedAt: { type: Date }, // When the job was assigned to a driver
  firstAssignedAt: { type: Date }, // Original assignment time (preserved during redispatch)
  
  // Track previous drivers when job is reassigned
  previousDrivers: [{
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    driverName: { type: String },
    reassignedAt: { type: Date },
    reassignedBy: { type: String }
  }],
  
  // Job acceptance/rejection tracking
  acceptedAt: { type: Date }, // When the job was accepted by the driver
  rejectedAt: { type: Date }, // When the job was rejected by the driver
  rejectionReason: { type: String }, // Reason provided for rejection
  autoRejectAt: { type: Date }, // When the job will be automatically rejected if not accepted
  rejectedBy: [{ // Array to track multiple rejections if job is reassigned
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    driverName: { type: String },
    reason: { type: String },
    timestamp: { type: Date }
  }],
  location: { type: String }, // Alias for serviceLocation for UI compatibility
  createdBy: { type: String, enum: ['user', 'api', 'admin'], default: 'user' }, // Track who created the job
  needsAcceptance: { type: Boolean, default: false }, // Whether job needs to be accepted
  
  // Status timestamps for tracking job progress
  dispatchedAt: { type: Date }, // When the job was dispatched
  enRouteAt: { type: Date }, // When the driver is en route to the job
  onSiteAt: { type: Date }, // When the driver arrived on site
  completedAt: { type: Date }, // When the job was completed
  
  // Status history to track all status changes
  statusHistory: [{
    status: { type: String },
    timestamp: { type: Date, default: Date.now },
    updatedBy: { type: String },
    notes: { type: String } // Additional context about the status change
  }],
  cancellationReason: { type: String }, // Reason for job cancellation
  goaReason: { type: String }, // Reason for GOA request
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }, // GOA approval status
  rejectionReason: { type: String }, // Reason for GOA rejection
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // User who approved/rejected the GOA request
  approvedAt: { type: Date }, // When the GOA request was approved/rejected
});

// Virtual field to ensure backward compatibility
jobSchema.virtual('id').get(function() {
  return this._id.toString();
});

// Ensure virtuals are included when converting to JSON
jobSchema.set('toJSON', { virtuals: true });
jobSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Job', jobSchema);
