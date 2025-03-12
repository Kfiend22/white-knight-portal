// Dashboard.js
import React, { useEffect, useState, useCallback } from 'react';
import Papa from 'papaparse';
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
  Snackbar,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Paper,
  ButtonGroup,
  Card,
  CardContent,
  Switch,
  Divider,
} from '@mui/material';
import axios from 'axios';
import { 
  Add as AddIcon,
  MyLocation as MyLocationIcon,
  ContentCopy as ContentCopyIcon
} from '@mui/icons-material';

import SideMenu from '../components/SideMenu';
import Jobs from '../dashboard/Jobs'; // Adjust the import path according to your file structure

function Dashboard() {
  // Location types array
  const locationTypes = [
    'Residence',
    'Blocking Traffic',
    'Business',
    'Collision Center',
    'Dealership',
    'Highway',
    'Intersection',
    'Local Roadside',
    'Parking Garage',
    'Parking Lot',
    'Point of Interest',
    'Storage Facility'
  ];
  
  // Services array from Service1.jpg and Service2.jpg
  const serviceOptions = [
    'ASAP Transport',
    'Accident Tow',
    'Battery Jump',
    'EV Mobile Charge',
    'Fuel Delivery',
    'Impound',
    'Info Call',
    'Lock Out',
    'Locksmith',
    'Mobile Battery Delivery (Not-live)',
    'Mobile Cab Service',
    'Mobile Cargo Service',
    'Mobile Engine Service',
    'Mobile Exhaust Service',
    'Mobile Tire Delivery',
    'Mobile Tire Service',
    'Other',
    'Parts Delivery + 1hr Labor',
    'Recall 1',
    'Recovery',
    'Reimbursement - Emergency Trip Expense',
    'Reimbursement - Key Services',
    'Repo',
    'Reunite',
    'Secondary Tow',
    'Service Avoidance',
    'Storage (Deprecated)',
    'Technical Assistance Failure',
    'Technical Assistance Sucess',
    'Tire Change',
    'Tow',
    'Transport',
    'Trip Routing',
    'Winch Out'
  ];
  
  // Class types array from VehicleClassType.jpg
  const classTypeOptions = [
    'Flatbed',
    'Wheel Lift',
    'Light Duty',
    'Medium Duty',
    'Heavy Duty',
    'Super Heavy',
    'Service Truck',
    'Covered Flatbed',
    'Flatbed + Straps'
  ];

  // State for job creation/editing dialog
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [newJobData, setNewJobData] = useState({
    // Customer section
    account: '',
    paymentType: '',
    po: '',
    callerName: '',
    callerPhone: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    
    // Vehicle section
    vin: '',
    make: '',
    model: '',
    year: '',
    color: '',
    license: '',
    odometer: '',
    
    // Service section
    serviceTime: 'ASAP', // ASAP or Scheduled
    eta: '',
    scheduledDate: '',
    scheduledTime: '',
    service: '',
    classType: '',
    driverAssigned: '',
    truckAssigned: '',
    
    // Location section
    serviceLocationType: '',
    serviceLocation: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'USA'
    },
    dropoffLocationType: '',
    dropoffLocation: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'USA'
    },
    
    // Notes
    notes: '',
    
    // Contacts
    pickupContact: {
      name: '',
      number: ''
    },
    dropoffContact: {
      name: '',
      number: ''
    }
  });

  // State for user's companies
  const [userCompanies, setUserCompanies] = useState([]);
  
  // Scheduled time options
  const scheduledTimeOptions = [
    'ASAP',
    'Today',
    'Tomorrow',
    'This Week',
    'Next Week',
    'This Month',
    'Custom Date/Time'
  ];
  
  // State for user profile - initialize with default values to prevent null checks
  const [userProfile, setUserProfile] = useState({ primaryRole: '' });
  
  // State for location request
  const [locationRequestSent, setLocationRequestSent] = useState(false);
  
  // State for debug mode
  const [debugMode, setDebugMode] = useState(false);
  const [socketStatus, setSocketStatus] = useState({ connected: false, lastEvent: null });
  
  // State for active tab in notes section
  const [activeNotesTab, setActiveNotesTab] = useState('internal');
  
  // State for job ID
  const [jobId, setJobId] = useState('#' + Math.floor(Math.random() * 90000000 + 10000000));
  
  // State for Tabs
  const [tabValue, setTabValue] = useState(1);
  
  // State for notifications and loading
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [isLoading, setIsLoading] = useState(false);
  const [refreshJobs, setRefreshJobs] = useState(0);
  
  // Add these states for vehicle data
  const [vehicleData, setVehicleData] = useState({
    makes: [],
    models: {},
    years: [],
    colors: ['Black', 'White', 'Silver', 'Red', 'Blue', 'Gray', 'Green', 'Brown', 'Yellow', 'Orange', 'Purple', 'Gold']
  });
  
  // State for drivers list
  const [availableDrivers, setAvailableDrivers] = useState([]);

  // Check if user is authenticated and fetch user profile
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
      return;
    }
    
    // Fetch user profile
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get('/api/v1/users/profile', {
          headers: getAuthHeader()
        });
        
        if (response.data) {
          // Check if primaryRole exists before using it
          if (response.data.primaryRole !== undefined) {
            setUserProfile(response.data);
            
            // Set company name in account field if available
            if (response.data.companyName) {
              setNewJobData(prev => ({
                ...prev,
                account: response.data.companyName
              }));
            }
            
            // Set user companies based on profile
            setUserCompanies([
              { id: '1', name: response.data.companyName || 'White Knight Motor Club' }
            ]);
            
            // If user's primary role is driver, set tab to active jobs (index 1)
            if (response.data.primaryRole === 'driver') {
              setTabValue(1); // Active Jobs tab
            }
          } else {
            // Handle the case where primaryRole is missing
            console.error("User profile missing primaryRole:", response.data);
            // Keep the default userProfile with empty primaryRole
          }
        } else {
          // Handle empty response.data
          console.error("Empty response from user profile API");
          // Keep the default userProfile with empty primaryRole
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Use default company if API fails
        setUserCompanies([
          { id: '1', name: 'White Knight Motor Club' }
        ]);
        // Default userProfile is already set with empty primaryRole
      }
    };
    
    fetchUserProfile();
  }, []);

  // Fetch available drivers (only on-duty drivers)
  useEffect(() => {
    const fetchAvailableDrivers = async () => {
      try {
        const response = await axios.get('/api/drivers/available', {
          headers: getAuthHeader()
        });
        
        setAvailableDrivers(response.data);
      } catch (error) {
        console.error('Error fetching available drivers:', error);
        setNotification({
          open: true,
          message: 'Failed to load available drivers',
          severity: 'error'
        });
      }
    };
    
    // Fetch drivers when job dialog opens
    if (jobDialogOpen) {
      fetchAvailableDrivers();
    }
  }, [jobDialogOpen]);
  
  // Load CSV data when component mounts
  useEffect(() => {
    const loadVehicleData = async () => {
      try {
        // Use the direct path to the file in the public folder
        const response = await fetch('/csvs/VehicleList.csv');
        const csvText = await response.text();
      
        Papa.parse(csvText, {
          header: true,
          complete: (results) => {
            const parsedData = results.data;
          
            // Extract makes
            const uniqueMakes = [...new Set(parsedData
              .filter(row => row.Make && row.Make.trim() !== '')
              .map(row => row.Make.trim()))];
          
            // Extract models by make
            const modelsByMake = {};
            uniqueMakes.forEach(make => {
              modelsByMake[make] = [...new Set(parsedData
                .filter(row => row.Make === make && row.Model && row.Model.trim() !== '')
                .map(row => row.Model.trim()))];
            });
          
            // Extract production years from the CSV
            let uniqueYears = [];
            
            // Try to extract years from "Production years" column
            parsedData.forEach(row => {
              if (row['Production years']) {
                // Extract years from formats like "1962-1968" or "1962-1968, 1983-1990"
                const yearRanges = row['Production years'].split(',');
                yearRanges.forEach(range => {
                  const years = range.trim().split('-');
                  if (years.length >= 1) {
                    // Extract start year
                    const startYear = parseInt(years[0].trim());
                    if (!isNaN(startYear) && !uniqueYears.includes(startYear.toString())) {
                      uniqueYears.push(startYear.toString());
                    }
                    
                    // Extract end year if available
                    if (years.length > 1) {
                      const endYear = parseInt(years[1].trim());
                      if (!isNaN(endYear) && !uniqueYears.includes(endYear.toString())) {
                        uniqueYears.push(endYear.toString());
                      }
                      
                      // Add years in between
                      for (let year = startYear + 1; year < endYear; year++) {
                        if (!uniqueYears.includes(year.toString())) {
                          uniqueYears.push(year.toString());
                        }
                      }
                    }
                  }
                });
              }
            });
            
            // If no years were extracted, generate recent years
            if (uniqueYears.length === 0) {
              uniqueYears = Array.from({ length: 30 }, (_, i) => 
                (new Date().getFullYear() - i).toString());
            }
          
            // Sort years in descending order
            uniqueYears.sort((a, b) => b - a);
          
            // Use functional update pattern to avoid dependency on vehicleData.colors
            setVehicleData(prevData => ({
              makes: uniqueMakes,
              models: modelsByMake,
              years: uniqueYears,
              colors: prevData.colors // Keep existing colors using prevData
            }));
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
          }
        });
      } catch (error) {
        console.error('Error loading CSV file:', error);
      }
    };
  
    loadVehicleData();
  }, []);
  
  // Helper function to get auth headers
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  // Handler for tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handler for adding a new job
  const handleAddJob = () => {
    setIsEditing(false);
    setSelectedJob(null);
    setJobDialogOpen(true);
    // Generate a new job ID
    setJobId('#' + Math.floor(Math.random() * 90000000 + 10000000));
  };
  
  // Handler for editing job
  const handleEditJob = (job) => {
    setIsEditing(true);
    setSelectedJob(job);
    setJobId(job.po || job.id);
    
    // Parse locations
    let serviceLocationType = '';
    let serviceLocation = {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'USA'
    };
    
    // Handle service location
    if (job.serviceLocation) {
      // Check if serviceLocation is an object with the new structure
      if (typeof job.serviceLocation === 'object' && job.serviceLocation !== null) {
        serviceLocation = {
          street: job.serviceLocation.street || '',
          city: job.serviceLocation.city || '',
          state: job.serviceLocation.state || '',
          zip: job.serviceLocation.zip || '',
          country: job.serviceLocation.country || 'USA'
        };
      } else if (typeof job.serviceLocation === 'string') {
        // Handle legacy string format
        const match = job.serviceLocation.match(/^([^:]+):\s*(.+)$/);
        if (match) {
          serviceLocationType = match[1];
          // Try to parse the address into components
          const addressParts = match[2].split(',');
          if (addressParts.length >= 2) {
            serviceLocation.street = addressParts[0].trim();
            
            // Parse city, state, zip
            if (addressParts.length >= 2) {
              serviceLocation.city = addressParts[1].trim();
            }
            
            if (addressParts.length >= 3) {
              // Try to extract state and zip from the last part
              const stateZipMatch = addressParts[2].trim().match(/^([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
              if (stateZipMatch) {
                serviceLocation.state = stateZipMatch[1];
                serviceLocation.zip = stateZipMatch[2];
              } else {
                serviceLocation.state = addressParts[2].trim();
              }
            }
          } else {
            // If we can't parse it properly, just put everything in street
            serviceLocation.street = match[2];
          }
        } else if (job.serviceLocation) {
          // No type prefix, just an address
          serviceLocation.street = job.serviceLocation;
        }
      }
    } else if (job.location) {
      // Fall back to location field if serviceLocation is not available
      const match = job.location.match(/^([^:]+):\s*(.+)$/);
      if (match) {
        serviceLocationType = match[1];
        serviceLocation.street = match[2];
      } else if (job.location) {
        serviceLocation.street = job.location;
      }
    }
    
    // Handle dropoff location
    let dropoffLocationType = '';
    let dropoffLocation = {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'USA'
    };
    
    if (job.dropoffLocation) {
      // Check if dropoffLocation is an object with the new structure
      if (typeof job.dropoffLocation === 'object' && job.dropoffLocation !== null) {
        dropoffLocation = {
          street: job.dropoffLocation.street || '',
          city: job.dropoffLocation.city || '',
          state: job.dropoffLocation.state || '',
          zip: job.dropoffLocation.zip || '',
          country: job.dropoffLocation.country || 'USA'
        };
      } else if (typeof job.dropoffLocation === 'string') {
        // Handle legacy string format
        const match = job.dropoffLocation.match(/^([^:]+):\s*(.+)$/);
        if (match) {
          dropoffLocationType = match[1];
          // Try to parse the address into components
          const addressParts = match[2].split(',');
          if (addressParts.length >= 2) {
            dropoffLocation.street = addressParts[0].trim();
            
            // Parse city, state, zip
            if (addressParts.length >= 2) {
              dropoffLocation.city = addressParts[1].trim();
            }
            
            if (addressParts.length >= 3) {
              // Try to extract state and zip from the last part
              const stateZipMatch = addressParts[2].trim().match(/^([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
              if (stateZipMatch) {
                dropoffLocation.state = stateZipMatch[1];
                dropoffLocation.zip = stateZipMatch[2];
              } else {
                dropoffLocation.state = addressParts[2].trim();
              }
            }
          } else {
            // If we can't parse it properly, just put everything in street
            dropoffLocation.street = match[2];
          }
        } else if (job.dropoffLocation) {
          // No type prefix, just an address
          dropoffLocation.street = job.dropoffLocation;
        }
      }
    }
    
    // Extract vehicle information
    const vehicleInfo = job.vehicle || {};
    
    // Parse ETA
    let serviceTime = 'ASAP';
    let eta = job.eta || '';
    let scheduledDate = '';
    let scheduledTime = '';
    
    if (typeof eta === 'string' && eta.includes('Scheduled for')) {
      serviceTime = 'Scheduled';
      const dateTimeStr = eta.replace('Scheduled for ', '');
      // Try to parse the date and time
      try {
        const dateObj = new Date(dateTimeStr);
        scheduledDate = dateObj.toLocaleDateString();
        scheduledTime = 'Custom Date/Time';
      } catch (e) {
        // If parsing fails, just keep the string as is
        scheduledDate = dateTimeStr;
        scheduledTime = 'Custom Date/Time';
      }
    }
    
    // Set the form data
    setNewJobData({
      // Customer section
      account: job.account || '',
      paymentType: job.paymentType || '',
      po: job.po || '',
      callerName: job.callerName || '',
      callerPhone: job.callerPhone || '',
      customerName: job.customerName || '',
      customerPhone: job.customerPhone || '',
      customerEmail: job.customerEmail || '',
      
      // Vehicle section
      vin: vehicleInfo.vin || '',
      make: vehicleInfo.make || '',
      model: vehicleInfo.model || '',
      year: vehicleInfo.year || '',
      color: vehicleInfo.color || '',
      license: vehicleInfo.license || '',
      odometer: vehicleInfo.odometer || '',
      
      // Service section
      serviceTime: serviceTime,
      eta: serviceTime === 'ASAP' ? eta : '',
      scheduledDate: scheduledDate,
      scheduledTime: scheduledTime,
      service: job.service || '',
      classType: job.classType || '',
      driverAssigned: job.driverId || '',
      truckAssigned: job.truck || '',
      
      // Location section
      serviceLocationType: serviceLocationType,
      serviceLocation: serviceLocation,
      dropoffLocationType: dropoffLocationType,
      dropoffLocation: dropoffLocation,
      
      // Notes
      notes: job.notes || '',
      
      // Contacts
      pickupContact: job.pickupContact || { name: '', number: '' },
      dropoffContact: job.dropoffContact || { name: '', number: '' }
    });
    
    setJobDialogOpen(true);
  };

  const handleJobDialogClose = () => {
    setJobDialogOpen(false);
    setIsEditing(false);
    setSelectedJob(null);
    setNewJobData({
      // Customer section
      account: userProfile?.companyName || 'White Knight Motor Club',
      paymentType: '',
      po: '',
      callerName: '',
      callerPhone: '',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      
      // Vehicle section
      vin: '',
      make: '',
      model: '',
      year: '',
      color: '',
      license: '',
      odometer: '',
      
      // Service section
      serviceTime: 'ASAP',
      eta: '',
      scheduledDate: '',
      scheduledTime: '',
      service: '',
      classType: '',
      driverAssigned: '',
      truckAssigned: '',
      
      // Location section
      serviceLocationType: '',
      serviceLocation: {
        street: '',
        city: '',
        state: '',
        zip: '',
        country: 'USA'
      },
      dropoffLocationType: '',
      dropoffLocation: {
        street: '',
        city: '',
        state: '',
        zip: '',
        country: 'USA'
      },
      
      // Notes
      notes: '',
      
      // Contacts
      pickupContact: {
        name: '',
        number: ''
      },
      dropoffContact: {
        name: '',
        number: ''
      }
    });
    setLocationRequestSent(false);
  };

  // Handler for updating an existing job
  const handleJobUpdate = async () => {
    if (!selectedJob) {
      setNotification({
        open: true,
        message: 'No job selected for update',
        severity: 'error'
      });
      return;
    }
    
    // Validate mandatory fields (same validation as handleJobCreate)
    const mandatoryFields = [
      { field: 'year', label: 'Year' },
      { field: 'make', label: 'Make' },
      { field: 'model', label: 'Model' },
      { field: 'customerName', label: 'Customer Name' },
      { field: 'customerPhone', label: 'Customer Phone' },
      { field: 'serviceLocationType', label: 'Service Location Type' },
      { field: 'serviceLocation.street', label: 'Service Location Street' },
      { field: 'serviceLocation.city', label: 'Service Location City' },
      { field: 'serviceLocation.state', label: 'Service Location State' },
      { field: 'serviceLocation.zip', label: 'Service Location ZIP' },
      { field: 'pickupContact.name', label: 'Pickup Name' },
      { field: 'pickupContact.number', label: 'Pickup Number' },
      { field: 'service', label: 'Service' },
      { field: 'classType', label: 'Class Type' }
    ];
    
    // Check if ETA is required based on service time
    if (newJobData.serviceTime === 'ASAP') {
      mandatoryFields.push({ field: 'eta', label: 'ETA' });
    } else {
      mandatoryFields.push({ field: 'scheduledDate', label: 'Scheduled Date' });
      mandatoryFields.push({ field: 'scheduledTime', label: 'Scheduled Time' });
    }
    
    // Check each mandatory field
    const missingFields = mandatoryFields.filter(item => {
      if (item.field.includes('.')) {
        // Handle nested fields like pickupContact.name or serviceLocation.street
        const [parent, child] = item.field.split('.');
        return !newJobData[parent] || !newJobData[parent][child];
      }
      return !newJobData[item.field];
    });
    
    if (missingFields.length > 0) {
      setNotification({
        open: true,
        message: `Please fill in all required fields: ${missingFields.map(f => f.label).join(', ')}`,
        severity: 'error'
      });
      return;
    }
    
    // Format the ETA based on service time
    const etaFormatted = newJobData.serviceTime === 'Scheduled' ? 
      `Scheduled for ${newJobData.scheduledDate} ${newJobData.scheduledTime}` : newJobData.eta;
    
    // Prepare data for submission
    const jobDataToSubmit = {
      ...newJobData,
      // Set formatted fields
      eta: etaFormatted,
      // Extract vehicle fields for backward compatibility
      year: newJobData.year,
      make: newJobData.make,
      model: newJobData.model,
      color: newJobData.color,
      license: newJobData.license,
      vin: newJobData.vin,
      odometer: newJobData.odometer
    };
    
    // Handle driver assignment
    if (newJobData.driverAssigned) {
      // Find the driver information from availableDrivers
      const selectedDriver = availableDrivers.find(driver => driver.id === newJobData.driverAssigned);
      
      if (selectedDriver) {
        // Check if this is a driver reassignment
        const isDriverReassignment = selectedJob.driverId && 
                                    selectedJob.driverId !== newJobData.driverAssigned;
        
        // Add driver information to the submission data
        jobDataToSubmit.driverId = selectedDriver.id;
        jobDataToSubmit.driver = selectedDriver.name;
        
        // If this is a reassignment, we'll let the backend handle the status change
        // Otherwise, set the status explicitly
        if (!isDriverReassignment) {
          jobDataToSubmit.status = 'Pending Acceptance';
          jobDataToSubmit.needsAcceptance = true;
        }
        
        console.log(`Driver assignment: ${isDriverReassignment ? 'Reassignment' : 'New assignment'} to ${selectedDriver.name}`);
      }
    } else if (selectedJob.driverId && !newJobData.driverAssigned) {
      // If driver was previously assigned but now removed, clear driver fields
      jobDataToSubmit.driverId = null;
      jobDataToSubmit.driver = null;
      jobDataToSubmit.status = 'Pending'; // Reset to pending status
      jobDataToSubmit.needsAcceptance = false;
      
      console.log('Driver assignment removed');
    }
    
    // Only include dropoffContact if both name and number are provided
    if (!newJobData.dropoffContact.name && !newJobData.dropoffContact.number) {
      delete jobDataToSubmit.dropoffContact;
    }
    
    console.log('Updating job data:', jobDataToSubmit);
    
    setIsLoading(true);
    
    try {
      // Make API call to update job - use PUT request with the job ID
      const response = await axios.put(`/api/jobs/${selectedJob.id}`, jobDataToSubmit, {
        headers: getAuthHeader()
      });
      
      // Show success notification with custom message if provided by the API
      setNotification({
        open: true,
        message: response.data.message || 'Job updated successfully',
        severity: 'success'
      });
      
      // Close dialog and reset form
      handleJobDialogClose();
      
      // Trigger refresh of job list
      setRefreshJobs(prev => prev + 1);
    } catch (error) {
      console.error('Error updating job:', error);
      
      // Show error notification
      setNotification({
        open: true,
        message: error.response?.data?.message || 'Failed to update job',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJobCreate = async () => {
    // Validate mandatory fields
    const mandatoryFields = [
      { field: 'year', label: 'Year' },
      { field: 'make', label: 'Make' },
      { field: 'model', label: 'Model' },
      { field: 'customerName', label: 'Customer Name' },
      { field: 'customerPhone', label: 'Customer Phone' },
      { field: 'serviceLocationType', label: 'Service Location Type' },
      { field: 'serviceLocation.street', label: 'Service Location Street' },
      { field: 'serviceLocation.city', label: 'Service Location City' },
      { field: 'serviceLocation.state', label: 'Service Location State' },
      { field: 'serviceLocation.zip', label: 'Service Location ZIP' },
      { field: 'pickupContact.name', label: 'Pickup Name' },
      { field: 'pickupContact.number', label: 'Pickup Number' },
      { field: 'service', label: 'Service' },
      { field: 'classType', label: 'Class Type' }
    ];
    
    // Check if ETA is required based on service time
    if (newJobData.serviceTime === 'ASAP') {
      mandatoryFields.push({ field: 'eta', label: 'ETA' });
    } else {
      mandatoryFields.push({ field: 'scheduledDate', label: 'Scheduled Date' });
      mandatoryFields.push({ field: 'scheduledTime', label: 'Scheduled Time' });
    }
    
    // Check each mandatory field
    const missingFields = mandatoryFields.filter(item => {
      if (item.field.includes('.')) {
        // Handle nested fields like pickupContact.name or serviceLocation.street
        const [parent, child] = item.field.split('.');
        return !newJobData[parent] || !newJobData[parent][child];
      }
      return !newJobData[item.field];
    });
    
    if (missingFields.length > 0) {
      setNotification({
        open: true,
        message: `Please fill in all required fields: ${missingFields.map(f => f.label).join(', ')}`,
        severity: 'error'
      });
      return;
    }
    
    // Format the ETA based on service time
    const etaFormatted = newJobData.serviceTime === 'Scheduled' ? 
      `Scheduled for ${newJobData.scheduledDate} ${newJobData.scheduledTime}` : newJobData.eta;
    
    // Prepare data for submission
    const jobDataToSubmit = {
      ...newJobData,
      // Set formatted fields
      eta: etaFormatted,
      // Extract vehicle fields for backward compatibility
      year: newJobData.year,
      make: newJobData.make,
      model: newJobData.model,
      color: newJobData.color,
      license: newJobData.license,
      vin: newJobData.vin,
      odometer: newJobData.odometer
    };
    
    // If a driver is assigned, set appropriate fields
    if (newJobData.driverAssigned) {
      // Find the driver information from availableDrivers
      const selectedDriver = availableDrivers.find(driver => driver.id === newJobData.driverAssigned);
      
      if (selectedDriver) {
        jobDataToSubmit.driverId = selectedDriver.id;
        jobDataToSubmit.driver = selectedDriver.name;
        jobDataToSubmit.status = 'Pending Acceptance';
        jobDataToSubmit.assignedAt = new Date().toISOString();
        jobDataToSubmit.needsAcceptance = true;
      }
    }
    
    // Only include dropoffContact if both name and number are provided
    if (!newJobData.dropoffContact.name && !newJobData.dropoffContact.number) {
      delete jobDataToSubmit.dropoffContact;
    }
    
    console.log('Submitting job data:', jobDataToSubmit);
    
    setIsLoading(true);
    
    try {
      // Make API call to create job
      await axios.post('/api/jobs', jobDataToSubmit, {
        headers: getAuthHeader()
      });
      
      // Show success notification
      setNotification({
        open: true,
        message: 'Job created successfully',
        severity: 'success'
      });
      
      // Close dialog and reset form
      handleJobDialogClose();
      
      // Trigger refresh of job list
      setRefreshJobs(prev => prev + 1);
    } catch (error) {
      console.error('Error creating job:', error);
      
      // Show error notification
      setNotification({
        open: true,
        message: error.response?.data?.message || 'Failed to create job',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

// Handler for receiving a demo job
  const createDemoJob = useCallback(() => {
    setIsLoading(true);
    
    // Create a demo job object with the new address structure
    const demoJob = {
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
    
    // Make API call to create demo job
    axios.post('/api/jobs/demo', demoJob, {
      headers: getAuthHeader()
    })
      .then(() => {
        setNotification({
          open: true,
          message: 'Demo job created successfully',
          severity: 'success'
        });
        
        // Trigger refresh of job list
        setRefreshJobs(prev => prev + 1);
      })
      .catch(error => {
        console.error('Error creating demo job:', error);
        setNotification({
          open: true,
          message: error.response?.data?.message || 'Failed to create demo job',
          severity: 'error'
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);
  
  // Handler for closing notifications
  const handleNotificationClose = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  // Handler for notes tab change
  const handleNotesTabChange = (tab) => {
    setActiveNotesTab(tab);
  };

  // Handler for copying customer info to pickup contact
  const handleCopyCustomer = () => {
    setNewJobData({
      ...newJobData,
      pickupContact: {
        name: newJobData.customerName,
        number: newJobData.customerPhone
      }
    });
  };

  // Handler for input change
  const handleInputChange = (field, value) => {
    setNewJobData({
      ...newJobData,
      [field]: value
    });
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
    
    setIsLoading(true);
    
    try {
      // Generate a unique request ID for this location request
      const requestId = Date.now().toString();
      
      // Format the phone number (remove any non-numeric characters)
      const formattedPhone = newJobData.customerPhone.replace(/\D/g, '');
      
      // Make API call to send location request text
      const response = await axios.post('/api/location/request', {
        phone: formattedPhone,
        requestId: requestId
      }, {
        headers: getAuthHeader()
      });
      
      if (response.data.success) {
        setLocationRequestSent(true);
        setNotification({
          open: true,
          message: 'Location request sent to customer',
          severity: 'success'
        });
        
        // Start polling for location updates
        const pollInterval = setInterval(async () => {
          try {
            const pollResponse = await axios.get(`/api/location/${requestId}`, {
              headers: getAuthHeader()
            });
            
            // Check if location has been received
            if (pollResponse.data.status === 'completed' && pollResponse.data.location) {
              // Clear the polling interval
              clearInterval(pollInterval);
              
              // Get the address from the response
              const address = pollResponse.data.location.address || 
                `${pollResponse.data.location.latitude}, ${pollResponse.data.location.longitude}`;
              
              // Parse the address into components if possible
              if (address) {
                const addressParts = address.split(',');
                if (addressParts.length >= 3) {
                  // Try to parse the address into street, city, state, zip
                  const street = addressParts[0].trim();
                  const city = addressParts[1].trim();
                  
                  // Try to extract state and zip from the last part
                  const stateZipMatch = addressParts[2].trim().match(/^([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
                  let state = '';
                  let zip = '';
                  
                  if (stateZipMatch) {
                    state = stateZipMatch[1];
                    zip = stateZipMatch[2];
                  } else {
                    // If we can't parse state and zip, just use the last part as state
                    state = addressParts[2].trim();
                  }
                  
                  // Update the service location with parsed components
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
                } else {
                  // If we can't parse the address, just put everything in street
                  setNewJobData(prev => ({
                    ...prev,
                    serviceLocation: {
                      ...prev.serviceLocation,
                      street: address
                    }
                  }));
                }
              }
              
              setNotification({
                open: true,
                message: 'Customer location received',
                severity: 'success'
              });
            }
          } catch (error) {
            console.error('Error polling for location:', error);
          }
        }, 5000); // Poll every 5 seconds
        
        // Stop polling after 5 minutes (300000 ms)
        setTimeout(() => {
          clearInterval(pollInterval);
        }, 300000);
      } else {
        throw new Error('Failed to send location request');
      }
      
      // For demo purposes only - simulate receiving a location after 10 seconds
      // This would be removed in production when the real API is working
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
      
    } catch (error) {
      console.error('Error requesting location:', error);
      setNotification({
        open: true,
        message: error.response?.data?.message || 'Failed to send location request',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for nested input change
  const handleNestedInputChange = (parent, field, value) => {
    setNewJobData({
      ...newJobData,
      [parent]: {
        ...newJobData[parent],
        [field]: value
      }
    });
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
        <Box mb={2}>
          <Box display="flex" justifyContent="flex-end" alignItems="center">
            <Typography variant="caption" sx={{ mr: 1 }}>Debug Mode</Typography>
            <Switch
              checked={debugMode}
              onChange={(e) => setDebugMode(e.target.checked)}
              size="small"
            />
          </Box>
          
          {debugMode && (
            <Card variant="outlined" sx={{ mt: 1, mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Debug Information</Typography>
                
                <Typography variant="subtitle1">User Profile</Typography>
                <Box sx={{ p: 1, mb: 2, bgcolor: 'background.paper', borderRadius: 1, fontSize: '0.875rem' }}>
                  <pre style={{ margin: 0, overflow: 'auto' }}>
                    {JSON.stringify(userProfile, null, 2)}
                  </pre>
                </Box>
                
                <Typography variant="subtitle1">Socket Status</Typography>
                <Box sx={{ p: 1, bgcolor: 'background.paper', borderRadius: 1, fontSize: '0.875rem' }}>
                  <Typography>
                    Connected: <span style={{ color: socketStatus.connected ? 'green' : 'red' }}>
                      {socketStatus.connected ? 'Yes' : 'No'}
                    </span>
                  </Typography>
                  {socketStatus.lastEvent && (
                    <Typography>
                      Last Event: {socketStatus.lastEvent.type} at {new Date(socketStatus.lastEvent.time).toLocaleTimeString()}
                    </Typography>
                  )}
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle1">Socket Event Listeners</Typography>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  size="small"
                  onClick={() => {
                    // Manually dispatch a test event
                    window.dispatchEvent(new CustomEvent('job-assigned', { 
                      detail: { message: 'Test job assignment event' } 
                    }));
                    setSocketStatus(prev => ({
                      ...prev,
                      lastEvent: { type: 'job-assigned (test)', time: Date.now() }
                    }));
                    setNotification({
                      open: true,
                      message: 'Test job-assigned event dispatched',
                      severity: 'info'
                    });
                  }}
                >
                  Test Job Assigned Event
                </Button>
              </CardContent>
            </Card>
          )}
        </Box>
        
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
                  refreshTrigger={refreshJobs}
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
                  refreshTrigger={refreshJobs}
                  onSocketStatusChange={setSocketStatus}
                />
                
                <Typography variant="h5" mt={4} gutterBottom>
                  Jobs Awaiting Your Acceptance
                </Typography>
                <Jobs
                  jobCategory="pending"
                  onEditJob={handleEditJob}
                  refreshTrigger={refreshJobs}
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
                  refreshTrigger={refreshJobs}
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
                  refreshTrigger={refreshJobs}
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
                  onReceiveDemoJob={createDemoJob}
                  refreshTrigger={refreshJobs}
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

        {/* Job Creation Dialog */}
        <Dialog 
          open={jobDialogOpen} 
          onClose={isLoading ? undefined : handleJobDialogClose}
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
              {/* Customer Section */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Typography variant="h6" gutterBottom>Customer</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControl fullWidth margin="dense">
                        <InputLabel>Account</InputLabel>
                        <Select
                          value={newJobData.account}
                          onChange={(e) => handleInputChange('account', e.target.value)}
                          label="Account"
                        >
                          <MenuItem value="">
                            <em>- Select -</em>
                          </MenuItem>
                          {userCompanies.map((company) => (
                            <MenuItem key={company.id} value={company.name}>
                              {company.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={8}>
                      <FormControl fullWidth margin="dense">
                        <InputLabel>Payment Type</InputLabel>
                        <Select
                          value={newJobData.paymentType}
                          onChange={(e) => handleInputChange('paymentType', e.target.value)}
                          label="Payment Type"
                        >
                          <MenuItem value="">
                            <em>- Select -</em>
                          </MenuItem>
                          <MenuItem value="Credit Card">Credit Card</MenuItem>
                          <MenuItem value="Cash">Cash</MenuItem>
                          <MenuItem value="Invoice">Invoice</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        margin="dense"
                        label="PO"
                        fullWidth
                        value={newJobData.po}
                        disabled
                        helperText="Auto-generated on job creation"
                        InputProps={{
                          readOnly: true,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        margin="dense"
                        label="Caller Name"
                        fullWidth
                        value={newJobData.callerName}
                        onChange={(e) => handleInputChange('callerName', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        margin="dense"
                        label="Caller Phone"
                        fullWidth
                        value={newJobData.callerPhone}
                        onChange={(e) => handleInputChange('callerPhone', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        margin="dense"
                        label="Customer Name *"
                        fullWidth
                        value={newJobData.customerName}
                        onChange={(e) => handleInputChange('customerName', e.target.value)}
                        placeholder="First & Last Name"
                        required
                        error={!newJobData.customerName}
                        helperText={!newJobData.customerName ? "Required" : ""}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        margin="dense"
                        label="Customer Phone *"
                        fullWidth
                        value={newJobData.customerPhone}
                        onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                        required
                        error={!newJobData.customerPhone}
                        helperText={!newJobData.customerPhone ? "Required" : ""}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        margin="dense"
                        label="Customer Email"
                        fullWidth
                        value={newJobData.customerEmail}
                        onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </Paper>

                {/* Vehicle Section */}
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Typography variant="h6" gutterBottom>Vehicle</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        margin="dense"
                        label="VIN"
                        fullWidth
                        value={newJobData.vin}
                        onChange={(e) => handleInputChange('vin', e.target.value)}
                        placeholder="Valid VIN Autofills Vehicle"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth margin="dense">
                        <InputLabel required error={!newJobData.make}>Make *</InputLabel>
                        <Select
                          value={newJobData.make}
                          onChange={(e) => {
                            // Update both make and model in a single state update
                            const updatedData = {
                              ...newJobData,
                              make: e.target.value,
                              model: '' // Reset model when make changes
                            };
                            setNewJobData(updatedData);
                            console.log('Make selected:', e.target.value);
                            console.log('Updated vehicle data:', updatedData);
                          }}
                          label="Make *"
                          required
                          error={!newJobData.make}
                        >
                          <MenuItem value="">
                            <em>Select</em>
                          </MenuItem>
                          {vehicleData.makes.map((make) => (
                            <MenuItem key={make} value={make}>
                              {make}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth margin="dense">
                        <InputLabel required error={!newJobData.model}>Model *</InputLabel>
                        <Select
                          value={newJobData.model}
                          onChange={(e) => handleInputChange('model', e.target.value)}
                          label="Model *"
                          disabled={!newJobData.make} // Disable if no make selected
                          required
                          error={!newJobData.model}
                        >
                          <MenuItem value="">
                            <em>Select</em>
                          </MenuItem>
                          {newJobData.make && vehicleData.models[newJobData.make] ? 
                            vehicleData.models[newJobData.make].map((model) => (
                              <MenuItem key={model} value={model}>
                                {model}
                              </MenuItem>
                            )) : null
                          }
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth margin="dense">
                        <InputLabel required error={!newJobData.year}>Year *</InputLabel>
                        <Select
                          value={newJobData.year}
                          onChange={(e) => handleInputChange('year', e.target.value)}
                          label="Year *"
                          required
                          error={!newJobData.year}
                        >
                          <MenuItem value="">
                            <em>Select</em>
                          </MenuItem>
                          {vehicleData.years.map((year) => (
                            <MenuItem key={year} value={year}>
                              {year}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth margin="dense">
                        <InputLabel>Color</InputLabel>
                        <Select
                          value={newJobData.color}
                          onChange={(e) => handleInputChange('color', e.target.value)}
                          label="Color"
                        >
                          <MenuItem value="">
                            <em>Select</em>
                          </MenuItem>
                          <MenuItem value="Black">Black</MenuItem>
                          <MenuItem value="White">White</MenuItem>
                          <MenuItem value="Silver">Silver</MenuItem>
                          <MenuItem value="Red">Red</MenuItem>
                          <MenuItem value="Blue">Blue</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        margin="dense"
                        label="License"
                        fullWidth
                        value={newJobData.license}
                        onChange={(e) => handleInputChange('license', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        margin="dense"
                        label="Odometer"
                        fullWidth
                        value={newJobData.odometer}
                        onChange={(e) => handleInputChange('odometer', e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </Paper>

                {/* Service Section */}
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>Service</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>Service Time</Typography>
                      <ButtonGroup variant="outlined" fullWidth>
                        <Button 
                          variant={newJobData.serviceTime === 'ASAP' ? 'contained' : 'outlined'}
                          onClick={() => handleInputChange('serviceTime', 'ASAP')}
                        >
                          ASAP
                        </Button>
                        <Button 
                          variant={newJobData.serviceTime === 'Scheduled' ? 'contained' : 'outlined'}
                          onClick={() => handleInputChange('serviceTime', 'Scheduled')}
                        >
                          Scheduled
                        </Button>
                      </ButtonGroup>
                    </Grid>
                    <Grid item xs={12}>
                      {newJobData.serviceTime === 'ASAP' ? (
                        <TextField
                          margin="dense"
                          label="ETA *"
                          fullWidth
                          value={newJobData.eta}
                          onChange={(e) => handleInputChange('eta', e.target.value)}
                          required
                          error={!newJobData.eta}
                          helperText={!newJobData.eta ? "Required" : ""}
                        />
                      ) : (
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <FormControl fullWidth margin="dense">
                              <InputLabel required error={!newJobData.scheduledTime}>Scheduled For *</InputLabel>
                              <Select
                                value={newJobData.scheduledTime}
                                onChange={(e) => {
                                  const selectedOption = e.target.value;
                                  handleInputChange('scheduledTime', selectedOption);
                                  
                                  // If "Custom Date/Time" is selected, don't set a date
                                  if (selectedOption !== 'Custom Date/Time') {
                                    // Set a default date based on the selection
                                    const today = new Date();
                                    let scheduledDate = today.toLocaleDateString();
                                    
                                    if (selectedOption === 'Tomorrow') {
                                      const tomorrow = new Date();
                                      tomorrow.setDate(today.getDate() + 1);
                                      scheduledDate = tomorrow.toLocaleDateString();
                                    } else if (selectedOption === 'This Week') {
                                      // Set to end of current week (Saturday)
                                      const endOfWeek = new Date();
                                      const daysToSaturday = 6 - today.getDay(); // 6 is Saturday
                                      endOfWeek.setDate(today.getDate() + daysToSaturday);
                                      scheduledDate = endOfWeek.toLocaleDateString();
                                    } else if (selectedOption === 'Next Week') {
                                      // Set to middle of next week (Wednesday)
                                      const nextWednesday = new Date();
                                      const daysToNextWednesday = (10 - today.getDay()) % 7 + 3; // 3 is Wednesday
                                      nextWednesday.setDate(today.getDate() + daysToNextWednesday);
                                      scheduledDate = nextWednesday.toLocaleDateString();
                                    } else if (selectedOption === 'This Month') {
                                      // Set to end of current month
                                      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                                      scheduledDate = endOfMonth.toLocaleDateString();
                                    }
                                    
                                    handleInputChange('scheduledDate', scheduledDate);
                                  }
                                }}
                                label="Scheduled For *"
                                required
                                error={!newJobData.scheduledTime}
                              >
                                <MenuItem value="">
                                  <em>- Select -</em>
                                </MenuItem>
                                {scheduledTimeOptions.map((option) => (
                                  <MenuItem key={option} value={option}>
                                    {option}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                          
                          {newJobData.scheduledTime === 'Custom Date/Time' && (
                            <>
                              <Grid item xs={6}>
                                <TextField
                                  margin="dense"
                                  label="Date (MM/DD/YYYY) *"
                                  fullWidth
                                  value={newJobData.scheduledDate}
                                  onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
                                  placeholder="MM/DD/YYYY"
                                  required
                                  error={!newJobData.scheduledDate}
                                  helperText={!newJobData.scheduledDate ? "Required" : ""}
                                />
                              </Grid>
                              <Grid item xs={6}>
                                <TextField
                                  margin="dense"
                                  label="Time (HH:MM AM/PM) *"
                                  fullWidth
                                  value={newJobData.customTime || ''}
                                  onChange={(e) => handleInputChange('customTime', e.target.value)}
                                  placeholder="HH:MM AM"
                                  required
                                />
                              </Grid>
                            </>
                          )}
                        </Grid>
                      )}
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl fullWidth margin="dense">
                        <InputLabel required error={!newJobData.service}>Service *</InputLabel>
                        <Select
                          value={newJobData.service}
                          onChange={(e) => handleInputChange('service', e.target.value)}
                          label="Service *"
                          required
                          error={!newJobData.service}
                        >
                          <MenuItem value="">
                            <em>- Select -</em>
                          </MenuItem>
                          {serviceOptions.map((service) => (
                            <MenuItem key={service} value={service}>
                              {service}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl fullWidth margin="dense">
                        <InputLabel required error={!newJobData.classType}>Class Type *</InputLabel>
                        <Select
                          value={newJobData.classType}
                          onChange={(e) => handleInputChange('classType', e.target.value)}
                          label="Class Type *"
                          required
                          error={!newJobData.classType}
                        >
                          <MenuItem value="">
                            <em>- Select -</em>
                          </MenuItem>
                          {classTypeOptions.map((classType) => (
                            <MenuItem key={classType} value={classType}>
                              {classType}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl fullWidth margin="dense">
                        <InputLabel>Driver Assigned</InputLabel>
                        <Select
                          value={newJobData.driverAssigned}
                          onChange={(e) => handleInputChange('driverAssigned', e.target.value)}
                          label="Driver Assigned"
                        >
                          <MenuItem value="">
                            <em>- Select -</em>
                          </MenuItem>
                          {availableDrivers.map((driver) => (
                            <MenuItem key={driver.id} value={driver.id}>
                              {driver.name} {driver.status ? `(${driver.status})` : ''}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      {availableDrivers.length === 0 && (
                        <Typography variant="caption" color="text.secondary">
                          No on-duty drivers available. Only on-duty drivers can be assigned.
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl fullWidth margin="dense">
                        <InputLabel>Truck Assigned</InputLabel>
                        <Select
                          value={newJobData.truckAssigned}
                          onChange={(e) => handleInputChange('truckAssigned', e.target.value)}
                          label="Truck Assigned"
                        >
                          <MenuItem value="">
                            <em>- Select -</em>
                          </MenuItem>
                          <MenuItem value="HQ">HQ</MenuItem>
                          <MenuItem value="Truck 2">Truck 2</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Right Column */}
              <Grid item xs={12} md={6}>
                {/* Notes Section */}
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Typography variant="h6" gutterBottom>Notes</Typography>
                  <Box sx={{ mb: 2 }}>
                    <ButtonGroup variant="outlined" fullWidth>
                      <Button 
                        variant={activeNotesTab === 'internal' ? 'contained' : 'outlined'}
                        onClick={() => handleNotesTabChange('internal')}
                      >
                        Internal
                      </Button>
                      <Button 
                        variant={activeNotesTab === 'dispatcher' ? 'contained' : 'outlined'}
                        onClick={() => handleNotesTabChange('dispatcher')}
                      >
                        Dispatcher
                      </Button>
                      <Button 
                        variant={activeNotesTab === 'invoice' ? 'contained' : 'outlined'}
                        onClick={() => handleNotesTabChange('invoice')}
                      >
                        Invoice
                      </Button>
                    </ButtonGroup>
                  </Box>
                  <TextField
                    multiline
                    rows={4}
                    fullWidth
                    placeholder={`Enter ${activeNotesTab} notes here...`}
                    value={newJobData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                  />
                </Paper>

                {/* Location Section */}
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">Location</Typography>
                    <Button 
                      variant="contained" 
                      color="primary"
                      startIcon={<MyLocationIcon />}
                      onClick={handleRequestLocation}
                      disabled={!newJobData.customerPhone || locationRequestSent}
                    >
                      {locationRequestSent ? 'LOCATION REQUESTED' : 'REQUEST LOCATION'}
                    </Button>
                  </Box>
                  <Grid container spacing={2}>
                    {/* Service Location */}
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>Service Location</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                          <FormControl fullWidth margin="dense">
                            <InputLabel required error={!newJobData.serviceLocationType}>Location Type *</InputLabel>
                            <Select
                              value={newJobData.serviceLocationType}
                              onChange={(e) => handleInputChange('serviceLocationType', e.target.value)}
                              label="Location Type *"
                              required
                              error={!newJobData.serviceLocationType}
                            >
                              <MenuItem value="">
                                <em>- Select -</em>
                              </MenuItem>
                              {locationTypes.map((type) => (
                                <MenuItem key={type} value={type}>
                                  {type}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={8}>
                          <TextField
                            margin="dense"
                            label="Street Address *"
                            fullWidth
                            value={newJobData.serviceLocation.street}
                            onChange={(e) => handleNestedInputChange('serviceLocation', 'street', e.target.value)}
                            required
                            error={!newJobData.serviceLocation.street}
                            helperText={!newJobData.serviceLocation.street ? "Required" : ""}
                          />
                        </Grid>
                        <Grid item xs={12} sm={5}>
                          <TextField
                            margin="dense"
                            label="City *"
                            fullWidth
                            value={newJobData.serviceLocation.city}
                            onChange={(e) => handleNestedInputChange('serviceLocation', 'city', e.target.value)}
                            required
                            error={!newJobData.serviceLocation.city}
                            helperText={!newJobData.serviceLocation.city ? "Required" : ""}
                          />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <FormControl fullWidth margin="dense">
                            <InputLabel required error={!newJobData.serviceLocation.state}>State *</InputLabel>
                            <Select
                              value={newJobData.serviceLocation.state}
                              onChange={(e) => handleNestedInputChange('serviceLocation', 'state', e.target.value)}
                              label="State *"
                              required
                              error={!newJobData.serviceLocation.state}
                            >
                              <MenuItem value="">
                                <em>- Select -</em>
                              </MenuItem>
                              <MenuItem value="AL">AL</MenuItem>
                              <MenuItem value="AK">AK</MenuItem>
                              <MenuItem value="AZ">AZ</MenuItem>
                              <MenuItem value="AR">AR</MenuItem>
                              <MenuItem value="CA">CA</MenuItem>
                              <MenuItem value="CO">CO</MenuItem>
                              <MenuItem value="CT">CT</MenuItem>
                              <MenuItem value="DE">DE</MenuItem>
                              <MenuItem value="FL">FL</MenuItem>
                              <MenuItem value="GA">GA</MenuItem>
                              <MenuItem value="HI">HI</MenuItem>
                              <MenuItem value="ID">ID</MenuItem>
                              <MenuItem value="IL">IL</MenuItem>
                              <MenuItem value="IN">IN</MenuItem>
                              <MenuItem value="IA">IA</MenuItem>
                              <MenuItem value="KS">KS</MenuItem>
                              <MenuItem value="KY">KY</MenuItem>
                              <MenuItem value="LA">LA</MenuItem>
                              <MenuItem value="ME">ME</MenuItem>
                              <MenuItem value="MD">MD</MenuItem>
                              <MenuItem value="MA">MA</MenuItem>
                              <MenuItem value="MI">MI</MenuItem>
                              <MenuItem value="MN">MN</MenuItem>
                              <MenuItem value="MS">MS</MenuItem>
                              <MenuItem value="MO">MO</MenuItem>
                              <MenuItem value="MT">MT</MenuItem>
                              <MenuItem value="NE">NE</MenuItem>
                              <MenuItem value="NV">NV</MenuItem>
                              <MenuItem value="NH">NH</MenuItem>
                              <MenuItem value="NJ">NJ</MenuItem>
                              <MenuItem value="NM">NM</MenuItem>
                              <MenuItem value="NY">NY</MenuItem>
                              <MenuItem value="NC">NC</MenuItem>
                              <MenuItem value="ND">ND</MenuItem>
                              <MenuItem value="OH">OH</MenuItem>
                              <MenuItem value="OK">OK</MenuItem>
                              <MenuItem value="OR">OR</MenuItem>
                              <MenuItem value="PA">PA</MenuItem>
                              <MenuItem value="RI">RI</MenuItem>
                              <MenuItem value="SC">SC</MenuItem>
                              <MenuItem value="SD">SD</MenuItem>
                              <MenuItem value="TN">TN</MenuItem>
                              <MenuItem value="TX">TX</MenuItem>
                              <MenuItem value="UT">UT</MenuItem>
                              <MenuItem value="VT">VT</MenuItem>
                              <MenuItem value="VA">VA</MenuItem>
                              <MenuItem value="WA">WA</MenuItem>
                              <MenuItem value="WV">WV</MenuItem>
                              <MenuItem value="WI">WI</MenuItem>
                              <MenuItem value="WY">WY</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            margin="dense"
                            label="ZIP Code *"
                            fullWidth
                            value={newJobData.serviceLocation.zip}
                            onChange={(e) => handleNestedInputChange('serviceLocation', 'zip', e.target.value)}
                            required
                            error={!newJobData.serviceLocation.zip}
                            helperText={!newJobData.serviceLocation.zip ? "Required" : ""}
                          />
                        </Grid>
                      </Grid>
                    </Grid>
                    
                    {/* Dropoff Location */}
                    <Grid item xs={12} sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>Dropoff Location (Optional)</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                          <FormControl fullWidth margin="dense">
                            <InputLabel>Location Type</InputLabel>
                            <Select
                              value={newJobData.dropoffLocationType}
                              onChange={(e) => handleInputChange('dropoffLocationType', e.target.value)}
                              label="Location Type"
                            >
                              <MenuItem value="">
                                <em>- Select -</em>
                              </MenuItem>
                              {locationTypes.map((type) => (
                                <MenuItem key={type} value={type}>
                                  {type}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={8}>
                          <TextField
                            margin="dense"
                            label="Street Address"
                            fullWidth
                            value={newJobData.dropoffLocation.street}
                            onChange={(e) => handleNestedInputChange('dropoffLocation', 'street', e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} sm={5}>
                          <TextField
                            margin="dense"
                            label="City"
                            fullWidth
                            value={newJobData.dropoffLocation.city}
                            onChange={(e) => handleNestedInputChange('dropoffLocation', 'city', e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <FormControl fullWidth margin="dense">
                            <InputLabel>State</InputLabel>
                            <Select
                              value={newJobData.dropoffLocation.state}
                              onChange={(e) => handleNestedInputChange('dropoffLocation', 'state', e.target.value)}
                              label="State"
                            >
                              <MenuItem value="">
                                <em>- Select -</em>
                              </MenuItem>
                              <MenuItem value="AL">AL</MenuItem>
                              <MenuItem value="AK">AK</MenuItem>
                              <MenuItem value="AZ">AZ</MenuItem>
                              <MenuItem value="AR">AR</MenuItem>
                              <MenuItem value="CA">CA</MenuItem>
                              <MenuItem value="CO">CO</MenuItem>
                              <MenuItem value="CT">CT</MenuItem>
                              <MenuItem value="DE">DE</MenuItem>
                              <MenuItem value="FL">FL</MenuItem>
                              <MenuItem value="GA">GA</MenuItem>
                              <MenuItem value="HI">HI</MenuItem>
                              <MenuItem value="ID">ID</MenuItem>
                              <MenuItem value="IL">IL</MenuItem>
                              <MenuItem value="IN">IN</MenuItem>
                              <MenuItem value="IA">IA</MenuItem>
                              <MenuItem value="KS">KS</MenuItem>
                              <MenuItem value="KY">KY</MenuItem>
                              <MenuItem value="LA">LA</MenuItem>
                              <MenuItem value="ME">ME</MenuItem>
                              <MenuItem value="MD">MD</MenuItem>
                              <MenuItem value="MA">MA</MenuItem>
                              <MenuItem value="MI">MI</MenuItem>
                              <MenuItem value="MN">MN</MenuItem>
                              <MenuItem value="MS">MS</MenuItem>
                              <MenuItem value="MO">MO</MenuItem>
                              <MenuItem value="MT">MT</MenuItem>
                              <MenuItem value="NE">NE</MenuItem>
                              <MenuItem value="NV">NV</MenuItem>
                              <MenuItem value="NH">NH</MenuItem>
                              <MenuItem value="NJ">NJ</MenuItem>
                              <MenuItem value="NM">NM</MenuItem>
                              <MenuItem value="NY">NY</MenuItem>
                              <MenuItem value="NC">NC</MenuItem>
                              <MenuItem value="ND">ND</MenuItem>
                              <MenuItem value="OH">OH</MenuItem>
                              <MenuItem value="OK">OK</MenuItem>
                              <MenuItem value="OR">OR</MenuItem>
                              <MenuItem value="PA">PA</MenuItem>
                              <MenuItem value="RI">RI</MenuItem>
                              <MenuItem value="SC">SC</MenuItem>
                              <MenuItem value="SD">SD</MenuItem>
                              <MenuItem value="TN">TN</MenuItem>
                              <MenuItem value="TX">TX</MenuItem>
                              <MenuItem value="UT">UT</MenuItem>
                              <MenuItem value="VT">VT</MenuItem>
                              <MenuItem value="VA">VA</MenuItem>
                              <MenuItem value="WA">WA</MenuItem>
                              <MenuItem value="WV">WV</MenuItem>
                              <MenuItem value="WI">WI</MenuItem>
                              <MenuItem value="WY">WY</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            margin="dense"
                            label="ZIP Code"
                            fullWidth
                            value={newJobData.dropoffLocation.zip}
                            onChange={(e) => handleNestedInputChange('dropoffLocation', 'zip', e.target.value)}
                          />
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                  
                  {/* Map Placeholder */}
                  <Box 
                    sx={{ 
                      height: 300, 
                      bgcolor: '#f5f5f5', 
                      mt: 2, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      borderRadius: 1
                    }}
                  >
                    <Typography>Map Placeholder</Typography>
                  </Box>
                </Paper>

                {/* Contact Section */}
                <Paper sx={{ p: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">Pickup Contact</Typography>
                    <Button 
                      variant="outlined" 
                      size="small"
                      startIcon={<ContentCopyIcon />}
                      onClick={handleCopyCustomer}
                    >
                      COPY CUSTOMER
                    </Button>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Pickup Name *"
                        value={newJobData.pickupContact.name}
                        onChange={(e) => handleNestedInputChange('pickupContact', 'name', e.target.value)}
                        required
                        error={!newJobData.pickupContact.name}
                        helperText={!newJobData.pickupContact.name ? "Required" : ""}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Pickup Number *"
                        value={newJobData.pickupContact.number}
                        onChange={(e) => handleNestedInputChange('pickupContact', 'number', e.target.value)}
                        required
                        error={!newJobData.pickupContact.number}
                        helperText={!newJobData.pickupContact.number ? "Required" : ""}
                      />
                    </Grid>
                  </Grid>

                  <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Dropoff Contact</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Dropoff Name"
                        value={newJobData.dropoffContact.name}
                        onChange={(e) => handleNestedInputChange('dropoffContact', 'name', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Dropoff Number"
                        value={newJobData.dropoffContact.number}
                        onChange={(e) => handleNestedInputChange('dropoffContact', 'number', e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, justifyContent: 'flex-end' }}>
            <Button 
              variant="outlined" 
              onClick={handleJobDialogClose} 
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
