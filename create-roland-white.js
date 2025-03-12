// create-roland-white.js
// This script creates an Owner user account for Roland White

const axios = require('axios');
const crypto = require('crypto');

// API URL
const API_URL = 'http://localhost:5001/api/auth/register';

// Generate a secure password
function generateSecurePassword() {
  // Generate a random base
  const randomBase = crypto.randomBytes(8).toString('hex');
  
  // Ensure it has uppercase, lowercase, number, and special character
  const password = `${randomBase.slice(0, 4)}Wk${randomBase.slice(4, 8)}!2`;
  
  return password;
}

// Define all available pages and actions
const allPages = [
  'Dashboard',
  'Submissions',
  'Regions',
  'Settings',
  'Payments',
  'Users',
  'Performance'
];

const allActions = [
  'create_user',
  'edit_user',
  'delete_user',
  'create_job',
  'edit_job',
  'delete_job',
  'assign_job',
  'view_reports',
  'manage_settings',
  'manage_regions'
];

// Function to create owner account
async function createRolandWhiteAccount() {
  try {
    console.log('Creating Owner account for Roland White...');
    
    // Generate password
    const password = generateSecurePassword();
    
    // Create user data
    const userData = {
      firstName: 'Roland',
      lastName: 'White',
      phone: '3189902159',
      email: 'roland.white@wkroadss.com',
      username: 'd6367734',
      password: password,
      primaryRole: 'OW', // Owner role
      secondaryRoles: {
        admin: true,
        dispatcher: false,
        answeringService: false,
        driver: false
      },
      vendorNumber: 'OWNER' + Date.now().toString().slice(-8),
      companyName: 'White Knight Roadside Motor Club',
      address: {
        country: 'US',
        street1: '123 Main St',
        city: 'Anytown',
        state: 'TX',
        zip: '12345'
      },
      isFirstLogin: true,
      permissions: {
        pages: allPages,
        actions: allActions
      },
      // Legacy fields for backward compatibility
      vendorId: 'OWNER' + Date.now().toString().slice(-8),
      ownerFirstName: 'Roland',
      ownerLastName: 'White',
      facilityCountry: 'US',
      facilityAddress1: '123 Main St',
      facilityCity: 'Anytown',
      facilityState: 'TX',
      facilityZip: '12345',
      territories: {
        zipCodes: ['12345']
      },
      role: 'OW'
    };
    
    // Send request to create user
    const response = await axios.post(API_URL, userData);
    
    console.log('\n✅ Owner account created successfully!\n');
    console.log('Use the following credentials to log in:');
    console.log('----------------------------------------');
    console.log(`Username: ${userData.username}`);
    console.log(`Email:    ${userData.email}`);
    console.log(`Password: ${password}`);
    console.log('----------------------------------------');
    console.log('\nYou will be prompted to change your password on first login.');
    console.log('Please keep these credentials in a safe place.');
    
  } catch (error) {
    if (error.response && error.response.data) {
      console.error('❌ Error creating Owner account:', error.response.data.message || error.response.data);
      if (error.response.data.errors) {
        console.error('Validation errors:', error.response.data.errors);
      }
    } else {
      console.error('❌ Error creating Owner account:', error.message);
      console.error('Make sure the backend server is running on port 5001.');
    }
  }
}

// Execute the function
createRolandWhiteAccount();
