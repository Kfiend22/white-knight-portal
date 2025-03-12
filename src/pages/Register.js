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
import axios from 'axios';

const Register = () => {
  const [formData, setFormData] = useState({
    vendorId: '',
    username: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    email: '', // Changed from contactEmail to match backend expectation
  });
  const [errors, setErrors] = useState({});
  const [vendorIdNotFoundError, setVendorIdNotFoundError] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingVendorId, setIsValidatingVendorId] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if all fields are filled to enable the Register button
    const { vendorId, username, password, confirmPassword, companyName, email } = formData;
    if (
      vendorId.trim() &&
      username.trim() &&
      password.trim() &&
      confirmPassword.trim() &&
      password === confirmPassword &&
      companyName.trim() &&
      email.trim() &&
      !vendorIdNotFoundError
    ) {
      setIsFormValid(true);
    } else {
      setIsFormValid(false);
    }
  }, [formData, vendorIdNotFoundError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
    
    // Clear errors when user types
    setVendorIdNotFoundError('');
    setSubmissionError('');
    
    // If vendorId field is being changed and has a valid length, validate it
    if (name === 'vendorId' && value.trim().length >= 8) {
      validateVendorId(value);
    }
  };
  
  // Function to validate vendorId with the backend
  const validateVendorId = async (vendorId) => {
    if (!vendorId.trim()) return;
    
    setIsValidatingVendorId(true);
    try {
      const response = await axios.get(`/api/auth/validate-vendor-id/${vendorId}`);
      if (!response.data.valid) {
        setVendorIdNotFoundError('Vendor ID not found or already registered');
      }
    } catch (error) {
      setVendorIdNotFoundError('Error validating Vendor ID');
      console.error('Vendor ID validation error:', error);
    } finally {
      setIsValidatingVendorId(false);
    }
  };

  const validateForm = () => {
    const { vendorId, username, password, confirmPassword, companyName, email } = formData;
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
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (!companyName) newErrors.companyName = 'Company Name is required.';

    if (!email) {
      newErrors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Invalid email address.';
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0 && !vendorIdNotFoundError) {
      setConfirmDialogOpen(true);
    }
  };

  const handleCancel = () => {
    setConfirmDialogOpen(false);
  };

  const handleConfirm = async () => {
    setConfirmDialogOpen(false);
    setIsLoading(true);
    
    try {
      // Create payload with correct field names for backend
      const payload = {
        vendorId: formData.vendorId,
        username: formData.username,
        password: formData.password,
        companyName: formData.companyName,
        email: formData.email // Using email instead of contactEmail
      };
      
      const response = await axios.post('/api/auth/register', payload);
      // On successful registration, navigate to login with success message
      navigate('/login', { 
        state: { 
          message: 'Registration successful! Please log in with your new credentials.',
          type: 'success' 
        } 
      });
    } catch (error) {
      if (error.response) {
        // Server responded with an error
        setSubmissionError(error.response.data.message || 'Registration failed');
      } else if (error.request) {
        // Request was made but no response received
        setSubmissionError('Network error. Please check your connection and try again.');
      } else {
        // Something else happened while setting up the request
        setSubmissionError('An unexpected error occurred. Please try again.');
      }
      console.error('Registration failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box mt={4}>
        <Typography variant="h4" align="center" gutterBottom>
          Register
        </Typography>
        <form onSubmit={handleSubmit} noValidate>
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
            name="password"
            type="password"
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
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            margin="normal"
            variant="outlined"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={Boolean(errors.confirmPassword)}
            helperText={errors.confirmPassword}
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
            label="Email"
            name="email"
            margin="normal"
            variant="outlined"
            value={formData.email}
            onChange={handleChange}
            error={Boolean(errors.email)}
            helperText={errors.email}
            required
          />
          {vendorIdNotFoundError && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {vendorIdNotFoundError}
            </Typography>
          )}
          
          {submissionError && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {submissionError}
            </Typography>
          )}
          <Button
            fullWidth
            variant="contained"
            color="primary"
            type="submit"
            sx={{ mt: 2 }}
            disabled={!isFormValid || isLoading || isValidatingVendorId}
          >
            {isLoading ? 'Registering...' : 'Register'}
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
          <Button onClick={handleCancel} disabled={isLoading}>Cancel</Button>
          <Button 
            onClick={handleConfirm} 
            color="primary"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Register;
