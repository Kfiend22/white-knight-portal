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
    open247: String,
    hoursOfOperation: String,
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
  signature: String,
  employees: Number,
  backgroundCheckPath: String,
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
    electricVehicleExp: String,
    digitalDispatch: String,
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
});

module.exports = mongoose.model('Application', ApplicationSchema);
