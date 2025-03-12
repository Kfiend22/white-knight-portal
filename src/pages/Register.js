// Register.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

const Register = () => {
  const [formData, setFormData] = useState({
    vendorId: '',
    username: '',
    password: '',
    companyName: '',
    contactEmail: '',
  });
  const [errors, setErrors] = useState({});
  const [vendorIdNotFoundError, setVendorIdNotFoundError] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if all fields are filled to enable the Register button
    const { vendorId, username, password, companyName, contactEmail } = formData;
    if (
      vendorId.trim() &&
      username.trim() &&
      password.trim() &&
      companyName.trim() &&
      contactEmail.trim()
    ) {
      setIsFormValid(true);
    } else {
      setIsFormValid(false);
    }
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
    setVendorIdNotFoundError('');
    setSubmissionError('');
  };

  const validateForm = () => {
    const { vendorId, username, password, companyName, contactEmail } = formData;
    const newErrors = {};

    if (!vendorId) {
      newErrors.vendorId = 'Vendor ID is required.';
    }

    if (!username) newErrors.username = 'Username is required.';

    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long.';
    }

    if (!companyName) newErrors.companyName = 'Company Name is required.';

    if (!contactEmail) {
      newErrors.contactEmail = 'Contact Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(contactEmail)) {
      newErrors.contactEmail = 'Invalid email address.';
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setConfirmDialogOpen(true);
    }
  };

  const handleConfirm = async () => {
    setConfirmDialogOpen(false);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'PUT', // Changed to PUT since we're updating an existing user
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: formData.vendorId,
          username: formData.username,
          password: formData.password, // Backend will handle hashing
          companyName: formData.companyName,
          email: formData.contactEmail
        }),
      });
      const data = await response.json();
  
      if (response.ok) {
        navigate('/login');
      } else {
        if (data.message === 'Vendor ID not found') {
          setVendorIdNotFoundError('No matching vendor ID found in our records');
        } else {
          setSubmissionError(data.message || 'An error occurred during registration');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      setSubmissionError('An error occurred during registration');
    }
  };  

  const handleCancel = () => {
    setConfirmDialogOpen(false);
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
            error={Boolean(errors.vendorId) || Boolean(vendorIdNotFoundError)}
            helperText={errors.vendorId || vendorIdNotFoundError}
            required
          />
          <TextField
            fullWidth
            label="Username"
            name="username"
            margin="normal"
            variant="outlined"
            value={formData.username}
            onChange={handleChange}
            error={Boolean(errors.username)}
            helperText={errors.username}
            required
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            name="password"
            margin="normal"
            variant="outlined"
            value={formData.password}
            onChange={handleChange}
            error={Boolean(errors.password)}
            helperText={errors.password}
            required
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
            required
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
            required
          />
          {submissionError && (
            <Typography color="error" variant="body2">
              {submissionError}
            </Typography>
          )}
          <Button
            fullWidth
            variant="contained"
            color="primary"
            type="submit"
            sx={{ mt: 2 }}
            disabled={!isFormValid}
          >
            Register
          </Button>
        </form>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={handleCancel}>
        <DialogTitle>Confirm Registration</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to submit your registration information?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleConfirm} color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Register;
