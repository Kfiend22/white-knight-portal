// JobDialog.js
// Job creation/editing dialog component

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  Typography,
  Box,
  ButtonGroup,
  CircularProgress
} from '@mui/material';
import {
  MyLocation as MyLocationIcon,
  ContentCopy as ContentCopyIcon
} from '@mui/icons-material';

import { 
  locationTypes, 
  serviceOptions, 
  classTypeOptions, 
  scheduledTimeOptions,
  defaultJobData
} from '../constants/dashboardConstants';
import { 
  handleInputChange as handleInputChangeUtil, 
  handleNestedInputChange as handleNestedInputChangeUtil,
  copyCustomerToPickup,
  validateJobData,
  formatJobDataForSubmission,
  formatJobDataForUpdate,
  parseJobForEditing,
  generateJobId
} from '../utils/dashboardUtils';
import useLocationRequest from '../hooks/useLocationRequest';
import useAvailableDrivers from '../hooks/useAvailableDrivers';
import { createJob, updateJob } from '../services/jobService';

// Import sub-components
import CustomerSection from './JobDialog/CustomerSection';
import VehicleSection from './JobDialog/VehicleSection';
import ServiceSection from './JobDialog/ServiceSection';
import NotesSection from './JobDialog/NotesSection';
import LocationSection from './JobDialog/LocationSection';
import ContactSection from './JobDialog/ContactSection';

/**
 * Job Dialog component for creating and editing jobs
 */
const JobDialog = ({
  open,
  onClose,
  isEditing,
  selectedJob,
  userProfile,
  userCompanies,
  vehicleData,
  onJobCreated,
  onJobUpdated,
  setNotification
}) => {
  // State for job data
  const [newJobData, setNewJobData] = useState({ ...defaultJobData });
  
  // State for job ID
  const [jobId, setJobId] = useState(generateJobId());
  
  // State for active tab in notes section
  const [activeNotesTab, setActiveNotesTab] = useState('internal');
  
  // State for loading
  const [isLoading, setIsLoading] = useState(false);
  
  // State for fleet vehicles
  const [fleetVehicles, setFleetVehicles] = useState([]);

  // Use location request hook
  const { 
    locationRequestSent, 
    isLoading: locationLoading, 
    locationData, 
    sendLocationRequest, 
    resetLocationRequest,
    parseLocationAddress
  } = useLocationRequest();

  // Use available drivers hook - only fetch when dialog is open
  const { 
    availableDrivers, 
    isLoading: driversLoading, 
    error: driversError 
  } = useAvailableDrivers(open);
  
  // Fetch fleet vehicles when dialog opens
  useEffect(() => {
    if (open) {
      // First check localStorage for cached vehicles
      const cachedVehicles = localStorage.getItem('fleetVehicles');
      if (cachedVehicles) {
        try {
          const parsedVehicles = JSON.parse(cachedVehicles);
          console.log('JobDialog - Using cached fleet vehicles from localStorage:', parsedVehicles.length);
          setFleetVehicles(parsedVehicles);
        } catch (e) {
          console.error('Error parsing cached vehicles:', e);
          // Continue with API fetch if parse fails
          fetchFromAPI();
        }
      } else {
        // If not in localStorage, fetch from API
        fetchFromAPI();
      }
    }
    
    async function fetchFromAPI() {
      try {
        // Try to get vehicles from settings API
        const response = await fetch('/api/settings');
        const data = await response.json();
        
        if (data && data.vehicles && Array.isArray(data.vehicles)) {
          console.log('JobDialog - Fetched fleet vehicles from API:', data.vehicles.length);
          console.log('JobDialog - Fleet vehicles data:', data.vehicles);
          setFleetVehicles(data.vehicles);
          
          // Cache in localStorage for other components
          localStorage.setItem('fleetVehicles', JSON.stringify(data.vehicles));
        } else {
          console.log('JobDialog - No fleet vehicles found in API response');
          setFleetVehicles([]);
        }
      } catch (error) {
        console.error('Error fetching fleet vehicles:', error);
        // If error occurs, set empty array
        setFleetVehicles([]);
      }
    }
  }, [open]);

  // Debug: Log fleet vehicles state
  useEffect(() => {
    console.log('JobDialog - Current fleetVehicles state:', fleetVehicles);
  }, [fleetVehicles]);

  // Set initial job data when editing
  useEffect(() => {
    if (open) {
      if (isEditing && selectedJob) {
        // Parse job data for editing
        const parsedJobData = parseJobForEditing(selectedJob);
        setNewJobData(parsedJobData);
        setJobId(selectedJob.po || selectedJob.id);
      } else {
        // Set default job data for new job
        setNewJobData({
          ...defaultJobData,
          account: userProfile?.companyName || 'White Knight Motor Club'
        });
        setJobId(generateJobId());
      }
    }
  }, [open, isEditing, selectedJob, userProfile]);

  // Update service location when location data is received
  useEffect(() => {
    if (locationData) {
      const parsedAddress = parseLocationAddress(locationData);
      if (parsedAddress) {
        setNewJobData(prev => ({
          ...prev,
          serviceLocation: parsedAddress
        }));
        
        setNotification({
          open: true,
          message: 'Customer location received',
          severity: 'success'
        });
      }
    }
  }, [locationData, parseLocationAddress, setNotification]);

  // Reset location request when dialog closes
  useEffect(() => {
    if (!open) {
      resetLocationRequest();
    }
  }, [open, resetLocationRequest]);

  // Handler for input change
  const handleInputChange = (field, value) => {
    setNewJobData(prevData => handleInputChangeUtil(prevData, field, value));
  };

  // Handler for nested input change
  const handleNestedInputChange = (parent, field, value) => {
    setNewJobData(prevData => handleNestedInputChangeUtil(prevData, parent, field, value));
  };

  // Handler for notes tab change
  const handleNotesTabChange = (tab) => {
    setActiveNotesTab(tab);
  };

  // Handler for copying customer info to pickup contact
  const handleCopyCustomer = () => {
    setNewJobData(prevData => copyCustomerToPickup(prevData));
  };

  // Handler for requesting customer location
  const handleRequestLocation = async () => {
    if (!newJobData.customerPhone) {
      setNotification({
        open: true,
        message: 'Customer phone number is required to request location',
        severity: 'error'
      });
      return;
    }
    
    const success = await sendLocationRequest(newJobData.customerPhone);
    
    if (success) {
      setNotification({
        open: true,
        message: 'Location request sent to customer',
        severity: 'success'
      });
      
      // For demo purposes only - simulate receiving a location after 10 seconds
      setTimeout(() => {
        // Simulate receiving location coordinates
        const simulatedAddress = "123 Main St, Anytown, TX 75001";
        
        // Parse the simulated address
        const addressParts = simulatedAddress.split(',');
        const street = addressParts[0].trim();
        const city = addressParts[1].trim();
        
        // Extract state and zip
        const stateZipMatch = addressParts[2].trim().match(/([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/);
        const state = stateZipMatch ? stateZipMatch[1] : '';
        const zip = stateZipMatch ? stateZipMatch[2] : '';
        
        // Update service location with simulated coordinates
        setNewJobData(prev => ({
          ...prev,
          serviceLocation: {
            ...prev.serviceLocation,
            street,
            city,
            state,
            zip
          }
        }));
        
        setNotification({
          open: true,
          message: 'Customer location received (simulated)',
          severity: 'success'
        });
      }, 10000);
    }
  };

  // Handler for job creation
  const handleJobCreate = async () => {
    // Validate job data
    const validation = validateJobData(newJobData);
    
    if (!validation.isValid) {
      setNotification({
        open: true,
        message: `Please fill in all required fields: ${validation.missingFields.join(', ')}`,
        severity: 'error'
      });
      return;
    }
    
    // Format job data for submission
    const jobDataToSubmit = formatJobDataForSubmission(newJobData, availableDrivers);
    
    console.log('Submitting job data:', jobDataToSubmit);
    
    setIsLoading(true);
    
    try {
      // Make API call to create job
      const result = await createJob(jobDataToSubmit);
      
      if (result.success) {
        // Show success notification
        setNotification({
          open: true,
          message: 'Job created successfully',
          severity: 'success'
        });
        
        // Close dialog and reset form
        onClose();
        
        // Trigger refresh of job list
        if (onJobCreated) {
          onJobCreated();
        }
      } else {
        // Show error notification
        setNotification({
          open: true,
          message: result.message,
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error creating job:', error);
      
      // Show error notification
      setNotification({
        open: true,
        message: 'Failed to create job',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for job update
  const handleJobUpdate = async () => {
    if (!selectedJob) {
      setNotification({
        open: true,
        message: 'No job selected for update',
        severity: 'error'
      });
      return;
    }
    
    // Validate job data
    const validation = validateJobData(newJobData);
    
    if (!validation.isValid) {
      setNotification({
        open: true,
        message: `Please fill in all required fields: ${validation.missingFields.join(', ')}`,
        severity: 'error'
      });
      return;
    }
    
    // Format job data for update
    const jobDataToSubmit = formatJobDataForUpdate(newJobData, selectedJob, availableDrivers);
    
    console.log('Updating job data:', jobDataToSubmit);
    
    setIsLoading(true);
    
    try {
      // Make API call to update job
      const result = await updateJob(selectedJob.id, jobDataToSubmit);
      
      if (result.success) {
        // Show success notification
        setNotification({
          open: true,
          message: result.message,
          severity: 'success'
        });
        
        // Close dialog and reset form
        onClose();
        
        // Trigger refresh of job list
        if (onJobUpdated) {
          onJobUpdated();
        }
      } else {
        // Show error notification
        setNotification({
          open: true,
          message: result.message,
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error updating job:', error);
      
      // Show error notification
      setNotification({
        open: true,
        message: 'Failed to update job',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={isLoading ? undefined : onClose}
      disableEscapeKeyDown={isLoading}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{isEditing ? 'Edit Job' : 'Create Job'}</Typography>
          <Typography variant="h6">{jobId}</Typography>
        </Box>
        <Typography variant="caption" color="textSecondary">
          Fields marked with * are required
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          {/* Left Column */}
          <Grid item xs={12} md={6}>
            <CustomerSection 
              jobData={newJobData}
              handleInputChange={handleInputChange}
              userCompanies={userCompanies}
            />
            
            <VehicleSection 
              jobData={newJobData}
              handleInputChange={handleInputChange}
              vehicleData={vehicleData}
            />
            
            <ServiceSection 
              jobData={newJobData}
              handleInputChange={handleInputChange}
              availableDrivers={availableDrivers}
              vehicles={fleetVehicles}
            />
          </Grid>
          
          {/* Right Column */}
          <Grid item xs={12} md={6}>
            <NotesSection 
              jobData={newJobData}
              handleInputChange={handleInputChange}
              activeTab={activeNotesTab}
              handleTabChange={handleNotesTabChange}
            />
            
            <LocationSection 
              jobData={newJobData}
              handleInputChange={handleInputChange}
              handleNestedInputChange={handleNestedInputChange}
              locationRequestSent={locationRequestSent}
              locationLoading={locationLoading}
              handleRequestLocation={handleRequestLocation}
            />
            
            <ContactSection 
              jobData={newJobData}
              handleNestedInputChange={handleNestedInputChange}
              handleCopyCustomer={handleCopyCustomer}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2, justifyContent: 'flex-end' }}>
        <Button 
          variant="outlined" 
          onClick={onClose} 
          disabled={isLoading}
          sx={{ mr: 1 }}
        >
          Cancel
        </Button>
        <Button 
          variant="outlined" 
          color="primary" 
          disabled={isLoading}
          sx={{ mr: 1 }}
        >
          SAVE DRAFT
        </Button>
        <Button 
          variant="contained" 
          color="primary"
          onClick={isEditing ? handleJobUpdate : handleJobCreate}
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : null}
        >
          {isLoading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'UPDATE JOB' : 'CREATE JOB')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default JobDialog;
