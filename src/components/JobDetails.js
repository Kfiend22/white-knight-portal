// JobDetails.js
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Tabs,
  Tab,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Link,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Alert,
  Chip
} from '@mui/material';
import JobHistory from './JobHistory';
import JobInvoice from './JobInvoice';
import { uploadJobDocuments, getJobDocuments, getJobDocumentDownloadUrl, getJobDocumentAsDataUrl, deleteJobDocument, approveGOA, denyGOA, approveUnsuccessfulJob, denyUnsuccessfulJob } from '../services/jobService';
import { canManageUnsuccessful } from '../utils/jobUtils';
import DeleteIcon from '@mui/icons-material/Delete';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

// Map component that is always visible
const MapComponent = () => (
  <Paper style={{ height: '350px' }}>
    <Typography variant="subtitle1" align="center" sx={{ py: 2 }}>
      Map Placeholder
    </Typography>
  </Paper>
);

// Component to show the details tab content.
const DetailsTabContent = ({ job, currentUser }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const fileInputRef = useRef(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState({ open: false, success: false, message: '' });
  const [goaActionStatus, setGoaActionStatus] = useState({ open: false, success: false, message: '' });
  const [goaActionLoading, setGoaActionLoading] = useState(false);
  const [unsuccessfulActionStatus, setUnsuccessfulActionStatus] = useState({ open: false, success: false, message: '' });
  const [unsuccessfulActionLoading, setUnsuccessfulActionLoading] = useState(false);

  // Determine if the current user is a driver
  // Debug log for user profile
  console.log('JobDetails - currentUser:', currentUser);
  console.log('JobDetails - primaryRole:', currentUser?.primaryRole);
  console.log('JobDetails - secondaryRoles:', currentUser?.secondaryRoles);
  console.log('JobDetails - secondaryRoles is Array?', Array.isArray(currentUser?.secondaryRoles));
  
  if (currentUser?.secondaryRoles && !Array.isArray(currentUser.secondaryRoles)) {
    console.log('JobDetails - secondaryRoles type:', typeof currentUser.secondaryRoles);
    console.log('JobDetails - secondaryRoles keys:', Object.keys(currentUser.secondaryRoles));
  }
  
  // Ensure secondaryRoles is always treated as an array
  let secondaryRolesArray = [];
  if (currentUser?.secondaryRoles) {
    if (Array.isArray(currentUser.secondaryRoles)) {
      secondaryRolesArray = currentUser.secondaryRoles;
    } else if (typeof currentUser.secondaryRoles === 'object') {
      // Convert object format {driver: true} to array format ['driver']
      secondaryRolesArray = Object.keys(currentUser.secondaryRoles)
        .filter(role => currentUser.secondaryRoles[role]);
    }
  }
  
  // Detailed logging for isDriver calculation
  console.log('JobDetails - isDriver calculation details:');
  console.log('- currentUser exists?', !!currentUser);
  console.log('- primaryRole === "N/A"?', currentUser?.primaryRole === 'N/A');
  console.log('- secondaryRolesArray:', secondaryRolesArray);
  console.log('- secondaryRolesArray.length === 1?', secondaryRolesArray.length === 1);
  console.log('- includes "Driver"?', secondaryRolesArray.includes('Driver'));
  console.log('- includes "driver"?', secondaryRolesArray.includes('driver')); // Check for lowercase
  
  // Determine if the user is ONLY a driver with no other roles
  const isDriver = currentUser && 
    currentUser.primaryRole === 'N/A' && 
    secondaryRolesArray.length === 1 && 
    secondaryRolesArray.includes('driver'); // Changed to lowercase
  
  console.log('JobDetails - isDriver:', isDriver);

  // Load existing documents when component mounts or job changes
  useEffect(() => {
    const fetchDocuments = async () => {
      if (job && job.id) {
        try {
          const response = await getJobDocuments(job.id);
          if (response.success) {
            setUploadedFiles(response.data);
          }
        } catch (error) {
          console.error('Error fetching job documents:', error);
        }
      }
    };

    fetchDocuments();
  }, [job]);

  // Check if user can approve/deny GOA requests (OW, sOW, RM roles)
  console.log('JobDetails - currentUser:', currentUser);
  const canManageGOA =
    currentUser && ['OW', 'sOW', 'RM'].includes(currentUser.primaryRole);
  console.log(
    'JobDetails - canManageGOA:',
    canManageGOA,
    'primaryRole:',
    currentUser?.primaryRole
  );
  
  // Check if user can approve/deny unsuccessful requests
  const canManageUnsuccessfulRequests = canManageUnsuccessful(currentUser);
  console.log(
    'JobDetails - canManageUnsuccessfulRequests:',
    canManageUnsuccessfulRequests
  );

  // Handle GOA approval
  const handleApproveGOA = async () => {
    if (!job || !job.id) return;

    setGoaActionLoading(true);

    try {
      const response = await approveGOA(job.id);

      if (response.success) {
        setGoaActionStatus({
          open: true,
          success: true,
          message: 'GOA request approved successfully',
        });

        // Refresh the job data (this will be handled by the parent component)
        if (typeof window !== 'undefined') {
          // Emit a custom event that the parent component can listen for
          const event = new CustomEvent('jobUpdated', { detail: { jobId: job.id } });
          window.dispatchEvent(event);
        }
      } else {
        setGoaActionStatus({
          open: true,
          success: false,
          message: response.message || 'Failed to approve GOA request',
        });
      }
    } catch (error) {
      console.error('Error approving GOA request:', error);
      setGoaActionStatus({
        open: true,
        success: false,
        message: 'An error occurred while approving the GOA request',
      });
    } finally {
      setGoaActionLoading(false);
    }
  };

  // Handle GOA denial
  const handleDenyGOA = async () => {
    if (!job || !job.id) return;

    setGoaActionLoading(true);

    try {
      const response = await denyGOA(job.id);

      if (response.success) {
        setGoaActionStatus({
          open: true,
          success: true,
          message: 'GOA request denied successfully',
        });

        // Refresh the job data (this will be handled by the parent component)
        if (typeof window !== 'undefined') {
          // Emit a custom event that the parent component can listen for
          const event = new CustomEvent('jobUpdated', { detail: { jobId: job.id } });
          window.dispatchEvent(event);
        }
      } else {
        setGoaActionStatus({
          open: true,
          success: false,
          message: response.message || 'Failed to deny GOA request',
        });
      }
    } catch (error) {
      console.error('Error denying GOA request:', error);
      setGoaActionStatus({
        open: true,
        success: false,
        message: 'An error occurred while denying the GOA request',
      });
    } finally {
      setGoaActionLoading(false);
    }
  };

  // Handle closing the GOA action status snackbar
  const handleGoaActionStatusClose = () => {
    setGoaActionStatus({ ...goaActionStatus, open: false });
  };

  // Handle closing the unsuccessful action status snackbar
  const handleUnsuccessfulActionStatusClose = () => {
    setUnsuccessfulActionStatus({ ...unsuccessfulActionStatus, open: false });
  };

  // Handle Unsuccessful approval
  const handleApproveUnsuccessful = async () => {
    if (!job || !job.id) return;

    setUnsuccessfulActionLoading(true);

    try {
      const response = await approveUnsuccessfulJob(job.id);

      if (response.success) {
        setUnsuccessfulActionStatus({
          open: true,
          success: true,
          message: 'Unsuccessful request approved successfully',
        });

        // Refresh the job data (this will be handled by the parent component)
        if (typeof window !== 'undefined') {
          // Emit a custom event that the parent component can listen for
          const event = new CustomEvent('jobUpdated', { detail: { jobId: job.id } });
          window.dispatchEvent(event);
        }
      } else {
        setUnsuccessfulActionStatus({
          open: true,
          success: false,
          message: response.message || 'Failed to approve unsuccessful request',
        });
      }
    } catch (error) {
      console.error('Error approving unsuccessful request:', error);
      setUnsuccessfulActionStatus({
        open: true,
        success: false,
        message: 'An error occurred while approving the unsuccessful request',
      });
    } finally {
      setUnsuccessfulActionLoading(false);
    }
  };

  // Handle Unsuccessful denial
  const handleDenyUnsuccessful = async () => {
    if (!job || !job.id) return;

    setUnsuccessfulActionLoading(true);

    try {
      const response = await denyUnsuccessfulJob(job.id);

      if (response.success) {
        setUnsuccessfulActionStatus({
          open: true,
          success: true,
          message: 'Unsuccessful request denied successfully',
        });

        // Refresh the job data (this will be handled by the parent component)
        if (typeof window !== 'undefined') {
          // Emit a custom event that the parent component can listen for
          const event = new CustomEvent('jobUpdated', { detail: { jobId: job.id } });
          window.dispatchEvent(event);
        }
      } else {
        setUnsuccessfulActionStatus({
          open: true,
          success: false,
          message: response.message || 'Failed to deny unsuccessful request',
        });
      }
    } catch (error) {
      console.error('Error denying unsuccessful request:', error);
      setUnsuccessfulActionStatus({
        open: true,
        success: false,
        message: 'An error occurred while denying the unsuccessful request',
      });
    } finally {
      setUnsuccessfulActionLoading(false);
    }
  };

  // Check if user can delete documents (primary role other than N/A)
  const canDeleteDocuments =
    currentUser && currentUser.primaryRole !== 'N/A';

  // Handle opening delete confirmation dialog
  const handleDeleteClick = (doc) => {
    setFileToDelete(doc);
    setDeleteDialogOpen(true);
  };

  // Handle closing delete confirmation dialog
  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setFileToDelete(null);
  };

  // Handle document deletion
  const handleDeleteDocument = async () => {
    if (!fileToDelete || !job.id) return;

    try {
      const response = await deleteJobDocument(job.id, fileToDelete.filename);

      if (response.success) {
        // Remove the deleted document from the state
        setUploadedFiles(
          uploadedFiles.filter((doc) => doc.filename !== fileToDelete.filename)
        );

        // Show success message
        setDeleteStatus({
          open: true,
          success: true,
          message: 'Document deleted successfully',
        });
      } else {
        // Show error message
        setDeleteStatus({
          open: true,
          success: false,
          message: response.message || 'Failed to delete document',
        });
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      setDeleteStatus({
        open: true,
        success: false,
        message: 'An error occurred while deleting the document',
      });
    } finally {
      handleDeleteDialogClose();
    }
  };

  // Handle closing the status snackbar
  const handleStatusClose = () => {
    setDeleteStatus({ ...deleteStatus, open: false });
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      // Convert FileList to Array
      const filesArray = Array.from(event.target.files);
      setSelectedFiles([...selectedFiles, ...filesArray]);
    }
  };

  // Handle removing a file from the selected files
  const handleRemoveFile = (index) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
  };

  // Handle upload button click
  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !job || !job.id) return;

    setUploading(true);
    setUploadSuccess(false);

    try {
      // Create FormData object
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('documents', file);
      });

      // Upload the files
      const response = await uploadJobDocuments(job.id, formData);

      if (response.success) {
        // Clear selected files after successful upload
        setSelectedFiles([]);
        setUploadSuccess(true);

        // Refresh the list of uploaded files
        const docsResponse = await getJobDocuments(job.id);
        if (docsResponse.success) {
          setUploadedFiles(docsResponse.data);
        }
      } else {
        console.error('Error uploading files:', response.message);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
  <Box p={2}>
      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Delete Document
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this document? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteDocument} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Status snackbars */}
      <Snackbar 
        open={deleteStatus.open} 
        autoHideDuration={6000} 
        onClose={handleStatusClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleStatusClose} 
          severity={deleteStatus.success ? 'success' : 'error'} 
          sx={{ width: '100%' }}
        >
          {deleteStatus.message}
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={goaActionStatus.open} 
        autoHideDuration={6000} 
        onClose={handleGoaActionStatusClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleGoaActionStatusClose} 
          severity={goaActionStatus.success ? 'success' : 'error'} 
          sx={{ width: '100%' }}
        >
          {goaActionStatus.message}
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={unsuccessfulActionStatus.open} 
        autoHideDuration={6000} 
        onClose={handleUnsuccessfulActionStatusClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleUnsuccessfulActionStatusClose} 
          severity={unsuccessfulActionStatus.success ? 'success' : 'error'} 
          sx={{ width: '100%' }}
        >
          {unsuccessfulActionStatus.message}
        </Alert>
      </Snackbar>
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
          
          {/* ETA/Scheduled Time Information - hide for completed or canceled jobs */}
          {job.status !== 'Completed' && job.status !== 'GOA' && job.status !== 'Canceled' && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">
                Time Information
              </Typography>
              <Typography variant="body1">
                {job.eta && job.eta.includes('Scheduled for') 
                  ? job.eta 
                  : job.eta 
                    ? `ETA: ${job.eta}` 
                    : "No ETA provided"}
              </Typography>
            </Grid>
          )}
          
          {/* Unsuccessful Status and Approval/Denial Buttons */}
          {job.approvalStatusUnsuccessful === 'pending' && job.unsuccessfulReason && (
            <Grid item xs={12} sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Unsuccessful Request Status:
                </Typography>
                <Chip 
                  label="Pending Approval"
                  color="warning"
                  size="small"
                  sx={{ ml: 1 }}
                />
                
                {/* Unsuccessful Reason */}
                {job.unsuccessfulReason && (
                  <Box sx={{ mt: 1, width: '100%' }}>
                    <Typography variant="body2" color="text.secondary">
                      Reason for Unsuccessful:
                    </Typography>
                    <Typography variant="body2">
                      {job.unsuccessfulReason}
                    </Typography>
                  </Box>
                )}
                
                {/* Approval/Denial Buttons for users with permission */}
                {canManageUnsuccessfulRequests && (
                  <Box sx={{ mt: 2, display: 'flex', gap: 2, width: '100%' }}>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircleIcon />}
                      onClick={handleApproveUnsuccessful}
                      disabled={unsuccessfulActionLoading}
                    >
                      {unsuccessfulActionLoading ? <CircularProgress size={24} /> : 'Approve Unsuccessful'}
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<CancelIcon />}
                      onClick={handleDenyUnsuccessful}
                      disabled={unsuccessfulActionLoading}
                    >
                      {unsuccessfulActionLoading ? <CircularProgress size={24} /> : 'Deny Unsuccessful'}
                    </Button>
                  </Box>
                )}
              </Box>
            </Grid>
          )}
          
          {/* Show unsuccessful approval/denial info if already decided */}
          {job.approvalStatusUnsuccessful && job.approvalStatusUnsuccessful !== 'pending' && job.unsuccessfulApprovedBy && job.unsuccessfulApprovedAt && (
            <Grid item xs={12} sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Unsuccessful Request Status:
                </Typography>
                <Chip 
                  label={job.approvalStatusUnsuccessful === 'approved' ? 'Approved' : 'Denied'}
                  color={job.approvalStatusUnsuccessful === 'approved' ? 'success' : 'error'}
                  size="small"
                  sx={{ ml: 1 }}
                />
                
                {/* Unsuccessful Reason */}
                {job.unsuccessfulReason && (
                  <Box sx={{ mt: 1, width: '100%' }}>
                    <Typography variant="body2" color="text.secondary">
                      Reason for Unsuccessful:
                    </Typography>
                    <Typography variant="body2">
                      {job.unsuccessfulReason}
                    </Typography>
                  </Box>
                )}
                
                <Box sx={{ mt: 1, width: '100%' }}>
                  <Typography variant="body2" color="text.secondary">
                    {job.approvalStatusUnsuccessful === 'approved' ? 'Approved' : 'Denied'} by: {job.unsuccessfulApprovedBy}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Date: {new Date(job.unsuccessfulApprovedAt).toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}
          
          {/* GOA Status and Approval/Denial Buttons */}
          {job.status === 'Awaiting Approval' && (
            <Grid item xs={12} sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  GOA Status:
                </Typography>
                <Chip 
                  label={job.approvalStatus === 'pending' ? 'Pending Approval' : 
                         job.approvalStatus === 'approved' ? 'Approved' : 
                         job.approvalStatus === 'denied' ? 'Denied' : 'Unknown'}
                  color={job.approvalStatus === 'pending' ? 'warning' : 
                         job.approvalStatus === 'approved' ? 'success' : 
                         job.approvalStatus === 'denied' ? 'error' : 'default'}
                  size="small"
                  sx={{ ml: 1 }}
                />
                
                {/* GOA Reason */}
                {job.goaReason && (
                  <Box sx={{ mt: 1, width: '100%' }}>
                    <Typography variant="body2" color="text.secondary">
                      Reason for GOA:
                    </Typography>
                    <Typography variant="body2">
                      {job.goaReason}
                    </Typography>
                  </Box>
                )}
                
                {/* Approval/Denial Buttons for OW, sOW, RM users */}
                {canManageGOA && job.approvalStatus === 'pending' && (
                  <Box sx={{ mt: 2, display: 'flex', gap: 2, width: '100%' }}>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircleIcon />}
                      onClick={handleApproveGOA}
                      disabled={goaActionLoading}
                    >
                      {goaActionLoading ? <CircularProgress size={24} /> : 'Approve GOA'}
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<CancelIcon />}
                      onClick={handleDenyGOA}
                      disabled={goaActionLoading}
                    >
                      {goaActionLoading ? <CircularProgress size={24} /> : 'Deny GOA'}
                    </Button>
                  </Box>
                )}
                
                {/* Show approval/denial info if already decided */}
                {job.approvalStatus !== 'pending' && job.approvedBy && job.approvedAt && (
                  <Box sx={{ mt: 1, width: '100%' }}>
                    <Typography variant="body2" color="text.secondary">
                      {job.approvalStatus === 'approved' ? 'Approved' : 'Denied'} by: {job.approvedBy}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Date: {new Date(job.approvedAt).toLocaleString()}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Grid>
          )}
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              Service Location {job.serviceLocationType ? `(${job.serviceLocationType})` : ''}
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
                Dropoff Location {job.dropoffLocationType ? `(${job.dropoffLocationType})` : ''}
              </Typography>
              <Typography variant="body1" gutterBottom>
                {job.dropoffLocation && typeof job.dropoffLocation === 'object' 
                  ? `${job.dropoffLocation.street}, ${job.dropoffLocation.city}, ${job.dropoffLocation.state} ${job.dropoffLocation.zip}` 
                  : job.dropoffLocation}
              </Typography>
            </Grid>
          )}
          
          {/* Vehicle details section */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              Vehicle Details
            </Typography>
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Year:
            </Typography>
            <Typography variant="body1">
              {job.vehicle?.year || "N/A"}
            </Typography>
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Make:
            </Typography>
            <Typography variant="body1">
              {job.vehicle?.make || "N/A"}
            </Typography>
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Model:
            </Typography>
            <Typography variant="body1">
              {job.vehicle?.model || "N/A"}
            </Typography>
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Color:
            </Typography>
            <Typography variant="body1">
              {job.vehicle?.color || "N/A"}
            </Typography>
          </Grid>
          
          {job.vehicle?.license && (
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                License Plate:
              </Typography>
              <Typography variant="body1">
                {job.vehicle.license}
              </Typography>
            </Grid>
          )}
          
          {job.vehicle?.vin && (
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                VIN:
              </Typography>
              <Typography variant="body1">
                {job.vehicle.vin}
              </Typography>
            </Grid>
          )}
          
          {/* Driver section */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
              Driver Information
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            {job.driver ? (
              <Typography variant="body1">
                {job.driver} {job.truck ? `(${job.truck})` : ''}
              </Typography>
            ) : job.status === 'Pending' && job.rejectedBy && job.rejectedBy.length > 0 && 
                job.rejectedBy[job.rejectedBy.length - 1].reason.includes('Auto-expired') ? (
              <Box>
                <Typography variant="body2" color="error.main">
                  Acceptance expired by: {job.rejectedBy[job.rejectedBy.length - 1].driverName}
                </Typography>
                {/* Only show Reassign button to managing users */}
                {currentUser && (currentUser.primaryRole === 'OW' || 
                                 currentUser.primaryRole === 'sOW' || 
                                 currentUser.primaryRole === 'RM' || 
                                 (Array.isArray(currentUser.secondaryRoles) && 
                                  currentUser.secondaryRoles.includes('dispatcher'))) && (
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    sx={{ mt: 1 }}
                    onClick={() => {
                      // Emit a custom event that the parent component can listen for
                      if (typeof window !== 'undefined') {
                        const event = new CustomEvent('dispatchJob', { detail: { jobId: job.id } });
                        window.dispatchEvent(event);
                      }
                    }}
                  >
                    Reassign
                  </Button>
                )}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No driver assigned
              </Typography>
            )}
          </Grid>
          
          {/* Customer details section */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
              Customer Details
            </Typography>
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Name:
            </Typography>
            <Typography variant="body1">
              {job.customerName || "N/A"}
            </Typography>
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Phone:
            </Typography>
            <Typography variant="body1">
              {job.customerPhone || "N/A"}
            </Typography>
          </Grid>
          
          {job.customerEmail && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Email:
              </Typography>
              <Typography variant="body1">
                {job.customerEmail}
              </Typography>
            </Grid>
          )}
          
          {/* Caller information section */}
          {(job.callerName || job.callerPhone) && (
            <>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                  Caller Information
                </Typography>
              </Grid>
              
              {job.callerName && (
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Caller Name:
                  </Typography>
                  <Typography variant="body1">
                    {job.callerName}
                  </Typography>
                </Grid>
              )}
              
              {job.callerPhone && (
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Caller Phone:
                  </Typography>
                  <Typography variant="body1">
                    {job.callerPhone}
                  </Typography>
                </Grid>
              )}
            </>
          )}
          
          {/* Notes section */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
              Notes
            </Typography>
            
            {/* Internal Notes - visible to all users */}
            {job.internalNotes && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Internal Notes:
                </Typography>
                <Typography variant="body1">
                  {job.internalNotes}
                </Typography>
              </Box>
            )}
            
            {/* Dispatcher Notes - not visible to drivers */}
            {job.dispatcherNotes && !isDriver && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Dispatcher Notes:
                </Typography>
                <Typography variant="body1">
                  {job.dispatcherNotes}
                </Typography>
              </Box>
            )}
            
            {/* Invoice Notes - not visible to drivers */}
            {job.invoiceNotes && !isDriver && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Invoice Notes:
                </Typography>
                <Typography variant="body1">
                  {job.invoiceNotes}
                </Typography>
              </Box>
            )}
            
            {/* Legacy notes field - for backward compatibility */}
            {job.notes && !job.internalNotes && !job.dispatcherNotes && !job.invoiceNotes && (
              <Typography variant="body1">
                {job.notes}
              </Typography>
            )}
            
            {/* Show message if no notes are available */}
            {!job.notes && !job.internalNotes && !job.dispatcherNotes && !job.invoiceNotes && (
              <Typography variant="body1">
                No notes available
              </Typography>
            )}
          </Grid>
          
          {/* Documents upload section */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 3 }}>
              Documents/Photos
            </Typography>
            
            {/* Upload section */}
            <Box sx={{ mt: 1, mb: 2 }}>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
              
              <Button 
                variant="outlined" 
                startIcon={<FileUploadIcon />}
                onClick={() => fileInputRef.current.click()}
                sx={{ mb: 1 }}
              >
                Select Files
              </Button>
              
              {/* Selected files list */}
              {selectedFiles.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <List dense>
                    {selectedFiles.map((file, index) => (
                      <ListItem key={index}>
                        <InsertDriveFileIcon sx={{ mr: 1 }} />
                        <ListItemText 
                          primary={file.name} 
                          secondary={`${(file.size / 1024).toFixed(1)} KB`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton 
                            edge="end" 
                            aria-label="delete" 
                            onClick={() => handleRemoveFile(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                  
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<FileUploadIcon />}
                    onClick={handleUpload}
                    disabled={uploading}
                    sx={{ mt: 1 }}
                  >
                    {uploading ? <CircularProgress size={24} /> : 'Upload Files'}
                  </Button>
                  
                  {uploadSuccess && (
                    <Typography color="success.main" sx={{ mt: 1 }}>
                      Files uploaded successfully!
                    </Typography>
                  )}
                </Box>
              )}
              
              {/* Image preview section - displays uploaded image files horizontally */}
              <ImagePreviewSection job={job} uploadedFiles={uploadedFiles} />

              {/* Divider between sections */}
              {uploadedFiles.length > 0 && (
                <Divider sx={{ my: 2 }} />
              )}
              
              {/* Existing files section */}
              {uploadedFiles.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Uploaded Documents
                  </Typography>
                  <List dense>
                    {uploadedFiles.map((doc, index) => (
                      <ListItem key={index}>
                        <InsertDriveFileIcon sx={{ mr: 1 }} />
                        <ListItemText 
                          primary={
                            <Link 
                              href={getJobDocumentDownloadUrl(job.id, doc.filename)} 
                              download
                              target="_blank"
                              rel="noopener"
                            >
                              {doc.filename.split('-')[0]} {/* Show filename without timestamp */}
                            </Link>
                          }
                          secondary={new Date(doc.uploadedAt).toLocaleString()}
                        />
                        {canDeleteDocuments && (
                          <ListItemSecondaryAction>
                            <IconButton 
                              edge="end" 
                              aria-label="delete" 
                              onClick={() => handleDeleteClick(doc)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        )}
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
  </Box>
  );
};

// Individual image component to handle each image's lifecycle
const JobImage = ({ job, doc }) => {
  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState(null);
  const [error, setError] = useState(false);
  
  // Use a ref to store the object URL for cleanup
  const objectUrlRef = useRef(null);
  
  // Fetch the image when the component mounts
  useEffect(() => {
    let isMounted = true;
    
    const fetchImage = async () => {
      try {
        // Fetch the image data
        const blob = await getJobDocumentAsDataUrl(job.id, doc.filename);
        
        // Only update state if the component is still mounted
        if (isMounted) {
          if (blob) {
            // Store the object URL in the ref for later cleanup
            objectUrlRef.current = blob;
            setImageUrl(blob);
            setError(false);
          } else {
            setError(true);
          }
        }
      } catch (error) {
        console.error(`Error fetching image ${doc.filename}:`, error);
        if (isMounted) {
          setError(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchImage();
    
    // Cleanup function to revoke the object URL when the component unmounts
    return () => {
      isMounted = false;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [job.id, doc.filename]);
  
  // Render the image, loading spinner, or error message
  if (loading) {
    return <CircularProgress size={24} />;
  } else if (imageUrl) {
    return (
      <Link 
        href={getJobDocumentDownloadUrl(job.id, doc.filename)} 
        target="_blank"
        rel="noopener"
      >
        <img 
          src={imageUrl}
          alt={doc.filename.split('-')[0]}
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover'
          }}
        />
      </Link>
    );
  } else {
    return (
      <Typography variant="body2" color="text.secondary">
        Failed to load image
      </Typography>
    );
  }
};

// Separate component for image previews
const ImagePreviewSection = ({ job, uploadedFiles }) => {
  // Only show this section if there are image files
  const imageFiles = uploadedFiles.filter(doc => doc.filename.match(/\.(jpg|jpeg|png|gif|webp)$/i));
  if (imageFiles.length === 0) return null;

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
        Image Previews
      </Typography>
      <Box 
        sx={{ 
          display: 'flex', 
          overflowX: 'auto', 
          pb: 1,
          '&::-webkit-scrollbar': {
            height: 8,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: 4,
          }
        }}
      >
        {imageFiles.map((doc, index) => (
          <Box 
            key={index} 
            sx={{ 
              minWidth: 150, 
              height: 150, 
              mr: 1, 
              position: 'relative',
              borderRadius: 1,
              overflow: 'hidden',
              boxShadow: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0,0,0,0.05)'
            }}
          >
            <JobImage job={job} doc={doc} />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

const JobDetails = ({ job, currentUser }) => {
  const [activeTab, setActiveTab] = useState(0);

  if (!job) return null;

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box margin={2} sx={{ boxShadow: 1, borderRadius: 1, overflow: 'hidden' }}>
      {/* Layout with map on left and tab content on right */}
      <Grid container spacing={2}>
        {/* Map column - always visible */}
        <Grid item xs={12} md={6}>
          <MapComponent />
        </Grid>
        
        {/* Tab content column */}
        <Grid item xs={12} md={6}>
          {/* Tabs navigation */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange} 
              aria-label="job details tabs"
              variant="fullWidth"
            >
              <Tab label="Details" id="tab-0" aria-controls="tabpanel-0" />
              <Tab label="History" id="tab-1" aria-controls="tabpanel-1" />
              <Tab label="Invoice" id="tab-2" aria-controls="tabpanel-2" />
            </Tabs>
          </Box>
          
          {/* Tab content panels */}
          <Box>
            <Box role="tabpanel" 
                hidden={activeTab !== 0} 
                id="tabpanel-0" 
                aria-labelledby="tab-0"
            >
              {activeTab === 0 && <DetailsTabContent job={job} currentUser={currentUser} />}
            </Box>
            
            <Box role="tabpanel" 
                hidden={activeTab !== 1} 
                id="tabpanel-1" 
                aria-labelledby="tab-1"
            >
              {activeTab === 1 && <JobHistory job={job} />}
            </Box>
            
            <Box role="tabpanel" 
                hidden={activeTab !== 2} 
                id="tabpanel-2" 
                aria-labelledby="tab-2"
            >
              {activeTab === 2 && <JobInvoice job={job} />}
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default JobDetails;
