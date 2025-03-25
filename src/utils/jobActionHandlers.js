import * as jobService from '../services/jobDashboardService';
import { isDriverOnlyUser, trackAssignedJob } from './jobUtils';
import { canChangeJobStatus, getUserPermissions } from './authUtils';

/**
 * Handlers for job actions (accept, reject, dispatch, etc.)
 */

// Accept job handler
export const handleAcceptJob = (job, setSelectedJob, setEtaDialogOpen, handleDirectAccept) => {
  setSelectedJob(job);
  
  // Check if the job already has an ETA
  if (job.eta && job.eta !== '') {
    // If job already has an ETA, accept it directly without showing the dialog
    handleDirectAccept(job);
  } else {
    // If no ETA, show the dialog to get one
    setEtaDialogOpen(true);
  }
};

// Direct accept without showing ETA dialog
export const handleDirectAccept = async (job, setLoading, refreshJobs) => {
  setLoading(true);
  
  try {
    // Accept the job with the existing ETA
    await jobService.directAcceptJob(job.id);
    
    // Also track this in localStorage for persistence
    const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}');
    if (currentUser && currentUser.id) {
      trackAssignedJob(job.id, currentUser.id);
    }
    
    // Refresh the jobs list
    refreshJobs();
    
  } catch (error) {
    console.error('Error accepting job:', error);
    alert('Failed to accept job. Please try again.');
  } finally {
    setLoading(false);
  }
};

// Save ETA selection and accept job
export const handleEtaDialogSave = async (etaValue, selectedJob, setLoading, refreshJobs, setEtaDialogOpen, setSelectedJob) => {
  setLoading(true);
  
  try {
    // Use the jobService to accept the job with the selected ETA
    await jobService.acceptJob(selectedJob.id, etaValue);
    
    // Also track this in localStorage for persistence
    const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}');
    if (currentUser && currentUser.id) {
      trackAssignedJob(selectedJob.id, currentUser.id);
    }
    
    // Refresh jobs to get the updated data
    refreshJobs();
    
    // Close the dialog
    setEtaDialogOpen(false);
    setSelectedJob(null);
  } catch (error) {
    console.error('Error updating job:', error);
    alert('Failed to update job. Please try again.');
  } finally {
    setLoading(false);
  }
};

// Reject job handler
export const handleRejectJob = (jobId, jobs, setJobToReject, setRejectDialogOpen) => {
  // Find the job to reject
  const job = jobs.find(j => j.id === jobId);
  if (!job) {
    console.error('Job not found for rejection');
    return;
  }
  
  // Set the job to reject and open the rejection dialog
  setJobToReject(job);
  setRejectDialogOpen(true);
};

// Submit job rejection with reason
export const handleSubmitRejection = async (jobToReject, rejectionReason, setLoading, refreshJobs, setRejectDialogOpen, setJobToReject) => {
  if (!jobToReject) {
    console.error('No job selected for rejection');
    alert('Error: No job selected for rejection');
    setRejectDialogOpen(false);
    return;
  }

  // Store the job ID in a local variable
  const jobId = jobToReject.id;
  
  setLoading(true);
  
  try {
    // Use the jobService to reject the job
    await jobService.rejectJob(jobId, rejectionReason);

    // Close dialog and refresh jobs
    setRejectDialogOpen(false);
    setJobToReject(null);
    refreshJobs();

  } catch (error) {
    console.error('Error rejecting job:', error);
    alert('Failed to reject job. Please try again.');
  } finally {
    setLoading(false);
  }
};

// Dispatch job handler
export const handleDispatchJob = (job, setSelectedJob, setDispatchDialogOpen) => {
  setSelectedJob(job);
  setDispatchDialogOpen(true);
};

// Assign driver and truck to job
export const handleAssignDriverAndTruck = async (driver, truck, selectedJob, setLoading, refreshJobs, setDispatchDialogOpen, setSelectedJob, vehicles = []) => {
  setLoading(true);
  
  try {
    // Check if this is a redispatch (job already has assignedAt and/or firstAssignedAt)
    const isRedispatch = selectedJob.assignedAt || selectedJob.firstAssignedAt;
    
    // If this is a redispatch, preserve the original assignedAt time
    // by explicitly sending it back to the server
    const preserveAssignedAt = isRedispatch;
    const originalAssignedAt = selectedJob.firstAssignedAt || selectedJob.assignedAt;
    
    // Check if truck is an ObjectId (24 hex characters) and convert to a readable name if possible
    let truckName = truck;
    
    // Check if truck looks like an ObjectId (24 hex characters)
    if (typeof truck === 'string' && /^[0-9a-f]{24}$/i.test(truck)) {
      // Find the vehicle in the vehicles array
      const vehicle = vehicles.find(v => v._id === truck);
      
      if (vehicle) {
        // Construct a readable name from the vehicle properties
        if (vehicle.name) {
          truckName = vehicle.name;
        } else if (vehicle.year && vehicle.make && vehicle.model) {
          truckName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
        } else if (vehicle.make && vehicle.model) {
          truckName = `${vehicle.make} ${vehicle.model}`;
        } else if (vehicle.identifier) {
          truckName = vehicle.identifier;
        }
        // If none of the above, keep the original truck value
      }
    }
    
    console.log(isRedispatch ? 'Redispatching job' : 'First-time dispatch for job:', {
      jobId: selectedJob.id,
      driverId: driver.id,
      driverName: driver.name,
      originalTruck: truck,
      truckName,
      preserveAssignedAt,
      originalAssignedAt,
      isRedispatch
    });
    
    // Use the jobService to assign the driver and truck (using the readable name)
    await jobService.assignDriverAndTruck(selectedJob.id, driver.id, truckName, preserveAssignedAt, originalAssignedAt);
    
    // Track this assignment in localStorage for persistence across refreshes
    trackAssignedJob(selectedJob.id, driver.id);
    
    // Refresh jobs and close dialog
    refreshJobs();
    setDispatchDialogOpen(false);
    setSelectedJob(null);
    
  } catch (error) {
    console.error('Error assigning driver and truck:', error);
    alert('Failed to assign driver and truck. Please try again.');
  } finally {
    setLoading(false);
  }
};

// Job status change handler
export const handleJobStatusChange = async (
  jobId, 
  status, 
  jobs, 
  currentUser, 
  setLoading, 
  refreshJobs, 
  handleDispatchJob, 
  setJobs, 
  jobCategory,
  getStatusPriority
) => {
  console.log('handleJobStatusChange called with:', { jobId, status });
  setLoading(true);

  try {
    // Get the current job details
    const currentJob = jobs.find(job => job.id === jobId);
    if (!currentJob) {
      console.error('Job not found for status change');
      alert('Failed to update job status. Job not found.');
      setLoading(false); // Ensure loading is set to false even if job is not found
      return;
    }
    const oldStatus = currentJob.status;
    
    console.log('Current job details:', { 
      id: currentJob.id, 
      oldStatus, 
      newStatus: status,
      jobCategory
    });

    // Log currentUser for debugging
    console.log('currentUser in handleJobStatusChange:', currentUser);
    
    // Check if the user is a driver-only user
    const isDriverOnly = isDriverOnlyUser(currentUser);
    
    // Check if the user is a N/A role user
    const isNARole = currentUser?.primaryRole === 'N/A';
    
    // Check if status change is allowed using only the permission system
    const isStatusChangeAllowed = canChangeJobStatus(oldStatus, status);
    
    // If the status change is not allowed, display an error and return
    if (!isStatusChangeAllowed) {
      // Get permissions for detailed logging
      const permissions = getUserPermissions();
      console.log('User permissions for job status change:', permissions);
      
      // Get allowed progressions from permissions
      const allowedProgressions = permissions?.allowedJobProgressions || {};
      const allowedNextStatuses = allowedProgressions[oldStatus] || [];
      
      console.log(`Status change rejected: ${oldStatus} -> ${status}`);
      console.log(`Allowed next statuses from permission system: ${allowedNextStatuses.join(', ')}`);
      
      if (allowedNextStatuses.length > 0) {
        alert(`You can only change from ${oldStatus} to ${allowedNextStatuses.join(' or ')}.`);
      } else if (jobCategory === 'completed' || jobCategory === 'canceled') {
        alert('You cannot change the status of completed or canceled jobs.');
      } else {
        alert(`You do not have permission to change this job's status from ${oldStatus} to ${status}.`);
      }
      
      setLoading(false);
      return;
    }

    // Check if this is a previously rejected job being dispatched
    if (oldStatus === 'Pending' && currentJob.rejectionReason && status === 'Dispatched') {
      console.log('Detected rejected job being dispatched, opening dispatch dialog');
      // Open dispatch dialog to assign a new driver
      handleDispatchJob(currentJob);
      return; // Exit early to avoid double updates
    }

    console.log('Updating job status on server:', { jobId, status });
    
    // Use the jobService to update the job status
    await jobService.updateJobStatus(jobId, status);

    // Update local state
    setJobs(prevJobs => 
      prevJobs.map(job => job.id === jobId ? { ...job, status } : job)
    );
    
    console.log('Local state updated with new status');

    // Re-prompt for driver if status changed back to Dispatched from a higher status
    if (status === 'Dispatched' && getStatusPriority(oldStatus) > getStatusPriority('Dispatched')) {
      console.log('Status changed to Dispatched from higher status, opening dispatch dialog');
      handleDispatchJob(currentJob); // Re-open dispatch dialog
    }
  } catch (error) {
    console.error('Error updating job status:', error);
    console.error('Error details:', error.response?.data || error.message);
    alert('Failed to update job status. Please try again.');
  } finally {
    setLoading(false);
  }
};

// Expand/collapse job details
export const handleExpandClick = (jobId, setJobs) => {
  console.log(`Expand button clicked for job ${jobId}`);
  
  setJobs((prevJobs) => {
    // Find the job to verify its current expanded state
    const targetJob = prevJobs.find(job => job.id === jobId);
    const currentExpandedState = targetJob?.expanded || false;
    
    console.log(`Current expanded state for job ${jobId}: ${currentExpandedState}`);
    console.log(`Setting expanded state to: ${!currentExpandedState}`);
    
    const updatedJobs = prevJobs.map((job) =>
      job.id === jobId ? { ...job, expanded: !job.expanded } : job
    );
    
    // Verify state after update
    const updatedJob = updatedJobs.find(job => job.id === jobId);
    console.log(`Updated expanded state for job ${jobId}: ${updatedJob?.expanded}`);
    
    return updatedJobs;
  });
};

// Handle cancel job
export const handleCancelJob = async (jobToCancel, cancellationReason, setLoading, refreshJobs, setCancelDialogOpen, setJobToCancel) => {
  if (!jobToCancel) {
    console.error('No job selected for cancellation');
    alert('Error: No job selected for cancellation');
    setCancelDialogOpen(false);
    return;
  }

  // Store the job ID in a local variable
  const jobId = jobToCancel.id;
  
  setLoading(true);
  
  try {
    // Use the jobService to cancel the job
    await jobService.cancelJob(jobId, cancellationReason);
    
    // Close dialog and refresh jobs
    setCancelDialogOpen(false);
    setJobToCancel(null);
    refreshJobs();
    
  } catch (error) {
    console.error('Error canceling job:', error);
    alert('Failed to cancel job. Please try again.');
  } finally {
    setLoading(false);
  }
};

// Handle GOA request
export const handleGoaRequest = async (jobToMarkGOA, goaReason, setLoading, refreshJobs, setGoaDialogOpen, setJobToMarkGOA, currentUser) => {
  if (!jobToMarkGOA) {
    console.error('No job selected for GOA');
    alert('Error: No job selected for GOA');
    setGoaDialogOpen(false);
    return;
  }

  // Check if the user is a driver-only user
  if (isDriverOnlyUser(currentUser)) {
    console.log('Driver-only user attempted to mark job as GOA');
    alert('Drivers cannot mark jobs as GOA.');
    setGoaDialogOpen(false);
    setJobToMarkGOA(null);
    return;
  }

  // Store the job ID in a local variable
  const jobId = jobToMarkGOA.id;
  
  setLoading(true);
  
  try {
    // Use the jobService to mark the job as GOA
    await jobService.markJobAsGOA(jobId, goaReason);
    
    // Close dialog and refresh jobs
    setGoaDialogOpen(false);
    setJobToMarkGOA(null);
    refreshJobs();
    
  } catch (error) {
    console.error('Error marking job as GOA:', error);
    alert('Failed to mark job as GOA. Please try again.');
  } finally {
    setLoading(false);
  }
};

// Handle Report Unsuccessful
export const handleReportUnsuccessful = async (jobToMarkUnsuccessful, unsuccessfulReason, setLoading, refreshJobs, setUnsuccessfulDialogOpen, setJobToMarkUnsuccessful, currentUser) => {
  if (!jobToMarkUnsuccessful) {
    console.error('No job selected for marking as unsuccessful');
    alert('Error: No job selected for marking as unsuccessful');
    setUnsuccessfulDialogOpen(false);
    return;
  }

  // Check if the user is a driver-only user
  if (isDriverOnlyUser(currentUser)) {
    console.log('Driver-only user attempted to mark job as unsuccessful');
    alert('Drivers cannot report jobs as unsuccessful.');
    setUnsuccessfulDialogOpen(false);
    setJobToMarkUnsuccessful(null);
    return;
  }

  // Store the job ID in a local variable
  const jobId = jobToMarkUnsuccessful.id;
  
  setLoading(true);
  
  try {
    // Use the jobService to mark the job as unsuccessful (now requires approval)
    await jobService.reportJobUnsuccessful(jobId, unsuccessfulReason);
    
    // Close dialog and refresh jobs
    setUnsuccessfulDialogOpen(false);
    setJobToMarkUnsuccessful(null);
    refreshJobs();
    
    // Show a message to the user that the request is pending approval
    alert('Unsuccessful request submitted and awaiting approval.');
    
  } catch (error) {
    console.error('Error marking job as unsuccessful:', error);
    alert('Failed to mark job as unsuccessful. Please try again.');
  } finally {
    setLoading(false);
  }
};

// Handle Approve Unsuccessful
export const handleApproveUnsuccessful = async (jobId, setLoading, refreshJobs) => {
  setLoading(true);
  
  try {
    // Use the jobService to approve the unsuccessful request
    await jobService.approveUnsuccessfulJob(jobId);
    
    // Refresh jobs to show the updated status
    refreshJobs();
    
    // Show a success message
    alert('Unsuccessful request approved successfully.');
    
  } catch (error) {
    console.error('Error approving unsuccessful request:', error);
    alert(`Error approving unsuccessful request: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

// Handle Deny Unsuccessful
export const handleDenyUnsuccessful = async (jobId, setLoading, refreshJobs) => {
  setLoading(true);
  
  try {
    // Use the jobService to deny the unsuccessful request
    await jobService.denyUnsuccessfulJob(jobId);
    
    // Refresh jobs to show the updated status
    refreshJobs();
    
    // Show a success message
    alert('Unsuccessful request denied. Job has been marked as canceled.');
    
  } catch (error) {
    console.error('Error denying unsuccessful request:', error);
    alert(`Error denying unsuccessful request: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

// Handle Approve GOA
export const handleApproveGOA = async (jobId, setLoading, refreshJobs) => {
  setLoading(true);
  
  try {
    // Use the jobService to approve the GOA request
    await jobService.approveGOA(jobId);
    
    // Refresh jobs to show the updated status
    refreshJobs();
    
    // Show a success message
    alert('GOA request approved successfully.');
    
  } catch (error) {
    console.error('Error approving GOA request:', error);
    alert(`Error approving GOA request: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

// Handle Deny GOA
export const handleDenyGOA = async (jobId, setLoading, refreshJobs) => {
  setLoading(true);
  
  try {
    // Use the jobService to deny the GOA request
    await jobService.denyGOA(jobId);
    
    // Refresh jobs to show the updated status
    refreshJobs();
    
    // Show a success message
    alert('GOA request denied successfully.');
    
  } catch (error) {
    console.error('Error denying GOA request:', error);
    alert(`Error denying GOA request: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

// Handle ETA update
export const handleEtaUpdateSave = async (additionalEtaValue, jobToUpdateEta, setLoading, refreshJobs, setEtaUpdateDialogOpen, setJobToUpdateEta, currentUser) => {
  if (!jobToUpdateEta) {
    console.error('No job selected for ETA update');
    alert('Error: No job selected for ETA update');
    setEtaUpdateDialogOpen(false);
    return;
  }

  // Check if the user is a driver-only user
  if (isDriverOnlyUser(currentUser)) {
    console.log('Driver-only user attempted to update ETA');
    alert('Drivers cannot update ETAs on jobs.');
    setEtaUpdateDialogOpen(false);
    setJobToUpdateEta(null);
    return;
  }

  // Store the job ID in a local variable
  const jobId = jobToUpdateEta.id;
  
  // Get the current ETA value (as a number)
  const currentEta = parseInt(jobToUpdateEta.eta) || 0;
  
  // Calculate the new ETA by adding the additional time
  const newEta = currentEta + parseInt(additionalEtaValue);
  
  console.log(`Updating ETA for job ${jobId}: ${currentEta} + ${additionalEtaValue} = ${newEta} minutes`);
  
  setLoading(true);
  
  try {
    // Use the dedicated ETA update endpoint to update only the ETA
    // This won't trigger re-acceptance or change any other job details
    await jobService.updateJobETA(jobId, newEta.toString());
    
    // Close dialog and refresh jobs
    setEtaUpdateDialogOpen(false);
    setJobToUpdateEta(null);
    refreshJobs();
    
  } catch (error) {
    console.error('Error updating job ETA:', error);
    alert('Failed to update job ETA. Please try again.');
  } finally {
    setLoading(false);
  }
};

// Handle menu actions
export const handleMenuAction = async (
  action, 
  job, 
  setJobToCancel,
  setCancelDialogOpen,
  setJobToMarkGOA,
  setGoaDialogOpen,
  setJobToUpdateEta,
  setEtaUpdateDialogOpen,
  setJobToMarkUnsuccessful,
  setUnsuccessfulDialogOpen,
  handleDispatchJob,
  refreshJobs,
  setLoading,
  currentUser
) => {
  // If job is provided directly (e.g., from the Rejected status button), use it
  // Otherwise use the selectedJobForMenu from the menu context
  const targetJob = job;
  
  if (!targetJob) {
    console.error('No job selected for action:', action);
    return;
  }
  
  // Check if the user is a driver-only user
  const isDriverOnly = isDriverOnlyUser(currentUser);
  
  // Restricted actions for driver-only users
  const driverRestrictedActions = ['goa', 'updateEta', 'unsuccessful', 'reassign'];
  
  if (isDriverOnly && driverRestrictedActions.includes(action)) {
    console.log(`Driver-only user attempted restricted action: ${action}`);
    alert(`Drivers cannot perform this action: ${action}`);
    return;
  }
  
  // Additional check for completed/canceled jobs for driver-only users
  if (isDriverOnly && action === 'cancel' && 
      (targetJob.status === 'Completed' || targetJob.status === 'Canceled' || 
       targetJob.status === 'GOA' || targetJob.status === 'Unsuccessful')) {
    alert('Drivers cannot cancel completed or canceled jobs.');
    return;
  }
  
  switch (action) {
    case 'approveUnsuccessful':
      // Handle approving unsuccessful request
      await handleApproveUnsuccessful(targetJob.id, setLoading, refreshJobs);
      break;
    case 'denyUnsuccessful':
      // Handle denying unsuccessful request
      await handleDenyUnsuccessful(targetJob.id, setLoading, refreshJobs);
      break;
    case 'approveGOA':
      // Handle approving GOA request
      await handleApproveGOA(targetJob.id, setLoading, refreshJobs);
      break;
    case 'denyGOA':
      // Handle denying GOA request
      await handleDenyGOA(targetJob.id, setLoading, refreshJobs);
      break;
    case 'cancel':
      // Only allow canceling if the job is NOT completed
      if (targetJob.status !== 'Completed') {
        // Store the job in a dedicated state variable for cancellation
        setJobToCancel(targetJob);
        setCancelDialogOpen(true);
      } else {
        alert('Completed jobs cannot be canceled.');
      }
      break;
    case 'goa':
      // Store the job in a dedicated state variable for GOA
      setJobToMarkGOA(targetJob);
      setGoaDialogOpen(true);
      break;
    case 'updateEta':
      // Store the job in a dedicated state variable for ETA update
      setJobToUpdateEta(targetJob);
      setEtaUpdateDialogOpen(true);
      break;
    case 'unsuccessful':
      // Store the job in a dedicated state variable for marking as unsuccessful
      setJobToMarkUnsuccessful(targetJob);
      setUnsuccessfulDialogOpen(true);
      break;
    case 'email':
      // Implement email job details logic
      alert('Email Job Details feature coming soon');
      break;
    case 'duplicate':
      try {
        await jobService.duplicateJob(targetJob.id);
        // Refresh the jobs list to show the new duplicated job
        refreshJobs();
        alert('Job duplicated successfully!');
      } catch (error) {
        console.error('Error duplicating job:', error);
        alert('Failed to duplicate job. Please try again.');
      }
      break;
    case 'reassign':
      // Use the existing dispatch dialog to reassign the driver
      handleDispatchJob(targetJob);
      break;
    default:
      break;
  }
};
