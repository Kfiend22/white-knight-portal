// ServiceSection.js
// Service section for the job dialog

import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ButtonGroup,
  Button
} from '@mui/material';
import { 
  serviceOptions, 
  classTypeOptions, 
  scheduledTimeOptions 
} from '../../constants/dashboardConstants';

/**
 * Service section component for the job dialog
 * @param {Object} props Component props
 * @param {Object} props.jobData Current job data
 * @param {Function} props.handleInputChange Function to handle input changes
 * @param {Array} props.availableDrivers List of available drivers
 * @param {Array} props.vehicles List of vehicles
 * @returns {JSX.Element} Service section component
 */
const ServiceSection = ({ jobData, handleInputChange, availableDrivers, vehicles = [] }) => {
  // State for all vehicles, combining prop and localStorage
  const [allVehicles, setAllVehicles] = useState([]);
  
  // Debug: Log vehicles prop
  console.log('ServiceSection vehicles prop:', vehicles);
  
  // Get vehicles from localStorage if available
  useEffect(() => {
    // Try to get cached vehicles from localStorage
    const cachedVehicles = localStorage.getItem('fleetVehicles');
    if (cachedVehicles) {
      try {
        const parsedVehicles = JSON.parse(cachedVehicles);
        console.log('ServiceSection - Using cached vehicles from localStorage:', parsedVehicles.length);
        setAllVehicles(parsedVehicles);
      } catch (e) {
        console.error('Error parsing cached vehicles:', e);
        // If parse fails, use provided vehicles prop
        setAllVehicles(vehicles || []);
      }
    } else {
      // If not in localStorage, use provided vehicles prop
      console.log('ServiceSection - No cached vehicles, using prop vehicles');
      setAllVehicles(vehicles || []);
    }
  }, [vehicles]);
  
  // Debug: Log final vehicles
  useEffect(() => {
    console.log('ServiceSection - Final vehicles list:', allVehicles);
  }, [allVehicles]);
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Service</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom>Service Time</Typography>
          <ButtonGroup variant="outlined" fullWidth>
            <Button 
              variant={jobData.serviceTime === 'ASAP' ? 'contained' : 'outlined'}
              onClick={() => handleInputChange('serviceTime', 'ASAP')}
            >
              ASAP
            </Button>
            <Button 
              variant={jobData.serviceTime === 'Scheduled' ? 'contained' : 'outlined'}
              onClick={() => handleInputChange('serviceTime', 'Scheduled')}
            >
              Scheduled
            </Button>
          </ButtonGroup>
        </Grid>
        <Grid item xs={12}>
          {jobData.serviceTime === 'ASAP' ? (
            <TextField
              margin="dense"
              label="ETA *"
              fullWidth
              value={jobData.eta}
              onChange={(e) => handleInputChange('eta', e.target.value)}
              required
              error={!jobData.eta}
              helperText={!jobData.eta ? "Required" : ""}
            />
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth margin="dense">
                  <InputLabel required error={!jobData.scheduledTime}>Scheduled For *</InputLabel>
                  <Select
                    value={jobData.scheduledTime}
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
                    error={!jobData.scheduledTime}
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
              
              {jobData.scheduledTime === 'Custom Date/Time' && (
                <>
                  <Grid item xs={6}>
                    <TextField
                      margin="dense"
                      label="Date (MM/DD/YYYY) *"
                      fullWidth
                      value={jobData.scheduledDate}
                      onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
                      placeholder="MM/DD/YYYY"
                      required
                      error={!jobData.scheduledDate}
                      helperText={!jobData.scheduledDate ? "Required" : ""}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      margin="dense"
                      label="Time (HH:MM AM/PM) *"
                      fullWidth
                      value={jobData.customTime || ''}
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
            <InputLabel required error={!jobData.service}>Service *</InputLabel>
            <Select
              value={jobData.service}
              onChange={(e) => handleInputChange('service', e.target.value)}
              label="Service *"
              required
              error={!jobData.service}
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
            <InputLabel required error={!jobData.classType}>Class Type *</InputLabel>
            <Select
              value={jobData.classType}
              onChange={(e) => handleInputChange('classType', e.target.value)}
              label="Class Type *"
              required
              error={!jobData.classType}
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
              value={jobData.driverAssigned}
              onChange={(e) => {
                const driverId = e.target.value;
                handleInputChange('driverAssigned', driverId);
                
                // Auto-assign vehicle if driver has one assigned
                if (driverId && vehicles && vehicles.length > 0) {
                  // Find vehicle assigned to this driver
                  const driverVehicle = vehicles.find(vehicle => 
                    vehicle.driverId === driverId || 
                    (vehicle.driver && vehicle.driver.includes(
                      availableDrivers.find(d => d.id === driverId)?.name || ''
                    ))
                  );
                  
                  // If driver has an assigned vehicle, set it automatically
                  if (driverVehicle) {
                    handleInputChange('truckAssigned', driverVehicle.name);
                  }
                }
              }}
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
              value={jobData.truckAssigned}
              onChange={(e) => handleInputChange('truckAssigned', e.target.value)}
              label="Truck Assigned"
            >
              <MenuItem value="">
                <em>- Select -</em>
              </MenuItem>
              {/* Dynamic vehicle list from fleet */}
              {allVehicles && allVehicles.length > 0 ? (
                allVehicles.map((vehicle, index) => (
                  <MenuItem key={vehicle.id || index} value={vehicle.name}>
                    {vehicle.name} - {vehicle.type} {vehicle.driver ? `(Assigned to: ${vehicle.driver})` : ''}
                  </MenuItem>
                ))
              ) : vehicles && vehicles.length > 0 ? (
                vehicles.map((vehicle, index) => (
                  <MenuItem key={index} value={vehicle.name}>
                    {vehicle.name} - {vehicle.type} {vehicle.driver ? `(Assigned to: ${vehicle.driver})` : ''}
                  </MenuItem>
                ))
              ) : (
                /* Fallback static options */
                <>
                  <MenuItem value="HQ">HQ</MenuItem>
                  <MenuItem value="Truck 2">Truck 2</MenuItem>
                </>
              )}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ServiceSection;
