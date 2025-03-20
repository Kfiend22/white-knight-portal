// JobsTable.js
import React, { useState } from 'react';
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
  Menu
} from '@mui/material';
import {
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import CountdownTimer from './CountdownTimer';
import JobDetails from './JobDetails';
import { ALL_JOB_STATUSES } from '../constants/jobConstants';
import { 
  getJobStatusColor, 
  calculateTargetTime, 
  calculateAutoRejectTime,
  isDispatchUser,
  isJobProvider,
  isAssignedDriver
} from '../utils/jobUtils';

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
  onMenuAction
}) => {
  // Menu state
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedJobForMenu, setSelectedJobForMenu] = useState(null);

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
      onMenuAction(action, selectedJobForMenu);
    }
    handleMenuClose();
  };

  // Render the job driver cell content based on status
  const renderDriverCell = (job) => {
    if (job.status === 'Pending Acceptance') {
      // For Pending Acceptance jobs, show different UI based on user role
      if (isAssignedDriver(job, currentUser)) {
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
      } else if (isJobProvider(job, currentUser)) {
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
    } else if (job.status === 'Pending Acceptance' && isAssignedDriver(job, currentUser)) {
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
              Dispatch
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

  // Render the job status cell content
  const renderStatusCell = (job) => {
    if (job.status === 'Awaiting Approval') {
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
    } else if (jobCategory === 'completed' && canReactivateJob(currentUser)) {
      return (
        <FormControl fullWidth>
          <InputLabel id={`status-select-label-${job.id}`}>Status</InputLabel>
          <Select
            labelId={`status-select-label-${job.id}`}
            label="Status"
            value={job.status || ''}
            onChange={(e) => onJobStatusChange(job.id, e.target.value)}
          >
            {ALL_JOB_STATUSES.map(status => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    } else if (jobCategory === 'inProgress') {
      return (
        <FormControl fullWidth>
          <InputLabel id={`status-select-label-${job.id}`}>Status</InputLabel>
          <Select
            labelId={`status-select-label-${job.id}`}
            label="Status"
            value={job.status || ''}
            onChange={(e) => onJobStatusChange(job.id, e.target.value)}
          >
            {ALL_JOB_STATUSES.map(status => (
              <MenuItem 
                key={status} 
                value={status}
                disabled={
                  // Disable Pending, Scheduled, Pending Acceptance for non-dispatch users
                  (['Pending', 'Scheduled', 'Pending Acceptance'].includes(status) && !isDispatchUser(currentUser)) ||
                  // Disable Dispatched for N/A users who are not dispatchers or answering service
                  (status === 'Dispatched' && currentUser?.primaryRole === 'N/A' && 
                   !(currentUser?.secondaryRoles?.dispatcher || currentUser?.secondaryRoles?.answeringService)) ||
                  // Always disable Rejected status
                  status === 'Rejected' ||
                  // Disable Accepted, Canceled, In-Progress for non-dispatch users
                  (['Accepted', 'Canceled', 'In-Progress'].includes(status) && !isDispatchUser(currentUser)) ||
                  // Disable Awaiting Approval for non-dispatch users
                  (status === 'Awaiting Approval' && !isDispatchUser(currentUser))
                }
              >
                {status}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    } else {
      // Show "Rejected" if status is Pending and there's a rejection reason
      if (job.status === 'Pending' && job.rejectionReason) {
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
      } else {
        return job.status;
      }
    }
  };

  // Helper function to check if a user can reactivate completed jobs
  const canReactivateJob = (user) => {
    if (!user) return false;
    
    // Check primary role (OW, sOW, RM)
    const hasPrimaryRole = user.primaryRole === 'OW' || user.primaryRole === 'sOW' || user.primaryRole === 'RM';
    
    // Check secondary roles (dispatcher, answeringService)
    const hasSecondaryRole = user.secondaryRoles?.dispatcher || user.secondaryRoles?.answeringService;
    
    return hasPrimaryRole || hasSecondaryRole;
  };

  if (jobs.length === 0) {
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
                  {job.eta ? (
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
                  )}
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => onExpandClick(job.id)}>
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
              <TableRow sx={{ backgroundColor: getJobStatusColor(job.status, job) }}>
                <TableCell
                  style={{ paddingBottom: 0, paddingTop: 0 }}
                  colSpan={10}
                >
                  <Collapse in={job.expanded} timeout="auto" unmountOnExit>
                    <JobDetails job={job} />
                  </Collapse>
                </TableCell>
              </TableRow>
            </React.Fragment>
          ))}
        </TableBody>
      </Table>

      {/* Menu for job actions */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleMenuActionSelect('email')}>Email Job Details</MenuItem>
        <MenuItem onClick={() => handleMenuActionSelect('duplicate')}>Duplicate Job</MenuItem>
        <MenuItem onClick={() => handleMenuActionSelect('cancel')}>Cancel Job</MenuItem>
        <MenuItem onClick={() => handleMenuActionSelect('goa')}>Mark as GOA</MenuItem>
        <MenuItem onClick={() => handleMenuActionSelect('unsuccessful')}>Report Unsuccessful</MenuItem>
        {isDispatchUser(currentUser) && (
          <MenuItem onClick={() => handleMenuActionSelect('reassign')}>Reassign Driver</MenuItem>
        )}
      </Menu>
    </>
  );
};

export default JobsTable;
