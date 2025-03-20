import * as jobService from '../services/jobDashboardService';

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
export const handleAssignDriverAndTruck = async (driver, truck, selectedJob, setLoading, refreshJobs, setDispatchDialogOpen, setSelectedJob) => {
  setLoading(true);
  
  try {
    // Check if this is a redispatch (job already has assignedAt and/or firstAssignedAt)
    const isRedispatch = selectedJob.assignedAt || selectedJob.firstAssignedAt;
    
    // If this is a redispatch, preserve the original assignedAt time
    // by explicitly sending it back to the server
    const preserveAssignedAt = isRedispatch;
    const originalAssignedAt = selectedJob.firstAssignedAt || selectedJob.assignedAt;
    
    console.log(isRedispatch ? 'Redispatching job' : 'First-time dispatch for job:', {
      jobId: selectedJob.id,
      driverId: driver.id,
      driverName: driver.name,
      truck,
      preserveAssignedAt,
      originalAssignedAt,
      isRedispatch
    });
    
    // Use the jobService to assign the driver and truck
    await jobService.assignDriverAndTruck(selectedJob.id, driver.id, truck, preserveAssignedAt, originalAssignedAt);
    
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

    // Check for user role restrictions ONLY for 'N/A' users who are not Dispatchers or Answering Service
    if (currentUser?.primaryRole === 'N/A' && 
        !(currentUser?.secondaryRoles?.dispatcher || currentUser?.secondaryRoles?.answeringService)) {
      if (getStatusPriority(status) < getStatusPriority(oldStatus)) {
        alert('Drivers with role N/A cannot lower the job status.');
        setLoading(false);
        return;
      }
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
  setJobs((prevJobs) =>
    prevJobs.map((job) =>
      job.id === jobId ? { ...job, expanded: !job.expanded } : job
    )
  );
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
export const handleGoaRequest = async (jobToMarkGOA, goaReason, setLoading, refreshJobs, setGoaDialogOpen, setJobToMarkGOA) => {
  if (!jobToMarkGOA) {
    console.error('No job selected for GOA');
    alert('Error: No job selected for GOA');
    setGoaDialogOpen(false);
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

// Handle menu actions
export const handleMenuAction = (
  action, 
  job, 
  setJobToCancel,
  setCancelDialogOpen,
  setJobToMarkGOA,
  setGoaDialogOpen,
  handleDispatchJob
) => {
  // If job is provided directly (e.g., from the Rejected status button), use it
  // Otherwise use the selectedJobForMenu from the menu context
  const targetJob = job;
  
  if (!targetJob) {
    console.error('No job selected for action:', action);
    return;
  }
  
  switch (action) {
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
    case 'unsuccessful':
      // Implement report unsuccessful logic
      alert('Report Unsuccessful feature coming soon');
      break;
    case 'email':
      // Implement email job details logic
      alert('Email Job Details feature coming soon');
      break;
    case 'duplicate':
      // Implement duplicate job logic
      alert('Duplicate Job feature coming soon');
      break;
    case 'reassign':
      // Use the existing dispatch dialog to reassign the driver
      handleDispatchJob(targetJob);
      break;
    default:
      break;
  }
};
