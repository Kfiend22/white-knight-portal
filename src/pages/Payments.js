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
  Tabs,
  Tab,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Tooltip,
  CircularProgress,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Payment as PaymentIcon,
  BarChart as BarChartIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

function Payments() {
  const navigate = useNavigate();

  // State variables
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [unsubmittedJobs, setUnsubmittedJobs] = useState([]);
  const [submittedJobs, setSubmittedJobs] = useState([]);
  const [processingJobs, setProcessingJobs] = useState([]);
  const [finishedJobs, setFinishedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);

  // Authentication check
  /*useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    } else {
      fetchJobs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);*/

  // Fetch jobs from backend
  const fetchJobs = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/payments/unsubmitted', { headers: authHeader() }).then((res) => res.json()),
      fetch('/api/payments/submitted', { headers: authHeader() }).then((res) => res.json()),
      fetch('/api/payments/processing', { headers: authHeader() }).then((res) => res.json()),
      fetch('/api/payments/finished', { headers: authHeader() }).then((res) => res.json()),
    ])
      .then(([unsubmittedData, submittedData, processingData, finishedData]) => {
        setUnsubmittedJobs(unsubmittedData);
        setSubmittedJobs(submittedData);
        setProcessingJobs(processingData);
        setFinishedJobs(finishedData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching jobs:', err);
        setError('Failed to load jobs.');
        setLoading(false);
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

  // Tab change handler
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setSearchQuery('');
  };

  // Job submission handler
  const handleSubmit = (jobId) => {
    setSelectedJobId(jobId);
    setConfirmDialogOpen(true);
  };

  // Confirm submission
  const handleConfirmSubmit = () => {
    fetch(`/api/payments/submit/${selectedJobId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader(),
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to submit job.');
        }
        // Update the job lists accordingly
        setUnsubmittedJobs((prevJobs) => prevJobs.filter((job) => job.id !== selectedJobId));
        fetchJobs();
        setSnackbarMessage('Job submitted successfully.');
        setSnackbarOpen(true);
        setConfirmDialogOpen(false);
      })
      .catch((error) => {
        console.error('Error submitting job:', error);
        setError('Failed to submit job.');
        setConfirmDialogOpen(false);
      });
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Search handler
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  // Filter jobs based on search query
  const filterJobs = (jobs) => {
    if (!searchQuery) return jobs;
    return jobs.filter((job) =>
      job.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Render jobs table
  const renderJobsTable = (jobs, showSubmitButton = false) => {
    if (jobs.length === 0) {
      return <Typography>No jobs available.</Typography>;
    }

    const filteredJobs = filterJobs(jobs);

    return (
      <TableContainer component={Paper}>
        <Table aria-label="jobs table">
          <TableHead>
            <TableRow>
              <TableCell>Job Title</TableCell>
              <TableCell>Payment Amount</TableCell>
              <TableCell>Details</TableCell>
              {showSubmitButton && <TableCell>Action</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredJobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell>{job.title}</TableCell>
                <TableCell>{job.amount}</TableCell>
                <TableCell>{job.details}</TableCell>
                {showSubmitButton && (
                  <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleSubmit(job.id)}
                    >
                      Submit
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
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
            <NotificationsIcon />
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
        <Box mt={4} mb={2}>
          <Typography variant="h4">Payments</Typography>
        </Box>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="payments status tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Unsubmitted" />
          <Tab label="Submitted" />
          <Tab label="Processing" />
          <Tab label="Finished" />
        </Tabs>

        {/* Search Bar */}
        <Box mt={2} mb={2} display="flex" alignItems="center">
          <TextField
            label="Search Jobs"
            variant="outlined"
            value={searchQuery}
            onChange={handleSearchChange}
            size="small"
            fullWidth
          />
          <Tooltip title="Search">
            <IconButton aria-label="search" size="large">
              <SearchIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Job Tables */}
        <Box mt={2}>
          {loading && <CircularProgress />}
          {error && (
            <Typography color="error" variant="body1">
              {error}
            </Typography>
          )}
          {!loading && !error && (
            <>
              {tabValue === 0 && renderJobsTable(unsubmittedJobs, true)}
              {tabValue === 1 && renderJobsTable(submittedJobs)}
              {tabValue === 2 && renderJobsTable(processingJobs)}
              {tabValue === 3 && renderJobsTable(finishedJobs)}
            </>
          )}
        </Box>
      </Container>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Confirm Submission</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to submit this job for payment?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmSubmit} color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for Notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
      />
    </>
  );
}

export default Payments;
