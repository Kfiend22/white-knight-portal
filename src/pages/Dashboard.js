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
  Container,
  Box,
  Tabs,
  Tab,
  Fab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Badge,
  Snackbar,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Payment as PaymentIcon,
  BarChart as BarChartIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

function Dashboard() {
  const navigate = useNavigate();

  // State variables
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [activeJobs, setActiveJobs] = useState([]);
  const [completedJobs, setCompletedJobs] = useState([]);
  const [canceledJobs, setCanceledJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // New job form state
  const [newJobData, setNewJobData] = useState({
    customerName: '',
    contactInfo: '',
    serviceType: '',
    location: '',
    instructions: '',
  });

  // Authentication check
  /* useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    } else {
      // Verify token with backend if necessary
      fetchJobs();
      const cleanupSocket = initializeSocket();
      return cleanupSocket;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);*/

  // Fetch jobs from backend
  const fetchJobs = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/jobs/active', { headers: authHeader() }).then((res) => res.json()),
      fetch('/api/jobs/completed', { headers: authHeader() }).then((res) => res.json()),
      fetch('/api/jobs/canceled', { headers: authHeader() }).then((res) => res.json()),
    ])
      .then(([activeData, completedData, canceledData]) => {
        setActiveJobs(activeData);
        setCompletedJobs(completedData);
        setCanceledJobs(canceledData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching jobs:', err);
        setError('Failed to load jobs.');
        setLoading(false);
      });
  };

  // Initialize WebSocket connection for real-time updates
  const initializeSocket = () => {
    const socket = io('https://your-backend-url', {
      query: { token: localStorage.getItem('token') },
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    socket.on('jobUpdate', (data) => {
      // Update job lists based on real-time data
      fetchJobs();
      setNotifications((prev) => [...prev, data.message]);
      setSnackbarOpen(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
    });

    // Clean up on component unmount
    return () => {
      socket.disconnect();
    };
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

  // Tab change handler
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Job creation dialog handlers
  const handleJobDialogOpen = () => {
    setJobDialogOpen(true);
  };

  const handleJobDialogClose = () => {
    setJobDialogOpen(false);
    setNewJobData({
      customerName: '',
      contactInfo: '',
      serviceType: '',
      location: '',
      instructions: '',
    });
  };

  const handleJobCreate = () => {
    // Form validation
    if (!newJobData.customerName || !newJobData.contactInfo || !newJobData.serviceType) {
      setError('Please fill in all required fields.');
      return;
    }

    fetch('/api/jobs/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader(),
      },
      body: JSON.stringify(newJobData),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to create job.');
        }
        return res.json();
      })
      .then((data) => {
        handleJobDialogClose();
        fetchJobs();
        setNotifications((prev) => [...prev, 'New job created successfully']);
        setSnackbarOpen(true);
      })
      .catch((err) => {
        console.error('Error creating job:', err);
        setError('Failed to create job.');
      });
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Render job lists
  const renderJobs = (jobs) => {
    if (jobs.length === 0) {
      return <Typography>No jobs available.</Typography>;
    }
    return (
      <List>
        {jobs.map((job) => (
          <Accordion key={job.id}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`panel${job.id}-content`}
              id={`panel${job.id}-header`}
            >
              <Typography>{job.title}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="subtitle1">Customer Information</Typography>
              <Typography>Name: {job.customerName}</Typography>
              <Typography>Contact: {job.contactInfo}</Typography>
              <Typography>Service Type: {job.serviceType}</Typography>
              <Typography>Location: {job.location}</Typography>
              <Typography>Instructions: {job.instructions}</Typography>
              {/* Add more job details as needed */}
            </AccordionDetails>
          </Accordion>
        ))}
      </List>
    );
  };

  // Navigation items
  const navItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
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
            <Badge badgeContent={notifications.length} color="secondary">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <Avatar alt="Provider Name" src="/path/to/profile.jpg" />
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
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Container maxWidth="md">
        <Box mt={4} mb={2} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4">Dashboard</Typography>
          <Fab color="primary" aria-label="add" onClick={handleJobDialogOpen}>
            <AddIcon />
          </Fab>
        </Box>

        {/* Tabs */}
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="job status tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Active Jobs" />
          <Tab label="Completed Jobs" />
          <Tab label="Canceled Jobs" />
        </Tabs>

        {/* Job Lists */}
        <Box mt={2}>
          {loading && <Typography>Loading...</Typography>}
          {error && (
            <Typography color="error" variant="body1">
              {error}
            </Typography>
          )}
          {!loading && !error && (
            <>
              {tabValue === 0 && renderJobs(activeJobs)}
              {tabValue === 1 && renderJobs(completedJobs)}
              {tabValue === 2 && renderJobs(canceledJobs)}
            </>
          )}
        </Box>
      </Container>

      {/* Job Creation Dialog */}
      <Dialog open={jobDialogOpen} onClose={handleJobDialogClose}>
        <DialogTitle>Create New Job</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            required
            margin="dense"
            label="Customer Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newJobData.customerName}
            onChange={(e) => setNewJobData({ ...newJobData, customerName: e.target.value })}
          />
          <TextField
            required
            margin="dense"
            label="Contact Info"
            type="text"
            fullWidth
            variant="outlined"
            value={newJobData.contactInfo}
            onChange={(e) => setNewJobData({ ...newJobData, contactInfo: e.target.value })}
          />
          <TextField
            required
            margin="dense"
            label="Service Type"
            type="text"
            fullWidth
            variant="outlined"
            value={newJobData.serviceType}
            onChange={(e) => setNewJobData({ ...newJobData, serviceType: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Location"
            type="text"
            fullWidth
            variant="outlined"
            value={newJobData.location}
            onChange={(e) => setNewJobData({ ...newJobData, location: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Instructions"
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newJobData.instructions}
            onChange={(e) => setNewJobData({ ...newJobData, instructions: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleJobDialogClose}>Cancel</Button>
          <Button onClick={handleJobCreate} color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for Notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={notifications[notifications.length - 1]}
      />
    </>
  );
}

export default Dashboard;
