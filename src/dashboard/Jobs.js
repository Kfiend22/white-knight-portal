// Jobs.js - Main jobs dashboard component
import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import JobsTable from '../components/JobsTable';
import { JobDialogManager, useJobDialogs } from '../components/JobDialogs/JobDialogManager';
import useJobData from '../hooks/useJobData';
import { filterJobs, getStatusPriority } from '../utils/jobUtils';
import * as jobActionHandlers from '../utils/jobActionHandlers';

function Jobs({ jobCategory, onCreateJob, onReceiveDemoJob, onEditJob, refreshTrigger = 0, onSocketStatusChange }) {
  // State for fleet vehicles
  const [fleetVehicles, setFleetVehicles] = useState([]);
  
  // Get the job data from our custom hook
  const {
    jobs,
    setJobs,
    drivers,
    loading,
    setLoading,
    error,
    currentUser,
    refreshJobs
  } = useJobData(jobCategory, refreshTrigger, onSocketStatusChange);
  
  // Fetch fleet vehicles from settings API
  useEffect(() => {
    const fetchFleetVehicles = async () => {
      try {
        // Try to fetch from settings API
        const response = await fetch('/api/settings');
        const data = await response.json();
        
        if (data && data.vehicles && Array.isArray(data.vehicles)) {
          console.log('Fetched fleet vehicles:', data.vehicles.length);
          console.log('Fleet vehicles data:', data.vehicles);
          setFleetVehicles(data.vehicles);
        } else {
          console.log('No fleet vehicles found in settings API response');
          setFleetVehicles([]);
        }
      } catch (error) {
        console.error('Error fetching fleet vehicles:', error);
        setFleetVehicles([]);
      }
    };
    
    fetchFleetVehicles();
  }, []);

  // Debug: Log fleet vehicles after state update
  useEffect(() => {
    console.log('Current fleetVehicles state:', fleetVehicles);
  }, [fleetVehicles]);

  // Get dialogs state from our custom hook
  const dialogState = useJobDialogs();
  const {
    selectedJob, setSelectedJob,
    jobToReject, setJobToReject,
    jobToCancel, setJobToCancel,
    jobToMarkGOA, setJobToMarkGOA,
    etaDialogOpen, setEtaDialogOpen,
    dispatchDialogOpen, setDispatchDialogOpen,
    rejectDialogOpen, setRejectDialogOpen,
    cancelDialogOpen, setCancelDialogOpen,
    goaDialogOpen, setGoaDialogOpen
  } = dialogState;

  // Predefined trucks list (moved from state to constant)
  const trucks = ['Flatbed 1', 'Flatbed 2', 'Wheel Lift 1', 'Heavy Duty 1', 'Service Truck 1'];

  // Handlers that leverage our utility functions
  const handleAcceptJob = (job) => {
    jobActionHandlers.handleAcceptJob(
      job, 
      setSelectedJob, 
      setEtaDialogOpen, 
      (job) => jobActionHandlers.handleDirectAccept(job, setLoading, refreshJobs)
    );
  };

  const handleRejectJob = (jobId) => {
    jobActionHandlers.handleRejectJob(
      jobId,
      jobs,
      setJobToReject,
      setRejectDialogOpen
    );
  };

  const handleDispatchJob = (job) => {
    jobActionHandlers.handleDispatchJob(
      job,
      setSelectedJob,
      setDispatchDialogOpen
    );
  };

  const handleJobStatusChange = (jobId, status) => {
    jobActionHandlers.handleJobStatusChange(
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
    );
  };

  const handleExpandClick = (jobId) => {
    jobActionHandlers.handleExpandClick(jobId, setJobs);
  };

  const handleMenuAction = (action, job) => {
    jobActionHandlers.handleMenuAction(
      action,
      job,
      setJobToCancel,
      setCancelDialogOpen,
      setJobToMarkGOA,
      setGoaDialogOpen,
      handleDispatchJob
    );
  };

  // Get filtered jobs based on category and user role
  const displayedJobs = filterJobs(jobs, jobCategory, currentUser);

  return (
    <Box mt={2}>
      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <Typography>Loading jobs...</Typography>
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
            loading={loading}
            onExpandClick={handleExpandClick}
            onEditJob={onEditJob}
            onAcceptJob={handleAcceptJob}
            onRejectJob={handleRejectJob}
            onDispatchJob={handleDispatchJob}
            onJobStatusChange={handleJobStatusChange}
            onMenuAction={handleMenuAction}
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
