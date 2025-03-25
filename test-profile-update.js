// test-profile-update.js
// A simple script to test the profile update functionality

const axios = require('axios');
const FormData = require('form-data');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt for input
const prompt = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

// Main function
async function testProfileUpdate() {
  try {
    console.log('=== Profile Update Test ===');
    
    // Get JWT token
    const token = await prompt('Enter your JWT token: ');
    if (!token) {
      console.error('Token is required');
      return;
    }
    
    // First, get the current profile
    console.log('\nFetching current profile...');
    const profileResponse = await axios.get('http://localhost:3001/api/v1/users/profile', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    const currentProfile = profileResponse.data;
    console.log('\nCurrent Profile:');
    console.log(JSON.stringify(currentProfile, null, 2));
    
    // Prepare update data
    const formData = new FormData();
    formData.append('firstName', currentProfile.firstName);
    formData.append('lastName', currentProfile.lastName);
    formData.append('username', currentProfile.username);
    formData.append('phoneNumber', currentProfile.phoneNumber || '');
    
    // Add notification preferences
    formData.append('receiveEmailNotifications', currentProfile.receiveEmailNotifications || false);
    formData.append('receiveTextNotifications', currentProfile.receiveTextNotifications || false);
    formData.append('notifyOnNewJob', currentProfile.notifyOnNewJob || false);
    formData.append('notifyOnJobCanceled', currentProfile.notifyOnJobCanceled || false);
    formData.append('notifyOnJobOnScene', currentProfile.notifyOnJobOnScene || false);
    formData.append('notifyOnJobReassigned', currentProfile.notifyOnJobReassigned || false);
    formData.append('notifyOnJobMarkedAsGOA', currentProfile.notifyOnJobMarkedAsGOA || false);
    
    // Update the profile
    console.log('\nUpdating profile...');
    const updateResponse = await axios.put('http://localhost:3001/api/v1/users/profile', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...formData.getHeaders()
      }
    });
    
    console.log('\nUpdate Response:');
    console.log(JSON.stringify(updateResponse.data, null, 2));
    
    console.log('\nProfile update test completed successfully!');
  } catch (error) {
    console.error('\nError:');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
    console.error('Error config:', error.config);
  } finally {
    rl.close();
  }
}

// Run the test
testProfileUpdate();
