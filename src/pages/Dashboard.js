// Dashboard.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  Container,
  Box,
  Typography,
  Fab,
  Tabs,
  Tab,
  Snackbar,
  Alert
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

import SideMenu from '../components/SideMenu';
import Jobs from '../dashboard/Jobs';
import JobDialog from '../components/JobDialog';
import DebugPanel from '../components/DebugPanel';
import useUserProfile from '../hooks/useUserProfile';
import useVehicleData from '../hooks/useVehicleData';
import { getDefaultDemoJob, createDemoJob } from '../services/jobService';

function Dashboard() {
  // State for job creation/editing dialog
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  
  // State for debug mode
  const [debugMode, setDebugMode] = useState(false);
  const [socketStatus, setSocketStatus] = useState({ connected: false, lastEvent: null });
  
  // State for Tabs
  const [tabValue, setTabValue] = useState(1);
  
  // State for notifications and loading
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [isLoading, setIsLoading] = useState(false);
  
  // Use custom hooks
  const { userProfile, userCompanies } = useUserProfile();
  const { vehicleData } = useVehicleData();

  // Set tab based on user role
  useEffect(() => {
    if (userProfile && userProfile.primaryRole === 'driver') {
      setTabValue(1); // Active Jobs tab
    }
  }, [userProfile]);

  // Handler for tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handler for adding a new job
  const handleAddJob = () => {
    setIsEditing(false);
    setSelectedJob(null);
    setJobDialogOpen(true);
  };
  
  // Handler for editing job
  const handleEditJob = (job) => {
    setIsEditing(true);
    setSelectedJob(job);
    setJobDialogOpen(true);
  };

  // Handler for job dialog close
  const handleJobDialogClose = () => {
    setJobDialogOpen(false);
    setIsEditing(false);
    setSelectedJob(null);
  };

  // Job handlers are no longer needed as we're using web socket updates

  // Handler for creating a demo job
  const handleCreateDemoJob = useCallback(() => {
    setIsLoading(true);
    
    // Create a demo job object
    const demoJob = getDefaultDemoJob();
    
    // Make API call to create demo job
    createDemoJob(demoJob)
      .then((result) => {
        if (result.success) {
          setNotification({
            open: true,
            message: 'Demo job created successfully',
            severity: 'success'
          });
          
          // Job will be updated via websocket, no need to manually refresh
        } else {
          setNotification({
            open: true,
            message: result.message,
            severity: 'error'
          });
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);
  
  // Handler for closing notifications
  const handleNotificationClose = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Side Menu */}
      <SideMenu />

      {/* Main Content */}
      <Container maxWidth={false} sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box
          mt={4}
          mb={2}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h4">Dashboard</Typography>
          {/* Add New Job Button - only show for users with specific roles that can create jobs */}
          {userProfile && (
            userProfile.primaryRole === 'OW' ||
            userProfile.primaryRole === 'sOW' ||
            userProfile.primaryRole === 'RM' ||
            userProfile.primaryRole === 'SP' ||
            (userProfile.secondaryRoles && userProfile.secondaryRoles.dispatcher)
          ) && (
            <Fab color="primary" aria-label="add" onClick={handleAddJob}>
              <AddIcon />
            </Fab>
          )}
        </Box>

        {/* Tabs */}
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="job categories"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Scheduled Jobs" />
          <Tab label="Active Jobs" />
          <Tab label="Completed Jobs" />
          <Tab label="Canceled Jobs" />
        </Tabs>

        {/* Debug Panel */}
        <DebugPanel 
          debugMode={debugMode}
          setDebugMode={setDebugMode}
          userProfile={userProfile}
          socketStatus={socketStatus}
          setSocketStatus={setSocketStatus}
          setNotification={setNotification}
        />
        
        {/* Tab Panels */}
        {userProfile && userProfile.primaryRole === 'driver' ? (
          // Driver view - show only jobs assigned to this driver
          <>
            {tabValue === 0 && (
              <Box mt={2}>
                {/* Scheduled Jobs */}
                <Typography variant="h5" gutterBottom>
                  Your Scheduled Jobs
                </Typography>
                <Jobs 
                  jobCategory="scheduled" 
                  onEditJob={handleEditJob} 
                  onSocketStatusChange={setSocketStatus}
                />
              </Box>
            )}
            {tabValue === 1 && (
              <Box mt={2}>
                {/* Active Jobs */}
                <Typography variant="h5" gutterBottom>
                  Your Active Jobs
                </Typography>
                <Jobs 
                  jobCategory="inProgress"
                  onEditJob={handleEditJob} 
                  onSocketStatusChange={setSocketStatus}
                />
                
                <Typography variant="h5" mt={4} gutterBottom>
                  Jobs Awaiting Your Acceptance
                </Typography>
                <Jobs
                  jobCategory="pending"
                  onEditJob={handleEditJob}
                  onSocketStatusChange={setSocketStatus}
                />
              </Box>
            )}
            {tabValue === 2 && (
              <Box mt={2}>
                {/* Completed Jobs */}
                <Typography variant="h5" gutterBottom>
                  Your Completed Jobs
                </Typography>
                <Jobs 
                  jobCategory="completed"
                  onEditJob={handleEditJob}
                  onSocketStatusChange={setSocketStatus}
                />
              </Box>
            )}
            {tabValue === 3 && (
              <Box mt={2}>
                {/* Canceled Jobs */}
                <Typography variant="h5" gutterBottom>
                  Your Canceled Jobs
                </Typography>
                <Jobs 
                  jobCategory="canceled"
                  onEditJob={handleEditJob} 
                  onSocketStatusChange={setSocketStatus}
                />
              </Box>
            )}
          </>
        ) : (
          // Regular user view - show all jobs
          <>
            {tabValue === 0 && (
              <Box mt={2}>
                {/* Scheduled Jobs */}
                <Jobs 
                  jobCategory="scheduled" 
                  onCreateJob={handleAddJob}
                  onEditJob={handleEditJob}
                  onSocketStatusChange={setSocketStatus}
                />
              </Box>
            )}
            {tabValue === 1 && (
              <Box mt={2}>
                {/* Active Jobs - Pending and In-Progress */}
                <Typography variant="h5" mt={4}>
                  Pending Jobs
                </Typography>
                <Jobs
                  jobCategory="pending"
                  onCreateJob={handleAddJob}
                  onEditJob={handleEditJob}
                  onReceiveDemoJob={handleCreateDemoJob}
                  onSocketStatusChange={setSocketStatus}
                />

                <Typography variant="h5" mt={4}>
                  In-Progress Jobs
                </Typography>
                <Jobs 
                  jobCategory="inProgress"
                  onEditJob={handleEditJob}
                  onSocketStatusChange={setSocketStatus}
                />
              </Box>
            )}
            {tabValue === 2 && (
              <Box mt={2}>
                {/* Completed Jobs */}
                <Jobs 
                  jobCategory="completed"
                  onEditJob={handleEditJob}
                  onSocketStatusChange={setSocketStatus}
                />
              </Box>
            )}
            {tabValue === 3 && (
              <Box mt={2}>
                {/* Canceled Jobs */}
                <Jobs 
                  jobCategory="canceled"
                  onEditJob={handleEditJob}
                  onSocketStatusChange={setSocketStatus}
                />
              </Box>
            )}
          </>
        )}

        {/* Job Dialog */}
        <JobDialog
          open={jobDialogOpen}
          onClose={handleJobDialogClose}
          isEditing={isEditing}
          selectedJob={selectedJob}
          userProfile={userProfile}
          userCompanies={userCompanies}
          vehicleData={vehicleData}
          setNotification={setNotification}
        />
        
        {/* Notification Snackbar */}
        <Snackbar 
          open={notification.open} 
          autoHideDuration={6000} 
          onClose={handleNotificationClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleNotificationClose} 
            severity={notification.severity}
            variant="filled"
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}

export default Dashboard;
