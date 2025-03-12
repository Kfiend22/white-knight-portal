import React, { useState, useEffect } from 'react';
import { TextField, Button, Link, Typography, Container, Box, Alert, FormControlLabel, Checkbox } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ChangePasswordDialog from '../components/ChangePasswordDialog';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Check if token is valid before redirecting
      import('../utils/authUtils').then(({ isTokenExpired }) => {
        if (!isTokenExpired(token)) {
          navigate('/dashboard');
        } else {
          // Clear invalid token
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setLoginError('Your session has expired. Please log in again.');
        }
      });
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const validateForm = () => {
    const { username, password } = formData;
    const newErrors = {};
    if (!username) newErrors.username = 'Username is required.';
    if (!password) newErrors.password = 'Password is required.';
    return newErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const newErrors = validateForm();
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      setLoginError('');
      
      try {
        const response = await axios.post('/api/auth/login', {
          username: formData.username,
          password: formData.password,
          rememberMe: rememberMe
        });
        
        // Store token in localStorage
        localStorage.setItem('token', response.data.token);
        
        // Store user info
        const userData = {
          _id: response.data._id,
          username: response.data.username,
          email: response.data.email,
          // Store both primaryRole and legacy role for backward compatibility
          primaryRole: response.data.primaryRole || response.data.role,
          role: response.data.role || response.data.primaryRole
        };
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Debug log
        console.log('User data stored in localStorage:', userData);
        
        console.log('Login successful:', response.data);
        
        // Check if password change is required
        if (response.data.isFirstLogin) {
          setShowChangePasswordDialog(true);
        } else {
          // Redirect to dashboard
          navigate('/dashboard');
        }
      } catch (error) {
        if (error.response) {
          // Server responded with an error
          setLoginError(error.response.data.message || 'Login failed. Please try again.');
        } else if (error.request) {
          // Request was made but no response received
          setLoginError('Network error. Please check your connection and try again.');
        } else {
          // Something else happened while setting up the request
          setLoginError('An unexpected error occurred. Please try again.');
        }
        console.error('Login failed:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle successful password change
  const handlePasswordChangeSuccess = () => {
    // Redirect to dashboard
    navigate('/dashboard');
  };

  return (
    <Container maxWidth="xs">
      <Box mt={8}>
        <Typography variant="h4" align="center">
          White Knight Roadside Motor Club
        </Typography>
        <Typography variant="h6" align="center" gutterBottom>
          Provider Login
        </Typography>
        <form onSubmit={handleSubmit}>
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
          />
          {loginError && (
            <Typography color="error" variant="body2">
              {loginError}
            </Typography>
          )}
          <FormControlLabel
            control={
              <Checkbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                color="primary"
              />
            }
            label="Remember me for 30 days"
            sx={{ mt: 1 }}
          />
          
          <Button
            fullWidth
            variant="contained"
            color="primary"
            type="submit"
            sx={{ mt: 2 }}
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
          <Box mt={2} display="flex" justifyContent="space-between">
            <Link href="/register" variant="body2">
              Register with Vendor ID
            </Link>
            <Link href="/reset-password" variant="body2">
              Forgot Password?
            </Link>
          </Box>
        </form>
      </Box>
      
      {/* Change Password Dialog */}
      <ChangePasswordDialog
        open={showChangePasswordDialog}
        onClose={() => setShowChangePasswordDialog(false)}
        onSuccess={handlePasswordChangeSuccess}
      />
    </Container>
  );
};

export default Login;
