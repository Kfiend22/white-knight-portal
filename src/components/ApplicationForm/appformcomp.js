// appformcomp.js
import React, { useState } from 'react';
import {
  TextField,
  Button,
  Box,
  Typography,
  FormControlLabel,
  Checkbox,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormHelperText,
  Link,
} from '@mui/material';
import Grid2 from '@mui/material/Grid2';

const countries = [
  'United States',
  'Canada',
  // Add other countries as needed
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

const yesNoOptions = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

const yearsOptions = [
  'Less than a year',
  '1-5 years',
  '5-10 years',
  'More than 10 years',
];

const ApplicationForm = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    ownerFirstName: '',
    ownerLastName: '',
    email: '',
    phoneCountry: 'United States',
    phoneCountryCode: '+1',
    phoneNumber: '',
    facilityCountry: 'United States',
    facilityAddress1: '',
    facilityAddress2: '',
    facilityCity: '',
    facilityState: '',
    facilityZip: '',
    billingSame: 'yes',
    billingAddress: {
      country: 'United States',
      address1: '',
      address2: '',
      city: '',
      state: '',
      zip: '',
    },
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
    territories: {
      zipCodeFile: null,
      zipCodes: '',
    },
    w9: null,
    w9Address: '',
    backupWithholding: false,
    signature: '',
    employees: '',
    backgroundCheck: null,
    insurance: {
      coi: null,
      agency: '',
      policyNumber: '',
      agentName: '',
      agentPhone: '',
      agentFax: '',
      agentEmail: '',
      policyExpiration: '',
    },
    businessInfo: {
      yearsInBusiness: '',
      electricVehicleExp: '',
      digitalDispatch: '',
    },
    ownership: {
      familyOwned: false,
      womenOwned: false,
      minorityOwned: false,
      veteranOwned: false,
      lgbtqOwned: false,
      smallBusiness: false,
      disadvantagedBusiness: false,
    },
    termsAgreement: false,
    codeOfConductAgreement: false,
  });

  // Handler for form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Create a copy of formData with properly formatted services
    const submissionData = new FormData();
    
    // Transform services data to ensure boolean values
    const transformedServices = {};
    Object.keys(formData.services).forEach(key => {
      transformedServices[key] = formData.services[key] === 'on' ? true : Boolean(formData.services[key]);
    });
    
    // Create the final data object with transformed services
    const finalData = {
      ...formData,
      services: transformedServices
    };
  
    // Append the transformed data
    submissionData.append('data', JSON.stringify(finalData));
    
    // Append files if they exist
    if (formData.w9) submissionData.append('w9', formData.w9);
    if (formData.backgroundCheck) submissionData.append('backgroundCheck', formData.backgroundCheck);
    if (formData.insurance?.coi) submissionData.append('coi', formData.insurance.coi);
    if (formData.territories?.zipCodeFile) submissionData.append('zipCodeFile', formData.territories.zipCodeFile);
  
    // Submit to server
    fetch('/api/v1/applications', {
      method: 'POST',
      body: submissionData,
    })
      .then(response => {
        if (!response.ok) throw new Error('Failed to submit application');
        return response.json();
      })
      .then(data => {
        console.log('Application submitted successfully:', data);
      })
      .catch(error => {
        console.error('Error submitting application:', error);
      });
  };


  // Handler for top-level fields
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Handle phone country selection
    if (name === 'phoneCountry') {
      const countryCode = value === 'United States' ? '+1' : '+1'; // Adjust country codes as needed
      setFormData((prev) => ({
        ...prev,
        phoneCountry: value,
        phoneCountryCode: countryCode,
      }));
    } else if (name.startsWith('billingAddress.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        billingAddress: {
          ...prev.billingAddress,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handler for nested fields (services)
  const handleServicesChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      services: {
        ...prev.services,
        [name]: type === 'checkbox' ? checked : value,
      },
    }));
  };

  // Handler for territories
  const handleTerritoriesChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      territories: {
        ...prev.territories,
        [name]: value,
      },
    }));
  };

  // Handler for ownership checkboxes
  const handleOwnershipChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      ownership: {
        ...prev.ownership,
        [name]: checked,
      },
    }));
  };

  // Handler for top-level checkboxes
  const handleTopLevelCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  // Handler for nested fields (businessInfo)
  const handleBusinessInfoChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      businessInfo: {
        ...prev.businessInfo,
        [name]: value,
      },
    }));
  };

  // Handler for insurance fields
  const handleInsuranceChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      insurance: {
        ...prev.insurance,
        [name]: value,
      },
    }));
  };

  // Handler for file inputs
  const handleFileChange = (e) => {
    const { name } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: e.target.files[0],
    }));
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Contact Information */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6">Contact Information</Typography>
        <TextField
          fullWidth
          required
          label="Company Name"
          name="companyName"
          value={formData.companyName}
          onChange={handleChange}
          margin="dense"
        />
        <TextField
          fullWidth
          required
          label="Owner's First Name"
          name="ownerFirstName"
          value={formData.ownerFirstName}
          onChange={handleChange}
          margin="dense"
        />
        <TextField
          fullWidth
          required
          label="Owner's Last Name"
          name="ownerLastName"
          value={formData.ownerLastName}
          onChange={handleChange}
          margin="dense"
        />
        <TextField
          fullWidth
          required
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          margin="dense"
        />
        <Grid2 container spacing={2}>
          <Grid2 xs={12} sm={4}>
            <InputLabel id="phone-country-label">Country</InputLabel>
            <Select
              fullWidth
              labelId="phone-country-label"
              name="phoneCountry"
              value={formData.phoneCountry}
              onChange={handleChange}
            >
              {countries.map((country) => (
                <MenuItem key={country} value={country}>
                  {country}
                </MenuItem>
              ))}
            </Select>
          </Grid2>
          <Grid2 xs={12} sm={2}>
            <TextField
              fullWidth
              label="Code"
              name="phoneCountryCode"
              value={formData.phoneCountryCode}
              slotProps={{
                input: {
                  readOnly: true,
                }
              }}
              margin="dense"
            />
          </Grid2>
          <Grid2 xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Phone Number"
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              margin="dense"
            />
          </Grid2>
        </Grid2>
        <Grid2 container spacing={1}>
  {/* Existing fields */}
  
  {/* Add this new Grid item for files */}
  <Grid2 xs={12}>
  <Box sx={{ mt: 2 }}>
    <Typography variant="h6">Uploaded Documents</Typography>
    
    {/* W9 Form */}
    {formData.w9 && (
      <Box display="flex" alignItems="center" mb={1}>
        <Typography variant="subtitle2" sx={{ mr: 2 }}>W9 Form:</Typography>
        <Link href={`http://localhost:5000/uploads/applications/${formData.w9}`} target="_blank">
          View Document
        </Link>
      </Box>
    )}

    {/* Background Check */}
    {formData.backgroundCheck && (
      <Box display="flex" alignItems="center" mb={1}>
        <Typography variant="subtitle2" sx={{ mr: 2 }}>Background Check:</Typography>
        <Link href={`http://localhost:5000/uploads/applications/${formData.backgroundCheck}`} target="_blank">
          View Document
        </Link>
      </Box>
    )}

    {/* Insurance COI */}
    {formData.insurance?.coi && (
      <Box display="flex" alignItems="center" mb={1}>
        <Typography variant="subtitle2" sx={{ mr: 2 }}>Certificate of Insurance:</Typography>
        <Link href={`http://localhost:5000/uploads/applications/${formData.insurance.coi}`} target="_blank">
          View Document
        </Link>
      </Box>
    )}

    {/* Zip Code File */}
    {formData.territories?.zipCodeFile && (
      <Box display="flex" alignItems="center" mb={1}>
        <Typography variant="subtitle2" sx={{ mr: 2 }}>Zip Codes File:</Typography>
        <Link href={`http://localhost:5000/uploads/applications/${formData.territories.zipCodeFile}`} target="_blank">
          View Document
        </Link>
      </Box>
    )}
  </Box>
  </Grid2>
</Grid2>
      </Box>

      {/* Facility Address */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6">Facility Address</Typography>
        <InputLabel id="facility-country-label">Facility Country</InputLabel>
        <Select
          fullWidth
          labelId="facility-country-label"
          name="facilityCountry"
          value={formData.facilityCountry}
          onChange={handleChange}
          margin="dense"
        >
          {countries.map((country) => (
            <MenuItem key={country} value={country}>
              {country}
            </MenuItem>
          ))}
        </Select>
        <TextField
          fullWidth
          label="Facility Address Line 1"
          name="facilityAddress1"
          value={formData.facilityAddress1}
          onChange={handleChange}
          margin="dense"
        />
        <TextField
          fullWidth
          label="Facility Address Line 2"
          name="facilityAddress2"
          value={formData.facilityAddress2}
          onChange={handleChange}
          margin="dense"
        />
        <TextField
          fullWidth
          label="City"
          name="facilityCity"
          value={formData.facilityCity}
          onChange={handleChange}
          margin="dense"
        />
        <InputLabel id="facility-state-label">State/Province</InputLabel>
        <Select
          fullWidth
          labelId="facility-state-label"
          name="facilityState"
          value={formData.facilityState}
          onChange={handleChange}
          margin="dense"
        >
          {statesProvinces[formData.facilityCountry]?.map((state) => (
            <MenuItem key={state} value={state}>
              {state}
            </MenuItem>
          ))}
        </Select>
        <TextField
          fullWidth
          label="Zip/Postal Code"
          name="facilityZip"
          value={formData.facilityZip}
          onChange={handleChange}
          margin="dense"
        />
      </Box>

      {/* Billing Information */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6">Billing Information</Typography>
        <InputLabel id="billing-same-label">
          Is your billing address the same as your facility address?
        </InputLabel>
        <Select
          fullWidth
          labelId="billing-same-label"
          name="billingSame"
          value={formData.billingSame}
          onChange={handleChange}
          margin="dense"
        >
          {yesNoOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>

        {/* Show billing address fields if billingSame is 'no' */}
        {formData.billingSame === 'no' && (
          <Box sx={{ mt: 2 }}>
            <InputLabel id="billing-country-label">Billing Country</InputLabel>
            <Select
              fullWidth
              labelId="billing-country-label"
              name="billingAddress.country"
              value={formData.billingAddress.country}
              onChange={handleChange}
              margin="dense"
            >
              {countries.map((country) => (
                <MenuItem key={country} value={country}>
                  {country}
                </MenuItem>
              ))}
            </Select>
            <TextField
              fullWidth
              label="Billing Address Line 1"
              name="billingAddress.address1"
              value={formData.billingAddress.address1}
              onChange={handleChange}
              margin="dense"
            />
            <TextField
              fullWidth
              label="Billing Address Line 2"
              name="billingAddress.address2"
              value={formData.billingAddress.address2}
              onChange={handleChange}
              margin="dense"
            />
            <TextField
              fullWidth
              label="City"
              name="billingAddress.city"
              value={formData.billingAddress.city}
              onChange={handleChange}
              margin="dense"
            />
            <InputLabel id="billing-state-label">State/Province</InputLabel>
            <Select
              fullWidth
              labelId="billing-state-label"
              name="billingAddress.state"
              value={formData.billingAddress.state}
              onChange={handleChange}
              margin="dense"
            >
              {statesProvinces[formData.billingAddress.country]?.map((state) => (
                <MenuItem key={state} value={state}>
                  {state}
                </MenuItem>
              ))}
            </Select>
            <TextField
              fullWidth
              label="Zip/Postal Code"
              name="billingAddress.zip"
              value={formData.billingAddress.zip}
              onChange={handleChange}
              margin="dense"
            />
          </Box>
        )}
      </Box>

      {/* Services You Perform */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6">Services You Perform</Typography>
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.services.roadOnly}
                onChange={handleServicesChange}
                name="roadOnly"
              />
            }
            label="Road-Only Services"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.services.lightDuty}
                onChange={handleServicesChange}
                name="lightDuty"
              />
            }
            label="Light Duty Towing"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.services.mediumDuty}
                onChange={handleServicesChange}
                name="mediumDuty"
              />
            }
            label="Medium Duty Towing"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.services.heavyDuty}
                onChange={handleServicesChange}
                name="heavyDuty"
              />
            }
            label="Heavy Duty Towing"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.services.mobileMechanic}
                onChange={handleServicesChange}
                name="mobileMechanic"
              />
            }
            label="Mobile Mechanic Services"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.services.mediumHeavyTire}
                onChange={handleServicesChange}
                name="mediumHeavyTire"
              />
            }
            label="Medium/Heavy Tire Delivery Service"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.services.accidentSceneTowing}
                onChange={handleServicesChange}
                name="accidentSceneTowing"
              />
            }
            label="Accident Scene Towing"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.services.secondaryTow}
                onChange={handleServicesChange}
                name="secondaryTow"
              />
            }
            label="Secondary Tow with VCC Payout"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.services.storageFacility}
                onChange={handleServicesChange}
                name="storageFacility"
              />
            }
            label="Storage at Facility"
          />
        </FormGroup>
        <InputLabel id="open247-label">Are you open 24/7?</InputLabel>
        <Select
          fullWidth
          labelId="open247-label"
          name="open247"
          value={formData.services.open247}
          onChange={handleServicesChange}
          margin="dense"
        >
          {yesNoOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
        {formData.services.open247 === 'no' && (
          <TextField
            fullWidth
            label="Please list your hours of operation"
            name="hoursOfOperation"
            value={formData.services.hoursOfOperation}
            onChange={handleServicesChange}
            margin="dense"
          />
        )}
      </Box>

      {/* Territories */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6">Territories</Typography>
        <Button variant="contained" component="label" sx={{ mt: 1 }}>
          Upload Zip Code List
          <input
            type="file"
            hidden
            name="zipCodeFile"
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                territories: {
                  ...prev.territories,
                  zipCodeFile: e.target.files[0],
                },
              }))
            }
          />
        </Button>
        {formData.territories.zipCodeFile && (
          <Typography>{formData.territories.zipCodeFile.name}</Typography>
        )}
        <Typography variant="body2" sx={{ mt: 1 }}>
          Or type in your zip code list, separating each with a comma and space here:
        </Typography>
        <TextField
          fullWidth
          multiline
          name="zipCodes"
          value={formData.territories.zipCodes}
          onChange={handleTerritoriesChange}
          inputProps={{ maxLength: 500 }}
          margin="dense"
        />
        <FormHelperText>{`${formData.territories.zipCodes.length}/500 characters`}</FormHelperText>
      </Box>

      {/* IRS Information */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6">IRS Information</Typography>
        <Button variant="contained" component="label" sx={{ mt: 1 }}>
          Upload W-9 Form
          <input type="file" hidden name="w9" onChange={handleFileChange} />
        </Button>
        {formData.w9 && <Typography>{formData.w9.name}</Typography>}
        <InputLabel id="w9-address-label" sx={{ mt: 2 }}>
          Address on W-9 Form
        </InputLabel>
        <Select
          fullWidth
          labelId="w9-address-label"
          name="w9Address"
          value={formData.w9Address}
          onChange={handleChange}
          margin="dense"
        >
          <MenuItem value="facility">Facility Address</MenuItem>
          <MenuItem value="billing">Billing Address</MenuItem>
        </Select>
        <FormControlLabel
          control={
            <Checkbox
              name="backupWithholding"
              checked={formData.backupWithholding}
              onChange={handleTopLevelCheckboxChange}
            />
          }
          label="Backup Withholding Certification"
        />
      </Box>

      {/* Electronic Signature */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6">Electronic Signature</Typography>
        <TextField
          fullWidth
          label="Electronic Signature"
          name="signature"
          value={formData.signature}
          onChange={handleChange}
          margin="dense"
        />
      </Box>

      {/* Number of Employees */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6">Number of Employees</Typography>
        <TextField
          fullWidth
          label="Number of Employees (including yourself)"
          type="number"
          name="employees"
          value={formData.employees}
          onChange={handleChange}
          margin="dense"
        />
      </Box>

      {/* Background Check */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6">Background Check Documentation</Typography>
        <Typography variant="body2">
          Background checks are required for all members of your business. If you do
          not provide background checks, your application will not be considered.
        </Typography>
        <Button variant="contained" component="label" sx={{ mt: 1 }}>
          Upload Background Check
          <input type="file" hidden name="backgroundCheck" onChange={handleFileChange} />
        </Button>
        {formData.backgroundCheck && (
          <Typography>{formData.backgroundCheck.name}</Typography>
        )}
      </Box>

      {/* Insurance Information */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6">Insurance Information</Typography>
        <Typography variant="body2">
          Please upload your Certificate of Insurance.
          Please review the application instructions for our requirements. COIs that
          do not meet our minimums may delay your application or cause it to be
          rejected.
        </Typography>
        <Button variant="contained" component="label" sx={{ mt: 1 }}>
          Upload Certificate of Insurance
          <input
            type="file"
            hidden
            name="coi"
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                insurance: {
                  ...prev.insurance,
                  coi: e.target.files[0],
                },
              }))
            }
          />
        </Button>
        {formData.insurance.coi && <Typography>{formData.insurance.coi.name}</Typography>}
        <TextField
          fullWidth
          label="Insurance Agency"
          name="agency"
          value={formData.insurance.agency}
          onChange={handleInsuranceChange}
          margin="dense"
        />
        <TextField
          fullWidth
          label="Policy #"
          name="policyNumber"
          value={formData.insurance.policyNumber}
          onChange={handleInsuranceChange}
          margin="dense"
        />
        <TextField
          fullWidth
          label="Agent's Name"
          name="agentName"
          value={formData.insurance.agentName}
          onChange={handleInsuranceChange}
          margin="dense"
        />
        <TextField
          fullWidth
          label="Agent's Phone"
          name="agentPhone"
          type="tel"
          value={formData.insurance.agentPhone}
          onChange={handleInsuranceChange}
          margin="dense"
        />
        <TextField
          fullWidth
          label="Agent's Fax"
          name="agentFax"
          type="tel"
          value={formData.insurance.agentFax}
          onChange={handleInsuranceChange}
          margin="dense"
        />
        <TextField
          fullWidth
          label="Agent's Email"
          name="agentEmail"
          type="email"
          value={formData.insurance.agentEmail}
          onChange={handleInsuranceChange}
          margin="dense"
        />
        <TextField
          fullWidth
          label="Policy Expiration Date"
          name="policyExpiration"
          type="date"
          value={formData.insurance.policyExpiration}
          onChange={handleInsuranceChange}
          margin="dense"
          InputLabelProps={{
            shrink: true,
          }}
        />
      </Box>

      {/* Additional Company Info */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6">Additional Company Info</Typography>
        <InputLabel id="years-in-business-label">
          How long has your company been in business?
        </InputLabel>
        <Select
          fullWidth
          labelId="years-in-business-label"
          name="yearsInBusiness"
          value={formData.businessInfo.yearsInBusiness}
          onChange={handleBusinessInfoChange}
          margin="dense"
        >
          {yearsOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
        <InputLabel id="ev-experience-label">
          Do you have experience handling Electric Vehicles?
        </InputLabel>
        <Select
          fullWidth
          labelId="ev-experience-label"
          name="electricVehicleExp"
          value={formData.businessInfo.electricVehicleExp}
          onChange={handleBusinessInfoChange}
          margin="dense"
        >
          {yesNoOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
        <InputLabel id="digital-dispatch-label">
          Do you currently use digital dispatch software?
        </InputLabel>
        <Select
          fullWidth
          labelId="digital-dispatch-label"
          name="digitalDispatch"
          value={formData.businessInfo.digitalDispatch}
          onChange={handleBusinessInfoChange}
          margin="dense"
        >
          {yesNoOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </Box>

      {/* Business Ownership */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6">Business Ownership Identification</Typography>
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.ownership.familyOwned}
                onChange={handleOwnershipChange}
                name="familyOwned"
              />
            }
            label="Family-Owned"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.ownership.womenOwned}
                onChange={handleOwnershipChange}
                name="womenOwned"
              />
            }
            label="Women-Owned"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.ownership.minorityOwned}
                onChange={handleOwnershipChange}
                name="minorityOwned"
              />
            }
            label="Minority-Owned"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.ownership.veteranOwned}
                onChange={handleOwnershipChange}
                name="veteranOwned"
              />
            }
            label="Veteran-Owned"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.ownership.lgbtqOwned}
                onChange={handleOwnershipChange}
                name="lgbtqOwned"
              />
            }
            label="LGBTQ+-Owned"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.ownership.smallBusiness}
                onChange={handleOwnershipChange}
                name="smallBusiness"
              />
            }
            label="Small Business"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.ownership.disadvantagedBusiness}
                onChange={handleOwnershipChange}
                name="disadvantagedBusiness"
              />
            }
            label="Small Disadvantaged Business"
          />
        </FormGroup>
      </Box>

      {/* Terms and Conditions */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6">Terms and Conditions</Typography>
        <FormControlLabel
          control={
            <Checkbox
              name="termsAgreement"
              checked={formData.termsAgreement}
              onChange={handleTopLevelCheckboxChange}
              required
            />
          }
          label={
            <>
              By checking this box, I agree to{' '}
              <Link href="/terms-and-conditions.pdf" target="_blank">
                White Knight's Terms and Conditions.*
              </Link>
            </>
          }
        />
        <FormControlLabel
          control={
            <Checkbox
              name="codeOfConductAgreement"
              checked={formData.codeOfConductAgreement}
              onChange={handleTopLevelCheckboxChange}
              required
            />
          }
          label={
            <>
              By checking this box, I agree to{' '}
              <Link href="/code-of-conduct.pdf" target="_blank">
                White Knight's Code of Conduct.*
              </Link>
            </>
          }
        />
      </Box>

      <Button
        type="submit"
        variant="contained"
        color="primary"
        sx={{ mt: 2, mb: 4 }}
        disabled={!formData.termsAgreement || !formData.codeOfConductAgreement}
      >
        Submit Application
      </Button>
    </form>
  );
};

export default ApplicationForm;
