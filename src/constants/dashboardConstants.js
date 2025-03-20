// dashboardConstants.js
// Constants for the dashboard

/**
 * Location types array
 */
export const locationTypes = [
  'Residence',
  'Blocking Traffic',
  'Business',
  'Collision Center',
  'Dealership',
  'Highway',
  'Intersection',
  'Local Roadside',
  'Parking Garage',
  'Parking Lot',
  'Point of Interest',
  'Storage Facility'
];

/**
 * Services array
 */
export const serviceOptions = [
  'ASAP Transport',
  'Accident Tow',
  'Battery Jump',
  'EV Mobile Charge',
  'Fuel Delivery',
  'Impound',
  'Info Call',
  'Lock Out',
  'Locksmith',
  'Mobile Battery Delivery (Not-live)',
  'Mobile Cab Service',
  'Mobile Cargo Service',
  'Mobile Engine Service',
  'Mobile Exhaust Service',
  'Mobile Tire Delivery',
  'Mobile Tire Service',
  'Other',
  'Parts Delivery + 1hr Labor',
  'Recall 1',
  'Recovery',
  'Reimbursement - Emergency Trip Expense',
  'Reimbursement - Key Services',
  'Repo',
  'Reunite',
  'Secondary Tow',
  'Service Avoidance',
  'Storage (Deprecated)',
  'Technical Assistance Failure',
  'Technical Assistance Sucess',
  'Tire Change',
  'Tow',
  'Transport',
  'Trip Routing',
  'Winch Out'
];

/**
 * Class types array
 */
export const classTypeOptions = [
  'Flatbed',
  'Wheel Lift',
  'Light Duty',
  'Medium Duty',
  'Heavy Duty',
  'Super Heavy',
  'Service Truck',
  'Covered Flatbed',
  'Flatbed + Straps'
];

/**
 * Scheduled time options
 */
export const scheduledTimeOptions = [
  'ASAP',
  'Today',
  'Tomorrow',
  'This Week',
  'Next Week',
  'This Month',
  'Custom Date/Time'
];

/**
 * Default job data
 */
export const defaultJobData = {
  // Customer section
  account: '',
  paymentType: '',
  po: '',
  callerName: '',
  callerPhone: '',
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  
  // Vehicle section
  vin: '',
  make: '',
  model: '',
  year: '',
  color: '',
  license: '',
  odometer: '',
  
  // Service section
  serviceTime: 'ASAP', // ASAP or Scheduled
  eta: '',
  scheduledDate: '',
  scheduledTime: '',
  service: '',
  classType: '',
  driverAssigned: '',
  truckAssigned: '',
  
  // Location section
  serviceLocationType: '',
  serviceLocation: {
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'USA'
  },
  dropoffLocationType: '',
  dropoffLocation: {
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'USA'
  },
  
  // Notes
  notes: '',
  
  // Contacts
  pickupContact: {
    name: '',
    number: ''
  },
  dropoffContact: {
    name: '',
    number: ''
  }
};
