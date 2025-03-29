// SideMenu.js
import React, { useState, useEffect, useMemo } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Box,
  ListItemButton, // <-- Add this
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Payment as PaymentIcon,
  BarChart as BarChartIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Description as SubmissionsIcon,
  Public as RegionsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Import the dialog components
import EditProfileDialog from '../SideMenu/EditProfileDialog';
import UpdateTaxInfoDialog from '../SideMenu/UpdateTaxInfoDialog';
import UploadCOIDialog from '../SideMenu/UploadCOIDialog';
import UploadBackgroundChecksDialog from '../SideMenu/UploadBKChecksDialog';
import LogoutConfirmDialog from './LogoutConfirmDialog';

const defaultProfileImage = '/images/default-profile.png';

function SideMenu() {
  const navigate = useNavigate();

  // State variables
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [secondaryRoles, setSecondaryRoles] = useState({});

  // Avatar Dropdown Menu State
  const [anchorEl, setAnchorEl] = useState(null);
  const openProfileMenu = Boolean(anchorEl);

  // Dialog States for Avatar Menu Options
  const [openEditProfileDialog, setOpenEditProfileDialog] = useState(false);
  const [openUpdateTaxInfoDialog, setOpenUpdateTaxInfoDialog] = useState(false);
  const [openUploadCOIDialog, setOpenUploadCOIDialog] = useState(false);
  const [
    openUploadBackgroundChecksDialog,
    setOpenUploadBackgroundChecksDialog,
  ] = useState(false);
  
  // Logout confirmation dialog state
  const [openLogoutDialog, setOpenLogoutDialog] = useState(false);

  // State for Profile Data
  const [profileData, setProfileData] = useState({
    companyName: '',
    firstName: '',
    lastName: '',
    position: '',
    companyAddress: '',
    companyAddress2: '',
    city: '',
    state: '',
    zip: '',
    mainLinePhoneNumber: '',
    dispatchPhoneNumber: '',
    answeringServicePhoneNumber: '',
    towingLicenseNumber: '',
    dotNumber: '',
    profilePicture: null, // URL or null
  });

  // Handlers for Avatar Menu Options
  const handleAvatarClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseProfileMenu = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    // Show logout confirmation dialog
    setOpenLogoutDialog(true);
    
    // Close the profile menu
    handleCloseProfileMenu();
  };
  
  const handleConfirmLogout = () => {
    // Close the logout dialog
    setOpenLogoutDialog(false);
    
    // Import and use the logout function from authUtils
    const { logout } = require('../utils/authUtils');
    logout();
    
    // Note: We don't need to navigate here since logout() will redirect
  };

  const handleEditProfile = () => {
    setOpenEditProfileDialog(true);
    handleCloseProfileMenu();
  };

  const handleUpdateTaxInfo = () => {
    setOpenUpdateTaxInfoDialog(true);
    handleCloseProfileMenu();
  };

  const handleUploadCOI = () => {
    setOpenUploadCOIDialog(true);
    handleCloseProfileMenu();
  };

  const handleUploadBackgroundChecks = () => {
    setOpenUploadBackgroundChecksDialog(true);
    handleCloseProfileMenu();
  };

  // --- Background Check Upload Handler ---
  const handleBackgroundCheckUpload = async (file) => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found for upload.');
      alert('Authentication error. Please log in again.');
      return;
    }
    if (!file) {
      alert('No file selected.');
      return;
    }

    const formData = new FormData();
    // Key must match the name used in backend multer: 'backgroundCheckFile'
    formData.append('backgroundCheckFile', file); 

    try {
      const response = await fetch('/api/v1/users/profile/upload-background-check', {
        method: 'PUT',
        headers: {
          // DO NOT set Content-Type manually when using FormData
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to upload background check.');
      }

      console.log('Background check uploaded successfully:', result);
      alert('Background check uploaded successfully!'); 
      // Optionally: Refresh profile data or application data if needed
      // fetchUserProfile(); 

    } catch (error) {
      console.error('Error uploading background check:', error);
      alert(`Error uploading background check: ${error.message}`);
    } finally {
      // Close the dialog regardless of success or failure
      setOpenUploadBackgroundChecksDialog(false); 
    }
  };
  // --- End Background Check Upload Handler ---


  // Fetch user profile data and role when component mounts
  useEffect(() => {
    fetchUserProfile();
    
    // Get user role from localStorage
    try {
      const userJson = localStorage.getItem('user');
      console.log('User data from localStorage:', userJson);
      
      if (userJson) {
        const user = JSON.parse(userJson);
        console.log('Parsed user data:', user);
        
        // Check for primaryRole first, then fall back to legacy role field
        if (user && (user.primaryRole || user.role)) {
          const effectiveRole = user.primaryRole || user.role;
          console.log('Setting user role:', effectiveRole);
          setUserRole(effectiveRole);
          
          // Store secondary roles if available
          if (user.secondaryRoles) {
            console.log('Setting secondary roles:', user.secondaryRoles);
            setSecondaryRoles(user.secondaryRoles);
          }
        } else {
          console.warn('No role found in user data');
          // Set a default role to ensure menu items load
          setUserRole('SP'); // Service Provider as default
        }
      } else {
        console.warn('No user data found in localStorage');
        // Set a default role to ensure menu items load
        setUserRole('SP'); // Service Provider as default
      }
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
      // Set a default role to ensure menu items load
      setUserRole('SP'); // Service Provider as default
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUserProfile = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No token found in localStorage for profile fetch');
      return;
    }

    console.log('Fetching user profile with token:', token ? 'Token exists' : 'No token');
    
    fetch('/api/v1/users/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Profile fetch failed with status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log('Profile data received:', data);
        setProfileData(data);
      })
      .catch((error) => {
        console.error('Error fetching profile data:', error);
      });
  };

  // Helper function to get auth headers
  const authHeader = () => {
    const token = localStorage.getItem('token');
    return { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  // Drawer toggle
  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  // Helper function to check if user has access to a menu item
  const hasAccess = (itemRoles) => {
    // If no roles specified, everyone has access
    if (!itemRoles || itemRoles.length === 0) return true;
    
    // Check if primary role has access
    if (itemRoles.includes(userRole)) return true;
    
    // For sOW users, always grant access to all pages
    if (userRole === 'sOW') return true;
    
    // Check if any secondary role has access
    if (secondaryRoles) {
      // If secondaryRoles is an array, check if any role is included
      if (Array.isArray(secondaryRoles)) {
        return secondaryRoles.some(role => itemRoles.includes(role));
      } 
      // If secondaryRoles is an object, check if any role is true
      else if (typeof secondaryRoles === 'object') {
        for (const [role, hasRole] of Object.entries(secondaryRoles)) {
          if (hasRole && itemRoles.includes(role)) return true;
        }
      }
    }
    
    return false;
  };

  // Navigation items based on user role
  const navItems = useMemo(() => {
    console.log('Building nav items with userRole:', userRole, 'and secondaryRoles:', secondaryRoles);
    
    const items = [
      { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', roles: ['OW', 'RM', 'SP', 'MN', 'DV', 'DP'] },
      { text: 'Submissions', icon: <SubmissionsIcon />, path: '/submissions', roles: ['OW', 'RM', 'sOW'] },
      { text: 'Payments', icon: <PaymentIcon />, path: '/payments', roles: ['OW', 'RM', 'SP', 'MN', 'DP', 'sOW'] },
      { text: 'Performance', icon: <BarChartIcon />, path: '/performance', roles: ['OW', 'RM', 'SP', 'MN', 'DP', 'sOW'] },
      { text: 'Settings', icon: <SettingsIcon />, path: '/settings', roles: ['OW', 'RM', 'SP', 'MN', 'DP', 'sOW'] },
    ];
    
    // Add Regions menu item for Owner role only
    if (userRole === 'OW' || userRole === 'sOW') {
      console.log('Adding Regions menu item for Owner/sOW');
      items.push({ text: 'Regions', icon: <RegionsIcon />, path: '/regions', roles: ['OW', 'sOW'] });
    }
    
    return items;
  }, [userRole, secondaryRoles]);

  return (
    <>
      {/* AppBar */}
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={toggleDrawer}
            size="large"
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            White Knight Roadside Motor Club
          </Typography>
          <IconButton color="inherit" size="large">
            <NotificationsIcon />
          </IconButton>
          {/* Avatar with Dropdown Menu */}
          <IconButton onClick={handleAvatarClick} size="large">
            <Avatar
              alt="Provider Name"
              src={
                profileData.profilePicture
                  ? profileData.profilePicture
                  : defaultProfileImage
              }
            />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={openProfileMenu}
            onClose={handleCloseProfileMenu}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={handleEditProfile}>Edit Profile</MenuItem>
            <MenuItem onClick={handleUpdateTaxInfo}>Update Tax Info</MenuItem>
            {/* Only show Upload COI and Upload Background Checks for OW, sOW, RM, and SP roles */}
            {['OW', 'sOW', 'RM', 'SP'].includes(userRole) && (
              <>
                <MenuItem onClick={handleUploadCOI}>Upload COI</MenuItem>
                <MenuItem onClick={handleUploadBackgroundChecks}>
                  Upload Background Checks
                </MenuItem>
              </>
            )}
            <MenuItem onClick={handleLogout}>
              Log Out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer}>
        <Box sx={{ width: 250 }} role="presentation" onClick={toggleDrawer}>
          <List>
            {userRole ? (
              navItems
                .filter(item => hasAccess(item.roles))
                .map((item) => (
                  <ListItem key={item.text} disablePadding> {/* Remove 'button' prop, add disablePadding */}
                    <ListItemButton onClick={() => navigate(item.path)}> {/* Add ListItemButton and move onClick */}
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.text} />
                    </ListItemButton>
                  </ListItem>
                ))
            ) : (
              <ListItem>
                <ListItemText primary="Loading menu items..." />
              </ListItem>
            )}
          </List>
        </Box>
      </Drawer>

      {/* Dialogs for Avatar Menu Options */}
      <EditProfileDialog
        open={openEditProfileDialog}
        onClose={() => setOpenEditProfileDialog(false)}
        profileData={profileData}
        setProfileData={setProfileData}
        authHeader={authHeader}
      />

      <UpdateTaxInfoDialog
        open={openUpdateTaxInfoDialog}
        onClose={() => setOpenUpdateTaxInfoDialog(false)}
      />

      <UploadCOIDialog
        open={openUploadCOIDialog}
        onClose={() => setOpenUploadCOIDialog(false)}
      />

      <UploadBackgroundChecksDialog
        open={openUploadBackgroundChecksDialog}
        onClose={() => setOpenUploadBackgroundChecksDialog(false)}
        onUpload={handleBackgroundCheckUpload} // Pass the upload handler
      />
      
      {/* Logout Confirmation Dialog */}
      <LogoutConfirmDialog
        open={openLogoutDialog}
        onClose={() => setOpenLogoutDialog(false)}
        onConfirm={handleConfirmLogout}
      />
    </>
  );
}

export default SideMenu;
