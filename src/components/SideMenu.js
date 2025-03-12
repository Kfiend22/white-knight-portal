// SideMenu.js
import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Payment as PaymentIcon,
  BarChart as BarChartIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Description as SubmissionsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Import the dialog components
import EditProfileDialog from '../SideMenu/EditProfileDialog';
import UpdateTaxInfoDialog from '../SideMenu/UpdateTaxInfoDialog';
import UploadCOIDialog from '../SideMenu/UploadCOIDialog';
import UploadBackgroundChecksDialog from '../SideMenu/UploadBKChecksDialog';

const defaultProfileImage = 'public/images/default-profile.png';

function SideMenu() {
  const navigate = useNavigate();

  // State variables
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  // Fetch user profile data when component mounts
  useEffect(() => {
    fetchUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUserProfile = () => {
    fetch('/api/user/profile', {
      headers: authHeader(),
    })
      .then((res) => res.json())
      .then((data) => {
        setProfileData(data);
      })
      .catch((error) => {
        console.error('Error fetching profile data:', error);
      });
  };

  // Helper function to get auth headers
  const authHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  // Drawer toggle
  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  // Navigation items
  const navItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Submissions', icon: <SubmissionsIcon />, path: '/submissions' },
    { text: 'Payments', icon: <PaymentIcon />, path: '/payments' },
    { text: 'Performance', icon: <BarChartIcon />, path: '/performance' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

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
                  : '/path/to/default/profile.jpg'
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
            <MenuItem onClick={handleUploadCOI}>Upload COI</MenuItem>
            <MenuItem onClick={handleUploadBackgroundChecks}>
              Upload Background Checks
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer}>
        <Box sx={{ width: 250 }} role="presentation" onClick={toggleDrawer}>
          <List>
            {navItems.map((item) => (
              <ListItem button key={item.text} onClick={() => navigate(item.path)}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
                <ListItem component="div" button={true.toString()} />
              </ListItem>
            ))}
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
      />
    </>
  );
}

export default SideMenu;
