const mongoose = require('mongoose');

const FacilitySchema = new mongoose.Schema({
  applicationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Application', 
    required: true 
  },
  facilityName: { 
    type: String, 
    required: true 
  },
  address1: { 
    type: String, 
    required: true 
  },
  address2: { 
    type: String 
  },
  city: { 
    type: String, 
    required: true 
  },
  state: { 
    type: String, 
    required: true 
  },
  zip: { 
    type: String, 
    required: true 
  },
  coveredZipCodes: [{ 
    type: String 
  }],
  contactName: { 
    type: String 
  },
  contactPhone: { 
    type: String 
  },
  contactEmail: {
    type: String
  },
  // NEW schedule object
  schedule: {
    open247: { type: Boolean, default: false },
    sameEveryDay: { type: Boolean, default: false },
    sameTimeSelectedDays: { type: Boolean, default: false }, // Field for the feature
    everyDayOpen: { type: String, default: '' },
    everyDayClose: { type: String, default: '' },
    days: {
      monday: { isOpen: { type: Boolean, default: false }, open: { type: String, default: '' }, close: { type: String, default: '' } },
      tuesday: { isOpen: { type: Boolean, default: false }, open: { type: String, default: '' }, close: { type: String, default: '' } },
      wednesday: { isOpen: { type: Boolean, default: false }, open: { type: String, default: '' }, close: { type: String, default: '' } },
      thursday: { isOpen: { type: Boolean, default: false }, open: { type: String, default: '' }, close: { type: String, default: '' } },
      friday: { isOpen: { type: Boolean, default: false }, open: { type: String, default: '' }, close: { type: String, default: '' } },
      saturday: { isOpen: { type: Boolean, default: false }, open: { type: String, default: '' }, close: { type: String, default: '' } },
      sunday: { isOpen: { type: Boolean, default: false }, open: { type: String, default: '' }, close: { type: String, default: '' } }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now 
  }
});

module.exports = mongoose.model('Facility', FacilitySchema);
