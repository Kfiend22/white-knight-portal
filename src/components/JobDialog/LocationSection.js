// LocationSection.js
// Location section for the job dialog

import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Button
} from '@mui/material';
import { MyLocation as MyLocationIcon } from '@mui/icons-material';
import { locationTypes } from '../../constants/dashboardConstants';

/**
 * Location section component for the job dialog
 * @param {Object} props Component props
 * @param {Object} props.jobData Current job data
 * @param {Function} props.handleInputChange Function to handle input changes
 * @param {Function} props.handleNestedInputChange Function to handle nested input changes
 * @param {boolean} props.locationRequestSent Flag indicating if location request was sent
 * @param {boolean} props.locationLoading Flag indicating if location request is loading
 * @param {Function} props.handleRequestLocation Function to handle location request
 * @returns {JSX.Element} Location section component
 */
const LocationSection = ({ 
  jobData, 
  handleInputChange, 
  handleNestedInputChange, 
  locationRequestSent, 
  locationLoading, 
  handleRequestLocation 
}) => {
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Location</Typography>
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<MyLocationIcon />}
          onClick={handleRequestLocation}
          disabled={!jobData.customerPhone || locationRequestSent || locationLoading}
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
                <InputLabel required error={!jobData.serviceLocationType}>Location Type *</InputLabel>
                <Select
                  value={jobData.serviceLocationType}
                  onChange={(e) => handleInputChange('serviceLocationType', e.target.value)}
                  label="Location Type *"
                  required
                  error={!jobData.serviceLocationType}
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
                value={jobData.serviceLocation.street}
                onChange={(e) => handleNestedInputChange('serviceLocation', 'street', e.target.value)}
                required
                error={!jobData.serviceLocation.street}
                helperText={!jobData.serviceLocation.street ? "Required" : ""}
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField
                margin="dense"
                label="City *"
                fullWidth
                value={jobData.serviceLocation.city}
                onChange={(e) => handleNestedInputChange('serviceLocation', 'city', e.target.value)}
                required
                error={!jobData.serviceLocation.city}
                helperText={!jobData.serviceLocation.city ? "Required" : ""}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth margin="dense">
                <InputLabel required error={!jobData.serviceLocation.state}>State *</InputLabel>
                <Select
                  value={jobData.serviceLocation.state}
                  onChange={(e) => handleNestedInputChange('serviceLocation', 'state', e.target.value)}
                  label="State *"
                  required
                  error={!jobData.serviceLocation.state}
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
                value={jobData.serviceLocation.zip}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^[0-9]*$/.test(value)) { // Allow only numbers
                    handleNestedInputChange('serviceLocation', 'zip', value);
                  }
                }}
                required
                error={!jobData.serviceLocation.zip}
                helperText={!jobData.serviceLocation.zip ? "Required" : ""}
                inputProps={{ maxLength: 10 }} // Add maxLength to allow for ZIP+4
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
                  value={jobData.dropoffLocationType}
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
                value={jobData.dropoffLocation.street}
                onChange={(e) => handleNestedInputChange('dropoffLocation', 'street', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField
                margin="dense"
                label="City"
                fullWidth
                value={jobData.dropoffLocation.city}
                onChange={(e) => handleNestedInputChange('dropoffLocation', 'city', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth margin="dense">
                <InputLabel>State</InputLabel>
                <Select
                  value={jobData.dropoffLocation.state}
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
                value={jobData.dropoffLocation.zip}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^[0-9]*$/.test(value)) { // Allow only numbers
                    handleNestedInputChange('dropoffLocation', 'zip', value);
                  }
                }}
                inputProps={{ maxLength: 10 }} // Add maxLength to allow for ZIP+4
              />
            </Grid>
          </Grid>
        </Grid>
        
        {/* Map Placeholder */}
        <Grid item xs={12}>
          <Box 
            sx={{ 
              height: 200, 
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
        </Grid>
      </Grid>
    </Paper>
  );
};

export default LocationSection;
