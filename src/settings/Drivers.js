// Drivers.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Typography,
  Box,
  Paper,
  Divider,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Switch,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  FormGroup,
  InputAdornment
} from '@mui/material';
import {
  Edit as EditIcon,
  Phone as PhoneIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';

function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [openOnDutyConfirmDialog, setOpenOnDutyConfirmDialog] = useState(false);
  const [pendingOnDutyChange, setPendingOnDutyChange] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [changePassword, setChangePassword] = useState(false);

  // Helper function to get auth headers
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  // Fetch users from the backend and filter to only show drivers
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try primary API path first
        let response;
        try {
          response = await axios.get('/api/v1/users', {
            headers: getAuthHeader()
          });
        } catch (primaryError) {
          console.error('Error fetching users with primary API path:', primaryError);
          
          // Try alternative API path
          response = await axios.get('/api/users', {
            headers: getAuthHeader()
          });
        }
        
        const allUsers = response.data;
        
        // Filter to only include users with driver secondary role
        const driversOnly = allUsers.filter(user => 
          (user.secondaryRoles?.driver === true) || 
          (user.isDriver === true)
        );
        
        setDrivers(driversOnly);
        setFilteredDrivers(driversOnly);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching drivers:', error);
        setError('Error fetching drivers. Please try again.');
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Toggle on-duty status
  const handleToggleOnDuty = (driverId) => {
    console.log(`Preparing to toggle on-duty status for user with ID ${driverId}`);
    
    // Find the user by either id or _id
    const driver = drivers.find(u => u.id === driverId || u._id === driverId);
    if (!driver) {
      console.error(`Driver with ID ${driverId} not found`);
      return;
    }

    console.log(`Found driver:`, driver);

    // Store the pending on-duty change and show confirmation dialog
    setPendingOnDutyChange({
      driverId,
      driver,
      newValue: !driver.isOnDuty
    });
    setOpenOnDutyConfirmDialog(true);
  };

  // Function to confirm and apply on-duty change
  const confirmOnDutyChange = async () => {
    if (!pendingOnDutyChange) return;
    
    const { driverId, driver, newValue } = pendingOnDutyChange;
    
    try {
      setLoading(true);
      
      // Use _id if available, otherwise use id
      const effectiveUserId = driver._id || driverId;
      console.log(`Using effective user ID for toggle on-duty: ${effectiveUserId}`);
      
      // Try primary API path first
      try {
        console.log(`Sending PUT request to /api/v1/users/${effectiveUserId}/toggle-on-duty`);
        await axios.put(`/api/v1/users/${effectiveUserId}/toggle-on-duty`, {}, {
          headers: getAuthHeader()
        });
      } catch (primaryError) {
        console.error('Error toggling on-duty status with primary API path:', primaryError);
        
        // Try alternative API path
        console.log(`Trying alternative API path: /api/users/${effectiveUserId}/toggle-on-duty`);
        await axios.put(`/api/users/${effectiveUserId}/toggle-on-duty`, {}, {
          headers: getAuthHeader()
        });
      }
      
      // Update local state for immediate UI feedback
      const updatedDrivers = drivers.map((u) =>
        (u.id === driverId || u._id === driverId) ? { ...u, isOnDuty: newValue } : u
      );
      setDrivers(updatedDrivers);
      setFilteredDrivers(updatedDrivers);
      
      // Show success message
      setError({ message: `Driver ${newValue ? 'set to On-Duty' : 'set to Off-Duty'} successfully`, severity: 'success' });
      setTimeout(() => setError(null), 3000); // Clear success message after 3 seconds
      
      setLoading(false);
    } catch (error) {
      console.error('Error toggling on-duty status:', error);
      
      let errorMessage = 'Failed to update driver status. Please try again.';
      
      if (error.response) {
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      setError(errorMessage);
      setLoading(false);
    }
    
    // Close the dialog
    setOpenOnDutyConfirmDialog(false);
    setPendingOnDutyChange(null);
  };

  // Function to cancel on-duty change
  const cancelOnDutyChange = () => {
    setOpenOnDutyConfirmDialog(false);
    setPendingOnDutyChange(null);
  };

  // Effect to load vehicles from localStorage
  useEffect(() => {
    try {
      const cachedVehicles = localStorage.getItem('fleetVehicles');
      if (cachedVehicles) {
        const parsedVehicles = JSON.parse(cachedVehicles);
        console.log('Drivers - Loaded vehicles from localStorage:', parsedVehicles.length);
        setVehicles(parsedVehicles);
      } else {
        // Fetch from API if not in localStorage
        fetchVehicles();
      }
    } catch (error) {
      console.error('Error loading vehicles from localStorage:', error);
      fetchVehicles();
    }
  }, []);

  // Fetch vehicles from API
  const fetchVehicles = async () => {
    try {
      const response = await axios.get('/api/settings', {
        headers: getAuthHeader()
      });
      
      if (response.data && response.data.vehicles) {
        console.log('Drivers - Fetched vehicles from API:', response.data.vehicles.length);
        setVehicles(response.data.vehicles);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  // Handle opening the edit dialog
  const handleEditDriver = (driver) => {
    setEditingDriver({
      ...driver,
      // Initialize notification preferences if they don't exist
      notifyOnJobAssignment: driver.notifyOnJobAssignment || false,
      notifyOnStatusChange: driver.notifyOnStatusChange || false,
      statusChangeNotificationTypes: driver.statusChangeNotificationTypes || [],
      password: '', // Reset password field for security
      assignedVehicle: driver.assignedVehicle || '',
    });
    setChangePassword(false);
    setShowPassword(false);
    setOpenEditDialog(true);
  };

  // Handle driver form field changes
  const handleDriverFormChange = (field, value) => {
    setEditingDriver(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle address field changes
  const handleAddressChange = (field, value) => {
    setEditingDriver(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
  };

  // Handle notification type checkbox changes
  const handleNotificationTypeChange = (type, checked) => {
    setEditingDriver(prev => {
      // Initialize the array if it doesn't exist
      const currentTypes = prev.statusChangeNotificationTypes || [];
      
      if (checked) {
        // Add the type if it's not already in the array
        return {
          ...prev,
          statusChangeNotificationTypes: [...new Set([...currentTypes, type])]
        };
      } else {
        // Remove the type
        return {
          ...prev,
          statusChangeNotificationTypes: currentTypes.filter(t => t !== type)
        };
      }
    });
  };

  // Save driver changes
  const handleSaveDriver = async () => {
    if (!editingDriver) return;
    
    setSaveLoading(true);
    
    try {
      const effectiveUserId = editingDriver._id || editingDriver.id;
      const userData = {
        username: editingDriver.username,
        address: editingDriver.address,
        notifyOnJobAssignment: editingDriver.notifyOnJobAssignment,
        notifyOnStatusChange: editingDriver.notifyOnStatusChange,
        statusChangeNotificationTypes: editingDriver.statusChangeNotificationTypes,
        assignedVehicle: editingDriver.assignedVehicle,
        isActive: editingDriver.isActive
      };
      
      // Only include password if we're changing it
      if (changePassword && editingDriver.password) {
        userData.password = editingDriver.password;
      }
      
      console.log(`Updating driver ${effectiveUserId}:`, userData);
      
      // Send the update
      let response;
      try {
        response = await axios.put(`/api/users/${effectiveUserId}`, userData, {
          headers: getAuthHeader()
        });
      } catch (primaryError) {
        console.error('Error updating user with primary API path:', primaryError);
        
        // Try alternative API path
        response = await axios.put(`/api/v1/users/${effectiveUserId}`, userData, {
          headers: getAuthHeader()
        });
      }
      
      // Update the local state
      const updatedDrivers = drivers.map(driver => 
        (driver.id === effectiveUserId || driver._id === effectiveUserId)
          ? { ...driver, ...userData }
          : driver
      );
      
      setDrivers(updatedDrivers);
      setFilteredDrivers(updatedDrivers);
      
      // Show success message
      setError({ message: 'Driver updated successfully', severity: 'success' });
      setTimeout(() => setError(null), 3000);
      
      // Close the dialog
      setOpenEditDialog(false);
    } catch (error) {
      console.error('Error updating driver:', error);
      
      let errorMessage = 'Failed to update driver. Please try again.';
      
      if (error.response) {
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setSaveLoading(false);
    }
  };

  // Handle toggling active status
  const handleToggleActive = async () => {
    if (!editingDriver) return;
    
    setEditingDriver(prev => ({
      ...prev,
      isActive: !prev.isActive
    }));
  };

  // Handle calling a driver
  const handleCallDriver = (phoneNumber) => {
    if (phoneNumber) {
      window.location.href = `tel:${phoneNumber}`;
    }
  };

  return (
    <Box mt={2}>
      <Paper elevation={3} sx={{ padding: 2 }}>
        <Typography variant="h6">Drivers</Typography>
        <Divider sx={{ my: 2 }} />

        {error && (
          <Typography 
            color={error.severity === 'success' ? 'success.main' : 'error.main'} 
            variant="body2"
            sx={{ mb: 2 }}
          >
            {typeof error === 'string' ? error : error.message}
          </Typography>
        )}

        {/* Drivers Table Display */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {filteredDrivers.length === 0 ? (
              <Typography variant="body1" sx={{ textAlign: 'center', my: 4 }}>
                No drivers found.
              </Typography>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Primary Role</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>On Duty</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* Active Drivers Section */}
                    {filteredDrivers
                      .filter(driver => driver.isActive !== false)
                      .map((driver) => (
                        <TableRow key={driver.id || driver._id}>
                          <TableCell>{`${driver.firstName || driver.ownerFirstName || ''} ${driver.lastName || driver.ownerLastName || ''}`}</TableCell>
                          <TableCell>{driver.phone}</TableCell>
                          <TableCell>{driver.email}</TableCell>
                          <TableCell>{driver.primaryRole || driver.role}</TableCell>
                          <TableCell>
                            <Box sx={{
                              backgroundColor: driver.isActive !== false ? 'success.light' : 'error.light',
                              borderRadius: 1,
                              px: 1,
                              py: 0.5,
                              display: 'inline-block',
                              color: '#fff'
                            }}>
                              {driver.isActive !== false ? 'Active' : 'Inactive'}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={driver.isOnDuty || false}
                              onChange={() => handleToggleOnDuty(driver.id || driver._id)}
                              disabled={loading}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              edge="end"
                              aria-label="edit"
                              onClick={() => handleEditDriver(driver)}
                              color="primary"
                              sx={{ mr: 1 }}
                            >
                              <EditIcon />
                            </IconButton>
                            {driver.phone && (
                              <IconButton
                                edge="end"
                                aria-label="call"
                                onClick={() => handleCallDriver(driver.phone)}
                                color="primary"
                              >
                                <PhoneIcon />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    
                    {/* Separator for Inactive Drivers */}
                    {filteredDrivers.some(driver => driver.isActive === false) && (
                      <TableRow>
                        <TableCell colSpan={7} sx={{ py: 2 }}>
                          <Typography variant="h6" color="textSecondary" align="center">
                            Inactive Drivers
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                      
                    {/* Inactive Drivers Section */}
                    {filteredDrivers
                      .filter(driver => driver.isActive === false)
                      .map((driver) => (
                        <TableRow 
                          key={driver.id || driver._id}
                          sx={{ backgroundColor: '#f5f5f5' }}
                        >
                          <TableCell>{`${driver.firstName || driver.ownerFirstName || ''} ${driver.lastName || driver.ownerLastName || ''}`}</TableCell>
                          <TableCell>{driver.phone}</TableCell>
                          <TableCell>{driver.email}</TableCell>
                          <TableCell>{driver.primaryRole || driver.role}</TableCell>
                          <TableCell>
                            <Box sx={{
                              backgroundColor: 'error.light',
                              borderRadius: 1,
                              px: 1,
                              py: 0.5,
                              display: 'inline-block',
                              color: '#fff'
                            }}>
                              Inactive
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={driver.isOnDuty || false}
                              disabled={true}
                            />
                          </TableCell>
                          <TableCell align="right">
                            {driver.phone && (
                              <IconButton
                                edge="end"
                                aria-label="call"
                                onClick={() => handleCallDriver(driver.phone)}
                                color="primary"
                              >
                                <PhoneIcon />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </Paper>

      {/* On-Duty Confirmation Dialog */}
      <Dialog
        open={openOnDutyConfirmDialog}
        onClose={cancelOnDutyChange}
      >
        <DialogTitle>Confirm On-Duty Status Change</DialogTitle>
        <DialogContent>
          {pendingOnDutyChange && (
            <Typography>
              Are you sure you want to set {pendingOnDutyChange.driver.firstName || pendingOnDutyChange.driver.ownerFirstName} {pendingOnDutyChange.driver.lastName || pendingOnDutyChange.driver.ownerLastName} 
              as {pendingOnDutyChange.newValue ? 'On-Duty' : 'Off-Duty'}?
              {pendingOnDutyChange.newValue && (
                <Typography sx={{ mt: 1 }}>
                  This driver will now be available for job assignments.
                </Typography>
              )}
              {!pendingOnDutyChange.newValue && (
                <Typography sx={{ mt: 1 }}>
                  This driver will no longer be available for job assignments.
                </Typography>
              )}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelOnDutyChange}>Cancel</Button>
          <Button onClick={confirmOnDutyChange} color="primary" variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Driver Edit Dialog */}
      <Dialog 
        open={openEditDialog} 
        onClose={() => setOpenEditDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Edit Driver Profile
          {editingDriver && (
            <Typography variant="caption" display="block" color="text.secondary">
              {editingDriver.firstName} {editingDriver.lastName}
            </Typography>
          )}
        </DialogTitle>

        <DialogContent>
          {editingDriver && (
            <Box component="form" noValidate autoComplete="off" sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                {/* Account Information Section */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Account Information
                  </Typography>
                </Grid>

                {/* Username */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Username"
                    value={editingDriver.username || ''}
                    onChange={(e) => handleDriverFormChange('username', e.target.value)}
                  />
                </Grid>

                {/* Password Section */}
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={changePassword}
                        onChange={(e) => setChangePassword(e.target.checked)}
                      />
                    }
                    label="Change Password"
                  />
                </Grid>

                {changePassword && (
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type={showPassword ? 'text' : 'password'}
                      label="New Password"
                      value={editingDriver.password || ''}
                      onChange={(e) => handleDriverFormChange('password', e.target.value)}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>
                )}

                {/* Assigned Vehicle */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mt: 2 }}>
                    Assigned Vehicle
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel id="vehicle-select-label">Assigned Vehicle</InputLabel>
                    <Select
                      labelId="vehicle-select-label"
                      value={editingDriver.assignedVehicle || ''}
                      onChange={(e) => handleDriverFormChange('assignedVehicle', e.target.value)}
                      label="Assigned Vehicle"
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {vehicles.map((vehicle, index) => (
                        <MenuItem key={vehicle.id || `vehicle-${index}`} value={vehicle.name || vehicle.id}>
                          {vehicle.name} {vehicle.type ? `(${vehicle.type})` : ''}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Address Section */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mt: 2 }}>
                    Address
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Street"
                    value={(editingDriver.address && editingDriver.address.street1) || ''}
                    onChange={(e) => handleAddressChange('street1', e.target.value)}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="City"
                    value={(editingDriver.address && editingDriver.address.city) || ''}
                    onChange={(e) => handleAddressChange('city', e.target.value)}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="State"
                    value={(editingDriver.address && editingDriver.address.state) || ''}
                    onChange={(e) => handleAddressChange('state', e.target.value)}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Zip Code"
                    value={(editingDriver.address && editingDriver.address.zip) || ''}
                    onChange={(e) => handleAddressChange('zip', e.target.value)}
                  />
                </Grid>

                {/* Notification Preferences */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mt: 2 }}>
                    Notification Preferences
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={editingDriver.notifyOnJobAssignment || false}
                          onChange={(e) => handleDriverFormChange('notifyOnJobAssignment', e.target.checked)}
                        />
                      }
                      label="Receive notifications when assigned to a job"
                    />
                    
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={editingDriver.notifyOnStatusChange || false}
                          onChange={(e) => handleDriverFormChange('notifyOnStatusChange', e.target.checked)}
                        />
                      }
                      label="Receive notifications on job status changes"
                    />
                  </FormGroup>
                </Grid>
                
                {/* Status Change Notification Types */}
                {editingDriver.notifyOnStatusChange && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Receive notifications for these status changes:
                    </Typography>
                    <FormGroup row>
                      {['Dispatched', 'En Route', 'On Scene', 'Complete', 'Cancelled', 'GOA'].map((status) => (
                        <FormControlLabel
                          key={status}
                          control={
                            <Checkbox
                              checked={(editingDriver.statusChangeNotificationTypes || []).includes(status)}
                              onChange={(e) => handleNotificationTypeChange(status, e.target.checked)}
                            />
                          }
                          label={status}
                        />
                      ))}
                    </FormGroup>
                  </Grid>
                )}

                {/* Active Status */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mt: 2 }}>
                    Driver Status
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={editingDriver.isActive !== false}
                        onChange={handleToggleActive}
                      />
                    }
                    label={editingDriver.isActive !== false ? "Active" : "Inactive"}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveDriver} 
            variant="contained" 
            color="primary"
            disabled={saveLoading}
          >
            {saveLoading ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Drivers;
