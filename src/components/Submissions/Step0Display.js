// src/components/Submissions/Step0Display.js
import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Grid,
  Link,
  Paper, // Added Paper for map placeholder
  Stack, // Added Stack for layout
} from '@mui/material';

// Helper function to format labels (can be moved to a utils file later)
const formatLabelName = (key) => {
    const labelMap = {
      // Add specific mappings if needed, otherwise rely on generic formatting
      roadOnly: 'Road-Only Services', lightDuty: 'Light Duty Towing', mediumDuty: 'Medium Duty Towing',
      heavyDuty: 'Heavy Duty Towing', mobileMechanic: 'Mobile Mechanic', mediumHeavyTire: 'Medium/Heavy Tire',
      accidentSceneTowing: 'Accident Scene Towing', secondaryTow: 'Secondary Tow', storageFacility: 'Storage Facility',
      familyOwned: 'Family-Owned', womenOwned: 'Women-Owned', minorityOwned: 'Minority-Owned',
      veteranOwned: 'Veteran-Owned', lgbtqOwned: 'LGBTQ+-Owned', smallBusiness: 'Small Business',
      disadvantagedBusiness: 'Disadvantaged Business',
      // Add more mappings from Apps.js formatLabelName if necessary
    };
    return labelMap[key] || key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
};

// Helper function for document links (ensure consistency with Apps.js)
const getDocumentUrl = (filename) => {
    if (!filename) return '#';
    const baseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';
    return `${baseUrl}/uploads/applications/${filename}`;
};


function Step0Display({ application }) {
  if (!application) return null;

  return (
    <Box sx={{ p: 2 }}>
      {/* Two Column Layout */}
      <Grid container spacing={2}>
        {/* Left Column - Map */}
        <Grid item xs={12} md={6}>
           <Paper sx={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
             <Typography variant="subtitle1">Map Placeholder</Typography>
           </Paper>
           {/* Document Viewer can also go here if preferred */}
        </Grid>
        {/* Right Column - Application Data */}
        <Grid item xs={12} md={6}>
          <Stack spacing={1}> {/* Use Stack for better spacing control */}
            {/* Contact Information */}
            <Typography variant="h6" gutterBottom>Contact Information</Typography>
      <TextField fullWidth label="Company Name" value={application.companyName || ''} InputProps={{ readOnly: true }} margin="dense" size="small"/>
      <TextField fullWidth label="Owner's First Name" value={application.ownerFirstName || ''} InputProps={{ readOnly: true }} margin="dense" size="small"/>
      <TextField fullWidth label="Owner's Last Name" value={application.ownerLastName || ''} InputProps={{ readOnly: true }} margin="dense" size="small"/>
      <TextField fullWidth label="Email" type="email" value={application.email || ''} InputProps={{ readOnly: true }} margin="dense" size="small"/>
      <Grid container spacing={1}>
        <Grid item xs={12} sm={4}><TextField fullWidth label="Phone Country" value={application.phoneCountry || 'United States'} InputProps={{ readOnly: true }} margin="dense" size="small"/></Grid>
        <Grid item xs={12} sm={2}><TextField fullWidth label="Code" value={application.phoneCountryCode || '+1'} InputProps={{ readOnly: true }} margin="dense" size="small"/></Grid>
        <Grid item xs={12} sm={6}><TextField fullWidth label="Phone Number" type="tel" value={application.phoneNumber || ''} InputProps={{ readOnly: true }} margin="dense" size="small"/></Grid>
      </Grid>

      {/* Facility Address */}
      <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>Facility Address</Typography>
      <TextField fullWidth label="Facility Country" value={application.facilityCountry || 'United States'} InputProps={{ readOnly: true }} margin="dense" size="small"/>
      <TextField fullWidth label="Facility Address Line 1" value={application.facilityAddress1 || ''} InputProps={{ readOnly: true }} margin="dense" size="small"/>
      <TextField fullWidth label="Facility Address Line 2" value={application.facilityAddress2 || ''} InputProps={{ readOnly: true }} margin="dense" size="small"/>
      <TextField fullWidth label="City" value={application.facilityCity || ''} InputProps={{ readOnly: true }} margin="dense" size="small"/>
      <TextField fullWidth label="State/Province" value={application.facilityState || ''} InputProps={{ readOnly: true }} margin="dense" size="small"/>
      <TextField fullWidth label="Zip/Postal Code" value={application.facilityZip || ''} InputProps={{ readOnly: true }} margin="dense" size="small"/>

      {/* Billing Information */}
      <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>Billing Information</Typography>
      <TextField fullWidth label="Billing Same as Facility?" value={application.billingSame ? 'Yes' : 'No'} InputProps={{ readOnly: true }} margin="dense" size="small"/>
      {!application.billingSame && application.billingAddress && (
        <Box sx={{ mt: 1, pl: 2, borderLeft: '2px solid #eee' }}>
          <Typography variant="subtitle2" gutterBottom>Billing Address:</Typography>
          <TextField fullWidth label="Billing Country" value={application.billingAddress.country || 'United States'} InputProps={{ readOnly: true }} margin="dense" size="small"/>
          <TextField fullWidth label="Billing Address Line 1" value={application.billingAddress.address1 || ''} InputProps={{ readOnly: true }} margin="dense" size="small"/>
          <TextField fullWidth label="Billing Address Line 2" value={application.billingAddress.address2 || ''} InputProps={{ readOnly: true }} margin="dense" size="small"/>
          <TextField fullWidth label="City" value={application.billingAddress.city || ''} InputProps={{ readOnly: true }} margin="dense" size="small"/>
          <TextField fullWidth label="State/Province" value={application.billingAddress.state || ''} InputProps={{ readOnly: true }} margin="dense" size="small"/>
          <TextField fullWidth label="Zip/Postal Code" value={application.billingAddress.zip || ''} InputProps={{ readOnly: true }} margin="dense" size="small"/>
        </Box>
      )}

      {/* Services */}
      <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>Services</Typography>
      <FormGroup>
        {Object.entries(application.services || {}).map(([key, value]) => {
          if (typeof value === 'boolean') return <FormControlLabel key={key} control={<Checkbox checked={value} disabled size="small"/>} label={formatLabelName(key)} sx={{height: '30px'}}/>;
          if (key === 'open247') return <TextField key={key} fullWidth label="Open 24/7?" value={value || 'yes'} InputProps={{ readOnly: true }} margin="dense" size="small"/>;
          if (key === 'hoursOfOperation' && value) return <TextField key={key} fullWidth label="Hours of Operation" value={value} InputProps={{ readOnly: true }} margin="dense" size="small"/>;
          return null;
        })}
      </FormGroup>

      {/* Territories */}
      <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>Territories</Typography>
      <TextField fullWidth multiline label="Covered Zip Codes (Manual Entry)" value={application.territories?.zipCodes || ''} InputProps={{ readOnly: true }} margin="dense" size="small"/>
      {/* Zip file link will be in DocumentViewer */}

      {/* IRS Information */}
      <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>IRS Information</Typography>
      <TextField fullWidth label="Address on W-9" value={application.w9Address || ''} InputProps={{ readOnly: true }} margin="dense" size="small"/>
      <FormControlLabel control={<Checkbox checked={application.backupWithholding || false} disabled size="small"/>} label="Backup Withholding Certification" sx={{height: '30px'}}/>
      {/* W9 link will be in DocumentViewer */}

      {/* Signature */}
      <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>Electronic Signature</Typography>
      <TextField fullWidth label="Signature" value={application.signature || ''} InputProps={{ readOnly: true }} margin="dense" size="small"/>

      {/* Employees */}
      <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>Employees</Typography>
      <TextField fullWidth label="Number of Employees" type="number" value={application.employees || ''} InputProps={{ readOnly: true }} margin="dense" size="small"/>
      {/* Background Check link will be in DocumentViewer */}

      {/* Insurance */}
      <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>Insurance Information</Typography>
      <TextField fullWidth label="Insurance Agency" value={application.insurance?.agency || ''} InputProps={{ readOnly: true }} margin="dense" size="small"/>
      <TextField fullWidth label="Policy #" value={application.insurance?.policyNumber || ''} InputProps={{ readOnly: true }} margin="dense" size="small"/>
      <TextField fullWidth label="Agent's Name" value={application.insurance?.agentName || ''} InputProps={{ readOnly: true }} margin="dense" size="small"/>
      <TextField fullWidth label="Agent's Phone" type="tel" value={application.insurance?.agentPhone || ''} InputProps={{ readOnly: true }} margin="dense" size="small"/>
      <TextField fullWidth label="Agent's Fax" type="tel" value={application.insurance?.agentFax || ''} InputProps={{ readOnly: true }} margin="dense" size="small"/>
      <TextField fullWidth label="Agent's Email" type="email" value={application.insurance?.agentEmail || ''} InputProps={{ readOnly: true }} margin="dense" size="small"/>
      <TextField fullWidth label="Policy Expiration" type="date" value={application.insurance?.policyExpiration ? application.insurance.policyExpiration.split('T')[0] : ''} InputProps={{ readOnly: true }} margin="dense" size="small" InputLabelProps={{ shrink: true }}/>
      {/* COI link will be in DocumentViewer */}

      {/* Additional Company Info */}
      <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>Additional Company Info</Typography>
      <TextField fullWidth label="Years in Business" value={application.businessInfo?.yearsInBusiness || ''} InputProps={{ readOnly: true }} margin="dense" size="small"/>
      <TextField fullWidth label="EV Experience?" value={application.businessInfo?.electricVehicleExp || ''} InputProps={{ readOnly: true }} margin="dense" size="small"/>
      <TextField fullWidth label="Uses Digital Dispatch?" value={application.businessInfo?.digitalDispatch || ''} InputProps={{ readOnly: true }} margin="dense" size="small"/>

      {/* Business Ownership */}
      <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>Business Ownership</Typography>
      <FormGroup>
        {Object.entries(application.ownership || {}).map(([key, value]) => (
          <FormControlLabel key={key} control={<Checkbox checked={value} disabled size="small"/>} label={formatLabelName(key)} sx={{height: '30px'}}/>
        ))}
      </FormGroup>

      {/* Terms Agreements */}
      <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>Agreements</Typography>
      <FormControlLabel control={<Checkbox checked={application.termsAgreement || false} disabled size="small"/>} label="Agreed to Terms & Conditions" sx={{height: '30px'}}/>
      <FormControlLabel control={<Checkbox checked={application.codeOfConductAgreement || false} disabled size="small"/>} label="Agreed to Code of Conduct" sx={{height: '30px'}}/>

            {/* Document Viewer - Rendered separately in Apps.js */}
            {/* <DocumentViewer application={application} /> */}
          </Stack>
        </Grid>
      </Grid>
   </Box>
  );
}

export default Step0Display;
