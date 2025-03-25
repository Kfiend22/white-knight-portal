// EditProfileDialog.js
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Avatar,
  Box,
  IconButton,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Typography,
  Divider,
  Grid,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  FormHelperText,
} from '@mui/material';
import { 
  CameraAlt as CameraAltIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';

function EditProfileDialog({ open, onClose, profileData, setProfileData, authHeader }) {
  // State for Profile Picture file (used in the dialog)
  const [profilePicture, setProfilePicture] = useState(null);

  // Local state for form fields (to avoid changing parent state before save)
  const [localProfileData, setLocalProfileData] = useState(profileData);
  
  // State for password fields
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
    showNewPassword: false,
    showConfirmPassword: false,
  });
  
  // State for password validation
  const [passwordError, setPasswordError] = useState('');
  
  // State for notification preferences
  const [notificationPrefs, setNotificationPrefs] = useState({
    receiveEmailNotifications: localProfileData.receiveEmailNotifications || false,
    receiveTextNotifications: localProfileData.receiveTextNotifications || false,
    notifyOnNewJob: localProfileData.notifyOnNewJob || false,
    notifyOnJobCanceled: localProfileData.notifyOnJobCanceled || false,
    notifyOnJobOnScene: localProfileData.notifyOnJobOnScene || false,
    notifyOnJobReassigned: localProfileData.notifyOnJobReassigned || false,
    notifyOnJobMarkedAsGOA: localProfileData.notifyOnJobMarkedAsGOA || false,
  });

  // Update localProfileData when profileData changes
  React.useEffect(() => {
    setLocalProfileData(profileData);
    // Also update notification preferences
    setNotificationPrefs({
      receiveEmailNotifications: profileData.receiveEmailNotifications || false,
      receiveTextNotifications: profileData.receiveTextNotifications || false,
      notifyOnNewJob: profileData.notifyOnNewJob || false,
      notifyOnJobCanceled: profileData.notifyOnJobCanceled || false,
      notifyOnJobOnScene: profileData.notifyOnJobOnScene || false,
      notifyOnJobReassigned: profileData.notifyOnJobReassigned || false,
      notifyOnJobMarkedAsGOA: profileData.notifyOnJobMarkedAsGOA || false,
    });
  }, [profileData]);

  // Handler for Profile Picture Change
  const handleProfilePictureChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setProfilePicture(event.target.files[0]);
    }
  };
  
  // Handler for password visibility toggle
  const handlePasswordVisibility = (field) => {
    if (field === 'new') {
      setPasswordData({
        ...passwordData,
        showNewPassword: !passwordData.showNewPassword,
      });
    } else if (field === 'confirm') {
      setPasswordData({
        ...passwordData,
        showConfirmPassword: !passwordData.showConfirmPassword,
      });
    }
  };
  
  // Handler for password change
  const handlePasswordChange = (e, field) => {
    const value = e.target.value;
    setPasswordData({
      ...passwordData,
      [field]: value,
    });
    
    // Clear error when typing
    if (passwordError) {
      setPasswordError('');
    }
  };
  
  // Handler for notification preference changes
  const handleNotificationChange = (event) => {
    const { name, checked } = event.target;
    setNotificationPrefs({
      ...notificationPrefs,
      [name]: checked,
    });
  };

  // Function to validate passwords
  const validatePasswords = () => {
    if (passwordData.newPassword && passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return false;
    }
    
    if (passwordData.newPassword && passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return false;
    }
    
    return true;
  };

  // Function to handle saving profile changes
  const handleSaveProfile = () => {
    // Validate passwords if a new password is being set
    if (passwordData.newPassword && !validatePasswords()) {
      return;
    }
    
    const formData = new FormData();
    
    // Always include these fields
    formData.append('firstName', localProfileData.firstName);
    formData.append('lastName', localProfileData.lastName);
    formData.append('username', localProfileData.username);
    formData.append('phoneNumber', localProfileData.phoneNumber);
    
    // Include password only if it's being changed
    if (passwordData.newPassword) {
      formData.append('password', passwordData.newPassword);
    }
    
    // Include notification preferences
    Object.keys(notificationPrefs).forEach(key => {
      formData.append(key, notificationPrefs[key]);
    });
    
    // Include SP-specific fields only if user is an SP
    if (localProfileData.primaryRole === 'SP') {
      formData.append('companyName', localProfileData.companyName || '');
      formData.append('position', localProfileData.position || '');
      formData.append('companyAddress', localProfileData.companyAddress || '');
      formData.append('companyAddress2', localProfileData.companyAddress2 || '');
      formData.append('city', localProfileData.city || '');
      formData.append('state', localProfileData.state || '');
      formData.append('zip', localProfileData.zip || '');
      formData.append('mainLinePhoneNumber', localProfileData.mainLinePhoneNumber || '');
      formData.append('dispatchPhoneNumber', localProfileData.dispatchPhoneNumber || '');
      formData.append('answeringServicePhoneNumber', localProfileData.answeringServicePhoneNumber || '');
      formData.append('towingLicenseNumber', localProfileData.towingLicenseNumber || '');
      formData.append('dotNumber', localProfileData.dotNumber || '');
    }

    // Include profile picture if changed
    if (profilePicture) {
      formData.append('profilePicture', profilePicture);
    }

    // Send the updated profile data to the backend
    fetch('/api/v1/users/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        // Do not set Content-Type when sending FormData
        // The browser will automatically set it to 'multipart/form-data' with the appropriate boundary
      },
      body: formData,
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        return res.json();
      })
      .then((data) => {
        // Update the profileData with the response from backend
        setProfileData(data);
        onClose();
        setProfilePicture(null); // Reset profile picture file
        // Reset password fields
        setPasswordData({
          newPassword: '',
          confirmPassword: '',
          showNewPassword: false,
          showConfirmPassword: false,
        });
      })
      .catch((error) => {
        console.error('Error updating profile:', error);
        // Handle error as needed
      });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Profile</DialogTitle>
      <DialogContent>
        {/* Profile Picture with Upload Option */}
        <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
          <Box position="relative">
            <Avatar
              alt="Profile Picture"
              src={
                profilePicture
                  ? URL.createObjectURL(profilePicture)
                  : localProfileData.profilePicture
                  ? localProfileData.profilePicture
                  : '/images/default-profile.png'
              }
              sx={{ width: 100, height: 100 }}
            />
            <IconButton
              color="primary"
              aria-label="upload picture"
              component="label"
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                backgroundColor: 'white',
                '&:hover': {
                  backgroundColor: 'white',
                },
              }}
            >
              <input
                hidden
                accept="image/*"
                type="file"
                onChange={handleProfilePictureChange}
              />
              <CameraAltIcon />
            </IconButton>
          </Box>
        </Box>
        
        {/* Basic User Information */}
        <Typography variant="h6" gutterBottom>
          User Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              margin="dense"
              label="First Name"
              fullWidth
              value={localProfileData.firstName || ''}
              onChange={(e) =>
                setLocalProfileData({ ...localProfileData, firstName: e.target.value })
              }
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              margin="dense"
              label="Last Name"
              fullWidth
              value={localProfileData.lastName || ''}
              onChange={(e) =>
                setLocalProfileData({ ...localProfileData, lastName: e.target.value })
              }
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              margin="dense"
              label="Username"
              fullWidth
              value={localProfileData.username || ''}
              onChange={(e) =>
                setLocalProfileData({ ...localProfileData, username: e.target.value })
              }
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              margin="dense"
              label="Phone Number"
              fullWidth
              value={localProfileData.phoneNumber || ''}
              onChange={(e) =>
                setLocalProfileData({ ...localProfileData, phoneNumber: e.target.value })
              }
            />
          </Grid>
        </Grid>
        
        {/* Password Change Section */}
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Change Password
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl fullWidth variant="outlined" margin="dense">
              <InputLabel htmlFor="new-password">New Password</InputLabel>
              <OutlinedInput
                id="new-password"
                type={passwordData.showNewPassword ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) => handlePasswordChange(e, 'newPassword')}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => handlePasswordVisibility('new')}
                      edge="end"
                    >
                      {passwordData.showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                }
                label="New Password"
              />
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth variant="outlined" margin="dense" error={!!passwordError}>
              <InputLabel htmlFor="confirm-password">Confirm Password</InputLabel>
              <OutlinedInput
                id="confirm-password"
                type={passwordData.showConfirmPassword ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={(e) => handlePasswordChange(e, 'confirmPassword')}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => handlePasswordVisibility('confirm')}
                      edge="end"
                    >
                      {passwordData.showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                }
                label="Confirm Password"
              />
              {passwordError && <FormHelperText>{passwordError}</FormHelperText>}
            </FormControl>
          </Grid>
        </Grid>
        
        {/* Notification Preferences */}
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Notification Preferences
        </Typography>
        <FormGroup>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={notificationPrefs.receiveEmailNotifications}
                    onChange={handleNotificationChange}
                    name="receiveEmailNotifications"
                  />
                }
                label="Receive Email Notifications"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={notificationPrefs.receiveTextNotifications}
                    onChange={handleNotificationChange}
                    name="receiveTextNotifications"
                  />
                }
                label="Receive Text Notifications"
              />
            </Grid>
          </Grid>
          
          <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
            Notify me when:
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={notificationPrefs.notifyOnNewJob}
                    onChange={handleNotificationChange}
                    name="notifyOnNewJob"
                  />
                }
                label="Assigned New Job"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={notificationPrefs.notifyOnJobCanceled}
                    onChange={handleNotificationChange}
                    name="notifyOnJobCanceled"
                  />
                }
                label="Job Canceled"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={notificationPrefs.notifyOnJobOnScene}
                    onChange={handleNotificationChange}
                    name="notifyOnJobOnScene"
                  />
                }
                label="Job On Scene"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={notificationPrefs.notifyOnJobReassigned}
                    onChange={handleNotificationChange}
                    name="notifyOnJobReassigned"
                  />
                }
                label="Job Reassigned"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={notificationPrefs.notifyOnJobMarkedAsGOA}
                    onChange={handleNotificationChange}
                    name="notifyOnJobMarkedAsGOA"
                  />
                }
                label="Job Marked As GOA"
              />
            </Grid>
          </Grid>
        </FormGroup>
        
        {/* SP-specific fields - only shown if user is an SP */}
        {localProfileData.primaryRole === 'SP' && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>
              Service Provider Information
            </Typography>
            <TextField
              margin="dense"
              label="Company Name"
              fullWidth
              value={localProfileData.companyName || ''}
              onChange={(e) =>
                setLocalProfileData({ ...localProfileData, companyName: e.target.value })
              }
            />
            <TextField
              margin="dense"
              label="Position"
              fullWidth
              value={localProfileData.position || ''}
              onChange={(e) =>
                setLocalProfileData({ ...localProfileData, position: e.target.value })
              }
            />
            <TextField
              margin="dense"
              label="Company Address"
              fullWidth
              value={localProfileData.companyAddress || ''}
              onChange={(e) =>
                setLocalProfileData({ ...localProfileData, companyAddress: e.target.value })
              }
            />
            <TextField
              margin="dense"
              label="Company Address 2 (Optional)"
              fullWidth
              value={localProfileData.companyAddress2 || ''}
              onChange={(e) =>
                setLocalProfileData({ ...localProfileData, companyAddress2: e.target.value })
              }
            />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  margin="dense"
                  label="City"
                  fullWidth
                  value={localProfileData.city || ''}
                  onChange={(e) =>
                    setLocalProfileData({ ...localProfileData, city: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  margin="dense"
                  label="State"
                  fullWidth
                  value={localProfileData.state || ''}
                  onChange={(e) =>
                    setLocalProfileData({ ...localProfileData, state: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  margin="dense"
                  label="Zip"
                  fullWidth
                  value={localProfileData.zip || ''}
                  onChange={(e) =>
                    setLocalProfileData({ ...localProfileData, zip: e.target.value })
                  }
                />
              </Grid>
            </Grid>
            <TextField
              margin="dense"
              label="Main Line Phone Number"
              fullWidth
              value={localProfileData.mainLinePhoneNumber || ''}
              onChange={(e) =>
                setLocalProfileData({
                  ...localProfileData,
                  mainLinePhoneNumber: e.target.value,
                })
              }
            />
            <TextField
              margin="dense"
              label="Dispatch Phone Number"
              fullWidth
              value={localProfileData.dispatchPhoneNumber || ''}
              onChange={(e) =>
                setLocalProfileData({
                  ...localProfileData,
                  dispatchPhoneNumber: e.target.value,
                })
              }
            />
            <TextField
              margin="dense"
              label="Answering Service Phone Number"
              fullWidth
              value={localProfileData.answeringServicePhoneNumber || ''}
              onChange={(e) =>
                setLocalProfileData({
                  ...localProfileData,
                  answeringServicePhoneNumber: e.target.value,
                })
              }
            />
            <TextField
              margin="dense"
              label="Towing License Number"
              fullWidth
              value={localProfileData.towingLicenseNumber || ''}
              onChange={(e) =>
                setLocalProfileData({
                  ...localProfileData,
                  towingLicenseNumber: e.target.value,
                })
              }
            />
            <TextField
              margin="dense"
              label="DOT Number"
              fullWidth
              value={localProfileData.dotNumber || ''}
              onChange={(e) =>
                setLocalProfileData({ ...localProfileData, dotNumber: e.target.value })
              }
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSaveProfile} color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default EditProfileDialog;
