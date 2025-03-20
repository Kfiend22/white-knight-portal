// VehicleSection.js
// Vehicle section for the job dialog

import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

/**
 * Vehicle section component for the job dialog
 * @param {Object} props Component props
 * @param {Object} props.jobData Current job data
 * @param {Function} props.handleInputChange Function to handle input changes
 * @param {Object} props.vehicleData Vehicle data (makes, models, years, colors)
 * @returns {JSX.Element} Vehicle section component
 */
const VehicleSection = ({ jobData, handleInputChange, vehicleData }) => {
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>Vehicle</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            margin="dense"
            label="VIN"
            fullWidth
            value={jobData.vin}
            onChange={(e) => handleInputChange('vin', e.target.value)}
            placeholder="Valid VIN Autofills Vehicle"
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
            onChange={(e) => handleInputChange('license', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            margin="dense"
            label="Odometer"
            fullWidth
            value={jobData.odometer}
            onChange={(e) => handleInputChange('odometer', e.target.value)}
          />
        </Grid>
      </Grid>
    </Paper>
  );
};

export default VehicleSection;
