// jobService.js
// Service for job-related API calls

import axios from 'axios';

/**
 * Helper function to get auth headers
 * @returns {Object} Auth headers
 */
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

/**
 * Create a new job
 * @param {Object} jobData Job data to create
 * @returns {Promise<Object>} API response
 */
export const createJob = async (jobData) => {
  try {
    const response = await axios.post('/api/jobs', jobData, {
      headers: getAuthHeader()
    });
    
    return {
      success: true,
      message: 'Job created successfully',
      data: response.data
    };
  } catch (error) {
    console.error('Error creating job:', error);
    
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to create job',
      error
    };
  }
};

/**
 * Update an existing job
 * @param {string} jobId Job ID to update
 * @param {Object} jobData Job data to update
 * @returns {Promise<Object>} API response
 */
export const updateJob = async (jobId, jobData) => {
  try {
    const response = await axios.put(`/api/jobs/${jobId}`, jobData, {
      headers: getAuthHeader()
    });
    
    return {
      success: true,
      message: response.data.message || 'Job updated successfully',
      data: response.data
    };
  } catch (error) {
    console.error('Error updating job:', error);
    
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to update job',
      error
    };
  }
};

/**
 * Get default demo job data
 * @returns {Object} Default demo job data
 */
export const getDefaultDemoJob = () => {
  return {
    service: 'Demo Service',
    serviceLocationType: 'Residence',
    serviceLocation: {
      street: '123 Demo St',
      city: 'Demo City',
      state: 'TX',
      zip: '75001',
      country: 'USA'
    },
    dropoffLocationType: 'Business',
    dropoffLocation: {
      street: '456 Demo Ave',
      city: 'Demo City',
      state: 'TX',
      zip: '75001',
      country: 'USA'
    },
    account: 'Demo Account',
    customerName: 'John Doe',
    customerPhone: '123-456-7890',
    status: 'Pending',
    vehicle: {
      make: 'Toyota',
      model: 'Camry',
      year: '2022',
      color: 'Silver'
    },
    pickupContact: {
      name: 'John Doe',
      number: '123-456-7890'
    }
  };
};

/**
 * Create a demo job
 * @param {Object} demoJob Demo job data
 * @returns {Promise<Object>} API response
 */
export const createDemoJob = async (demoJob) => {
  try {
    const response = await axios.post('/api/jobs/demo', demoJob, {
      headers: getAuthHeader()
    });
    
    return {
      success: true,
      message: 'Demo job created successfully',
      data: response.data
    };
  } catch (error) {
    console.error('Error creating demo job:', error);
    
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to create demo job',
      error
    };
  }
};

/**
 * Get jobs by category
 * @param {string} category Job category (scheduled, pending, inProgress, completed, canceled)
 * @returns {Promise<Object>} API response
 */
export const getJobsByCategory = async (category) => {
  try {
    const response = await axios.get(`/api/jobs/category/${category}`, {
      headers: getAuthHeader()
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error(`Error fetching ${category} jobs:`, error);
    
    return {
      success: false,
      message: error.response?.data?.message || `Failed to fetch ${category} jobs`,
      error
    };
  }
};

/**
 * Accept a job
 * @param {string} jobId Job ID to accept
 * @returns {Promise<Object>} API response
 */
export const acceptJob = async (jobId) => {
  try {
    const response = await axios.post(`/api/jobs/${jobId}/accept`, {}, {
      headers: getAuthHeader()
    });
    
    return {
      success: true,
      message: response.data.message || 'Job accepted successfully',
      data: response.data
    };
  } catch (error) {
    console.error('Error accepting job:', error);
    
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to accept job',
      error
    };
  }
};

/**
 * Decline a job
 * @param {string} jobId Job ID to decline
 * @param {string} reason Reason for declining
 * @returns {Promise<Object>} API response
 */
export const declineJob = async (jobId, reason) => {
  try {
    const response = await axios.post(`/api/jobs/${jobId}/decline`, { reason }, {
      headers: getAuthHeader()
    });
    
    return {
      success: true,
      message: response.data.message || 'Job declined successfully',
      data: response.data
    };
  } catch (error) {
    console.error('Error declining job:', error);
    
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to decline job',
      error
    };
  }
};

/**
 * Cancel a job
 * @param {string} jobId Job ID to cancel
 * @param {string} reason Reason for cancellation
 * @returns {Promise<Object>} API response
 */
export const cancelJob = async (jobId, reason) => {
  try {
    const response = await axios.post(`/api/jobs/${jobId}/cancel`, { reason }, {
      headers: getAuthHeader()
    });
    
    return {
      success: true,
      message: response.data.message || 'Job canceled successfully',
      data: response.data
    };
  } catch (error) {
    console.error('Error canceling job:', error);
    
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to cancel job',
      error
    };
  }
};

/**
 * Complete a job
 * @param {string} jobId Job ID to complete
 * @param {Object} completionData Completion data
 * @returns {Promise<Object>} API response
 */
export const completeJob = async (jobId, completionData) => {
  try {
    const response = await axios.post(`/api/jobs/${jobId}/complete`, completionData, {
      headers: getAuthHeader()
    });
    
    return {
      success: true,
      message: response.data.message || 'Job completed successfully',
      data: response.data
    };
  } catch (error) {
    console.error('Error completing job:', error);
    
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to complete job',
      error
    };
  }
};

/**
 * Start a job
 * @param {string} jobId Job ID to start
 * @returns {Promise<Object>} API response
 */
export const startJob = async (jobId) => {
  try {
    const response = await axios.post(`/api/jobs/${jobId}/start`, {}, {
      headers: getAuthHeader()
    });
    
    return {
      success: true,
      message: response.data.message || 'Job started successfully',
      data: response.data
    };
  } catch (error) {
    console.error('Error starting job:', error);
    
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to start job',
      error
    };
  }
};

/**
 * Arrive at job location
 * @param {string} jobId Job ID
 * @returns {Promise<Object>} API response
 */
export const arriveAtJob = async (jobId) => {
  try {
    const response = await axios.post(`/api/jobs/${jobId}/arrive`, {}, {
      headers: getAuthHeader()
    });
    
    return {
      success: true,
      message: response.data.message || 'Arrival recorded successfully',
      data: response.data
    };
  } catch (error) {
    console.error('Error recording arrival:', error);
    
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to record arrival',
      error
    };
  }
};
