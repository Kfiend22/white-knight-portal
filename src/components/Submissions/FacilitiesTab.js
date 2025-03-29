import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import ScheduleInput from '../ScheduleInput'; // Import the new component

function FacilitiesTab({ application, onUpdate }) {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [facilityToDelete, setFacilityToDelete] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    facilityName: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    coveredZipCodes: [],
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    // operationalHours: '' // Removed
    schedule: {}, // Add schedule to initial form state
    open247: false // Add open247 state
  });

  // Get auth headers
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };
  
  // Fetch facilities from the API
  const fetchFacilities = useCallback(async () => {
    if (!application || !application._id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/v1/applications/${application._id}/facilities`, {
        headers: getAuthHeader()
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch facilities: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data && data.length === 0) {
        // No facilities exist, pre-populate the form with primary application data
        setFormData({
          facilityName: application.companyName || '', // Use company name as default facility name
          address1: application.facilityAddress1 || '',
          address2: application.facilityAddress2 || '',
          city: application.facilityCity || '',
          state: application.facilityState || '',
          zip: application.facilityZip || '',
          coveredZipCodes: application.territories?.zipCodes || [], // Use main territory zips
      contactName: `${application.ownerFirstName || ''} ${application.ownerLastName || ''}`.trim(), // Default contact
      contactPhone: application.phoneNumber || '',
      contactEmail: application.email || '',
      // operationalHours: application.services?.hoursOfOperation || '' // Removed
      schedule: application.services?.schedule || {}, // Pre-populate schedule from main app services if no facilities
      open247: application.services?.open247 || false // Pre-populate open247
    });
    setIsAdding(true); // Set to adding mode to show the form ready for saving
    setSelectedFacility(null); // Ensure no facility is marked as selected
        setFacilities([]); // Ensure the list is empty
      } else {
        // Facilities exist, load them normally
        setFacilities(data);
        // Optionally select the first facility by default if needed
        // if (data && data.length > 0) {
        //   handleSelectFacility(data[0]);
        // }
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch facilities');
      console.error('Error fetching facilities:', err);
    } finally {
      setLoading(false);
    }
  }, [application]);
  
  // Fetch facilities when component mounts or application changes
  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'coveredZipCodes') {
      // Convert comma-separated string to array
      setFormData({
        ...formData,
        [name]: value.split(',').map(zip => zip.trim()).filter(zip => zip !== '')
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  // Handle selecting a facility for viewing/editing
  const handleSelectFacility = (facility) => {
    setSelectedFacility(facility);
    setFormData({
      facilityName: facility.facilityName || '',
      address1: facility.address1 || '',
      address2: facility.address2 || '',
      city: facility.city || '',
      state: facility.state || '',
      zip: facility.zip || '',
      coveredZipCodes: facility.coveredZipCodes || [],
      contactName: facility.contactName || '',
      contactPhone: facility.contactPhone || '',
      contactEmail: facility.contactEmail || '',
      // operationalHours: facility.operationalHours || '' // Removed
      schedule: facility.schedule || {} // Load facility's schedule
    });
    setIsEditing(false);
    setIsAdding(false);
  };
  
  // Handle adding a new facility
  const handleAddFacility = () => {
    setSelectedFacility(null);
    setFormData({
      facilityName: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      zip: '',
      coveredZipCodes: [],
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      // operationalHours: '' // Removed
      schedule: {}, // Start with empty schedule for new facility
      open247: false // Reset open247 for new facility
    });
    setIsEditing(false);
    setIsAdding(true);
  };
  
  // Handle editing a facility
  const handleEditFacility = () => {
    setIsEditing(true);
  };
  
  // Handle canceling edit/add
  const handleCancelEdit = () => {
    if (isAdding) {
      setIsAdding(false);
      setSelectedFacility(null);
    } else if (isEditing && selectedFacility) {
      setIsEditing(false);
      // Reset form data to selected facility
      setFormData({
        facilityName: selectedFacility.facilityName || '',
        address1: selectedFacility.address1 || '',
        address2: selectedFacility.address2 || '',
        city: selectedFacility.city || '',
        state: selectedFacility.state || '',
        zip: selectedFacility.zip || '',
        coveredZipCodes: selectedFacility.coveredZipCodes || [],
      contactName: selectedFacility.contactName || '',
      contactPhone: selectedFacility.contactPhone || '',
      contactEmail: selectedFacility.contactEmail || '',
      // operationalHours: selectedFacility.operationalHours || '' // Removed
      schedule: selectedFacility.schedule || {}, // Reset to selected facility's schedule
      open247: selectedFacility.open247 || false // Reset open247
    });
  }
};
  
  // Handle saving a facility (add or edit)
  const handleSaveFacility = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      let response;
      
      if (isAdding) {
        // Add new facility
        response = await fetch(`/api/v1/applications/${application._id}/facilities`, {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify(formData)
        });
      } else if (isEditing && selectedFacility) {
        // Update existing facility
        response = await fetch(`/api/v1/facilities/${selectedFacility._id}`, {
          method: 'PUT',
          headers: getAuthHeader(),
          body: JSON.stringify(formData)
        });
      } else {
        throw new Error('Invalid operation');
      }
      
      if (!response.ok) {
        throw new Error(`Failed to ${isAdding ? 'add' : 'update'} facility: ${response.statusText}`);
      }
      
      const updatedFacility = await response.json();
      
      if (isAdding) {
        setFacilities([...facilities, updatedFacility]);
        setSuccess('Facility added successfully');
        setIsAdding(false);
        setSelectedFacility(updatedFacility);
      } else {
        setFacilities(facilities.map(f => 
          f._id === updatedFacility._id ? updatedFacility : f
        ));
        setSuccess('Facility updated successfully');
        setIsEditing(false);
        setSelectedFacility(updatedFacility);
      }
      
      // Call the onUpdate callback to refresh the parent component
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      setError(err.message || `Failed to ${isAdding ? 'add' : 'update'} facility`);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle opening delete confirmation dialog
  const handleDeleteClick = (facility) => {
    setFacilityToDelete(facility);
    setDeleteDialogOpen(true);
  };
  
  // Handle closing delete confirmation dialog
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setFacilityToDelete(null);
  };
  
  // Handle confirming facility deletion
  const handleConfirmDelete = async () => {
    if (!facilityToDelete) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Correct the URL to include the application ID
      const response = await fetch(`/api/v1/applications/${application._id}/facilities/${facilityToDelete._id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete facility: ${response.statusText}`);
      }
      
      // Remove the deleted facility from the list
      setFacilities(facilities.filter(f => f._id !== facilityToDelete._id));
      
      // If the deleted facility was selected, clear the selection
      if (selectedFacility && selectedFacility._id === facilityToDelete._id) {
        setSelectedFacility(null);
        setIsEditing(false);
      }
      
      setSuccess('Facility deleted successfully');
      
      // Call the onUpdate callback to refresh the parent component
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      setError(err.message || 'Failed to delete facility');
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setFacilityToDelete(null);
    }
  };
  
  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={3}>
        {/* Left Panel - Facility List */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%', minHeight: 400, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Facilities
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddFacility}
                disabled={loading}
              >
                Add Facility
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}
            
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <CircularProgress />
              </Box>
            )}
            
            {facilities.length > 0 ? (
              <List sx={{ flexGrow: 1, overflow: 'auto' }}>
                {facilities.map((facility) => (
                  <ListItem
                    key={facility._id}
                    // removed button prop to fix React warning
                    selected={selectedFacility && selectedFacility._id === facility._id}
                    onClick={() => handleSelectFacility(facility)}
                    sx={{ cursor: 'pointer' }} // Add cursor pointer for better UX since 'button' is removed
                  >
                    <ListItemText
                      primary={facility.facilityName}
                      secondary={`${facility.city}, ${facility.state}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDeleteClick(facility)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="textSecondary">
                  No facilities found. Click "Add Facility" to create one.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Right Panel - Facility Form */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                {isAdding ? 'Add New Facility' : 
                 isEditing ? 'Edit Facility' : 
                 selectedFacility ? 'Facility Details' : 'Select or Add a Facility'}
              </Typography>
              
              {selectedFacility && !isEditing && !isAdding && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={handleEditFacility}
                >
                  Edit
                </Button>
              )}
              
              {(isEditing || isAdding) && (
                <Box>
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<CancelIcon />}
                    onClick={handleCancelEdit}
                    sx={{ mr: 1 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveFacility}
                    disabled={loading}
                  >
                    Save
                  </Button>
                </Box>
              )}
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {(selectedFacility || isAdding) ? (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Facility Name"
                    name="facilityName"
                    value={formData.facilityName}
                    onChange={handleInputChange}
                    disabled={!isEditing && !isAdding}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address Line 1"
                    name="address1"
                    value={formData.address1}
                    onChange={handleInputChange}
                    disabled={!isEditing && !isAdding}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address Line 2"
                    name="address2"
                    value={formData.address2}
                    onChange={handleInputChange}
                    disabled={!isEditing && !isAdding}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="City"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    disabled={!isEditing && !isAdding}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="State"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    disabled={!isEditing && !isAdding}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="ZIP Code"
                    name="zip"
                    value={formData.zip}
                    onChange={handleInputChange}
                    disabled={!isEditing && !isAdding}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Covered ZIP Codes (comma-separated)"
                    name="coveredZipCodes"
                    value={formData.coveredZipCodes.join(', ')}
                    onChange={handleInputChange}
                    disabled={!isEditing && !isAdding}
                    helperText="Enter ZIP codes separated by commas"
                  />
                  
                  {!isEditing && !isAdding && formData.coveredZipCodes.length > 0 && (
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {formData.coveredZipCodes.map((zip, index) => (
                        <Chip key={index} label={zip} size="small" />
                      ))}
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                    Contact Information
                  </Typography>
                  <Divider />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Contact Name"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleInputChange}
                    disabled={!isEditing && !isAdding}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Contact Phone"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                    disabled={!isEditing && !isAdding}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Contact Email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    disabled={!isEditing && !isAdding}
                  />
                </Grid>
                {/* Replace Operational Hours TextField with ScheduleInput */}
                <Grid item xs={12}>
                   <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                     Operational Hours & Schedule
                   </Typography>
                   <Divider sx={{ mb: 2 }}/>
                   <ScheduleInput
                     // Pass flattened structure including open247
                     scheduleData={{ 
                       open247: formData.open247 || false, 
                       ...(formData.schedule || {}) 
                     }}
                     onChange={(fieldPath, value) => {
                       // Handle 'open247' and 'schedule.*' paths correctly
                       setFormData(prev => {
                         if (fieldPath === 'open247') {
                           // Update open247 at the top level
                           return { ...prev, open247: value };
                         } else if (fieldPath.startsWith('schedule.')) {
                           // Update nested schedule object, removing the prefix
                           const actualPath = fieldPath.substring('schedule.'.length);
                           const keys = actualPath.split('.');
                           let currentSchedule = { ...(prev.schedule || {}) }; // Start with schedule
                           let tempRef = currentSchedule;

                           for (let i = 0; i < keys.length - 1; i++) {
                             const key = keys[i];
                             // Ensure nested objects exist
                             if (!tempRef[key] || typeof tempRef[key] !== 'object') {
                               tempRef[key] = {};
                             }
                             // Create a new object for the next level to avoid direct mutation
                             tempRef[key] = { ...tempRef[key] }; 
                             tempRef = tempRef[key];
                           }
                           tempRef[keys[keys.length - 1]] = value;
                           
                           // Return updated formData with the modified schedule
                           return { ...prev, schedule: currentSchedule };
                         }
                         // If path is neither, return previous state (shouldn't happen)
                         return prev; 
                       });
                     }}
                     disabled={!isEditing && !isAdding}
                   />
                 </Grid>
              </Grid>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
                <Typography color="textSecondary">
                  Select a facility from the list or add a new one to view details.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the facility "{facilityToDelete?.facilityName}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default FacilitiesTab;
