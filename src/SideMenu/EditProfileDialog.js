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
} from '@mui/material';
import { CameraAlt as CameraAltIcon } from '@mui/icons-material';

function EditProfileDialog({ open, onClose, profileData, setProfileData, authHeader }) {
  // State for Profile Picture file (used in the dialog)
  const [profilePicture, setProfilePicture] = useState(null);

  // Local state for form fields (to avoid changing parent state before save)
  const [localProfileData, setLocalProfileData] = useState(profileData);

  // Update localProfileData when profileData changes
  React.useEffect(() => {
    setLocalProfileData(profileData);
  }, [profileData]);

  // Handler for Profile Picture Change
  const handleProfilePictureChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setProfilePicture(event.target.files[0]);
    }
  };

  // Function to handle saving profile changes
  const handleSaveProfile = () => {
    const formData = new FormData();
    formData.append('companyName', localProfileData.companyName);
    formData.append('firstName', localProfileData.firstName);
    formData.append('lastName', localProfileData.lastName);
    formData.append('position', localProfileData.position);
    formData.append('companyAddress', localProfileData.companyAddress);
    formData.append('companyAddress2', localProfileData.companyAddress2);
    formData.append('city', localProfileData.city);
    formData.append('state', localProfileData.state);
    formData.append('zip', localProfileData.zip);
    formData.append('mainLinePhoneNumber', localProfileData.mainLinePhoneNumber);
    formData.append('dispatchPhoneNumber', localProfileData.dispatchPhoneNumber);
    formData.append(
      'answeringServicePhoneNumber',
      localProfileData.answeringServicePhoneNumber
    );
    formData.append('towingLicenseNumber', localProfileData.towingLicenseNumber);
    formData.append('dotNumber', localProfileData.dotNumber);

    if (profilePicture) {
      formData.append('profilePicture', profilePicture);
    }

    fetch('/api/user/profile', {
      method: 'POST',
      headers: {
        ...authHeader(),
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
                  : '/path/to/default/profile.jpg'
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
        {/* Add fields for editing profile */}
        <TextField
          margin="dense"
          label="Company Name"
          fullWidth
          value={localProfileData.companyName}
          onChange={(e) =>
            setLocalProfileData({ ...localProfileData, companyName: e.target.value })
          }
        />
        <TextField
          margin="dense"
          label="First Name"
          fullWidth
          value={localProfileData.firstName}
          onChange={(e) =>
            setLocalProfileData({ ...localProfileData, firstName: e.target.value })
          }
        />
        <TextField
          margin="dense"
          label="Last Name"
          fullWidth
          value={localProfileData.lastName}
          onChange={(e) =>
            setLocalProfileData({ ...localProfileData, lastName: e.target.value })
          }
        />
        <TextField
          margin="dense"
          label="Position"
          fullWidth
          value={localProfileData.position}
          onChange={(e) =>
            setLocalProfileData({ ...localProfileData, position: e.target.value })
          }
        />
        <TextField
          margin="dense"
          label="Company Address"
          fullWidth
          value={localProfileData.companyAddress}
          onChange={(e) =>
            setLocalProfileData({ ...localProfileData, companyAddress: e.target.value })
          }
        />
        <TextField
          margin="dense"
          label="Company Address 2 (Optional)"
          fullWidth
          value={localProfileData.companyAddress2}
          onChange={(e) =>
            setLocalProfileData({ ...localProfileData, companyAddress2: e.target.value })
          }
        />
        <TextField
          margin="dense"
          label="City"
          fullWidth
          value={localProfileData.city}
          onChange={(e) =>
            setLocalProfileData({ ...localProfileData, city: e.target.value })
          }
        />
        <TextField
          margin="dense"
          label="State"
          fullWidth
          value={localProfileData.state}
          onChange={(e) =>
            setLocalProfileData({ ...localProfileData, state: e.target.value })
          }
        />
        <TextField
          margin="dense"
          label="Zip"
          fullWidth
          value={localProfileData.zip}
          onChange={(e) =>
            setLocalProfileData({ ...localProfileData, zip: e.target.value })
          }
        />
        <TextField
          margin="dense"
          label="Main Line Phone Number"
          fullWidth
          value={localProfileData.mainLinePhoneNumber}
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
          value={localProfileData.dispatchPhoneNumber}
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
          value={localProfileData.answeringServicePhoneNumber}
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
          value={localProfileData.towingLicenseNumber}
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
          value={localProfileData.dotNumber}
          onChange={(e) =>
            setLocalProfileData({ ...localProfileData, dotNumber: e.target.value })
          }
        />
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
