// ContactSection.js
// Contact section for the job dialog

import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Box
} from '@mui/material';
import { ContentCopy as ContentCopyIcon } from '@mui/icons-material';

/**
 * Contact section component for the job dialog
 * @param {Object} props Component props
 * @param {Object} props.jobData Current job data
 * @param {Function} props.handleNestedInputChange Function to handle nested input changes
 * @param {Function} props.handleCopyCustomer Function to copy customer info to pickup contact
 * @returns {JSX.Element} Contact section component
 */
const ContactSection = ({ jobData, handleNestedInputChange, handleCopyCustomer }) => {
  return (
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
            value={jobData.pickupContact.name}
            onChange={(e) => handleNestedInputChange('pickupContact', 'name', e.target.value)}
            required
            error={!jobData.pickupContact.name}
            helperText={!jobData.pickupContact.name ? "Required" : ""}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Pickup Number *"
            value={jobData.pickupContact.number}
            onChange={(e) => {
              const value = e.target.value;
              if (/^[0-9]*$/.test(value)) { // Allow only numbers
                handleNestedInputChange('pickupContact', 'number', value);
              }
            }}
            required
            error={!jobData.pickupContact.number}
            helperText={!jobData.pickupContact.number ? "Required" : ""}
            inputProps={{ maxLength: 10 }} // Add maxLength
          />
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Dropoff Contact</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Dropoff Name"
            value={jobData.dropoffContact.name}
            onChange={(e) => handleNestedInputChange('dropoffContact', 'name', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Dropoff Number"
            value={jobData.dropoffContact.number}
            onChange={(e) => {
              const value = e.target.value;
              if (/^[0-9]*$/.test(value)) { // Allow only numbers
                handleNestedInputChange('dropoffContact', 'number', value);
              }
            }}
            inputProps={{ maxLength: 10 }} // Add maxLength
          />
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ContactSection;
