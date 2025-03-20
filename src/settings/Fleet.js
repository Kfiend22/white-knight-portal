// Fleet.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import useUserProfile from '../hooks/useUserProfile';
import {
  Typography,
  Box,
  Button,
  Container,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  useMediaQuery,
  Grid,
  FormControlLabel,
  Checkbox,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  MyLocation as MyLocationIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import GoogleMapReact from 'google-map-react';

function Fleet({ vehicles, setVehicles }) {
  // Get user profile to access vendor ID
  const { userProfile, loading: profileLoading } = useUserProfile();
  
  // State for add new vehicle
  const [openAddVehicleDialog, setOpenAddVehicleDialog] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    name: '',
    make: '',
    model: '',
    year: '',
    type: '',
    driverId: '',
    driverName: '',
    vendorId: ''
  });
  
  // State for edit vehicle
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [editVehicleData, setEditVehicleData] = useState(null);
  
  // Shared data
  const [csvVehicles, setCsvVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCsvVehicle, setSelectedCsvVehicle] = useState('');
  const [savingVehicle, setSavingVehicle] = useState(false);

  const isSmallScreen = useMediaQuery('(max-width:600px)');

  // Helper function to get auth headers
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  // Load CSV vehicles and drivers when component mounts
  useEffect(() => {
    fetchCsvVehicles();
    fetchDrivers();
  }, []);

  // Fetch vehicles from VehicleList.csv
  const fetchCsvVehicles = async () => {
    setLoading(true);
    try {
      const response = await fetch('/csvs/VehicleList.csv');
      const csvText = await response.text();
      
      Papa.parse(csvText, {
        header: true,
        complete: (results) => {
          // Filter out rows without Make or Model
          const validVehicles = results.data.filter(
            vehicle => vehicle.Make && vehicle.Model && 
            vehicle.Make.trim() !== '' && vehicle.Model.trim() !== ''
          );
          
          setCsvVehicles(validVehicles);
          setLoading(false);
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          setError('Failed to load vehicle data');
          setLoading(false);
        }
      });
    } catch (error) {
      console.error('Error fetching CSV:', error);
      setError('Failed to load vehicle data');
      setLoading(false);
    }
  };

  // Fetch drivers (users with driver secondary role)
  const fetchDrivers = async () => {
    setLoading(true);
    try {
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
      
      // Filter to only include active users with driver secondary role
      const driversOnly = allUsers.filter(user => 
        (user.isActive !== false) && 
        ((user.secondaryRoles?.driver === true) || (user.isDriver === true))
      );
      
      setDrivers(driversOnly);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setError('Failed to load driver data');
      setLoading(false);
    }
  };

  // Handle selecting a vehicle from CSV
  const handleCsvVehicleSelect = (event) => {
    const selectedVehicleIndex = event.target.value;
    setSelectedCsvVehicle(selectedVehicleIndex);
    
    if (selectedVehicleIndex !== '') {
      const vehicle = csvVehicles[selectedVehicleIndex];
      setNewVehicle({
        ...newVehicle,
        make: vehicle.Make || '',
        model: vehicle.Model || '',
        year: vehicle['Production years'] || vehicle['Model Years (US/Canada)'] || '',
        // Try to determine vehicle type based on classification or name
        type: determineVehicleType(vehicle),
        // Generate a default name
        name: `${vehicle.Make} ${vehicle.Model}`
      });
    }
  };

  // Helper function to determine vehicle type based on classification or name
  const determineVehicleType = (vehicle) => {
    const model = (vehicle.Model || '').toLowerCase();
    const classification = (vehicle['American classification'] || 
                           vehicle['European / World classification'] || '').toLowerCase();
    
    if (model.includes('flatbed') || model.includes('flat bed')) return 'Flatbed';
    if (model.includes('wheel lift')) return 'Wheel Lift';
    if (classification.includes('heavy duty') || classification.includes('heavy-duty')) return 'Heavy Duty';
    if (classification.includes('medium duty') || classification.includes('medium-duty')) return 'Medium Duty';
    if (classification.includes('light duty') || classification.includes('light-duty')) return 'Light Duty';
    if (model.includes('service truck')) return 'Service Truck';
    
    // Default to Light Duty if we can't determine
    return 'Light Duty';
  };

  // Handle driver selection
  const handleDriverSelect = (event) => {
    const driverId = event.target.value;
    if (driverId) {
      const selectedDriver = drivers.find(driver => 
        (driver.id === driverId || driver._id === driverId)
      );
      
      if (selectedDriver) {
        setNewVehicle({
          ...newVehicle,
          driverId: driverId,
          driverName: `${selectedDriver.firstName || selectedDriver.ownerFirstName || ''} ${selectedDriver.lastName || selectedDriver.ownerLastName || ''}`
        });
      }
    } else {
      setNewVehicle({
        ...newVehicle,
        driverId: '',
        driverName: ''
      });
    }
  };

  // Handle Add Vehicle Dialog
  const handleOpenAddVehicleDialog = () => {
    setOpenAddVehicleDialog(true);
  };

  const handleCloseAddVehicleDialog = () => {
    setOpenAddVehicleDialog(false);
    setNewVehicle({ name: '', make: '', model: '', year: '', type: '' });
  };

  // Update settings in the database
  const updateSettings = async (updatedSettings) => {
    try {
      const response = await axios.put('/api/settings', updatedSettings, {
        headers: getAuthHeader()
      });
      
      // Check if the response contains the updated vehicles
      if (response.data && response.data.vehicles) {
        // Update local state with the vehicles from the response
        setVehicles(response.data.vehicles);
      }
      
      return true;
    } catch (error) {
      console.error('Error updating settings:', error);
      return false;
    }
  };

  const handleSaveNewVehicle = async () => {
    if (newVehicle.name && newVehicle.type) {
      // Set saving state
      setSavingVehicle(true);
      
      // Get vendor ID from userProfile or generate a new one
      const vendorId = (userProfile && (userProfile.vendorId || userProfile.vendorNumber)) || 
                       `VEH${Date.now().toString().slice(-8)}`;
      
      // Create vehicle object with all necessary data
      const vehicleToSave = { 
        ...newVehicle, 
        driver: newVehicle.driverName || null, 
        driverId: newVehicle.driverId || null,
        status: 'Off Duty', 
        lat: 0, 
        lng: 0,
        vendorId
      };
      
      // Add to local state temporarily
      const updatedVehicles = [...vehicles, vehicleToSave];
      setVehicles(updatedVehicles);
      
      // Save to database
      const success = await updateSettings({
        vehicles: updatedVehicles
      });
      
      if (!success) {
        // If failed, revert to previous state
        setVehicles(vehicles);
        alert('Failed to save vehicle to database. Please try again.');
      } else {
        console.log('Vehicle saved successfully to database');
      }
      
      // Close dialog and reset state regardless of success
      handleCloseAddVehicleDialog();
      
      // Reset form fields
      setNewVehicle({
        name: '',
        make: '',
        model: '',
        year: '',
        type: '',
        driverId: '',
        driverName: '',
        vendorId: ''
      });
      setSelectedCsvVehicle('');
      setSavingVehicle(false);
    } else {
      alert('Please complete all required fields.');
    }
  };

  // Handle opening the edit dialog for a vehicle
  const handleEditVehicle = (vehicle, index) => {
    // Find driver in the drivers array if assigned
    let driverInfo = null;
    if (vehicle.driverId) {
      driverInfo = drivers.find(d => d.id === vehicle.driverId || d._id === vehicle.driverId);
    }
    
    setEditingVehicle(index);
    setEditVehicleData({
      ...vehicle,
      driverName: vehicle.driver || ''
    });
    setOpenEditDialog(true);
  };

  // Handle edit form field changes
  const handleEditFormChange = (field, value) => {
    setEditVehicleData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle driver selection in edit form
  const handleEditDriverSelect = (event) => {
    const driverId = event.target.value;
    if (driverId) {
      const selectedDriver = drivers.find(driver => 
        (driver.id === driverId || driver._id === driverId)
      );
      
      if (selectedDriver) {
        setEditVehicleData({
          ...editVehicleData,
          driverId: driverId,
          driver: `${selectedDriver.firstName || selectedDriver.ownerFirstName || ''} ${selectedDriver.lastName || selectedDriver.ownerLastName || ''}`
        });
      }
    } else {
      setEditVehicleData({
        ...editVehicleData,
        driverId: '',
        driver: ''
      });
    }
  };

  // Close edit dialog
  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setEditingVehicle(null);
    setEditVehicleData(null);
  };

  // Save edited vehicle
  const handleSaveEditedVehicle = async () => {
    if (!editVehicleData?.name || !editVehicleData?.type) {
      alert('Please complete all required fields.');
      return;
    }
    
    // Set saving state
    setSavingVehicle(true);
    
    try {
      // If the vehicle has an _id, use the new API endpoint
      if (editVehicleData._id) {
        // Save using the new vehicle API
        const response = await axios.put(
          `/api/vehicles/${editVehicleData._id}`, 
          editVehicleData,
          { headers: getAuthHeader() }
        );
        
        if (response.data) {
          // Update the vehicle in local state
          const updatedVehicles = [...vehicles];
          updatedVehicles[editingVehicle] = response.data;
          setVehicles(updatedVehicles);
          
          // Cache updated vehicles in localStorage
          localStorage.setItem('fleetVehicles', JSON.stringify(updatedVehicles));
          
          console.log('Vehicle updated successfully via API');
        }
      } else {
        // Fall back to the settings API for legacy vehicles
        const updatedVehicles = [...vehicles];
        updatedVehicles[editingVehicle] = editVehicleData;
        
        // Save to database
        const success = await updateSettings({
          vehicles: updatedVehicles
        });
        
        if (!success) {
          // If failed, revert to previous state
          alert('Failed to update vehicle. Please try again.');
        } else {
          setVehicles(updatedVehicles);
          console.log('Vehicle updated successfully via settings API');
        }
      }
      
      // Close dialog and reset state
      handleCloseEditDialog();
    } catch (error) {
      console.error('Error saving edited vehicle:', error);
      alert('Error saving vehicle. Please try again.');
    } finally {
      setSavingVehicle(false);
    }
  };

  // Handle vehicle status toggle
  const handleToggleStatus = (index) => {
    setVehicles((prevVehicles) => {
      const updatedVehicles = [...prevVehicles];
      updatedVehicles[index].status =
        updatedVehicles[index].status === 'On Duty' ? 'Off Duty' : 'On Duty';
      return updatedVehicles;
    });
  };

  return (
    <Box mt={2}>
      {/* Add New Vehicle Button */}
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAddVehicleDialog}
        >
          Add New Vehicle
        </Button>
      </Box>

      <Box display={isSmallScreen ? 'block' : 'flex'} height="500px">
        {/* Map Panel */}
        <Box flex={1} mr={isSmallScreen ? 0 : 2} mb={isSmallScreen ? 2 : 0}>
          <GoogleMapReact
            bootstrapURLKeys={{ key: 'YOUR_GOOGLE_MAPS_API_KEY' }}
            defaultCenter={{ lat: 39.8283, lng: -98.5795 }}
            defaultZoom={4}
          >
            {vehicles.map((vehicle, index) => (
              <MyLocationIcon
                key={index}
                lat={vehicle.lat}
                lng={vehicle.lng}
                color={vehicle.status === 'On Duty' ? 'green' : 'red'}
              />
            ))}
          </GoogleMapReact>
        </Box>

        {/* Vehicle and Driver List Panel */}
        <Box flex={1} ml={isSmallScreen ? 0 : 2} component={Paper} elevation={3} p={2}>
          <Typography variant="h6">Vehicles</Typography>
          <Divider sx={{ my: 2 }} />
          <List>
            {vehicles.map((vehicle, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={vehicle.name}
                  secondary={`Driver: ${vehicle.driver || 'Not Assigned'} | Type: ${
                    vehicle.type
                  }`}
                />
                <ListItemSecondaryAction>
                  <IconButton 
                    edge="end" 
                    aria-label="edit"
                    onClick={() => handleEditVehicle(vehicle, index)}
                    color="primary"
                    sx={{ mr: 1 }}
                  >
                    <EditIcon />
                  </IconButton>
                  <Switch
                    checked={vehicle.status === 'On Duty'}
                    onChange={() => handleToggleStatus(index)}
                    color="primary"
                    inputProps={{ 'aria-label': 'controlled' }}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Box>
      </Box>

      {/* Add Vehicle Dialog */}
      <Dialog
        open={openAddVehicleDialog}
        onClose={handleCloseAddVehicleDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Vehicle</DialogTitle>
        <DialogContent>
          {loading ? (
            <Typography>Loading vehicle and driver data...</Typography>
          ) : (
            <>
              {/* Vehicle Selection from CSV */}
              <FormControl fullWidth margin="dense">
                <InputLabel>Select Vehicle from Database</InputLabel>
                <Select
                  value={selectedCsvVehicle}
                  onChange={handleCsvVehicleSelect}
                >
                  <MenuItem value="">
                    <em>- Select a vehicle -</em>
                  </MenuItem>
                  {csvVehicles.map((vehicle, index) => (
                    <MenuItem key={index} value={index}>
                      {vehicle.Make} {vehicle.Model} {vehicle['Production years'] || vehicle['Model Years (US/Canada)'] || ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Divider with "or" text */}
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 2 }}>
                <Box sx={{ flex: 1 }}><Divider /></Box>
                <Box sx={{ px: 2 }}><Typography variant="body2">or enter vehicle details manually</Typography></Box>
                <Box sx={{ flex: 1 }}><Divider /></Box>
              </Box>

              {/* Custom Vehicle Details */}
              <TextField
                margin="dense"
                label="Name *"
                fullWidth
                required
                value={newVehicle.name}
                onChange={(e) => setNewVehicle({ ...newVehicle, name: e.target.value })}
              />
              <TextField
                margin="dense"
                label="Make"
                fullWidth
                value={newVehicle.make}
                onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
              />
              <TextField
                margin="dense"
                label="Model"
                fullWidth
                value={newVehicle.model}
                onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
              />
              <TextField
                margin="dense"
                label="Year"
                fullWidth
                type="number"
                value={newVehicle.year}
                onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value })}
              />
              <FormControl fullWidth margin="dense">
                <InputLabel>Type *</InputLabel>
                <Select
                  value={newVehicle.type}
                  onChange={(e) => setNewVehicle({ ...newVehicle, type: e.target.value })}
                  required
                >
                  <MenuItem value="">-Select-</MenuItem>
                  <MenuItem value="Flatbed">Flatbed</MenuItem>
                  <MenuItem value="Wheel Lift">Wheel Lift</MenuItem>
                  <MenuItem value="Light Duty">Light Duty</MenuItem>
                  <MenuItem value="Medium Duty">Medium Duty</MenuItem>
                  <MenuItem value="Heavy Duty">Heavy Duty</MenuItem>
                  <MenuItem value="Super Heavy">Super Heavy</MenuItem>
                  <MenuItem value="Service Truck">Service Truck</MenuItem>
                  <MenuItem value="Covered Flatbed">Covered Flatbed</MenuItem>
                  <MenuItem value="Flatbed + Straps">Flatbed + Straps</MenuItem>
                </Select>
              </FormControl>

              {/* Driver Assignment */}
              <FormControl fullWidth margin="dense">
                <InputLabel>Assign Driver</InputLabel>
                <Select
                  value={newVehicle.driverId}
                  onChange={handleDriverSelect}
                >
                  <MenuItem value="">
                    <em>- No driver assigned -</em>
                  </MenuItem>
                  {drivers.map((driver) => (
                    <MenuItem 
                      key={driver.id || driver._id} 
                      value={driver.id || driver._id}
                    >
                      {driver.firstName || driver.ownerFirstName} {driver.lastName || driver.ownerLastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddVehicleDialog}>Cancel</Button>
          <Button onClick={handleSaveNewVehicle} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Vehicle Dialog */}
      <Dialog
        open={openEditDialog}
        onClose={handleCloseEditDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Edit Vehicle
          {editVehicleData && (
            <Typography variant="caption" display="block" color="text.secondary">
              {editVehicleData.name}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {loading || !editVehicleData ? (
            <CircularProgress />
          ) : (
            <Box component="form" noValidate autoComplete="off" sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                {/* Basic Vehicle Information */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Vehicle Information
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Name *"
                    value={editVehicleData.name || ''}
                    onChange={(e) => handleEditFormChange('name', e.target.value)}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Type *</InputLabel>
                    <Select
                      value={editVehicleData.type || ''}
                      onChange={(e) => handleEditFormChange('type', e.target.value)}
                      label="Type *"
                      required
                    >
                      <MenuItem value="">-Select-</MenuItem>
                      <MenuItem value="Flatbed">Flatbed</MenuItem>
                      <MenuItem value="Wheel Lift">Wheel Lift</MenuItem>
                      <MenuItem value="Light Duty">Light Duty</MenuItem>
                      <MenuItem value="Medium Duty">Medium Duty</MenuItem>
                      <MenuItem value="Heavy Duty">Heavy Duty</MenuItem>
                      <MenuItem value="Super Heavy">Super Heavy</MenuItem>
                      <MenuItem value="Service Truck">Service Truck</MenuItem>
                      <MenuItem value="Covered Flatbed">Covered Flatbed</MenuItem>
                      <MenuItem value="Flatbed + Straps">Flatbed + Straps</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Make"
                    value={editVehicleData.make || ''}
                    onChange={(e) => handleEditFormChange('make', e.target.value)}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Model"
                    value={editVehicleData.model || ''}
                    onChange={(e) => handleEditFormChange('model', e.target.value)}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Year"
                    type="number"
                    value={editVehicleData.year || ''}
                    onChange={(e) => handleEditFormChange('year', e.target.value)}
                  />
                </Grid>
                
                {/* Driver Assignment */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mt: 2 }}>
                    Driver Assignment
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Assigned Driver</InputLabel>
                    <Select
                      value={editVehicleData.driverId || ''}
                      onChange={handleEditDriverSelect}
                      label="Assigned Driver"
                    >
                      <MenuItem value="">
                        <em>- No driver assigned -</em>
                      </MenuItem>
                      {drivers.map((driver) => (
                        <MenuItem 
                          key={driver.id || driver._id} 
                          value={driver.id || driver._id}
                        >
                          {driver.firstName || driver.ownerFirstName} {driver.lastName || driver.ownerLastName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                {/* Status */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mt: 2 }}>
                    Vehicle Status
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={editVehicleData.status || 'Off Duty'}
                      onChange={(e) => handleEditFormChange('status', e.target.value)}
                      label="Status"
                    >
                      <MenuItem value="On Duty">On Duty</MenuItem>
                      <MenuItem value="Off Duty">Off Duty</MenuItem>
                      <MenuItem value="Maintenance">Maintenance</MenuItem>
                      <MenuItem value="Out of Service">Out of Service</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                {/* Additional Details */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mt: 2 }}>
                    Additional Details
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes"
                    multiline
                    rows={4}
                    value={editVehicleData.notes || ''}
                    onChange={(e) => handleEditFormChange('notes', e.target.value)}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveEditedVehicle} 
            variant="contained" 
            color="primary"
            disabled={savingVehicle}
          >
            {savingVehicle ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Fleet;
