// models/Application.js
const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  step: {
    type: Number,
    default: 0
  },
  companyName: {
    type: String,
    default: '',
    required: true,
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
  email: { type: String, unique: true,  required: true },
  country: String,
  phoneCountryCode: String,
  phoneNumber: String,
  facilityCountry: String,
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
  billingSame: String,
  billingAddress: {
    country: String,
    address1: String,
    address2: String,
    city: String,
    state: String,
    zip: String,
  },
  services: {
    roadOnly: Boolean,
    lightDuty: Boolean,
    mediumDuty: Boolean,
    heavyDuty: Boolean,
    mobileMechanic: Boolean,
    mediumHeavyTire: Boolean,
    accidentSceneTowing: Boolean,
    secondaryTow: Boolean,
    storageFacility: Boolean,

    // Updated hours/schedule structure
    open247: { // Changed from String to Boolean
      type: Boolean,
      default: false
    },
    // hoursOfOperation: String, // REMOVED

    // NEW schedule object
    schedule: {
      sameEveryDay: {
        type: Boolean,
        default: false
      },
      everyDayOpen: {
        type: String, // Consider validation for HH:MM format if needed
        default: ''
      },
      everyDayClose: {
        type: String, // Consider validation for HH:MM format if needed
        default: ''
      },
      sameTimeSelectedDays: { // Added for the feature
        type: Boolean,
        default: false
      },
      selectedDaysOpen: { // Added to store common open time for selected days
        type: String,
        default: ''
      },
      selectedDaysClose: { // Added to store common close time for selected days
        type: String,
        default: ''
      },
      days: {
        monday: { isOpen: { type: Boolean, default: false }, open: { type: String, default: '' }, close: { type: String, default: '' } },
        tuesday: { isOpen: { type: Boolean, default: false }, open: { type: String, default: '' }, close: { type: String, default: '' } },
        wednesday: { isOpen: { type: Boolean, default: false }, open: { type: String, default: '' }, close: { type: String, default: '' } },
        thursday: { isOpen: { type: Boolean, default: false }, open: { type: String, default: '' }, close: { type: String, default: '' } },
        friday: { isOpen: { type: Boolean, default: false }, open: { type: String, default: '' }, close: { type: String, default: '' } },
        saturday: { isOpen: { type: Boolean, default: false }, open: { type: String, default: '' }, close: { type: String, default: '' } },
        sunday: { isOpen: { type: Boolean, default: false }, open: { type: String, default: '' }, close: { type: String, default: '' } }
      }
    }
  },
  territories: {
    zipCodes: {
      type: [String], // An array of strings
      default: [],
      required: true,
    }
  },
  w9Path: String,
  w9Address: String,
  backupWithholding: Boolean,
  w9: {
    nameOnW9: String,
    businessName: String,
    tin: String,
    taxClassification: String,
    federalTaxClassification: {
      individualSoleProprietor: Boolean,
      cCorporation: Boolean,
      sCorporation: Boolean,
      partnership: Boolean,
      trustEstate: Boolean,
      llc: Boolean,
      llcTaxClassification: String,
      other: Boolean,
      otherDetails: String
    },
    exemptPayeeCode: String,
    exemptFATCACode: String,
    address: String,
    city: String,
    state: String,
    zipCode: String,
    accountNumbers: String,
    certification: Boolean,
    signatureDate: Date,
    dateSubmitted: Date
  },
  signature: String,
  employees: Number,
  // backgroundCheckPath: String, // Replaced by backgroundCheck object below
  backgroundCheck: {
    path: { type: String, default: '' }, // Renamed from backgroundCheckPath
    status: { 
      type: String, 
      enum: ['Not Started', 'Requested', 'Pending', 'Approved', 'Denied', 'Error'], 
      default: 'Not Started' 
    },
    dateRequested: { type: Date },
    dateCompleted: { type: Date },
    provider: { type: String, default: '' },
    notes: { type: String, default: '' }
  },
  insurance: {
    coiPath: String,
    agency: String,
    policyNumber: String,
    agentName: String,
    agentPhone: String,
    agentFax: String,
    agentEmail: String,
    policyExpiration: Date,
  },
  businessInfo: {
    yearsInBusiness: String,
    electricVehicleExp: String, // 'yes' or 'no'
    digitalDispatch: String, // 'yes' or 'no'
    dispatchSoftware: String, // Name of the software used, if digitalDispatch is 'yes'
    otherMotorclubServices: String, // 'yes' or 'no'
    otherMotorclubsList: String, // Comma-separated list or free text
  },
  ownership: {
    familyOwned: Boolean,
    womenOwned: Boolean,
    minorityOwned: Boolean,
    veteranOwned: Boolean,
    lgbtqOwned: Boolean,
    smallBusiness: Boolean,
    disadvantagedBusiness: Boolean,
  },
  termsAgreement: Boolean,
  codeOfConductAgreement: Boolean,
  createdAt: { type: Date, default: Date.now },
  
  // Application status and approval fields
  status: {
    type: String,
    enum: ['pending', 'in-review', 'approved', 'denied'],
    default: 'pending'
  },
  vendorId: {
    type: String,
    unique: true,
    sparse: true // Allows multiple null values
  },
  approvalDate: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Document request tracking
  w9RequestDate: {
    type: Date
  },
  coiRequestDate: {
    type: Date
  },
  
  // Rate sheet tracking
  rateSheetPath: {
    type: String
  },
  rateSheetSentDate: {
    type: Date
  }
  
  // Note: Facilities are now in a separate collection and linked via 'applicationId' in the Facility model.
  // The 'facilities' array below is deprecated and should be removed after data migration.
  // facilities: [ ... old embedded schema ... ] 
});

// Add index for faster searches
ApplicationSchema.index({ companyName: 'text', ownerFirstName: 'text', ownerLastName: 'text', email: 'text' });

module.exports = mongoose.model('Application', ApplicationSchema);
