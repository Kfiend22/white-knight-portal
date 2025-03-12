import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  FormGroup,
  Typography,
} from '@mui/material';

const countries = [
  'United States',
  'Canada',
];

const statesProvinces = {
  'United States': [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI',
    'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI',
    'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC',
    'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT',
    'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  ],
  Canada: [
    'AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'ON', 'PE', 'QC', 'SK', 'NT', 'NU', 'YT',
  ],
};

const yearsOptions = [
  'Less than a year',
  '1-5 years',
  '5-10 years',
  'More than 10 years',
];

const serviceOptions = {
  roadOnly: 'Road-Only Services',
  lightDuty: 'Light Duty Towing',
  mediumDuty: 'Medium Duty Towing',
  heavyDuty: 'Heavy Duty Towing',
  mobileMechanic: 'Mobile Mechanic Services',
  mediumHeavyTire: 'Medium & Heavy Duty Tire Services',
  accidentSceneTowing: 'Accident Scene Towing',
  secondaryTow: 'Secondary Towing',
  storageFacility: 'Storage Facility',
};

const ownershipOptions = {
  familyOwned: 'Family-Owned',
  womenOwned: 'Women-Owned',
  minorityOwned: 'Minority-Owned',
  veteranOwned: 'Veteran-Owned',
  lgbtqOwned: 'LGBTQ-Owned',
  smallBusiness: 'Small Business',
  disadvantagedBusiness: 'Disadvantaged Business',
};

const AdvancedAppSearch = ({ open, onClose, onSubmit }) => {
  const [searchCriteria, setSearchCriteria] = useState({
    // Contact Information
    companyName: '',
    ownerFirstName: '',
    ownerLastName: '',
    email: '',
    phoneCountry: 'United States',
    phoneCountryCode: '+1',
    phoneNumber: '',
    // Facility Address
    facilityCountry: 'United States',
    facilityAddress1: '',
    facilityAddress2: '',
    facilityCity: '',
    facilityState: '',
    facilityZip: '',
    // Billing Information
    billingSame: 'yes',
    billingAddress: {
      country: 'United States',
      address1: '',
      address2: '',
      city: '',
      state: '',
      zip: '',
    },
    // Services
    services: {
      roadOnly: false,
      lightDuty: false,
      mediumDuty: false,
      heavyDuty: false,
      mobileMechanic: false,
      mediumHeavyTire: false,
      accidentSceneTowing: false,
      secondaryTow: false,
      storageFacility: false,
      open247: 'yes',
      hoursOfOperation: '',
    },
    // Territories
    territories: {
      zipCodes: '',
    },
    // Insurance Information
    insurance: {
      agency: '',
      policyNumber: '',
      agentName: '',
      agentPhone: '',
      agentFax: '',
      agentEmail: '',
      policyExpiration: '',
    },
    // Business Info
    businessInfo: {
      yearsInBusiness: '',
      electricVehicleExp: '',
      digitalDispatch: '',
    },
    // Ownership
    ownership: {
      familyOwned: false,
      womenOwned: false,
      minorityOwned: false,
      veteranOwned: false,
      lgbtqOwned: false,
      smallBusiness: false,
      disadvantagedBusiness: false,
    },
  });  

  // For top-level fields
  const handleChange = (field) => (event) => {
    setSearchCriteria({
      ...searchCriteria,
      [field]: event.target.value
    });
  };
  
// For services
const handleServicesChange = (e) => {
  const { name, value, checked, type } = e.target;
  setSearchCriteria((prev) => ({
    ...prev,
    services: {
      ...prev.services,
      [name]: type === 'checkbox' ? checked : value,
    },
  }));
};

// For ownership
const handleOwnershipChange = (e) => {
  const { name, checked } = e.target;
  setSearchCriteria(prev => ({
    ...prev,
    ownership: {
      ...prev.ownership,
      [name]: checked
    }
  }));
};

  const handleInsuranceChange = (e) => {
    const { name, value } = e.target;
    setSearchCriteria(prev => ({
      ...prev,
      insurance: {
        ...prev.insurance,
        [name]: value,
      },
    }));
  };

  const handleBusinessInfoChange = (e) => {
    const { name, value } = e.target;
    setSearchCriteria(prev => ({
      ...prev,
      businessInfo: {
        ...prev.businessInfo,
        [name]: value,
      },
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Advanced Search</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {/* Contact Information */}
          <Grid item xs={12}>
            <Typography variant="h6">Contact Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Company Name"
                  value={searchCriteria.companyName}
                  onChange={handleChange('companyName')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Owner's First Name"
                  value={searchCriteria.ownerFirstName}
                  onChange={handleChange('ownerFirstName')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Owner's Last Name"
                  value={searchCriteria.ownerLastName}
                  onChange={handleChange('ownerLastName')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={searchCriteria.email}
                  onChange={handleChange('email')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={searchCriteria.phoneNumber}
                  onChange={handleChange('phoneNumber')}
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Facility Address */}
          <Grid item xs={12}>
            <Typography variant="h6">Facility Address</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Select
                  fullWidth
                  value={searchCriteria.facilityCountry}
                  onChange={handleChange('facilityCountry')}
                  displayEmpty
                >
                  {countries.map((country) => (
                    <MenuItem key={country} value={country}>
                      {country}
                    </MenuItem>
                  ))}
                </Select>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address Line 1"
                  value={searchCriteria.facilityAddress1}
                  onChange={handleChange('facilityAddress1')}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address Line 2"
                  value={searchCriteria.facilityAddress2}
                  onChange={handleChange('facilityAddress2')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="City"
                  value={searchCriteria.facilityCity}
                  onChange={handleChange('facilityCity')}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <Select
                  fullWidth
                  value={searchCriteria.facilityState}
                  onChange={handleChange('facilityState')}
                  displayEmpty
                >
                  {statesProvinces[searchCriteria.facilityCountry]?.map((state) => (
                    <MenuItem key={state} value={state}>
                      {state}
                    </MenuItem>
                  ))}
                </Select>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Zip Code"
                  value={searchCriteria.facilityZip}
                  onChange={handleChange('facilityZip')}
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Services */}
          <Grid item xs={12}>
            <Typography variant="h6">Services</Typography>
            <FormGroup>
              <Grid container spacing={2}>
                {Object.entries(serviceOptions).map(([key, label]) => (
                  <Grid item xs={12} sm={6} key={key}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={searchCriteria.services[key]}
                          onChange={handleServicesChange}
                          name={key}
                        />
                      }
                      label={label}
                    />
                  </Grid>
                ))}
              </Grid>
            </FormGroup>
          </Grid>

          {/* Insurance Information */}
          <Grid item xs={12}>
            <Typography variant="h6">Insurance Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Insurance Agency"
                  value={searchCriteria.insurance.agency}
                  onChange={handleInsuranceChange}
                  name="agency"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Policy Number"
                  value={searchCriteria.insurance.policyNumber}
                  onChange={handleInsuranceChange}
                  name="policyNumber"
                />
              </Grid>
              {/* Add other insurance fields similarly */}
            </Grid>
          </Grid>

          {/* Business Information */}
          <Grid item xs={12}>
            <Typography variant="h6">Business Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Select
                  fullWidth
                  value={searchCriteria.businessInfo.yearsInBusiness}
                  onChange={handleBusinessInfoChange}
                  name="yearsInBusiness"
                  displayEmpty
                >
                  {yearsOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </Grid>
              {/* Add other business info fields similarly */}
            </Grid>
          </Grid>

          {/* Ownership */}
          <Grid item xs={12}>
            <Typography variant="h6">Ownership</Typography>
            <FormGroup>
              <Grid container spacing={2}>
                {Object.entries(ownershipOptions).map(([key, label]) => (
                  <Grid item xs={12} sm={6} key={key}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={searchCriteria.ownership[key]}
                          onChange={handleOwnershipChange}
                          name={key}
                        />
                      }
                      label={label}
                    />
                  </Grid>
                ))}
              </Grid>
            </FormGroup>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSubmit(searchCriteria)} variant="contained">
          Search
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdvancedAppSearch;
