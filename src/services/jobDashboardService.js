// jobDashboardService.js
import axios from 'axios';
import { authHeader } from '../utils/jobUtils';

// Fetch current user information
export const fetchCurrentUser = async () => {
  try {
    // Use the correct API endpoint path based on server.js configuration
    const response = await axios.get('/api/v1/users/profile', {
      headers: authHeader()
    });
    
    if (response.data) {
      console.log('Current user fetched successfully:', response.data);
      return response.data;
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    // Try alternative endpoint if the first one fails
    try {
      const altResponse = await axios.get('/api/user/profile', {
        headers: authHeader()
      });
      
      if (altResponse.data) {
        console.log('Current user fetched from alternative endpoint:', altResponse.data);
        return altResponse.data;
      }
    } catch (altError) {
      console.error('Error fetching user profile from alternative endpoint:', altError);
      throw altError;
    }
  }
};

// Fetch jobs based on category
export const fetchJobs = async (jobCategory, currentJobs = []) => {
  try {
    console.log(`Fetching jobs for category: ${jobCategory}`);
    
    // Modify the API endpoint based on jobCategory
    const response = await axios.get(`/api/jobs?category=${jobCategory}`, { 
      headers: authHeader() 
    });
    
    console.log(`Received ${response.data.length} jobs:`, response.data);
    
    // Process jobs to ensure they have the expanded property
    const processedJobs = response.data.map(job => {
      // Find the job in current state if it exists
      const existingJob = currentJobs.find(j => j.id === job.id);
      
      // Preserve expanded state if the job already exists in our state
      // Otherwise initialize as collapsed
      const expanded = existingJob ? existingJob.expanded : false;
      
      let createdDisplay;
      
      // Check if createdAt exists and is a valid date
      if (job.createdAt && !isNaN(new Date(job.createdAt).getTime())) {
        const createdDate = new Date(job.createdAt);
        const today = new Date();
        
        // Compare year, month, and day to determine if it's today
        const isCreatedToday = 
          createdDate.getFullYear() === today.getFullYear() &&
          createdDate.getMonth() === today.getMonth() &&
          createdDate.getDate() === today.getDate();
        
        if (isCreatedToday) {
          // If created today, show time
          createdDisplay = createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
          // If created on a different day, show date
          createdDisplay = createdDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
        }
      } else {
        // Fallback to the existing created field or 'Unknown'
        createdDisplay = job.created || 'Unknown';
      }
      
      return {
        ...job,
        expanded,
        created: createdDisplay
      };
    });
    
    return processedJobs;
  } catch (err) {
    console.error('Error fetching jobs:', err);
    throw err;
  }
};

// Fetch drivers
export const fetchDrivers = async () => {
  try {
    // Only fetch drivers who are on duty
    const response = await axios.get('/api/drivers?isOnDuty=true', { 
      headers: authHeader() 
    });
    
    return response.data;
  } catch (err) {
    console.error('Error fetching drivers:', err);
    throw err;
  }
};

// Accept job
export const acceptJob = async (jobId, etaValue) => {
  try {
    // Use the specific accept endpoint with the ETA
    const response = await axios.put(`/api/jobs/${jobId}/accept`, {
      eta: etaValue
    }, {
      headers: authHeader()
    });
    
    return response.data;
  } catch (error) {
    console.error('Error accepting job:', error);
    throw error;
  }
};

// Direct accept job (without showing ETA dialog)
export const directAcceptJob = async (jobId) => {
  try {
    // Accept the job with the existing ETA
    const response = await axios.put(`/api/jobs/${jobId}/accept`, {}, {
      headers: authHeader()
    });
    
    return response.data;
  } catch (error) {
    console.error('Error accepting job:', error);
    throw error;
  }
};

// Reject job with reason
export const rejectJob = async (jobId, rejectionReason) => {
  try {
    console.log(`Rejecting job ${jobId} with reason: ${rejectionReason}`);
    
    // Use the dedicated reject endpoint instead of the general status endpoint
    const response = await axios.put(`/api/jobs/${jobId}/reject`, { 
      rejectionReason
    }, {
      headers: authHeader()
    });
    
    console.log(`Job ${jobId} rejected successfully:`, response.data);
    return response.data;
  } catch (error) {
    console.error('Error rejecting job:', error);
    console.error('Error details:', error.response?.data || error.message);
    throw error;
  }
};

// Assign driver and truck to job
export const assignDriverAndTruck = async (jobId, driverId, truck, preserveAssignedAt = false, originalAssignedAt = null) => {
  try {
    // Prepare request data
    const requestData = {
      driverId,
      truck
    };
    
    // If this is a redispatch, preserve the original assignedAt time
    if (preserveAssignedAt && originalAssignedAt) {
      requestData.preserveAssignedAt = true;
      requestData.originalAssignedAt = originalAssignedAt;
    }
    
    // Update job on the server
    const response = await axios.put(`/api/jobs/${jobId}/assign`, requestData, {
      headers: authHeader()
    });
    
    return response.data;
  } catch (error) {
    console.error('Error assigning driver and truck:', error);
    throw error;
  }
};

// Update job status
export const updateJobStatus = async (jobId, status) => {
  try {
    // Update job status on the server using the dedicated status endpoint
    const response = await axios.put(`/api/jobs/${jobId}/status`, {
      status
    }, {
      headers: authHeader()
    });
    
    return response.data;
  } catch (error) {
    console.error('Error updating job status:', error);
    throw error;
  }
};

// Cancel job with reason
export const cancelJob = async (jobId, cancellationReason) => {
  try {
    // Update job status on the server using the dedicated status endpoint
    const response = await axios.put(`/api/jobs/${jobId}/status`, {
      status: 'Canceled',
      cancellationReason
    }, {
      headers: authHeader()
    });
    
    return response.data;
  } catch (error) {
    console.error('Error canceling job:', error);
    throw error;
  }
};

// Mark job as GOA with reason
export const markJobAsGOA = async (jobId, goaReason) => {
  try {
    // Update job status on the server using the dedicated status endpoint
    const response = await axios.put(`/api/jobs/${jobId}/status`, {
      status: 'Awaiting Approval',
      goaReason
    }, {
      headers: authHeader()
    });
    
    return response.data;
  } catch (error) {
    console.error('Error marking job as GOA:', error);
    throw error;
  }
};

// Report job as unsuccessful with reason
export const reportJobUnsuccessful = async (jobId, unsuccessfulReason) => {
  try {
    // Use the dedicated unsuccessful endpoint
    const response = await axios.put(`/api/jobs/${jobId}/unsuccessful`, {
      unsuccessfulReason
    }, {
      headers: authHeader()
    });
    
    console.log(`Job ${jobId} marked as unsuccessful with reason: ${unsuccessfulReason}`);
    return response.data;
  } catch (error) {
    console.error('Error marking job as unsuccessful:', error);
    throw error;
  }
};

// Approve unsuccessful request
export const approveUnsuccessfulJob = async (jobId) => {
  try {
    // Use the dedicated approve unsuccessful endpoint
    const response = await axios.put(`/api/jobs/${jobId}/unsuccessful/approve`, {}, {
      headers: authHeader()
    });
    
    console.log(`Unsuccessful request for job ${jobId} approved successfully`);
    return response.data;
  } catch (error) {
    console.error('Error approving unsuccessful request:', error);
    throw error;
  }
};

// Deny unsuccessful request
export const denyUnsuccessfulJob = async (jobId) => {
  try {
    // Use the dedicated deny unsuccessful endpoint
    const response = await axios.put(`/api/jobs/${jobId}/unsuccessful/deny`, {}, {
      headers: authHeader()
    });
    
    console.log(`Unsuccessful request for job ${jobId} denied successfully`);
    return response.data;
  } catch (error) {
    console.error('Error denying unsuccessful request:', error);
    throw error;
  }
};

// Approve GOA request
export const approveGOA = async (jobId) => {
  try {
    // Use the dedicated approve GOA endpoint
    const response = await axios.put(`/api/jobs/${jobId}/goa/approve`, {}, {
      headers: authHeader()
    });
    
    console.log(`GOA request for job ${jobId} approved successfully`);
    return response.data;
  } catch (error) {
    console.error('Error approving GOA request:', error);
    throw error;
  }
};

// Deny GOA request
export const denyGOA = async (jobId) => {
  try {
    // Use the dedicated deny GOA endpoint
    const response = await axios.put(`/api/jobs/${jobId}/goa/deny`, {}, {
      headers: authHeader()
    });
    
    console.log(`GOA request for job ${jobId} denied successfully`);
    return response.data;
  } catch (error) {
    console.error('Error denying GOA request:', error);
    throw error;
  }
};

// Update job ETA
export const updateETA = async (jobId, newEtaValue) => {
  try {
    // Update job ETA on the server using the main endpoint
    // We use the main endpoint here because ETA is a job detail, not a status
    const response = await axios.put(`/api/jobs/${jobId}`, {
      eta: newEtaValue
    }, {
      headers: authHeader()
    });
    
    console.log(`Updated ETA for job ${jobId} to ${newEtaValue} minutes`);
    return response.data;
  } catch (error) {
    console.error('Error updating job ETA:', error);
    throw error;
  }
};

// Update job ETA only (using dedicated endpoint)
export const updateJobETA = async (jobId, newEtaValue) => {
  try {
    // Update job ETA on the server using the dedicated ETA endpoint
    // This endpoint only updates the ETA and doesn't trigger re-acceptance
    const response = await axios.put(`/api/jobs/${jobId}/eta`, {
      eta: newEtaValue
    }, {
      headers: authHeader()
    });
    
    console.log(`Updated ETA for job ${jobId} to ${newEtaValue} minutes using dedicated endpoint`);
    return response.data;
  } catch (error) {
    console.error('Error updating job ETA:', error);
    throw error;
  }
};

// Delete job permanently
export const deleteJob = async (jobId) => {
  try {
    // Delete job on the server
    const response = await axios.delete(`/api/jobs/${jobId}`, {
      headers: authHeader()
    });
    
    console.log(`Job ${jobId} deleted successfully:`, response.data);
    return response.data;
  } catch (error) {
    console.error('Error deleting job:', error);
    throw error;
  }
};

// Duplicate job
export const duplicateJob = async (jobId) => {
  try {
    // Duplicate job on the server
    const response = await axios.post(`/api/jobs/${jobId}/duplicate`, {}, {
      headers: authHeader()
    });
    
    console.log(`Job ${jobId} duplicated successfully:`, response.data);
    return response.data;
  } catch (error) {
    console.error('Error duplicating job:', error);
    throw error;
  }
};

// Process jobUpdated event for real-time job updates
export const processJobUpdate = (updatedJob, existingJobs) => {
  if (!updatedJob) return existingJobs;
  
  let createdDisplay;
  
  // Check if createdAt exists and is a valid date
  if (updatedJob.createdAt && !isNaN(new Date(updatedJob.createdAt).getTime())) {
    const createdDate = new Date(updatedJob.createdAt);
    const today = new Date();
    
    // Compare year, month, and day to determine if it's today
    const isCreatedToday = 
      createdDate.getFullYear() === today.getFullYear() &&
      createdDate.getMonth() === today.getMonth() &&
      createdDate.getDate() === today.getDate();
    
    if (isCreatedToday) {
      // If created today, show time
      createdDisplay = createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      // If created on a different day, show date
      createdDisplay = createdDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }
  } else {
    // Fallback to the existing created field or 'Unknown'
    createdDisplay = updatedJob.created || 'Unknown';
  }
  
  // Create a processed job object with the expanded property preserved
  const processedJob = {
    ...updatedJob,
    // Preserve expanded state if the job already exists in our state
    expanded: existingJobs.find(job => job.id === updatedJob.id)?.expanded || false,
    created: createdDisplay
  };
  
  // Check if the job already exists in the array
  const jobExists = existingJobs.some(job => job.id === updatedJob.id);
  
  if (jobExists) {
    // Update the existing job
    return existingJobs.map(job => 
      job.id === updatedJob.id ? processedJob : job
    );
  } else {
    // Add the new job to the array
    return [...existingJobs, processedJob];
  }
};
