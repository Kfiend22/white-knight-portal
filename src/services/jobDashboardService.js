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
export const fetchJobs = async (jobCategory) => {
  try {
    console.log(`Fetching jobs for category: ${jobCategory}`);
    
    // Modify the API endpoint based on jobCategory
    const response = await axios.get(`/api/jobs?category=${jobCategory}`, { 
      headers: authHeader() 
    });
    
    console.log(`Received ${response.data.length} jobs:`, response.data);
    
    // Process jobs to ensure they have the expanded property
    const processedJobs = response.data.map(job => {
      // Preserve expanded state if the job already exists in our state
      const expanded = false; // Initially collapsed
      
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
    // Update job status on the server with rejection reason
    // Change status back to 'Pending'
    const response = await axios.put(`/api/jobs/${jobId}`, { 
      status: 'Pending',
      rejectionReason
    }, {
      headers: authHeader()
    });
    
    return response.data;
  } catch (error) {
    console.error('Error rejecting job:', error);
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
    // Update job status on the server
    const response = await axios.put(`/api/jobs/${jobId}`, {
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
    // Update job status on the server
    const response = await axios.put(`/api/jobs/${jobId}`, {
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
    // Update job status on the server
    const response = await axios.put(`/api/jobs/${jobId}`, {
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
  
  // Update the jobs by replacing the updated job or adding it if it's new
  return existingJobs.map(job => 
    job.id === updatedJob.id ? processedJob : job
  );
};
