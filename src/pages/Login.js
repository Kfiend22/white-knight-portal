import React, { useState, useEffect } from 'react';
import { TextField, Button, Link, Typography, Container, Box, Alert, FormControlLabel, Checkbox } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ChangePasswordDialog from '../components/ChangePasswordDialog';
import { isTokenExpired } from '../utils/authUtils';

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
    console.log('Login useEffect: Checking for existing token');
    
    // Check localStorage first
    let token = localStorage.getItem('token');
    let userJson = localStorage.getItem('user');
    
    // If not in localStorage, check sessionStorage
    if (!token) {
      token = sessionStorage.getItem('backup_token');
      userJson = sessionStorage.getItem('backup_user');
      console.log('Login useEffect: Backup token exists in sessionStorage?', !!token);
    } else {
      console.log('Login useEffect: Token exists in localStorage');
    }
    
    if (token) {
      // Check if token is valid before redirecting
      if (!isTokenExpired(token)) {
        console.log('Login useEffect: Token is valid, redirecting to dashboard');
        
        // If token was found in sessionStorage but not localStorage, restore it
        if (!localStorage.getItem('token') && sessionStorage.getItem('backup_token')) {
          localStorage.setItem('token', sessionStorage.getItem('backup_token'));
          
          if (userJson) {
            localStorage.setItem('user', userJson);
          }
        }
        
        navigate('/dashboard');
      } else {
        console.log('Login useEffect: Token is expired, clearing storage');
        // Clear invalid token from both storage locations
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('backup_token');
        sessionStorage.removeItem('backup_user');
        setLoginError('Your session has expired. Please log in again.');
      }
    } else {
      console.log('Login useEffect: No token found in either storage location');
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
        console.log('Login handleSubmit: Submitting login request');
        const response = await axios.post('/api/auth/login', {
          username: formData.username,
          password: formData.password,
          rememberMe: rememberMe
        });
        
        console.log('Login handleSubmit: Login successful, storing token');
        
        // Check if localStorage is working
        try {
          // Store token in localStorage
          localStorage.setItem('token', response.data.token);
          
          // Verify it was stored correctly
          const storedToken = localStorage.getItem('token');
          console.log('Login handleSubmit: Token stored successfully?', !!storedToken, 
                      'Length:', storedToken ? storedToken.length : 0);
          
          // Store user info
          const userData = {
            _id: response.data._id,
            username: response.data.username,
            email: response.data.email,
            // Store both primaryRole and legacy role for backward compatibility
            primaryRole: response.data.primaryRole || response.data.role,
            role: response.data.role || response.data.primaryRole,
            // Ensure secondaryRoles is always stored as an array
            secondaryRoles: Array.isArray(response.data.secondaryRoles) 
              ? response.data.secondaryRoles 
              : (response.data.secondaryRoles && typeof response.data.secondaryRoles === 'object')
                ? Object.keys(response.data.secondaryRoles).filter(role => response.data.secondaryRoles[role])
                : []
          };
          
          console.log('Login handleSubmit: Storing user data with secondaryRoles:', 
                      userData.secondaryRoles, 
                      'isArray:', Array.isArray(userData.secondaryRoles));
          localStorage.setItem('user', JSON.stringify(userData));
          
          // Verify user data was stored
          const storedUser = localStorage.getItem('user');
          console.log('Login handleSubmit: User data stored successfully?', !!storedUser);
          
          // Also store in sessionStorage as backup
          sessionStorage.setItem('backup_token', response.data.token);
          sessionStorage.setItem('backup_user', JSON.stringify(userData));
        } catch (storageError) {
          console.error('Login handleSubmit: Error storing data in localStorage:', storageError);
        }
        
        // Check if password change is required
        if (response.data.isFirstLogin) {
          setShowChangePasswordDialog(true);
        } else {
          // Refresh user data in useJobData if available
          if (window.refreshUserFromJobData && typeof window.refreshUserFromJobData === 'function') {
            console.log('Login: Refreshing user data in useJobData after login');
            window.refreshUserFromJobData();
          }
          
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
