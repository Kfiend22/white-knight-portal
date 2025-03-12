// Jobs.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  IconButton,
  InputLabel,
  FormControl,
  TextField,
  Collapse,
  Paper,
  Grid,
  Menu,
  Link,
} from '@mui/material';
import {
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';

const CountdownTimer = ({ targetTime }) => {
  const [remaining, setRemaining] = useState(Math.max(0, targetTime - Date.now()));

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(Math.max(0, targetTime - Date.now()));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return <Typography variant="body2">{formatTime(remaining)}</Typography>;
};

function Jobs({ jobCategory, onCreateJob, onReceiveDemoJob, onEditJob, refreshTrigger = 0, onSocketStatusChange }) {
  const [jobs, setJobs] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  // Dialog and menu states
  const [etaDialogOpen, setEtaDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedEta, setSelectedEta] = useState('5'); // default to 5 minutes
  const [anotherTime, setAnotherTime] = useState(false);
  const [anotherTimeValue, setAnotherTimeValue] = useState(null);

  const [dispatchDialogOpen, setDispatchDialogOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedJobForMenu, setSelectedJobForMenu] = useState(null);

  // Check if socket is connected
  useEffect(() => {
    try {
      const { getSocket } = require('../utils/socket');
      const socket = getSocket();
      
      if (socket) {
        // Check if socket is already connected
        if (socket.connected) {
          console.log('Socket is already connected');
          setSocketConnected(true);
          
          // Update parent component if callback provided
          if (onSocketStatusChange) {
            onSocketStatusChange({ connected: true, lastEvent: null });
          }
        } else {
          // Listen for connect event
          socket.on('connect', () => {
            console.log('Socket connected in Jobs component');
            setSocketConnected(true);
            
            // Update parent component if callback provided
            if (onSocketStatusChange) {
              onSocketStatusChange({ connected: true, lastEvent: null });
            }
          });
          
          // Listen for disconnect event
          socket.on('disconnect', () => {
            console.log('Socket disconnected in Jobs component');
            setSocketConnected(false);
            
            // Update parent component if callback provided
            if (onSocketStatusChange) {
              onSocketStatusChange({ connected: false, lastEvent: null });
            }
          });
        }
      } else {
        console.warn('Socket not initialized yet');
      }
    } catch (error) {
      console.error('Error checking socket connection:', error);
    }
    
    return () => {
      try {
        const { getSocket } = require('../utils/socket');
        const socket = getSocket();
        if (socket) {
          socket.off('connect');
          socket.off('disconnect');
        }
      } catch (error) {
        console.error('Error cleaning up socket connection listeners:', error);
      }
    };
  }, [onSocketStatusChange]);

  // Fetch data when socket is connected and category/refresh changes
  useEffect(() => {
    if (socketConnected) {
      console.log('Socket is connected, fetching jobs and setting up listeners');
      fetchJobs();
      fetchDrivers();
      fetchCurrentUser();
      setupSocketListeners();
      
      // Cleanup socket listeners on unmount or when dependencies change
      return () => {
        cleanupSocketListeners();
      };
    } else {
      console.log('Waiting for socket connection before fetching jobs');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobCategory, refreshTrigger, socketConnected]);
  
  // Setup socket listeners for real-time updates
  const setupSocketListeners = () => {
    try {
      // Listen for custom events dispatched by socket handlers
      window.addEventListener('job-assigned', handleJobEvent);
      window.addEventListener('job-auto-rejected', handleJobEvent);
      window.addEventListener('job-accepted', handleJobEvent);
      window.addEventListener('job-rejected', handleJobEvent);
    } catch (error) {
      console.error('Error setting up socket listeners:', error);
    }
  };
  
  // Handle job events
  const handleJobEvent = (event) => {
    console.log(`${event.type} event received:`, event.detail);
    
    // Update socket status in parent component if callback provided
    if (onSocketStatusChange) {
      onSocketStatusChange({ 
        connected: true, 
        lastEvent: { 
          type: event.type, 
          time: Date.now() 
        } 
      });
    }
    
    // Refresh jobs to update the job status
    fetchJobs();
  };
  
  // Cleanup socket listeners
  const cleanupSocketListeners = () => {
    try {
      // Remove event listeners
      window.removeEventListener('job-assigned', handleJobEvent);
      window.removeEventListener('job-auto-rejected', handleJobEvent);
      window.removeEventListener('job-accepted', handleJobEvent);
      window.removeEventListener('job-rejected', handleJobEvent);
    } catch (error) {
      console.error('Error cleaning up socket listeners:', error);
    }
  };

  // Fetch current user information
  const fetchCurrentUser = async () => {
    try {
      // Use the correct API endpoint path based on server.js configuration
      const response = await axios.get('/api/v1/users/profile', {
        headers: authHeader()
      });
      
      if (response.data) {
        setCurrentUser(response.data);
        console.log('Current user fetched successfully:', response.data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Try alternative endpoint if the first one fails
      try {
        const altResponse = await axios.get('/api/user/profile', {
          headers: authHeader()
        });
        
        if (altResponse.data) {
          setCurrentUser(altResponse.data);
          console.log('Current user fetched from alternative endpoint:', altResponse.data);
        }
      } catch (altError) {
        console.error('Error fetching user profile from alternative endpoint:', altError);
      }
    }
  };

  // Debug log when refreshTrigger changes
  useEffect(() => {
    console.log(`Jobs component refreshing for category: ${jobCategory}, trigger: ${refreshTrigger}`);
  }, [jobCategory, refreshTrigger]);

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching jobs for category: ${jobCategory}`);
      
      // Modify the API endpoint based on jobCategory
      const response = await axios.get(`/api/jobs?category=${jobCategory}`, { 
        headers: authHeader() 
      });
      
      console.log(`Received ${response.data.length} jobs:`, response.data);
      
      // Process jobs to ensure they have the expanded property
      const processedJobs = response.data.map(job => {
        // Debug log to see what's in the job data
        console.log(`Job ${job.id} createdAt:`, job.createdAt);
        
        let createdDisplay;
        
        // Check if createdAt exists and is a valid date
        if (job.createdAt && !isNaN(new Date(job.createdAt).getTime())) {
          const createdDate = new Date(job.createdAt);
          const today = new Date();
          
          // Compare year, month, and day to determine if it's today
          const isCreatedToday = 
            createdDate.getFullYear() === today.getFullYear() &&
            createdDate.getMonth() === today.getMonth() &&
            createdDate.getDate() === today.getDate();
          
          if (isCreatedToday) {
            // If created today, show time
            createdDisplay = createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          } else {
            // If created on a different day, show date
            createdDisplay = createdDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
          }
        } else {
          // Fallback to the existing created field or 'Unknown'
          createdDisplay = job.created || 'Unknown';
        }
        
        return {
          ...job,
          expanded: false,
          created: createdDisplay
        };
      });
      
      setJobs(processedJobs);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err.response?.data?.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      // Only fetch drivers who are on duty
      const response = await axios.get('/api/drivers?isOnDuty=true', { 
        headers: authHeader() 
      });
      
      setDrivers(response.data);
    } catch (err) {
      console.error('Error fetching drivers:', err);
    }
  };

  // Helper function to get auth headers
  const authHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  // Accept job handler
  const handleAcceptJob = (job) => {
    setSelectedJob(job);
    
    // Check if the job already has an ETA
    if (job.eta && job.eta !== '') {
      // If job already has an ETA, accept it directly without showing the dialog
      handleDirectAccept(job);
    } else {
      // If no ETA, show the dialog to get one
      setEtaDialogOpen(true);
    }
  };
  
  // Direct accept without showing ETA dialog
  const handleDirectAccept = async (job) => {
    setLoading(true);
    
    try {
      // Accept the job with the existing ETA
      await axios.put(`/api/jobs/${job.id}/accept`, {}, {
        headers: authHeader()
      });
      
      // Refresh the jobs list
      fetchJobs();
      
    } catch (error) {
      console.error('Error accepting job:', error);
      alert('Failed to accept job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ETA selection change
  const handleEtaSelectChange = (event) => {
    const value = event.target.value;
    if (value === 'another') {
      setAnotherTime(true);
    } else {
      setSelectedEta(value);
      setAnotherTime(false);
    }
  };

  // Close ETA dialog
  const handleEtaDialogClose = () => {
    setEtaDialogOpen(false);
    setSelectedJob(null);
    setSelectedEta('5');
    setAnotherTime(false);
    setAnotherTimeValue(null);
  };

  // Save ETA selection
  const handleEtaDialogSave = async () => {
    if (anotherTime && !anotherTimeValue) {
      alert('Please select a date and time.');
      return;
    }
    
    setLoading(true);
    
    try {
      // Use the eta value based on selection
      const etaValue = anotherTime ? anotherTimeValue : selectedEta;
      
      // Use the specific accept endpoint with the ETA
      await axios.put(`/api/jobs/${selectedJob.id}/accept`, {
        eta: etaValue
      }, {
        headers: authHeader()
      });
      
      // Refresh jobs to get the updated data
      fetchJobs();
      
      handleEtaDialogClose();
    } catch (error) {
      console.error('Error updating job:', error);
      alert('Failed to update job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reject job handler
  const handleRejectJob = (jobId) => {
    // Find the job to reject
    const job = jobs.find(j => j.id === jobId);
    if (!job) {
      console.error('Job not found for rejection');
      return;
    }
    
    // Set the job to reject and open the rejection dialog
    setJobToReject(job);
    setRejectDialogOpen(true);
  };
  
  // Submit job rejection with reason
  const handleSubmitRejection = async () => {
    if (!rejectionReason) {
      alert('Please provide a reason for rejecting this job.');
      return;
    }

    if (!jobToReject) {
      console.error('No job selected for rejection');
      alert('Error: No job selected for rejection');
      setRejectDialogOpen(false);
      return;
    }

    // Store the job ID in a local variable
    const jobId = jobToReject.id;
    
    setLoading(true);
    
    try {
      // Update job status on the server with rejection reason
      await axios.put(`/api/jobs/${jobId}/reject`, {
        rejectionReason
      }, {
        headers: authHeader()
      });
      
      // Close dialog and refresh jobs
      setRejectDialogOpen(false);
      setRejectionReason('');
      setJobToReject(null);
      fetchJobs();
      
    } catch (error) {
      console.error('Error rejecting job:', error);
      alert('Failed to reject job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Dispatch job handler
  const handleDispatchJob = (job) => {
    setSelectedJob(job);
    setDispatchDialogOpen(true);
  };

  // Close dispatch dialog
  const handleDispatchDialogClose = () => {
    setDispatchDialogOpen(false);
    setSelectedJob(null);
  };

  // State for selected driver and truck in dispatch dialog
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedTruck, setSelectedTruck] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [trucks, setTrucks] = useState([
    'Flatbed 1', 'Flatbed 2', 'Wheel Lift 1', 'Heavy Duty 1', 'Service Truck 1'
  ]);

  // Assign driver to job
  const handleSelectDriver = (driver) => {
    setSelectedDriver(driver);
    // Reset truck selection when driver changes
    setSelectedTruck('');
  };

  // Assign driver and truck to job
  const handleAssignDriverAndTruck = async () => {
    if (!selectedDriver) {
      alert('Please select a driver.');
      return;
    }
    
    if (!selectedTruck) {
      alert('Please select a truck.');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('Assigning driver to job:', {
        jobId: selectedJob.id,
        driverId: selectedDriver.id,
        driverName: selectedDriver.name,
        truck: selectedTruck
      });
      
      // Update job on the server
      const response = await axios.put(`/api/jobs/${selectedJob.id}/assign`, {
        driverId: selectedDriver.id,
        truck: selectedTruck
      }, {
        headers: authHeader()
      });
      
      console.log('Server response after assigning driver:', response.data);
      
      // Instead of manually updating the job, fetch all jobs again to ensure we have the latest data
      // This is important because the server sets additional fields like autoRejectAt and needsAcceptance
      fetchJobs();
      
      // Reset selections and close dialog
      setSelectedDriver(null);
      setSelectedTruck('');
      handleDispatchDialogClose();
    } catch (error) {
      console.error('Error assigning driver and truck:', error);
      alert('Failed to assign driver and truck. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Job status change handler
  const handleJobStatusChange = async (jobId, status) => {
    console.log('handleJobStatusChange called with:', { jobId, status });
    setLoading(true);
    
    try {
      // Update job status on the server - using the correct endpoint
      await axios.put(`/api/jobs/${jobId}`, {
        status
      }, {
        headers: authHeader()
      });
      
      // Update local state
      let updatedJobs = jobs.map((job) =>
        job.id === jobId ? { ...job, status } : job
      );
      
      setJobs(updatedJobs);
    } catch (error) {
      console.error('Error updating job status:', error);
      alert('Failed to update job status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Expand/collapse job details
  const handleExpandClick = (jobId) => {
    setJobs((prevJobs) =>
      prevJobs.map((job) =>
        job.id === jobId ? { ...job, expanded: !job.expanded } : job
      )
    );
  };

  // State for cancel job dialog
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [jobToCancel, setJobToCancel] = useState(null);

  // State for GOA dialog
  const [goaDialogOpen, setGoaDialogOpen] = useState(false);
  const [goaReason, setGoaReason] = useState('');
  const [jobToMarkGOA, setJobToMarkGOA] = useState(null);

  // State for job rejection dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [jobToReject, setJobToReject] = useState(null);

  // State for edit job dialog - reserved for future implementation
  // eslint-disable-next-line no-unused-vars
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [editJobData, setEditJobData] = useState(null);

  // Menu actions for in-progress jobs
  const handleMenuClick = (event, job) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedJobForMenu(job);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedJobForMenu(null);
  };

  // Handle edit job button click - reserved for future implementation
  // eslint-disable-next-line no-unused-vars
  const handleEditClick = (job) => {
    setEditJobData({...job});
    setEditDialogOpen(true);
  };

  // Handle cancel job
  const handleCancelJob = async () => {
    if (!cancellationReason) {
      alert('Please provide a reason for cancellation.');
      return;
    }

    if (!jobToCancel) {
      console.error('No job selected for cancellation');
      alert('Error: No job selected for cancellation');
      setCancelDialogOpen(false);
      return;
    }

    // Store the job ID in a local variable
    const jobId = jobToCancel.id;
    
    setLoading(true);
    
    try {
      // Update job status on the server using the stored jobId - using the correct endpoint
      await axios.put(`/api/jobs/${jobId}`, {
        status: 'Canceled',
        cancellationReason
      }, {
        headers: authHeader()
      });
      
      // Close dialog and refresh jobs
      setCancelDialogOpen(false);
      setCancellationReason('');
      setJobToCancel(null);
      fetchJobs();
      
    } catch (error) {
      console.error('Error canceling job:', error);
      alert('Failed to cancel job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle GOA request
  const handleGoaRequest = async () => {
    if (!goaReason) {
      alert('Please provide a reason for marking as GOA.');
      return;
    }

    if (!jobToMarkGOA) {
      console.error('No job selected for GOA');
      alert('Error: No job selected for GOA');
      setGoaDialogOpen(false);
      return;
    }

    // Store the job ID in a local variable
    const jobId = jobToMarkGOA.id;
    
    setLoading(true);
    
    try {
      // Update job status on the server using the stored jobId - using the correct endpoint
      await axios.put(`/api/jobs/${jobId}`, {
        status: 'Awaiting Approval',
        goaReason
      }, {
        headers: authHeader()
      });
      
      // Close dialog and refresh jobs
      setGoaDialogOpen(false);
      setGoaReason('');
      setJobToMarkGOA(null);
      fetchJobs();
      
    } catch (error) {
      console.error('Error marking job as GOA:', error);
      alert('Failed to mark job as GOA. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuAction = (action, job = null) => {
    // If job is provided directly (e.g., from the Rejected status button), use it
    // Otherwise use the selectedJobForMenu from the menu context
    const targetJob = job || selectedJobForMenu;
    
    if (!targetJob) {
      console.error('No job selected for action:', action);
      return;
    }
    
    switch (action) {
      case 'cancel':
        // Store the job in a dedicated state variable for cancellation
        setJobToCancel(targetJob);
        setCancelDialogOpen(true);
        break;
      case 'goa':
        // Store the job in a dedicated state variable for GOA
        setJobToMarkGOA(targetJob);
        setGoaDialogOpen(true);
        break;
      case 'unsuccessful':
        // Implement report unsuccessful logic
        alert('Report Unsuccessful feature coming soon');
        break;
      case 'email':
        // Implement email job details logic
        alert('Email Job Details feature coming soon');
        break;
      case 'duplicate':
        // Implement duplicate job logic
        alert('Duplicate Job feature coming soon');
        break;
      default:
        break;
    }
    
    // Only close the menu if it was opened (not when called directly from a button)
    if (menuAnchorEl) {
      handleMenuClose();
    }
  };

  // Helper function to check if current user is the job provider (dispatcher)
  const isJobProvider = (job) => {
    if (!currentUser || !job) return false;
    
    // Convert both IDs to strings for comparison to avoid type issues
    const providerId = job.provider?.toString();
    const userId = currentUser.id?.toString();
    
    console.log('Provider check:', { providerId, userId, isMatch: providerId === userId });
    return providerId === userId;
  };
  
  // Helper function to check if current user is the assigned driver
  const isAssignedDriver = (job) => {
    console.log('isAssignedDriver called with job:', job);
    console.log('Current user:', currentUser);
    
    if (!currentUser || !job || !job.driverId) {
      console.log('isAssignedDriver: Missing required data', { 
        hasCurrentUser: !!currentUser, 
        hasJob: !!job, 
        hasDriverId: job ? !!job.driverId : false,
        currentUserRole: currentUser?.primaryRole,
        currentUserSecondaryRoles: currentUser?.secondaryRoles,
        jobStatus: job?.status
      });
      return false;
    }
    
    // Convert both IDs to strings for comparison to avoid type issues
    const driverId = job.driverId?.toString();
    const userId = currentUser._id?.toString() || currentUser.id?.toString();
    
    // Log detailed information for debugging
    console.log('Driver check:', { 
      driverId, 
      userId, 
      driverIdType: typeof job.driverId,
      userIdType: typeof currentUser.id,
      isMatch: driverId === userId,
      currentUserRole: currentUser.primaryRole,
      hasDriverSecondaryRole: currentUser.secondaryRoles?.driver,
      job: {
        id: job.id,
        status: job.status,
        needsAcceptance: job.needsAcceptance,
        autoRejectAt: job.autoRejectAt
      }
    });
    
    // Check if the user has the driver secondary role
    const hasDriverRole = currentUser.secondaryRoles?.driver === true;
    
    // Check if the IDs match
    const idsMatch = driverId === userId;
    
    console.log(`isAssignedDriver result: ${idsMatch && hasDriverRole}`);
    
    // Return true only if the IDs match AND the user has the driver secondary role
    return idsMatch && hasDriverRole;
  };
  
  // Calculate target time for ETA countdown
  const calculateTargetTime = (job) => {
    if (!job.eta) return null;
    
    // If ETA is a number (minutes), calculate target time from job creation or acceptance
    if (!isNaN(parseInt(job.eta))) {
      // Convert ETA minutes to milliseconds
      const etaMilliseconds = parseInt(job.eta) * 60 * 1000;
      
      // Use acceptedAt as base time if available (when driver accepted the job)
      if (job.acceptedAt) {
        return new Date(job.acceptedAt).getTime() + etaMilliseconds;
      }
      
      // If job was assigned at a specific time, use that
      if (job.assignedAt) {
        return new Date(job.assignedAt).getTime() + etaMilliseconds;
      }
      
      // Otherwise fall back to job.createdAt or current time
      const baseTime = job.createdAt ? new Date(job.createdAt).getTime() : Date.now();
      return baseTime + etaMilliseconds;
    }
    
    // If ETA is a scheduled date/time string, convert it to timestamp
    if (typeof job.eta === 'string' && job.eta.includes('Scheduled for')) {
      const dateTimeStr = job.eta.replace('Scheduled for ', '');
      return new Date(dateTimeStr).getTime();
    }
    
    return null;
  };
  
  // Calculate auto-rejection time (2 minutes from assignment)
  const calculateAutoRejectTime = (job) => {
    if (!job.autoRejectAt) return null;
    return new Date(job.autoRejectAt).getTime();
  };

  // Filtering jobs based on status
  let displayedJobs = [];
  if (jobCategory === 'pending') {
    // Include both 'Pending' and 'Pending Acceptance' statuses in the pending section
    displayedJobs = jobs.filter((job) => {
      const isPending = job.status === 'Pending';
      const isPendingAcceptance = job.status === 'Pending Acceptance';
      
      // Debug log to see what jobs are being filtered
      if (isPendingAcceptance) {
        console.log('Found Pending Acceptance job:', job);
      }
      
      return isPending || isPendingAcceptance;
    });
  } else if (jobCategory === 'inProgress') {
    displayedJobs = jobs.filter((job) => 
      ['In-Progress', 'Dispatched', 'En Route', 'On Site', 'Awaiting Approval', 'Rejected', 'Accepted'].includes(job.status)
    );
  } else if (jobCategory === 'scheduled') {
    displayedJobs = jobs.filter((job) => job.status === 'Scheduled');
  } else if (jobCategory === 'completed') {
    displayedJobs = jobs.filter((job) => job.status === 'Completed');
  } else if (jobCategory === 'canceled') {
    displayedJobs = jobs.filter((job) => job.status === 'Canceled');
  }


  return (
    <Box mt={2}>
      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <Typography>Loading jobs...</Typography>
        </Box>
      )}
      {error && (
        <Typography color="error" variant="body1">
          {error}
        </Typography>
      )}

      {displayedJobs.length > 0 ? (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Job ID</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Driver</TableCell>
                <TableCell>Truck</TableCell>
                <TableCell>Account</TableCell>
                <TableCell>Service</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>ETA</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedJobs.map((job) => (
                <React.Fragment key={job.id}>
                  <TableRow>
                    <TableCell>{job.po || job.id}</TableCell>
                    <TableCell>{job.created}</TableCell>
                    <TableCell>
                      {job.status === 'Pending Acceptance' ? (
                        // For Pending Acceptance jobs, show different UI based on user role
                        isAssignedDriver(job) ? (
                          // If current user is the assigned driver, show Accept/Reject buttons with countdown
                          <Box>
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              sx={{ mr: 1, mb: 1 }}
                              onClick={() => handleAcceptJob(job)}
                            >
                              Accept
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={() => handleRejectJob(job.id)}
                            >
                              Reject
                            </Button>
                            {job.autoRejectAt && (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="caption" color="error">
                                  Auto-reject in:
                                </Typography>
                                <CountdownTimer targetTime={calculateAutoRejectTime(job)} />
                              </Box>
                            )}
                          </Box>
                        ) : isJobProvider(job) ? (
                          // If current user is the job provider (dispatcher), show AWAITING with countdown
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              AWAITING
                            </Typography>
                            {job.autoRejectAt && (
                              <Box>
                                <Typography variant="caption" color="warning.main">
                                  Auto-reject in:
                                </Typography>
                                <CountdownTimer targetTime={calculateAutoRejectTime(job)} />
                              </Box>
                            )}
                            <Typography variant="caption" display="block">
                              Assigned to: {job.driver}
                            </Typography>
                          </Box>
                        ) : (
                          // For other users, just show the driver name
                          <Typography>
                            {job.driver} <Typography variant="caption">(Pending)</Typography>
                          </Typography>
                        )
                      ) : job.driver ? (
                        // If not pending acceptance but has a driver, show the driver name
                        job.driver
                      ) : job.status === 'Pending Acceptance' && isAssignedDriver(job) ? (
                        // Only show Accept button if job status is Pending Acceptance and current user is the assigned driver
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={() => handleAcceptJob(job)}
                        >
                          Accept
                        </Button>
                      ) : job.status === 'Pending' || job.status === 'Scheduled' ? (
                        // Show Dispatch button for all pending jobs that don't need acceptance
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={() => handleDispatchJob(job)}
                        >
                          Dispatch
                        </Button>
                      ) : (
                        // Fallback for other statuses
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={() => handleDispatchJob(job)}
                        >
                          Reassign
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>{job.truck || 'N/A'}</TableCell>
                    <TableCell>{job.account}</TableCell>
                    <TableCell>{job.service}</TableCell>
                    <TableCell>{job.location}</TableCell>
                    <TableCell>
                      {job.status === 'Awaiting Approval' ? (
                        <Box>
                          <Typography variant="body2" color="warning.main">
                            {job.status}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            GOA request pending approval
                          </Typography>
                        </Box>
                      ) : job.status === 'Rejected' ? (
                        <Box>
                          <Typography variant="body2" color="error.main">
                            {job.status}
                          </Typography>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => handleMenuAction('cancel', job)}
                          >
                            Cancel Job
                          </Button>
                        </Box>
                      ) : jobCategory === 'inProgress' ? (
                        <FormControl fullWidth>
                          <InputLabel id={`status-select-label-${job.id}`}>Status</InputLabel>
                          <Select
                            labelId={`status-select-label-${job.id}`}
                            label="Status"
                            value={job.status}
                            onChange={(e) =>
                              handleJobStatusChange(job.id, e.target.value)
                            }
                          >
                            {/* Simplified dropdown with all possible status options */}
                            <MenuItem value="Dispatched">Dispatched</MenuItem>
                            <MenuItem value="En Route">En Route</MenuItem>
                            <MenuItem value="On Site">On Site</MenuItem>
                            <MenuItem value="Completed">Completed</MenuItem>
                            <MenuItem value="Awaiting Approval">Awaiting Approval</MenuItem>
                            <MenuItem value="Rejected">Rejected</MenuItem>
                            <MenuItem value="Accepted">Accepted</MenuItem>
                          </Select>
                        </FormControl>
                      ) : (
                        job.status
                      )}
                    </TableCell>
                    <TableCell>
                      {job.eta ? (
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {job.eta}
                          </Typography>
                          {calculateTargetTime(job) && (
                            <CountdownTimer targetTime={calculateTargetTime(job)} />
                          )}
                        </Box>
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => handleExpandClick(job.id)}>
                        {job.expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                      <IconButton onClick={() => onEditJob && onEditJob(job)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={(e) => handleMenuClick(e, job)}>
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  {/* Expanded Row */}
                  <TableRow>
                    <TableCell
                      style={{ paddingBottom: 0, paddingTop: 0 }}
                      colSpan={10}
                    >
                      <Collapse in={job.expanded} timeout="auto" unmountOnExit>
                        <Box margin={2} sx={{ boxShadow: 1, borderRadius: 1, overflow: 'hidden' }}>
                          <Grid container spacing={2}>
                            {/* Map on the left */}
                            <Grid item xs={12} md={6}>
                              <Paper style={{ height: '350px' }}>
                                <Typography variant="subtitle1" align="center" sx={{ py: 2 }}>
                                  Map Placeholder
                                </Typography>
                              </Paper>
                            </Grid>
                            
                            {/* Job details on the right */}
                            <Grid item xs={12} md={6}>
                              <Box p={2}>
                                {/* Job Details Header */}
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                  Job Details
                                </Typography>
                                
                                {/* Service details section */}
                                <Grid container spacing={2} sx={{ mb: 2 }}>
                                  <Grid item xs={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                      Service Type
                                    </Typography>
                                    <Typography variant="body1">
                                      {job.service}
                                    </Typography>
                                  </Grid>
                                  <Grid item xs={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                      Class Type
                                    </Typography>
                                    <Typography variant="body1">
                                      {job.classType || "N/A"}
                                    </Typography>
                                  </Grid>
                                  
                                  <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                      Service Location
                                    </Typography>
                                    <Typography variant="body1" gutterBottom>
                                      {job.serviceLocation && typeof job.serviceLocation === 'object' 
                                        ? `${job.serviceLocation.street}, ${job.serviceLocation.city}, ${job.serviceLocation.state} ${job.serviceLocation.zip}` 
                                        : (job.serviceLocation || job.location)}
                                    </Typography>
                                  </Grid>
                                  
                                  {job.dropoffLocation && (
                                    <Grid item xs={12}>
                                      <Typography variant="subtitle2" color="text.secondary">
                                        Dropoff Location
                                      </Typography>
                                      <Typography variant="body1" gutterBottom>
                                        {job.dropoffLocation && typeof job.dropoffLocation === 'object' 
                                          ? `${job.dropoffLocation.street}, ${job.dropoffLocation.city}, ${job.dropoffLocation.state} ${job.dropoffLocation.zip}` 
                                          : job.dropoffLocation}
                                      </Typography>
                                    </Grid>
                                  )}
                                  
                                  {/* Vehicle details section */}
                                  <Grid item xs={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                      Vehicle Make
                                    </Typography>
                                    <Typography variant="body1">
                                      {job.vehicleMake || "N/A"}
                                    </Typography>
                                  </Grid>
                                  <Grid item xs={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                      Vehicle Model
                                    </Typography>
                                    <Typography variant="body1">
                                      {job.vehicleModel || "N/A"}
                                    </Typography>
                                  </Grid>
                                  
                                  {/* Additional details */}
                                  <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                      Notes
                                    </Typography>
                                    <Typography variant="body1">
                                      {job.notes || "No additional notes"}
                                    </Typography>
                                  </Grid>
                                </Grid>
                              </Box>
                            </Grid>
                          </Grid>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
          
          {/* ETA Dialog */}
          <Dialog open={etaDialogOpen} onClose={handleEtaDialogClose}>
            <DialogTitle>Estimated Time of Arrival</DialogTitle>
            <DialogContent>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel id="eta-select-label">ETA</InputLabel>
                <Select
                  labelId="eta-select-label"
                  value={selectedEta}
                  onChange={handleEtaSelectChange}
                  label="ETA"
                >
                  <MenuItem value="5">5 minutes</MenuItem>
                  <MenuItem value="10">10 minutes</MenuItem>
                  <MenuItem value="15">15 minutes</MenuItem>
                  <MenuItem value="20">20 minutes</MenuItem>
                  <MenuItem value="30">30 minutes</MenuItem>
                  <MenuItem value="45">45 minutes</MenuItem>
                  <MenuItem value="60">1 hour</MenuItem>
                  <MenuItem value="90">1.5 hours</MenuItem>
                  <MenuItem value="120">2 hours</MenuItem>
                  <MenuItem value="another">Another time...</MenuItem>
                </Select>
              </FormControl>
              
              {anotherTime && (
                <TextField
                  label="Custom ETA (minutes)"
                  type="number"
                  fullWidth
                  sx={{ mt: 2 }}
                  value={anotherTimeValue}
                  onChange={(e) => setAnotherTimeValue(e.target.value)}
                />
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleEtaDialogClose}>Cancel</Button>
              <Button onClick={handleEtaDialogSave} variant="contained" color="primary">
                Accept Job
              </Button>
            </DialogActions>
          </Dialog>
          
          {/* Dispatch Dialog */}
          <Dialog open={dispatchDialogOpen} onClose={handleDispatchDialogClose} maxWidth="md">
            <DialogTitle>Dispatch Job</DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Select Driver
                  </Typography>
                  <Box sx={{ maxHeight: '300px', overflow: 'auto', border: '1px solid #eee', borderRadius: 1, p: 1 }}>
                    {drivers.length > 0 ? (
                      drivers.map((driver) => (
                        <Box
                          key={driver.id}
                          sx={{
                            p: 1,
                            mb: 1,
                            border: '1px solid #ddd',
                            borderRadius: 1,
                            cursor: 'pointer',
                            bgcolor: selectedDriver?.id === driver.id ? 'primary.light' : 'background.paper',
                            '&:hover': {
                              bgcolor: 'action.hover',
                            },
                          }}
                          onClick={() => handleSelectDriver(driver)}
                        >
                          <Typography variant="body1">{driver.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {driver.phone || 'No phone'}
                          </Typography>
                        </Box>
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No drivers available
                      </Typography>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Select Truck
                  </Typography>
                  <FormControl fullWidth>
                    <InputLabel id="truck-select-label">Truck</InputLabel>
                    <Select
                      labelId="truck-select-label"
                      value={selectedTruck}
                      onChange={(e) => setSelectedTruck(e.target.value)}
                      label="Truck"
                      disabled={!selectedDriver}
                    >
                      {trucks.map((truck) => (
                        <MenuItem key={truck} value={truck}>
                          {truck}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleDispatchDialogClose}>Cancel</Button>
              <Button
                onClick={handleAssignDriverAndTruck}
                variant="contained"
                color="primary"
                disabled={!selectedDriver || !selectedTruck}
              >
                Dispatch
              </Button>
            </DialogActions>
          </Dialog>
          
          {/* Rejection Dialog */}
          <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
            <DialogTitle>Reject Job</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Reason for rejection"
                fullWidth
                multiline
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmitRejection} variant="contained" color="error">
                Reject Job
              </Button>
            </DialogActions>
          </Dialog>
          
          {/* Cancellation Dialog */}
          <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
            <DialogTitle>Cancel Job</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Reason for cancellation"
                fullWidth
                multiline
                rows={4}
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setCancelDialogOpen(false)}>Back</Button>
              <Button onClick={handleCancelJob} variant="contained" color="error">
                Cancel Job
              </Button>
            </DialogActions>
          </Dialog>
          
          {/* GOA Dialog */}
          <Dialog open={goaDialogOpen} onClose={() => setGoaDialogOpen(false)}>
            <DialogTitle>Mark as GOA</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Reason for GOA"
                fullWidth
                multiline
                rows={4}
                value={goaReason}
                onChange={(e) => setGoaReason(e.target.value)}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setGoaDialogOpen(false)}>Back</Button>
              <Button onClick={handleGoaRequest} variant="contained" color="warning">
                Submit GOA
              </Button>
            </DialogActions>
          </Dialog>
          
          {/* Menu for job actions */}
          <Menu
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => handleMenuAction('email')}>Email Job Details</MenuItem>
            <MenuItem onClick={() => handleMenuAction('duplicate')}>Duplicate Job</MenuItem>
            <MenuItem onClick={() => handleMenuAction('cancel')}>Cancel Job</MenuItem>
            <MenuItem onClick={() => handleMenuAction('goa')}>Mark as GOA</MenuItem>
            <MenuItem onClick={() => handleMenuAction('unsuccessful')}>Report Unsuccessful</MenuItem>
          </Menu>
        </>
      ) : (
        <Box display="flex" justifyContent="center" my={4}>
          <Typography>No jobs found for this category.</Typography>
        </Box>
      )}
    </Box>
  );
}

export default Jobs;
