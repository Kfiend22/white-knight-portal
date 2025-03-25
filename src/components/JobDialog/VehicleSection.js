// VehicleSection.js
// Vehicle section for the job dialog

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
  FormControlLabel,
  Checkbox,
  Box,
  Divider
} from '@mui/material';

/**
 * Vehicle section component for the job dialog
 * @param {Object} props Component props
 * @param {Object} props.jobData Current job data
 * @param {Function} props.handleInputChange Function to handle input changes
 * @param {Object} props.vehicleData Vehicle data (makes, models, years, colors)
 * @param {Array} props.fleetVehicles List of fleet vehicles
 * @returns {JSX.Element} Vehicle section component
 */
const VehicleSection = ({ jobData, handleInputChange, vehicleData, fleetVehicles = [] }) => {
  // State to track if using existing vehicle
  const [usingExistingVehicle, setUsingExistingVehicle] = useState(!!jobData.truckAssigned);
  
  // Effect to set initial state based on truckAssigned
  useEffect(() => {
    setUsingExistingVehicle(!!jobData.truckAssigned);
  }, [jobData.truckAssigned]);
  
  // Handle fleet vehicle selection
  const handleFleetVehicleChange = (e) => {
    const vehicleId = e.target.value;
    
    if (vehicleId) {
      // Find the selected vehicle
      const selectedVehicle = fleetVehicles.find(v => v._id === vehicleId);
      
      if (selectedVehicle) {
        // Update the truck field with the vehicle name
        handleInputChange('truckAssigned', selectedVehicle.name || selectedVehicle.identifier || vehicleId);
        
        // Optionally populate other vehicle fields if they're empty
        if (!jobData.make) handleInputChange('make', selectedVehicle.make || '');
        if (!jobData.model) handleInputChange('model', selectedVehicle.model || '');
        if (!jobData.year) handleInputChange('year', selectedVehicle.year || '');
        if (!jobData.color) handleInputChange('color', selectedVehicle.color || '');
        if (!jobData.license) handleInputChange('license', selectedVehicle.license || '');
        if (!jobData.vin) handleInputChange('vin', selectedVehicle.vin || '');
      }
    } else {
      // Clear the truck field if no vehicle is selected
      handleInputChange('truckAssigned', '');
    }
  };
  
  // Handle toggle for using existing vehicle
  const handleUseExistingVehicleToggle = (e) => {
    const checked = e.target.checked;
    setUsingExistingVehicle(checked);
    
    if (!checked) {
      // Clear the truck field if not using existing vehicle
      handleInputChange('truckAssigned', '');
    }
  };
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>Vehicle</Typography>
      
      {/* Option to use existing fleet vehicle */}
      <Box mb={2}>
        <FormControlLabel
          control={
            <Checkbox
              checked={usingExistingVehicle}
              onChange={handleUseExistingVehicleToggle}
              name="useExistingVehicle"
              color="primary"
            />
          }
          label="Use Existing Fleet Vehicle"
        />
        
        {usingExistingVehicle && (
          <FormControl fullWidth margin="dense">
            <InputLabel>Select Fleet Vehicle</InputLabel>
            <Select
              value={fleetVehicles.find(v => v.name === jobData.truckAssigned || v.identifier === jobData.truckAssigned)?._id || ''}
              onChange={handleFleetVehicleChange}
              label="Select Fleet Vehicle"
            >
              <MenuItem value="">
                <em>Select a vehicle</em>
              </MenuItem>
              {fleetVehicles.map((vehicle) => (
                <MenuItem key={vehicle._id} value={vehicle._id}>
                  {vehicle.name || vehicle.identifier || vehicle._id} {vehicle.make && vehicle.model ? `(${vehicle.make} ${vehicle.model})` : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>
      
      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle1" gutterBottom>Vehicle Details</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            margin="dense"
            label="VIN"
            fullWidth
            value={jobData.vin}
            onChange={(e) => {
              const value = e.target.value.toUpperCase();
              if (/^[A-Z0-9]*$/.test(value)) { // Allow only alphanumeric
                handleInputChange('vin', value);
              }
            }}
            placeholder="Valid VIN Autofills Vehicle"
            inputProps={{ maxLength: 17 }} // Add maxLength
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth margin="dense">
            <InputLabel required error={!jobData.make}>Make *</InputLabel>
            <Select
              value={jobData.make}
              onChange={(e) => {
                // Update both make and model in a single state update
                handleInputChange('make', e.target.value);
                handleInputChange('model', ''); // Reset model when make changes
              }}
              label="Make *"
              required
              error={!jobData.make}
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
            <InputLabel required error={!jobData.model}>Model *</InputLabel>
            <Select
              value={jobData.model}
              onChange={(e) => handleInputChange('model', e.target.value)}
              label="Model *"
              disabled={!jobData.make} // Disable if no make selected
              required
              error={!jobData.model}
            >
              <MenuItem value="">
                <em>Select</em>
              </MenuItem>
              {jobData.make && vehicleData.models[jobData.make] ? 
                vehicleData.models[jobData.make].map((model) => (
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
            <InputLabel required error={!jobData.year}>Year *</InputLabel>
            <Select
              value={jobData.year}
              onChange={(e) => handleInputChange('year', e.target.value)}
              label="Year *"
              required
              error={!jobData.year}
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
              value={jobData.color}
              onChange={(e) => handleInputChange('color', e.target.value)}
              label="Color"
            >
              <MenuItem value="">
                <em>Select</em>
              </MenuItem>
              {vehicleData.colors.map((color) => (
                <MenuItem key={color} value={color}>
                  {color}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            margin="dense"
            label="License"
            fullWidth
            value={jobData.license}
            onChange={(e) => {
              const value = e.target.value.toUpperCase();
              if (/^[A-Z0-9]*$/.test(value)) {
                handleInputChange('license', value);
              }
            }}
            inputProps={{ maxLength: 10 }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            margin="dense"
            label="Odometer"
            fullWidth
            value={jobData.odometer}
            onChange={(e) => {
              const value = e.target.value;
              if (/^[0-9]*$/.test(value)) {
                handleInputChange('odometer', value);
              }
            }}
            inputProps={{ maxLength: 7 }}
          />
        </Grid>
      </Grid>
    </Paper>
  );
};

export default VehicleSection;
