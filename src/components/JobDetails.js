// JobDetails.js
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Tabs,
  Tab
} from '@mui/material';
import JobHistory from './JobHistory';
import JobInvoice from './JobInvoice';

// Map component that is always visible
const MapComponent = () => (
  <Paper style={{ height: '350px' }}>
    <Typography variant="subtitle1" align="center" sx={{ py: 2 }}>
      Map Placeholder
    </Typography>
  </Paper>
);

// Component to show the details tab content
const DetailsTabContent = ({ job }) => (
  <Box p={2}>
        {/* Job Details Header */}
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Job Details
        </Typography>
        
        {/* Service details section */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Service Type
            </Typography>
            <Typography variant="body1">
              {job.service}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Class Type
            </Typography>
            <Typography variant="body1">
              {job.classType || "N/A"}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              Service Location
            </Typography>
            <Typography variant="body1" gutterBottom>
              {job.serviceLocation && typeof job.serviceLocation === 'object' 
                ? `${job.serviceLocation.street}, ${job.serviceLocation.city}, ${job.serviceLocation.state} ${job.serviceLocation.zip}` 
                : (job.serviceLocation || job.location)}
            </Typography>
          </Grid>
          
          {job.dropoffLocation && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">
                Dropoff Location
              </Typography>
              <Typography variant="body1" gutterBottom>
                {job.dropoffLocation && typeof job.dropoffLocation === 'object' 
                  ? `${job.dropoffLocation.street}, ${job.dropoffLocation.city}, ${job.dropoffLocation.state} ${job.dropoffLocation.zip}` 
                  : job.dropoffLocation}
              </Typography>
            </Grid>
          )}
          
          {/* Vehicle details section */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              Vehicle Details
            </Typography>
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Year:
            </Typography>
            <Typography variant="body1">
              {job.vehicle?.year || "N/A"}
            </Typography>
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Make:
            </Typography>
            <Typography variant="body1">
              {job.vehicle?.make || "N/A"}
            </Typography>
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Model:
            </Typography>
            <Typography variant="body1">
              {job.vehicle?.model || "N/A"}
            </Typography>
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Color:
            </Typography>
            <Typography variant="body1">
              {job.vehicle?.color || "N/A"}
            </Typography>
          </Grid>
          
          {job.vehicle?.license && (
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                License Plate:
              </Typography>
              <Typography variant="body1">
                {job.vehicle.license}
              </Typography>
            </Grid>
          )}
          
          {job.vehicle?.vin && (
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                VIN:
              </Typography>
              <Typography variant="body1">
                {job.vehicle.vin}
              </Typography>
            </Grid>
          )}
          
          {/* Customer details section */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
              Customer Details
            </Typography>
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Name:
            </Typography>
            <Typography variant="body1">
              {job.customerName || "N/A"}
            </Typography>
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Phone:
            </Typography>
            <Typography variant="body1">
              {job.customerPhone || "N/A"}
            </Typography>
          </Grid>
          
          {job.customerEmail && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Email:
              </Typography>
              <Typography variant="body1">
                {job.customerEmail}
              </Typography>
            </Grid>
          )}
          
          {/* Additional details */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
              Notes
            </Typography>
            <Typography variant="body1">
              {job.notes || "No additional notes"}
            </Typography>
          </Grid>
        </Grid>
  </Box>
);

const JobDetails = ({ job }) => {
  const [activeTab, setActiveTab] = useState(0);

  if (!job) return null;

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box margin={2} sx={{ boxShadow: 1, borderRadius: 1, overflow: 'hidden' }}>
      {/* Layout with map on left and tab content on right */}
      <Grid container spacing={2}>
        {/* Map column - always visible */}
        <Grid item xs={12} md={6}>
          <MapComponent />
        </Grid>
        
        {/* Tab content column */}
        <Grid item xs={12} md={6}>
          {/* Tabs navigation */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange} 
              aria-label="job details tabs"
              variant="fullWidth"
            >
              <Tab label="Details" id="tab-0" aria-controls="tabpanel-0" />
              <Tab label="History" id="tab-1" aria-controls="tabpanel-1" />
              <Tab label="Invoice" id="tab-2" aria-controls="tabpanel-2" />
            </Tabs>
          </Box>
          
          {/* Tab content panels */}
          <Box>
            <Box role="tabpanel" 
                hidden={activeTab !== 0} 
                id="tabpanel-0" 
                aria-labelledby="tab-0"
            >
              {activeTab === 0 && <DetailsTabContent job={job} />}
            </Box>
            
            <Box role="tabpanel" 
                hidden={activeTab !== 1} 
                id="tabpanel-1" 
                aria-labelledby="tab-1"
            >
              {activeTab === 1 && <JobHistory job={job} />}
            </Box>
            
            <Box role="tabpanel" 
                hidden={activeTab !== 2} 
                id="tabpanel-2" 
                aria-labelledby="tab-2"
            >
              {activeTab === 2 && <JobInvoice job={job} />}
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default JobDetails;
