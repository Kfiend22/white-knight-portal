// CustomerSection.js
// Customer section for the job dialog

import React from 'react';
import { isDriverUser } from '../../utils/authUtils';
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
 * Customer section component for the job dialog
 * @param {Object} props Component props
 * @param {Object} props.jobData Current job data
 * @param {Function} props.handleInputChange Function to handle input changes
 * @param {Array} props.userCompanies User's companies
 * @param {Object} props.currentUser Current user data
 * @returns {JSX.Element} Customer section component
 */
const CustomerSection = ({ jobData, handleInputChange, userCompanies, currentUser }) => {
  console.log("CustomerSection.js - jobData.account:", jobData.account);
  
  // Check if user is driver-only
  const isDriverOnly = currentUser ? isDriverUser(currentUser) : false;
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>Customer</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <FormControl fullWidth margin="dense">
            <InputLabel>Account</InputLabel>
            <Select
              value={jobData.account}
              onChange={(e) => handleInputChange('account', e.target.value)}
              label="Account"
              disabled={isDriverOnly}
            >
              <MenuItem value="">
                <em>- Select -</em>
              </MenuItem>
              {userCompanies.map((company) => {
                console.log("CustomerSection.js MenuItem value:", company.name);
                return (
                  <MenuItem key={company.id} value={company.name}>
                    {company.name}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={8}>
          <FormControl fullWidth margin="dense">
            <InputLabel>Payment Type</InputLabel>
            <Select
              value={jobData.paymentType}
              onChange={(e) => handleInputChange('paymentType', e.target.value)}
              label="Payment Type"
              disabled={isDriverOnly}
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
            value={jobData.po}
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
            value={jobData.callerName}
            onChange={(e) => handleInputChange('callerName', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            margin="dense"
            label="Caller Phone"
            fullWidth
            value={jobData.callerPhone}
            onChange={(e) => {
              const value = e.target.value;
              if (/^[0-9]*$/.test(value)) { // Allow only numbers
                handleInputChange('callerPhone', value);
              }
            }}
            inputProps={{ maxLength: 10 }} // Add maxLength
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            margin="dense"
            label="Customer Name *"
            fullWidth
            value={jobData.customerName}
            onChange={(e) => handleInputChange('customerName', e.target.value)}
            placeholder="First & Last Name"
            required
            error={!jobData.customerName}
            helperText={!jobData.customerName ? "Required" : ""}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            margin="dense"
            label="Customer Phone *"
            fullWidth
            value={jobData.customerPhone}
            onChange={(e) => {
              const value = e.target.value;
              if (/^[0-9]*$/.test(value)) { // Allow only numbers
                handleInputChange('customerPhone', value);
              }
            }}
            required
            error={!jobData.customerPhone}
            helperText={!jobData.customerPhone ? "Required" : ""}
            inputProps={{ maxLength: 10 }} // Add maxLength
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            margin="dense"
            label="Customer Email"
            fullWidth
            value={jobData.customerEmail}
            onChange={(e) => handleInputChange('customerEmail', e.target.value)}
          />
        </Grid>
      </Grid>
    </Paper>
  );
};

export default CustomerSection;
