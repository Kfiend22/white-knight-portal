// DispatchDialog.js
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Grid
} from '@mui/material';

const DispatchDialog = ({ open, onClose, onAssign, loading, drivers, trucks, vehicles = [] }) => {
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedTruck, setSelectedTruck] = useState('');
  const [allVehicles, setAllVehicles] = useState([]);

  // Debug: Log received props
  console.log('DispatchDialog vehicles prop:', vehicles);
  console.log('DispatchDialog trucks prop:', trucks);
  
  // Get vehicles from localStorage if available
  useEffect(() => {
    if (open) {
      // Try to get cached vehicles from localStorage
      const cachedVehicles = localStorage.getItem('fleetVehicles');
      if (cachedVehicles) {
        try {
          const parsedVehicles = JSON.parse(cachedVehicles);
          console.log('DispatchDialog - Using cached vehicles from localStorage:', parsedVehicles.length);
          setAllVehicles(parsedVehicles);
        } catch (e) {
          console.error('Error parsing cached vehicles:', e);
          // If parse fails, use provided vehicles prop
          setAllVehicles(vehicles || []);
        }
      } else {
        // If not in localStorage, use provided vehicles prop
        console.log('DispatchDialog - No cached vehicles, using prop vehicles');
        setAllVehicles(vehicles || []);
      }
    }
  }, [open, vehicles]);
  
  // Log combined vehicles
  useEffect(() => {
    console.log('DispatchDialog - Final vehicles list:', allVehicles);
  }, [allVehicles]);

  // Reset state when dialog is opened
  React.useEffect(() => {
    if (open) {
      setSelectedDriver(null);
      setSelectedTruck('');
    }
  }, [open]);

  // Assign driver to job
  const handleSelectDriver = (driver) => {
    setSelectedDriver(driver);
    
    // Auto-select vehicle if driver has one assigned
    if (driver && vehicles && vehicles.length > 0) {
      // Find vehicle assigned to this driver
      const driverVehicle = vehicles.find(vehicle => 
        vehicle.driverId === driver.id || 
        (vehicle.driver && vehicle.driver.includes(driver.name))
      );
      
      // If driver has an assigned vehicle, set it automatically
      if (driverVehicle) {
        setSelectedTruck(driverVehicle.name);
        console.log(`Auto-selected vehicle ${driverVehicle.name} for driver ${driver.name}`);
      } else {
        // Reset truck selection when driver changes and no vehicle is assigned
        setSelectedTruck('');
      }
    } else {
      // Reset truck selection when driver changes and no vehicles list is available
      setSelectedTruck('');
    }
  };

  // Handle assignment
  const handleAssign = () => {
    if (!selectedDriver) {
      alert('Please select a driver.');
      return;
    }
    
    if (!selectedTruck) {
      alert('Please select a truck.');
      return;
    }
    
    onAssign(selectedDriver, selectedTruck);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md">
      <DialogTitle>Dispatch Job</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Select Driver
            </Typography>
            <Box sx={{ maxHeight: '300px', overflow: 'auto', border: '1px solid #eee', borderRadius: 1, p: 1 }}>
              {drivers && drivers.length > 0 ? (
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
                {/* Display vehicles from localStorage or prop */}
                {allVehicles && allVehicles.length > 0 ? (
                  allVehicles.map((vehicle, index) => (
                    <MenuItem key={vehicle.id || index} value={vehicle.name}>
                      {vehicle.name} - {vehicle.type} {vehicle.driver ? `(Assigned to: ${vehicle.driver})` : ''}
                    </MenuItem>
                  ))
                ) : vehicles && vehicles.length > 0 ? (
                  vehicles.map((vehicle, index) => (
                    <MenuItem key={index} value={vehicle.name}>
                      {vehicle.name} - {vehicle.type} {vehicle.driver ? `(Assigned to: ${vehicle.driver})` : ''}
                    </MenuItem>
                  ))
                ) : (
                  /* Fallback to basic truck list */
                  trucks && trucks.map((truck) => (
                    <MenuItem key={truck} value={truck}>
                      {truck}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleAssign}
          variant="contained"
          color="primary"
          disabled={!selectedDriver || !selectedTruck || loading}
        >
          Dispatch
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DispatchDialog;
