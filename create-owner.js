// create-owner.js
// This script creates an Owner user account for the White Knight Portal

const axios = require('axios');

// API URL
const API_URL = 'http://localhost:5000/api/auth/create-owner';

// Function to create owner account
async function createOwnerAccount() {
  try {
    console.log('Creating Owner account...');
    
    const response = await axios.post(API_URL);
    
    console.log('\n✅ Owner account created successfully!\n');
    console.log('Use the following credentials to log in:');
    console.log('----------------------------------------');
    console.log(`Username: ${response.data.credentials.username}`);
    console.log(`Email:    ${response.data.credentials.email}`);
    console.log(`Password: ${response.data.credentials.password}`);
    console.log('----------------------------------------');
    console.log('\nYou will be prompted to change your password on first login.');
    console.log('Please keep these credentials in a safe place.');
    
  } catch (error) {
    if (error.response && error.response.data) {
      console.error('❌ Error creating Owner account:', error.response.data.message);
    } else {
      console.error('❌ Error creating Owner account:', error.message);
      console.error('Make sure the backend server is running on port 5000.');
    }
  }
}

// Execute the function
createOwnerAccount();
