// JobsTable.js
import React, { useState, useEffect } from 'react';
import StatusUpdateDialog from './StatusUpdateDialog';
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Collapse,
  Menu,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Skeleton
} from '@mui/material';
import {
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import CountdownTimer from './CountdownTimer';
import JobDetails from './JobDetails';
// import { ALL_JOB_STATUSES } from '../constants/jobConstants'; // Unused import
import { 
  getJobStatusColor, 
  calculateTargetTime, 
  calculateAutoRejectTime,
  isJobProvider,
  isAssignedDriver,
  getStatusPriority
} from '../utils/jobUtils';
import { 
  canDispatchJobs,
  canManageGoaRequests, 
  canManageUnsuccessfulRequests,
  getAllowedStatusTransitions,
  isDriverUser,
  hasPermission
} from '../utils/authUtils';

const JobsTable = ({ 
  jobs,
  currentUser,
  jobCategory,
  loading,
  onExpandClick,
  onEditJob,
  onAcceptJob,
  onRejectJob,
  onDispatchJob,
  onJobStatusChange,
  onMenuAction,
  onDeleteJob
}) => {
  // Menu state
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedJobForMenu, setSelectedJobForMenu] = useState(null);
  
  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  
  // Status update dialog for drivers
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [jobForStatusUpdate, setJobForStatusUpdate] = useState(null);
  
  // GOA approval/denial confirmation dialog states
  const [approveGOADialogOpen, setApproveGOADialogOpen] = useState(false);
  const [denyGOADialogOpen, setDenyGOADialogOpen] = useState(false);
  const [jobForGOAAction, setJobForGOAAction] = useState(null);
  
  // Use state to track delete permissions
  const [canDeleteJobs, setCanDeleteJobs] = useState(false);
  
  // Force render flag - we'll use this to force re-renders when needed
  const [forceRender, setForceRender] = useState(0);
  
  // When any job's expanded state changes, trigger a re-render of the entire component
  useEffect(() => {
    // Force re-render when jobs change - especially expanded state
    setForceRender(prev => prev + 1);
  }, [jobs]); // Depend directly on jobs instead of a derived value
  
  // Special handling for canceled jobs tab to ensure delete icons appear
  useEffect(() => {
    if (jobCategory === 'canceled') {
      console.log('In canceled jobs tab, triggering permission update');
      setForceRender(prev => prev + 1);
    }
  }, [jobCategory]);
  
  // Update permissions when anything relevant changes
  useEffect(() => {
    const hasDeletePermission = hasPermission('deleteJobs');
    setCanDeleteJobs(hasDeletePermission);
    
    // Debug logging for delete button visibility
    console.log('JobsTable permission update:', { 
      jobCategory, 
      hasDeletePermission,
      shouldShowDeleteButton: jobCategory === 'canceled' && hasDeletePermission,
      jobCount: jobs.length,
      forceRender
    });
    
    // If in canceled category, do an additional permission setting after a short delay
    // This helps ensure the permissions are updated after the component has fully rendered
    if (jobCategory === 'canceled') {
      setTimeout(() => {
        setCanDeleteJobs(prevState => {
          console.log('Delayed permission update for canceled jobs tab:', hasDeletePermission);
          return hasDeletePermission;
        });
      }, 500);
    }
  }, [currentUser, jobCategory, jobs.length, forceRender]);
  
  // Handle delete button click
  const handleDeleteClick = (job) => {
    setJobToDelete(job);
    setDeleteDialogOpen(true);
  };
  
  // Handle delete confirmation
  const handleConfirmDelete = () => {
    if (jobToDelete && onDeleteJob) {
      onDeleteJob(jobToDelete.id);
    }
    setDeleteDialogOpen(false);
    setJobToDelete(null);
  };
  
  // Handle delete dialog close
  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setJobToDelete(null);
  };

  // Handle menu click
  const handleMenuClick = (event, job) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedJobForMenu(job);
  };

  // Handle menu close
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedJobForMenu(null);
  };

  // Handle menu action selection
  const handleMenuActionSelect = (action) => {
    if (selectedJobForMenu) {
      onMenuAction(action, selectedJobForMenu, effectiveUser);
    }
    handleMenuClose();
  };

  // Render the job driver cell content based on status
  const renderDriverCell = (job) => {
    if (job.status === 'Pending Acceptance') {
      // For Pending Acceptance jobs, show different UI based on user role
      if (isAssignedDriver(job, effectiveUser)) {
        // If current user is the assigned driver, show Accept/Reject buttons with countdown
        return (
          <Box>
            <Button
              variant="contained"
              color="primary"
              size="small"
              sx={{ mr: 1, mb: 1 }}
              onClick={() => onAcceptJob(job)}
            >
              Accept
            </Button>
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={() => onRejectJob(job.id)}
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
        );
      } else if (isJobProvider(job, effectiveUser)) {
        // If current user is the job provider (dispatcher), show AWAITING with countdown
        return (
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
        );
      } else {
        // For other users, just show the driver name
        return (
          <Typography>
            {job.driver} <Typography variant="caption">(Pending)</Typography>
          </Typography>
        );
      }
    } else if (job.driver) {
      // If not pending acceptance but has a driver, show the driver name
      return job.driver;
    } else if (job.status === 'Pending Acceptance' && isAssignedDriver(job, effectiveUser)) {
      // Only show Accept button if job status is Pending Acceptance and current user is the assigned driver
      return (
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={() => onAcceptJob(job)}
        >
          Accept
        </Button>
      );
    } else if (job.status === 'Pending') {
      // For Pending jobs, check if it was previously assigned and expired
      if (job.rejectedBy && job.rejectedBy.length > 0 && 
          job.rejectedBy[job.rejectedBy.length - 1].reason.includes('Auto-expired')) {
        // Show expired message with the previous driver name
        return (
          <Box>
            <Typography variant="body2" color="error.main">
              Acceptance expired
            </Typography>
            <Typography variant="caption" color="text.secondary">
              by: {job.rejectedBy[job.rejectedBy.length - 1].driverName}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="small"
              sx={{ mt: 1 }}
              onClick={() => onDispatchJob(job)}
            >
              Reassign
            </Button>
          </Box>
        );
      } else {
        // Regular Pending job - show Dispatch button
        return (
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => onDispatchJob(job)}
          >
            Dispatch
          </Button>
        );
      }
    } else if (job.status === 'Scheduled') {
      // Show Dispatch button for scheduled jobs
      return (
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={() => onDispatchJob(job)}
        >
          Dispatch
        </Button>
      );
    } else {
      // Fallback for other statuses
      return (
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={() => onDispatchJob(job)}
        >
          Reassign
        </Button>
      );
    }
  };

  // Helper function to get allowed status options based on permissions and current job status
  const getAllowedStatusOptions = (job, user, category) => {
    // Default options based on job category
    const defaultOptions = category === 'completed' 
      ? ['Waiting', 'Dispatched', 'En Route', 'On Site', 'Completed', 'GOA', 'Unsuccessful']
      : ['Waiting', 'Dispatched', 'En Route', 'On Site', 'Completed'];
    
    // If no user, return default options
    if (!user) return defaultOptions;
    
    // Use the permission system to get allowed transitions
    const allowedTransitions = getAllowedStatusTransitions(job.status);
    
    // If we have allowed transitions from the permission system, use them
    if (allowedTransitions && allowedTransitions.length > 0) {
      console.log(`Permission-based status options for job ${job.id} (${job.status}):`, allowedTransitions);
      return allowedTransitions;
    }
    
    // Special handling for completed/canceled jobs
    if (category === 'completed' || job.status === 'Completed' || job.status === 'GOA' || job.status === 'Unsuccessful') {
      // Check if user has permission to update jobs in completed tabs
      const canUpdateCompletedJobs = hasPermission('updateJobsInCompletedTabs');
      if (!canUpdateCompletedJobs) {
        console.log(`User cannot change status of ${job.status} job in completed tab`);
        return [];
      }
      // Use default options for status changes in completed tabs
      return defaultOptions;
    }
    
    // Special handling for canceled jobs
    if (category === 'canceled' || job.status === 'Canceled') {
      // Check if user has permission to update jobs in canceled tabs
      const canUpdateCanceledJobs = hasPermission('updateJobsInCanceledTabs');
      if (!canUpdateCanceledJobs) {
        console.log(`User cannot change status of ${job.status} job in canceled tab`);
        return [];
      }
      // Use default options for status changes in canceled tabs
      return defaultOptions;
    }
    
    // For all other cases, return the default options
    return defaultOptions;
  };

  // Render the job status cell content
  const renderStatusCell = (job) => {
    // Get the allowed status options for this job based on user role
    const allowedStatusOptions = getAllowedStatusOptions(job, effectiveUser, jobCategory);
    
    // Log the allowed options for debugging
    console.log(`Job ${job.id} allowedStatusOptions:`, allowedStatusOptions);
    
    // Check for special cases where we don't want to show the dropdown
    
    // Check if job has a pending unsuccessful request
    if (job.approvalStatusUnsuccessful === 'pending' && job.unsuccessfulReason) {
      // Check if current user can manage unsuccessful requests
      const canManage = canManageUnsuccessfulRequests(effectiveUser);
      
      return (
        <Box>
          <Typography variant="body2" color="error.main">
            Unsuccessful Requested
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Reason: {job.unsuccessfulReason}
          </Typography>
          
          {/* Show Approve/Deny buttons only for users who can manage unsuccessful requests */}
          {canManage && (
            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                color="success"
                size="small"
              onClick={() => onMenuAction('approveUnsuccessful', job, effectiveUser)}
              >
                Approve
              </Button>
              <Button
                variant="contained"
                color="error"
                size="small"
                onClick={() => onMenuAction('denyUnsuccessful', job, effectiveUser)}
              >
                Deny
              </Button>
            </Box>
          )}
        </Box>
      );
    } else if (job.status === 'Awaiting Approval') {
      // Check if this is a denied GOA request
      if (job.approvalStatus === 'rejected') {
        return (
          <Box>
            <Typography variant="body2" color="error.main">
              GOA Denied
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Please cancel job or update status
            </Typography>
          </Box>
        );
      }
      
      // Check if current user can approve/deny GOA using permission system
      const canManage = canManageGoaRequests(job);
      
      // If user can manage GOA, show approve/deny buttons
      if (canManage) {
        return (
          <Box>
            <Typography variant="body2" color="warning.main">
              {job.status}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              GOA request pending approval
            </Typography>
            
            {/* Approve/Deny buttons */}
            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                color="success"
                size="small"
                onClick={() => {
                  setJobForGOAAction(job);
                  setApproveGOADialogOpen(true);
                }}
              >
                Approve
              </Button>
              <Button
                variant="contained"
                color="error"
                size="small"
                onClick={() => {
                  setJobForGOAAction(job);
                  setDenyGOADialogOpen(true);
                }}
              >
                Deny
              </Button>
            </Box>
          </Box>
        );
      } else {
        // Regular awaiting approval (user cannot manage)
        return (
          <Box>
            <Typography variant="body2" color="warning.main">
              {job.status}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              GOA request pending approval
            </Typography>
          </Box>
        );
      }
    } else if (job.status === 'Pending Acceptance' && isAssignedDriver(job, effectiveUser)) {
      // If current user is the assigned driver and job is pending acceptance,
      // don't show dropdown (Accept/Reject buttons are shown in the driver cell)
      return job.status;
    } else if (job.status === 'Pending' && job.rejectionReason) {
      // Show "Rejected" if status is Pending and there's a rejection reason
      return (
        <Box>
          <Typography variant="body2" color="error.main">
            Rejected
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Reason: {job.rejectionReason}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="small"
            sx={{ mt: 1 }}
            onClick={() => onDispatchJob(job)}
          >
            Dispatch
          </Button>
        </Box>
      );
    } else if (isDriverOnlyUser(effectiveUser) || checkIfDriverFromLocalStorage()) {
      // For "driver only" users - ALWAYS use button interface
      // First check if there are any allowed options 
      if (allowedStatusOptions.length === 0 || jobCategory === 'completed' || jobCategory === 'canceled') {
        // For jobs in completed or canceled tabs, or if no options available, just show status as text
        return <Typography>{job.status}</Typography>;
      }
      
      // For active jobs with allowed options, show current status with an "Update Status" button
      // NEVER use a dropdown for drivers, use a button that opens a dialog instead
      return (
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
            {job.status}
          </Typography>
          
          {/* Show Update Status button for jobs that can be updated */}
          {allowedStatusOptions.length > 0 && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              sx={{ mt: 1 }}
              onClick={() => {
                setJobForStatusUpdate(job);
                setStatusDialogOpen(true);
              }}
            >
              {allowedStatusOptions.length === 1 
                ? `Mark as ${allowedStatusOptions[0]}` 
                : 'Update Status'}
            </Button>
          )}
        </Box>
      );
    } else {
      // Add debug logging for status values
      console.log(`Job ${job.id} status: ${job.status}, jobCategory: ${jobCategory}`);
      
      // Handle completed jobs differently to avoid "out-of-range" errors
      if (jobCategory === 'canceled') {
        // For canceled jobs, use standard options but with Canceled status
        // For driver-only users, check if they have any allowed options
        const isDriverOnly = isDriverOnlyUser(effectiveUser);
        
        // If driver-only user, just show the status text (no dropdown)
        if (isDriverOnly) {
          return job.status;
        }
        
        // Get allowed options for canceled jobs
        const canceledOptions = [...allowedStatusOptions];
        if (!canceledOptions.includes('Canceled')) {
          canceledOptions.push('Canceled');
        }
        
        return (
          <FormControl fullWidth>
            <InputLabel id={`status-select-label-${job.id}`}>Status</InputLabel>
            <Select
              key={`${jobCategory}-${job.id}-${job.status}`} // Include job.status in key to force re-render on status change
              labelId={`status-select-label-${job.id}`}
              label="Status"
              value={job.status}
              onChange={(e) => onJobStatusChange(job.id, e.target.value)}
            >
              {/* Generate menu items based on allowed options */}
              {canceledOptions.map(status => (
                <MenuItem key={status} value={status}>{status}</MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      } else if (jobCategory === 'completed') {
        // For completed jobs, include GOA and Unsuccessful in the options
        // For driver-only users, check if they have any allowed options
        const isDriverOnly = isDriverOnlyUser(effectiveUser);
        
        // If driver-only user, just show the status text (no dropdown)
        if (isDriverOnly) {
          return job.status;
        }
        
        return (
          <FormControl fullWidth>
            <InputLabel id={`status-select-label-${job.id}`}>Status</InputLabel>
            <Select
              key={`${jobCategory}-${job.id}-${job.status}`} // Include job.status in key to force re-render on status change
              labelId={`status-select-label-${job.id}`}
              label="Status"
              value={job.status}
              onChange={(e) => onJobStatusChange(job.id, e.target.value)}
            >
              {/* Generate menu items based on allowed options */}
              {allowedStatusOptions.map(status => (
                <MenuItem key={status} value={status}>{status}</MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      } else {
        // For non-completed jobs, use the filtered options based on user role
        // Determine the displayed status value
        let displayedStatus = job.status;
        
        // If the current status is not in the allowed options, default to Waiting or Dispatched
        if (!allowedStatusOptions.includes(job.status)) {
          displayedStatus = job.driverId ? 'Dispatched' : 'Waiting';
        }
        
        // For driver-only users, check if they have any allowed options
        const isDriverOnly = isDriverOnlyUser(effectiveUser);
        
        // If driver-only user with no allowed options, just show the status text
        if (isDriverOnly && allowedStatusOptions.length === 0) {
          return job.status;
        }
        
        return (
          <FormControl fullWidth>
            <InputLabel id={`status-select-label-${job.id}`}>Status</InputLabel>
            <Select
              key={`${jobCategory}-${job.id}-${job.status}`} // Include job.status in key to force re-render on status change
              labelId={`status-select-label-${job.id}`}
              label="Status"
              value={displayedStatus}
              onChange={(e) => onJobStatusChange(job.id, e.target.value)}
              disabled={isDriverOnly && allowedStatusOptions.length === 0} // Disable if no options
            >
              {/* Generate menu items based on allowed options */}
              {allowedStatusOptions.map(status => (
                <MenuItem key={status} value={status}>{status}</MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      }
    }
  };

  // Helper function to check if a user can reactivate completed jobs
  // This function is kept for future reference but marked as unused with eslint-disable
  // eslint-disable-next-line no-unused-vars
  const canReactivateJob = (user) => {
    if (!user) return false;
    
    // Use permission system to check if user can reactivate jobs
    return hasPermission('reactivateJobs');
  };
  
  // Helper function to check if a user is a "driver only" user
  const isDriverOnlyUser = (user) => {
    if (!user) return false;
    
    // Use the permission system's isDriverUser function instead of role checks
    return isDriverUser(user);
  };
  
  // Helper function to check localStorage directly for DRIVER-ONLY users
  // This is used as a fallback during emergency render when user data isn't fully loaded
  // A driver-only user has primaryRole = 'N/A' and only 'driver' as secondary role
  const checkIfDriverFromLocalStorage = () => {
    try {
      const userDataString = localStorage.getItem('user');
      if (!userDataString) return false;
      
      // Parse the user data JSON
      const userData = JSON.parse(userDataString);
      
      // A user is "driver-only" if they have N/A primary role and ONLY driver secondary role
      let secondaryRoles = [];
      
      // Extract the secondary roles
      if (userData.secondaryRoles) {
        if (Array.isArray(userData.secondaryRoles)) {
          secondaryRoles = userData.secondaryRoles;
        } else if (typeof userData.secondaryRoles === 'object') {
          // Handle object format where values are booleans
          secondaryRoles = Object.keys(userData.secondaryRoles)
            .filter(role => userData.secondaryRoles[role] === true);
        }
      }
      
      // Check if this is a driver-only user (N/A primary role AND exactly one secondary role = 'driver')
      const isDriverOnly = 
        (userData.primaryRole === 'N/A' || userData.role === 'N/A') && 
        secondaryRoles.length === 1 && 
        secondaryRoles.includes('driver');
      
      console.log('LocalStorage driver-only check:', { isDriverOnly, userData, secondaryRoles });
      return isDriverOnly;
    } catch (err) {
      console.error('Error checking localStorage for driver-only:', err);
      return false;
    }
  };

  // EMERGENCY RENDER: Use this state to force rendering after a timeout
  const [emergencyRender, setEmergencyRender] = useState(false);
  
  // Set up emergency render timeout - will force display after 5 seconds regardless of user data
  useEffect(() => {
    console.log('Setting up emergency render timeout');
    const timer = setTimeout(() => {
      console.log('EMERGENCY RENDER TIMEOUT - forcing display regardless of user data state');
      setEmergencyRender(true);
    }, 5000); // 5 second fail-safe
    return () => clearTimeout(timer);
  }, []);
  
  // Debug current user object
  useEffect(() => {
    console.log('Current user object:', currentUser);
    if (currentUser) {
      console.log('User properties:', {
        hasId: Boolean(currentUser.id),
        has_Id: Boolean(currentUser._id),
        hasUsername: Boolean(currentUser.username),
        keys: Object.keys(currentUser)
      });
    }
  }, [currentUser]);
  
  // Check if user data is fully loaded - more aggressive checks including direct property access
  const isUserDataReady = Boolean(
    currentUser && 
    (currentUser.id || currentUser._id || 
     (currentUser.username && currentUser.primaryRole) ||
     forceRender || emergencyRender)
  );
  
  // Create an effective user object for when data isn't fully loaded yet
  const effectiveUser = currentUser || {
    primaryRole: 'N/A',
    secondaryRoles: {},
    id: null
  };
  
  // Log when we're using the default user
  if (!currentUser) {
    console.log('JobsTable: Using default user object (waiting for real user data)');
  }

  // FINAL FIX: Force display table in most scenarios to prevent infinite loading
  // 1. If we have jobs and the emergency render timer has triggered
  // 2. If we have jobs and user data appears ready by any criteria
  // 3. After 5 seconds, the emergency render will force display regardless
  
  const shouldShowTable = 
    // Show table if we have jobs and either emergency render kicked in OR user data is ready
    (jobs.length > 0 && (emergencyRender || isUserDataReady)) ||
    // ALSO force display if emergency render is active, even if jobs array is empty
    (emergencyRender && !loading);
  
  console.log('JobsTable rendering state:', {
    loading,
    emergencyRender,
    isUserDataReady,
    shouldShowTable,
    jobCount: jobs.length
  });
  
  // Only show loading state if we're still loading AND emergency render hasn't kicked in
  if (loading && !emergencyRender) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" my={4}>
        <CircularProgress size={24} />
        <Typography ml={2}>Loading job data...</Typography>
      </Box>
    );
  }

  // Show empty state when there are no jobs to display (but not if we're still loading)
  if (jobs.length === 0 && !loading) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <Typography>No jobs found for this category.</Typography>
      </Box>
    );
  }

  return (
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
          {jobs.map((job) => (
            <React.Fragment key={job.id}>
              <TableRow sx={{ backgroundColor: getJobStatusColor(job.status, job) }}>
                <TableCell>{job.po || job.id}</TableCell>
                <TableCell>{job.created}</TableCell>
                <TableCell>
                  {renderDriverCell(job)}
                </TableCell>
                <TableCell>{job.truck || 'N/A'}</TableCell>
                <TableCell>{job.account}</TableCell>
                <TableCell>{job.service}</TableCell>
                <TableCell>{job.location}</TableCell>
                <TableCell>
                  {renderStatusCell(job)}
                </TableCell>
                <TableCell>
                  {/* Hide ETA for completed and canceled jobs */}
                  {jobCategory !== 'completed' && jobCategory !== 'canceled' ? (
                    job.eta ? (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {job.eta}
                        </Typography>
                        {/* Only show timer if NOT completed */}
                        {job.status !== 'Completed' && calculateTargetTime(job) && (
                          <CountdownTimer targetTime={calculateTargetTime(job)} />
                        )}
                      </Box>
                    ) : (
                      "N/A"
                    )
                  ) : (
                    "—" // Em dash for completed/canceled jobs
                  )}
                </TableCell>
                <TableCell align="right" style={{ minWidth: '200px' }}>
                  <Box display="flex" justifyContent="flex-end">
                    <IconButton onClick={() => onExpandClick(job.id)}>
                      {job.expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                    <IconButton onClick={() => onEditJob && onEditJob(job)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={(e) => handleMenuClick(e, job)}>
                      <MoreVertIcon />
                    </IconButton>
                    {/* Show delete button only for cancelled jobs and users with permission */}
                    {jobCategory === 'canceled' && canDeleteJobs && (
                      <IconButton onClick={() => handleDeleteClick(job)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
              {/* Expanded Row */}
              <TableRow sx={{ backgroundColor: getJobStatusColor(job.status, job) }}>
                <TableCell
                  style={{ paddingBottom: 0, paddingTop: 0 }}
                  colSpan={10}
                >
                  {/* Debug log for Collapse component */}
                  {console.log(`Rendering Collapse for job ${job.id}, expanded=${job.expanded}`)}
                  <Collapse in={job.expanded} timeout="auto" unmountOnExit>
                    <JobDetails job={job} currentUser={effectiveUser} />
                  </Collapse>
                </TableCell>
              </TableRow>
            </React.Fragment>
          ))}
        </TableBody>
      </Table>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Delete Job
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to permanently delete this job? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Menu for job actions */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleMenuActionSelect('email')}>Email Job Details</MenuItem>
        
        {hasPermission('duplicateJobs') && (
          <MenuItem onClick={() => handleMenuActionSelect('duplicate')}>Duplicate Job</MenuItem>
        )}
        
        {hasPermission('cancelJobs') && (
          <MenuItem onClick={() => handleMenuActionSelect('cancel')}>Cancel Job</MenuItem>
        )}
        
        {hasPermission('markJobsGoa') && (
          <MenuItem 
            onClick={() => handleMenuActionSelect('goa')} 
            disabled={selectedJobForMenu?.status !== 'On Site'}
          >
            Mark as GOA
          </MenuItem>
        )}
        
        {hasPermission('updateJobEta') && (
          <MenuItem onClick={() => handleMenuActionSelect('updateEta')}>Update ETA</MenuItem>
        )}
        
        {hasPermission('markJobsUnsuccessful') && (
          <MenuItem 
            onClick={() => handleMenuActionSelect('unsuccessful')}
            disabled={selectedJobForMenu?.status !== 'On Site'}
          >
            Report Unsuccessful
          </MenuItem>
        )}
        
        {canDispatchJobs() && (
          <MenuItem onClick={() => handleMenuActionSelect('reassign')}>Reassign Driver</MenuItem>
        )}
      </Menu>

      {/* Approve GOA confirmation dialog */}
      <Dialog
        open={approveGOADialogOpen}
        onClose={() => {
          setApproveGOADialogOpen(false);
          setJobForGOAAction(null);
        }}
        aria-labelledby="approve-goa-dialog-title"
        aria-describedby="approve-goa-dialog-description"
      >
        <DialogTitle id="approve-goa-dialog-title">
          Approve GOA Request
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="approve-goa-dialog-description">
            Are you sure you want to approve this GOA request? This will mark the job as "GOA" (Gone On Arrival).
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setApproveGOADialogOpen(false);
              setJobForGOAAction(null);
            }} 
            color="primary"
          >
            Cancel
          </Button>
          <Button 
              onClick={() => {
                if (jobForGOAAction) {
                  onMenuAction('approveGOA', jobForGOAAction, effectiveUser);
                }
                setApproveGOADialogOpen(false);
                setJobForGOAAction(null);
              }} 
            color="success" 
            autoFocus
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deny GOA confirmation dialog */}
      <Dialog
        open={denyGOADialogOpen}
        onClose={() => {
          setDenyGOADialogOpen(false);
          setJobForGOAAction(null);
        }}
        aria-labelledby="deny-goa-dialog-title"
        aria-describedby="deny-goa-dialog-description"
      >
        <DialogTitle id="deny-goa-dialog-title">
          Deny GOA Request
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="deny-goa-dialog-description">
            Are you sure you want to deny this GOA request? The job will remain in the active section until it's canceled or marked as GOA again.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setDenyGOADialogOpen(false);
              setJobForGOAAction(null);
            }} 
            color="primary"
          >
            Cancel
          </Button>
          <Button 
            onClick={() => {
              if (jobForGOAAction) {
                onMenuAction('denyGOA', jobForGOAAction, effectiveUser);
              }
              setDenyGOADialogOpen(false);
              setJobForGOAAction(null);
            }} 
            color="error" 
            autoFocus
          >
            Deny
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Update Dialog */}
      <StatusUpdateDialog
        open={statusDialogOpen}
        onClose={() => {
          setStatusDialogOpen(false);
          setJobForStatusUpdate(null);
        }}
        currentStatus={jobForStatusUpdate ? jobForStatusUpdate.status : ''}
        allowedStatuses={jobForStatusUpdate ? getAllowedStatusOptions(jobForStatusUpdate, effectiveUser, jobCategory) : []}
        onUpdateStatus={(newStatus) => {
          if (jobForStatusUpdate) {
            onJobStatusChange(jobForStatusUpdate.id, newStatus);
          }
          setStatusDialogOpen(false);
          setJobForStatusUpdate(null);
        }}
      />
    </>
  );
};

// Custom comparison function for React.memo
// This ensures the component re-renders when job status, approvalStatus, or expanded state changes
const arePropsEqual = (prevProps, nextProps) => {
  // If job count changes, we need to re-render
  if (prevProps.jobs.length !== nextProps.jobs.length) {
    return false;
  }
  
  // Check if any job's status, approvalStatus, or expanded state has changed
  for (let i = 0; i < prevProps.jobs.length; i++) {
    const prevJob = prevProps.jobs[i];
    const nextJob = nextProps.jobs.find(job => job.id === prevJob.id);
    
    // If job not found in next props, we need to re-render
    if (!nextJob) {
      return false;
    }
    
    // If status, approvalStatus, or expanded state changed, we need to re-render
    if (prevJob.status !== nextJob.status || 
        prevJob.approvalStatus !== nextJob.approvalStatus ||
        prevJob.expanded !== nextJob.expanded) {
      
      // Log only if expanded state changed (to reduce noise in console)
      if (prevJob.expanded !== nextJob.expanded) {
        console.log('Job expanded state changed, triggering re-render:', {
          jobId: prevJob.id,
          prevExpanded: prevJob.expanded,
          nextExpanded: nextJob.expanded
        });
      } else {
        console.log('Job status or approvalStatus changed, triggering re-render:', {
          jobId: prevJob.id,
          prevStatus: prevJob.status,
          nextStatus: nextJob.status,
          prevApprovalStatus: prevJob.approvalStatus,
          nextApprovalStatus: nextJob.approvalStatus
        });
      }
      
      return false;
    }
  }
  
  // If we get here, no relevant changes were detected
  return true;
};

export default React.memo(JobsTable, arePropsEqual);
