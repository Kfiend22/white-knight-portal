import React, { useState } from 'react';
import { TextField, Button, Typography, Container, Box } from '@mui/material';

const Register = () => {
  const [formData, setFormData] = useState({
    vendorId: '',
    companyName: '',
    contactEmail: ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const validateVendorId = (id) => {
    // TODO: Implement actual Vendor ID validation logic
    return id.length === 6; // Example condition
  };

  const validateForm = () => {
    const { vendorId, companyName, contactEmail } = formData;
    const newErrors = {};
    if (!vendorId) {
      newErrors.vendorId = 'Vendor ID is required.';
    } else if (!validateVendorId(vendorId)) {
      newErrors.vendorId = 'Invalid Vendor ID.';
    }
    if (!companyName) newErrors.companyName = 'Company Name is required.';
    if (!contactEmail) {
      newErrors.contactEmail = 'Contact Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(contactEmail)) {
      newErrors.contactEmail = 'Invalid email address.';
    }
    return newErrors;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const newErrors = validateForm();
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      // TODO: Implement registration logic
      console.log('Registration data:', formData);
      // Redirect user to the dashboard or next registration step
    }
  };

  return (
    <Container maxWidth="sm">
      <Box mt={8}>
        <Typography variant="h4" align="center">
          White Knight Roadside Motor Club
        </Typography>
        <Typography variant="h6" align="center" gutterBottom>
          Provider Registration
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Vendor ID"
            name="vendorId"
            margin="normal"
            variant="outlined"
            value={formData.vendorId}
            onChange={handleChange}
            error={Boolean(errors.vendorId)}
            helperText={errors.vendorId}
          />
          <TextField
            fullWidth
            label="Company Name"
            name="companyName"
            margin="normal"
            variant="outlined"
            value={formData.companyName}
            onChange={handleChange}
            error={Boolean(errors.companyName)}
            helperText={errors.companyName}
          />
          <TextField
            fullWidth
            label="Contact Email"
            name="contactEmail"
            margin="normal"
            variant="outlined"
            value={formData.contactEmail}
            onChange={handleChange}
            error={Boolean(errors.contactEmail)}
            helperText={errors.contactEmail}
          />
          {/* Add more fields as necessary */}
          <Button
            fullWidth
            variant="contained"
            color="primary"
            type="submit"
            sx={{ mt: 2 }}
          >
            Register
          </Button>
        </form>
      </Box>
    </Container>
  );
};

export default Register;