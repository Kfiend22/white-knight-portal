// src/components/ChangePasswordDialog.js
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import axios from 'axios';

const ChangePasswordDialog = ({ open, onClose, onSuccess }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    
    if (!currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!newPassword) {
      errors.newPassword = 'New password is required';
    } else {
      // Enhanced password validation
      if (newPassword.length < 9) {
        errors.newPassword = 'Password must be at least 9 characters long';
      }
      
      if (!/[A-Z]/.test(newPassword)) {
        errors.newPassword = errors.newPassword || 'Password must contain at least one uppercase letter';
      }
      
      if (!/[a-z]/.test(newPassword)) {
        errors.newPassword = errors.newPassword || 'Password must contain at least one lowercase letter';
      }
      
      if (!/[0-9]/.test(newPassword)) {
        errors.newPassword = errors.newPassword || 'Password must contain at least one number';
      }
      
      if (!/[^A-Za-z0-9]/.test(newPassword)) {
        errors.newPassword = errors.newPassword || 'Password must contain at least one special character';
      }
      
      // Simple dictionary word check (can be enhanced with a more comprehensive list)
      const commonWords = ['password', 'admin', 'user', 'login', 'welcome', 'secret'];
      const lowerPassword = newPassword.toLowerCase();
      
      for (const word of commonWords) {
        if (lowerPassword.includes(word)) {
          errors.newPassword = errors.newPassword || 'Password should not contain common words';
          break;
        }
      }
    }
    
    if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      
      // Make sure we're using the correct API endpoint
      await axios.post('/api/auth/change-password', {
        currentPassword,
        newPassword
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
      
      // Close dialog
      onClose();
    } catch (error) {
      console.error('Error changing password:', error);
      
      if (error.response && error.response.data) {
        setError(error.response.data.message || 'Failed to change password');
      } else {
        setError('Failed to change password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Change Password</DialogTitle>
      <DialogContent>
        <Box my={2}>
          <Typography variant="body1" gutterBottom>
            You must change your password before continuing.
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <TextField
            label="Current Password"
            type="password"
            fullWidth
            margin="normal"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            error={!!validationErrors.currentPassword}
            helperText={validationErrors.currentPassword}
            disabled={loading}
          />
          
          <TextField
            label="New Password"
            type="password"
            fullWidth
            margin="normal"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            error={!!validationErrors.newPassword}
            helperText={validationErrors.newPassword}
            disabled={loading}
          />
          
          <TextField
            label="Confirm New Password"
            type="password"
            fullWidth
            margin="normal"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={!!validationErrors.confirmPassword}
            helperText={validationErrors.confirmPassword}
            disabled={loading}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={handleSubmit} 
          color="primary" 
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Changing Password...' : 'Change Password'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChangePasswordDialog;
