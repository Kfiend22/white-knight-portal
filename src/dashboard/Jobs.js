// Jobs.js - Main jobs dashboard component
import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import JobsTable from '../components/JobsTable';
import { JobDialogManager, useJobDialogs } from '../components/JobDialogs/JobDialogManager';
import useJobData from '../hooks/useJobData';
import useVehicleData from '../hooks/useVehicleData';
import { filterJobs, getStatusPriority } from '../utils/jobUtils';
import * as jobActionHandlers from '../utils/jobActionHandlers';

function Jobs({ jobCategory, onCreateJob, onReceiveDemoJob, onEditJob, refreshTrigger = 0, onSocketStatusChange }) {
  // Get the job data from our custom hook
  const {
    jobs,
    setJobs,
    drivers,
    loading: jobsLoading,
    setLoading,
    error: jobsError,
    currentUser,
    refreshJobs,
    deleteJob
  } = useJobData(jobCategory, onSocketStatusChange);
  
  // Get fleet vehicles from our custom hook
  const { 
    fleetVehicles, 
    isLoading: vehiclesLoading, 
    error: vehiclesError 
  } = useVehicleData();
  
  // Combined loading and error states
  const loading = jobsLoading || vehiclesLoading;
  const error = jobsError || vehiclesError;
  
  // Debug: Log fleet vehicles
  useEffect(() => {
    console.log('Fleet vehicles from useVehicleData:', fleetVehicles);
  }, [fleetVehicles]);

  // Get dialogs state from our custom hook
  const dialogState = useJobDialogs();
  const {
    selectedJob, setSelectedJob,
    jobToReject, setJobToReject,
    jobToCancel, setJobToCancel,
    jobToMarkGOA, setJobToMarkGOA,
    jobToUpdateEta, setJobToUpdateEta,
    jobToMarkUnsuccessful, setJobToMarkUnsuccessful,
    etaDialogOpen, setEtaDialogOpen,
    dispatchDialogOpen, setDispatchDialogOpen,
    rejectDialogOpen, setRejectDialogOpen,
    cancelDialogOpen, setCancelDialogOpen,
    goaDialogOpen, setGoaDialogOpen,
    etaUpdateDialogOpen, setEtaUpdateDialogOpen,
    unsuccessfulDialogOpen, setUnsuccessfulDialogOpen
  } = dialogState;

  // Predefined trucks list as fallback (only used if no fleet vehicles are available)
  const trucks = ['Flatbed 1', 'Flatbed 2', 'Wheel Lift 1', 'Heavy Duty 1', 'Service Truck 1'];

  // Handlers that leverage our utility functions
  const handleAcceptJob = useCallback((job) => {
    jobActionHandlers.handleAcceptJob(
      job, 
      setSelectedJob, 
      setEtaDialogOpen, 
      (job) => jobActionHandlers.handleDirectAccept(job, setLoading, refreshJobs)
    );
  }, [setSelectedJob, setEtaDialogOpen, setLoading, refreshJobs]);

  const handleRejectJob = useCallback((jobId) => {
    jobActionHandlers.handleRejectJob(
      jobId,
      jobs,
      setJobToReject,
      setRejectDialogOpen
    );
  }, [jobs, setJobToReject, setRejectDialogOpen]);

  const handleDispatchJob = useCallback((job) => {
    jobActionHandlers.handleDispatchJob(
      job,
      setSelectedJob,
      setDispatchDialogOpen
    );
  }, [setSelectedJob, setDispatchDialogOpen]);

  const handleJobStatusChange = useCallback((jobId, status) => {
    console.log('Before status change - job expanded states:', jobs.map(job => ({
      id: job.id,
      expanded: job.expanded
    })));
    
    jobActionHandlers.handleJobStatusChange(
      jobId,
      status,
      jobs,
      currentUser,
      setLoading,
      // Pass a custom refreshJobs function that preserves expanded state
      () => {
        console.log('Custom refreshJobs called - preserving expanded states');
        const expandedStates = {};
        // Save expanded states before refresh
        jobs.forEach(job => {
          expandedStates[job.id] = job.expanded;
        });
        
        // Call original refreshJobs
        return refreshJobs().then(() => {
          // After refresh, restore expanded states
          setJobs(currentJobs => {
            console.log('Restoring expanded states after refresh');
            return currentJobs.map(job => {
              if (expandedStates.hasOwnProperty(job.id)) {
                return { ...job, expanded: expandedStates[job.id] };
              }
              return job;
            });
          });
        });
      },
      handleDispatchJob,
      setJobs,
      jobCategory,
      getStatusPriority
    );
    
    // Do not refresh again - we already did it in the custom function
    // removed: refreshJobs();
  }, [jobs, currentUser, setLoading, refreshJobs, handleDispatchJob, setJobs, jobCategory]);

  const handleExpandClick = useCallback((jobId) => {
    console.log(`Jobs.js: handleExpandClick called for job ${jobId}`);
    console.log('Current jobs state before expand:', jobs.map(job => ({
      id: job.id,
      expanded: job.expanded
    })));
    
    jobActionHandlers.handleExpandClick(jobId, setJobs);
    
    // We can't log the updated state here because setState is asynchronous
    // The updated state will be visible in the next render
  }, [setJobs, jobs]);

  const handleMenuAction = useCallback((action, job, user = currentUser) => {
    // Create custom refreshJobs function to preserve expanded states
    const preservingRefreshJobs = () => {
      console.log('preservingRefreshJobs called from handleMenuAction');
      const expandedStates = {};
      // Save expanded states before refresh
      jobs.forEach(job => {
        expandedStates[job.id] = job.expanded;
      });
      
      // Call original refreshJobs
      return refreshJobs().then(() => {
        // After refresh, restore expanded states
        setJobs(currentJobs => {
          console.log('Restoring expanded states after menu action');
          return currentJobs.map(job => {
            if (expandedStates.hasOwnProperty(job.id)) {
              return { ...job, expanded: expandedStates[job.id] };
            }
            return job;
          });
        });
      });
    };
    
    jobActionHandlers.handleMenuAction(
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
      preservingRefreshJobs, // Use our custom wrapper
      setLoading,
      user // Pass the user parameter
    );
  }, [
    jobs, // Added jobs to the dependency array since we use it in the callback
    currentUser, // Added currentUser since we use it as a default parameter
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
    setJobs // Added setJobs since we use it in the callback
  ]);
  
  // Listen for dispatchJob events from JobDetails component
  useEffect(() => {
    const handleDispatchJobEvent = (event) => {
      const jobId = event.detail.jobId;
      const job = jobs.find(j => j.id === jobId);
      if (job) {
        handleDispatchJob(job);
      }
    };
    
    window.addEventListener('dispatchJob', handleDispatchJobEvent);
    
    return () => {
      window.removeEventListener('dispatchJob', handleDispatchJobEvent);
    };
  }, [jobs, handleDispatchJob]);

  // Get filtered jobs based on category and user role - using useMemo to avoid unnecessary recalculations
  const displayedJobs = useMemo(() => {
    return filterJobs(jobs, jobCategory, currentUser);
  }, [jobs, jobCategory, currentUser]);

  // Check if user data is fully ready - check both id and _id (MongoDB format)
  const isUserDataReady = Boolean(currentUser && (currentUser.id || currentUser._id));
  
  // For debugging: log user data structure if not considered ready
  if (currentUser && !isUserDataReady) {
    console.log('User data not considered ready:', {
      hasId: Boolean(currentUser.id), 
      has_Id: Boolean(currentUser._id), 
      keys: Object.keys(currentUser)
    });
  }
  
  // Add a state to force render after timeout if jobs exist but user data check is failing
  const [forceRender, setForceRender] = useState(false);
  
  // Effect to prevent infinite loading by forcing render after a timeout
  useEffect(() => {
    let timer;
    if (!isUserDataReady && jobs.length > 0 && !forceRender) {
      timer = setTimeout(() => {
        console.log('Forcing render after timeout - jobs exist but user data not ready');
        setForceRender(true);
      }, 3000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isUserDataReady, jobs.length, forceRender]);
  
  // Final loading state - won't be stuck if we have jobs but user data is problematic
  const isLoading = (loading || (!isUserDataReady && !forceRender));

  return (
    <Box mt={2}>
      {isLoading && (
        <Box display="flex" justifyContent="center" alignItems="center" my={4}>
          <Typography>Loading jobs data...</Typography>
        </Box>
      )}
      {error && (
        <Typography color="error" variant="body1">
          {error}
        </Typography>
      )}

      {displayedJobs.length > 0 ? (
        <>
          <JobsTable 
            jobs={displayedJobs}
            currentUser={currentUser}
            jobCategory={jobCategory}
            loading={isLoading}
            onExpandClick={handleExpandClick}
            onEditJob={onEditJob}
            onAcceptJob={handleAcceptJob}
            onRejectJob={handleRejectJob}
            onDispatchJob={handleDispatchJob}
            onJobStatusChange={handleJobStatusChange}
            onMenuAction={handleMenuAction}
            onDeleteJob={deleteJob}
          />
          
          {/* Dialog manager handles all the job-related dialogs */}
          <JobDialogManager
            loading={loading}
            selectedJob={selectedJob}
            setSelectedJob={setSelectedJob}
            refreshJobs={refreshJobs}
            setLoading={setLoading}
            drivers={drivers}
            trucks={trucks}
            vehicles={fleetVehicles}
            jobToReject={jobToReject}
            setJobToReject={setJobToReject}
            jobToCancel={jobToCancel}
            setJobToCancel={setJobToCancel}
            jobToMarkGOA={jobToMarkGOA}
            setJobToMarkGOA={setJobToMarkGOA}
            jobToUpdateEta={jobToUpdateEta}
            setJobToUpdateEta={setJobToUpdateEta}
            jobToMarkUnsuccessful={jobToMarkUnsuccessful}
            setJobToMarkUnsuccessful={setJobToMarkUnsuccessful}
            etaDialogOpen={etaDialogOpen}
            setEtaDialogOpen={setEtaDialogOpen}
            dispatchDialogOpen={dispatchDialogOpen}
            setDispatchDialogOpen={setDispatchDialogOpen}
            rejectDialogOpen={rejectDialogOpen}
            setRejectDialogOpen={setRejectDialogOpen}
            cancelDialogOpen={cancelDialogOpen}
            setCancelDialogOpen={setCancelDialogOpen}
            goaDialogOpen={goaDialogOpen}
            setGoaDialogOpen={setGoaDialogOpen}
            etaUpdateDialogOpen={etaUpdateDialogOpen}
            setEtaUpdateDialogOpen={setEtaUpdateDialogOpen}
            unsuccessfulDialogOpen={unsuccessfulDialogOpen}
            setUnsuccessfulDialogOpen={setUnsuccessfulDialogOpen}
          />
        </>
      ) : (
        <Box display="flex" justifyContent="center" my={4}>
          <Typography>No jobs found for this category.</Typography>
        </Box>
      )}
    </Box>
  );
}

export default Jobs;
