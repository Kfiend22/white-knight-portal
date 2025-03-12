// Dashboard.js
import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Fab,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

import SideMenu from '../components/SideMenu';
import Jobs from '../dashboard/Jobs'; // Adjust the import path according to your file structure

function Dashboard() {
  // State for job creation dialog
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [newJobData, setNewJobData] = useState({
    service: '',
    location: '',
    dropOffLocation: '',
    account: '',
    customerName: '',
    contactInfo: '',
  });

  // State for Tabs
  const [tabValue, setTabValue] = useState(0);

  // Handler for tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handler for adding a new job
  const handleAddJob = () => {
    setJobDialogOpen(true);
  };

  const handleJobDialogClose = () => {
    setJobDialogOpen(false);
    setNewJobData({
      service: '',
      location: '',
      dropOffLocation: '',
      account: '',
      customerName: '',
      contactInfo: '',
    });
  };

  const handleJobCreate = () => {
    // Implement job creation logic here
    // For demonstration, you can log the new job data
    console.log('New job created:', newJobData);
    handleJobDialogClose();
    // You can also trigger a refresh or update of the job list if needed
  };

  // Handler for receiving a demo job
  const handleReceiveDemoJob = () => {
    // Implement demo job creation logic
    // You can call a function in Jobs component via props or use a shared state management system
    // For this example, we'll use a callback function
    if (window.createDemoJob) {
      window.createDemoJob();
    }
  };

  return (
    <>
      {/* Side Menu */}
      <SideMenu />

      {/* Main Content */}
      <Container maxWidth="lg">
        <Box
          mt={4}
          mb={2}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h4">Dashboard</Typography>
          {/* Add New Job Button */}
          <Fab color="primary" aria-label="add" onClick={handleAddJob}>
            <AddIcon />
          </Fab>
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

        {/* Tab Panels */}
        {tabValue === 0 && (
          <Box mt={2}>
            {/* Scheduled Jobs */}
            <Jobs jobCategory="scheduled" onCreateJob={handleAddJob} />
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
              onReceiveDemoJob={handleReceiveDemoJob}
            />

            <Typography variant="h5" mt={4}>
              In-Progress Jobs
            </Typography>
            <Jobs jobCategory="inProgress" />
          </Box>
        )}
        {tabValue === 2 && (
          <Box mt={2}>
            {/* Completed Jobs */}
            <Jobs jobCategory="completed" />
          </Box>
        )}
        {tabValue === 3 && (
          <Box mt={2}>
            {/* Canceled Jobs */}
            <Jobs jobCategory="canceled" />
          </Box>
        )}

        {/* Job Creation Dialog */}
        <Dialog open={jobDialogOpen} onClose={handleJobDialogClose}>
          <DialogTitle>Create New Job</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Service"
              type="text"
              fullWidth
              variant="outlined"
              value={newJobData.service}
              onChange={(e) =>
                setNewJobData({ ...newJobData, service: e.target.value })
              }
            />
            <TextField
              margin="dense"
              label="Location"
              type="text"
              fullWidth
              variant="outlined"
              value={newJobData.location}
              onChange={(e) =>
                setNewJobData({ ...newJobData, location: e.target.value })
              }
            />
            <TextField
              margin="dense"
              label="Drop-Off Location"
              type="text"
              fullWidth
              variant="outlined"
              value={newJobData.dropOffLocation}
              onChange={(e) =>
                setNewJobData({ ...newJobData, dropOffLocation: e.target.value })
              }
            />
            <TextField
              margin="dense"
              label="Account"
              type="text"
              fullWidth
              variant="outlined"
              value={newJobData.account}
              onChange={(e) =>
                setNewJobData({ ...newJobData, account: e.target.value })
              }
            />
            <TextField
              margin="dense"
              label="Customer Name"
              type="text"
              fullWidth
              variant="outlined"
              value={newJobData.customerName}
              onChange={(e) =>
                setNewJobData({ ...newJobData, customerName: e.target.value })
              }
            />
            <TextField
              margin="dense"
              label="Contact Info"
              type="text"
              fullWidth
              variant="outlined"
              value={newJobData.contactInfo}
              onChange={(e) =>
                setNewJobData({ ...newJobData, contactInfo: e.target.value })
              }
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleJobDialogClose}>Cancel</Button>
            <Button onClick={handleJobCreate} color="primary">
              Create
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}

export default Dashboard;
