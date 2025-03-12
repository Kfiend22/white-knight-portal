// Jobs.js
import React, { useState, useEffect } from 'react';
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

function Jobs({ jobCategory, onCreateJob, onReceiveDemoJob }) {
  const [jobs, setJobs] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dialog and menu states
  const [etaDialogOpen, setEtaDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedEta, setSelectedEta] = useState('5'); // default to 5 minutes
  const [anotherTime, setAnotherTime] = useState(false);
  const [anotherTimeValue, setAnotherTimeValue] = useState(null);

  const [dispatchDialogOpen, setDispatchDialogOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedJobForMenu, setSelectedJobForMenu] = useState(null);

  useEffect(() => {
    fetchJobs();
    fetchDrivers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchJobs = () => {
    setLoading(true);
    // Modify the API endpoint based on jobCategory
    fetch(`/api/jobs?category=${jobCategory}`, { headers: authHeader() })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch jobs');
        }
        return res.json();
      })
      .then((data) => {
        setJobs(data);
        setLoading(false);
        if (data.length === 0 && jobCategory === 'pending') {
          // Expose the createDemoJob function globally
          window.createDemoJob = createDemoJob;
        }
      })
      .catch((err) => {
        console.error('Error fetching jobs:', err);
        setError('Failed to load jobs');
        setLoading(false);
      });
  };

  const fetchDrivers = () => {
    fetch('/api/drivers', { headers: authHeader() })
      .then((res) => res.json())
      .then((data) => {
        setDrivers(data);
      })
      .catch((err) => {
        console.error('Error fetching drivers:', err);
      });
  };

  // Helper function to get auth headers
  const authHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  // Accept job handler
  const handleAcceptJob = (job) => {
    setSelectedJob(job);
    setEtaDialogOpen(true);
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
  const handleEtaDialogSave = () => {
    if (anotherTime && !anotherTimeValue) {
      alert('Please select a date and time.');
      return;
    }
    const updatedJob = {
      ...selectedJob,
      accepted: true,
      eta: anotherTime ? anotherTimeValue : selectedEta,
      status: anotherTime ? 'Scheduled' : 'Accepted',
    };

    setJobs((prevJobs) =>
      prevJobs.map((job) => (job.id === selectedJob.id ? updatedJob : job))
    );

    handleEtaDialogClose();
  };

  // Reject job handler
  const handleRejectJob = (jobId) => {
    setJobs((prevJobs) => prevJobs.filter((job) => job.id !== jobId));
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

  // Assign driver to job
  const handleAssignDriver = (driver) => {
    const updatedJob = {
      ...selectedJob,
      driver: driver.name,
      truck: driver.assignedTruck || 'Auto-filled Truck',
      status: 'In-Progress',
    };
    setJobs((prevJobs) =>
      prevJobs.map((job) => (job.id === selectedJob.id ? updatedJob : job))
    );
    handleDispatchDialogClose();
  };

  // Job status change handler
  const handleJobStatusChange = (jobId, status) => {
    let updatedJobs = jobs.map((job) =>
      job.id === jobId ? { ...job, status } : job
    );

    setJobs(updatedJobs);
  };

  // Expand/collapse job details
  const handleExpandClick = (jobId) => {
    setJobs((prevJobs) =>
      prevJobs.map((job) =>
        job.id === jobId ? { ...job, expanded: !job.expanded } : job
      )
    );
  };

  // Menu actions for in-progress jobs
  const handleMenuClick = (event, job) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedJobForMenu(job);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedJobForMenu(null);
  };

  const handleMenuAction = (action) => {
    switch (action) {
      case 'cancel':
        // Implement cancel job logic
        break;
      case 'goa':
        // Implement GOA logic
        break;
      case 'unsuccessful':
        // Implement report unsuccessful logic
        break;
      case 'email':
        // Implement email job details logic
        break;
      case 'duplicate':
        // Implement duplicate job logic
        break;
      default:
        break;
    }
    handleMenuClose();
  };

  // Filtering jobs based on status
  let displayedJobs = [];
  if (jobCategory === 'pending') {
    displayedJobs = jobs.filter((job) => job.status === 'Pending');
  } else if (jobCategory === 'inProgress') {
    displayedJobs = jobs.filter((job) => job.status === 'In-Progress');
  } else if (jobCategory === 'scheduled') {
    displayedJobs = jobs.filter((job) => job.status === 'Scheduled');
  } else if (jobCategory === 'completed') {
    displayedJobs = jobs.filter((job) => job.status === 'Completed');
  } else if (jobCategory === 'canceled') {
    displayedJobs = jobs.filter((job) => job.status === 'Canceled');
  }

  // Function to create a demo job
  const createDemoJob = () => {
    const demoJob = {
      id: Math.floor(Math.random() * 900000000 + 100000000).toString(),
      created: new Date().toISOString(),
      driver: null,
      truck: null,
      account: 'Demo Account',
      service: 'Demo Service',
      location: '123 Demo St',
      dropOffLocation: '456 Demo Ave',
      eta: null,
      status: 'Pending',
      accepted: false,
      expanded: false,
      customerName: 'John Doe',
      contactInfo: '123-456-7890',
    };
    setJobs((prevJobs) => [...prevJobs, demoJob]);
  };

  return (
    <Box mt={2}>
      {loading && <Typography>Loading jobs...</Typography>}
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
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedJobs.map((job) => (
                <React.Fragment key={job.id}>
                  <TableRow>
                    <TableCell>{job.id}</TableCell>
                    <TableCell>{job.created}</TableCell>
                    <TableCell>
                      {job.driver ? (
                        job.driver
                      ) : job.status === 'Pending' ? (
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={() => handleAcceptJob(job)}
                        >
                          Accept
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={() => handleDispatchJob(job)}
                        >
                          Dispatch
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>{job.truck || 'N/A'}</TableCell>
                    <TableCell>{job.account}</TableCell>
                    <TableCell>{job.service}</TableCell>
                    <TableCell>{job.location}</TableCell>
                    <TableCell>
                      {jobCategory === 'inProgress' ? (
                        <FormControl variant="standard" fullWidth>
                          <Select
                            value={job.status}
                            onChange={(e) =>
                              handleJobStatusChange(job.id, e.target.value)
                            }
                          >
                            <MenuItem value="Waiting">Waiting</MenuItem>
                            <MenuItem value="Accepted">Accepted</MenuItem>
                            <MenuItem value="Dispatched">Dispatched</MenuItem>
                            <MenuItem value="En Route">En Route</MenuItem>
                            <MenuItem value="On Site">On Site</MenuItem>
                            <MenuItem value="Completed">Completed</MenuItem>
                          </Select>
                        </FormControl>
                      ) : (
                        job.status
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => handleExpandClick(job.id)}>
                        {job.expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                      <IconButton>
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
                      colSpan={9}
                    >
                      <Collapse in={job.expanded} timeout="auto" unmountOnExit>
                        <Box margin={1}>
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                              {/* Map placeholder */}
                              <Paper style={{ height: '200px' }}>
                                <Typography variant="subtitle1" align="center">
                                  Map Placeholder
                                </Typography>
                              </Paper>
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <Typography variant="subtitle1">
                                Job Details
                              </Typography>
                              {/* Display detailed job information here */}
                              <Typography>
                                Customer Name: {job.customerName}
                              </Typography>
                              <Typography>
                                Contact Info: {job.contactInfo}
                              </Typography>
                              {/* Add more details as needed */}
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
        </>
      ) : (
        <>
          {jobCategory === 'pending' ? (
            <Typography>
              <Link href="#" onClick={onCreateJob}>
                Create a Job
              </Link>{' '}
              or{' '}
              <Link href="#" onClick={onReceiveDemoJob}>
                Receive a Demo Job
              </Link>
            </Typography>
          ) : jobCategory === 'inProgress' ? (
            <Typography>Assign a job to a driver!</Typography>
          ) : (
            <Typography>No jobs available in this section.</Typography>
          )}
        </>
      )}

      {/* ETA Dialog */}
      <Dialog open={etaDialogOpen} onClose={handleEtaDialogClose}>
        <DialogTitle>Select ETA</DialogTitle>
        <DialogContent>
          <FormControl fullWidth>
            <InputLabel>ETA</InputLabel>
            <Select value={selectedEta} onChange={handleEtaSelectChange}>
              {[...Array(36)].map((_, i) => {
                const minutes = (i + 1) * 5;
                return (
                  <MenuItem key={minutes} value={minutes.toString()}>
                    {minutes} minutes
                  </MenuItem>
                );
              })}
              <MenuItem value="another">Another Time</MenuItem>
            </Select>
          </FormControl>
          {anotherTime && (
            <TextField
              label="Select Date and Time"
              type="datetime-local"
              fullWidth
              value={anotherTimeValue || ''}
              onChange={(e) => setAnotherTimeValue(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              sx={{ mt: 2 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEtaDialogClose}>Cancel</Button>
          <Button onClick={handleEtaDialogSave} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dispatch Dialog */}
      <Dialog
        open={dispatchDialogOpen}
        onClose={handleDispatchDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Dispatch Job</DialogTitle>
        <DialogContent>
          <Typography variant="h6">Job Details</Typography>
          {/* Display job details */}
          <Typography>ID: {selectedJob?.id}</Typography>
          <Typography>Service: {selectedJob?.service}</Typography>
          <Typography>Location: {selectedJob?.location}</Typography>
          <Typography>ETA: {selectedJob?.eta}</Typography>
          {/* Map placeholder */}
          <Paper style={{ height: '300px', marginTop: '16px' }}>
            <Typography variant="subtitle1" align="center">
              Map Placeholder
            </Typography>
          </Paper>
          <Typography variant="h6" style={{ marginTop: '16px' }}>
            Available Drivers
          </Typography>
          {drivers.map((driver) => (
            <Button
              key={driver.id}
              variant="contained"
              fullWidth
              onClick={() => handleAssignDriver(driver)}
              style={{ marginTop: '8px' }}
            >
              {driver.name}
            </Button>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDispatchDialogClose}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* More Actions Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleMenuAction('cancel')}>Cancel Job</MenuItem>
        <MenuItem onClick={() => handleMenuAction('goa')}>Mark as GOA</MenuItem>
        <MenuItem onClick={() => handleMenuAction('unsuccessful')}>
          Report Unsuccessful
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('email')}>
          Email Job Details
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('duplicate')}>
          Duplicate Job
        </MenuItem>
      </Menu>
    </Box>
  );
}

export default Jobs;
