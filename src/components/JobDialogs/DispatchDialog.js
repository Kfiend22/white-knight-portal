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
  Grid,
  Alert
} from '@mui/material';
import useVehicleData from '../../hooks/useVehicleData';

const DispatchDialog = ({ open, onClose, onAssign, loading, drivers }) => {
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const { fleetVehicles, availableVehicles, fetchAvailableVehicles, isLoading: vehiclesLoading } = useVehicleData();

  // Reset state when dialog is opened
  React.useEffect(() => {
    if (open) {
      setSelectedDriver(null);
      setSelectedVehicle(null);
      
      // No need to fetch available vehicles here as they're already managed by useVehicleData
      // and provided via props
    }
  }, [open]);

  const handleSelectDriver = (driver) => {
    setSelectedDriver(driver);
    setSelectedVehicle(null); // Reset vehicle selection

    // Check if driver already has a vehicle assigned
    if (driver && fleetVehicles && fleetVehicles.length > 0) {
      // Find vehicle assigned to this driver
      const driverVehicle = fleetVehicles.find(vehicle =>
        vehicle.driverId && vehicle.driverId.toString() === driver.id.toString()
      );

      // If driver has an assigned vehicle, set it automatically
      if (driverVehicle) {
        setSelectedVehicle(driverVehicle);
      }
    }
  };

   // Handle assignment
   const handleAssign = () => {
    if (!selectedDriver) {
      alert('Please select a driver.');
      return;
    }

    if (!selectedVehicle) {
      alert('Please select a vehicle.');
      return;
    }

    // Pass the vehicle ID or name to the onAssign function
     onAssign(selectedDriver, selectedVehicle._id || selectedVehicle.name);

   }

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
            {/* Always render the content, but disable the Select when no driver is selected */}
            <>
                {/* Show message if driver already has a vehicle assigned */}
                {selectedVehicle && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Driver {selectedDriver.name} is assigned to vehicle {selectedVehicle.name}
                  </Alert>
                )}

                {/* Show message if no vehicles are available */}
                {!selectedVehicle && availableVehicles.length === 0 && !vehiclesLoading && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    No vehicles available for assignment. Please free up a vehicle first.
                  </Alert>
                )}

                <FormControl fullWidth>
                  <InputLabel id="vehicle-select-label">Vehicle</InputLabel>
                  <Select
                    labelId="vehicle-select-label"
                    value={selectedVehicle ? selectedVehicle._id : ''}
                    onChange={(e) => {
                      const vehicleId = e.target.value;
                      // Find the selected vehicle object in availableVehicles
                      const vehicle = availableVehicles.find(v => v._id === vehicleId);
                      setSelectedVehicle(vehicle);
                    }}
                    label="Vehicle"
                    disabled={!selectedDriver}
                  >
                    {/* If driver has a vehicle assigned, show only that vehicle */}
                    {selectedVehicle ? (
                      <MenuItem key={selectedVehicle._id} value={selectedVehicle._id}>
                        {selectedVehicle.name} - {selectedVehicle.type || 'Unknown type'}
                      </MenuItem>
                    ) : (
                      // Otherwise, show available vehicles
                      availableVehicles.map((vehicle) => (
                        <MenuItem key={vehicle._id} value={vehicle._id}>
                          {vehicle.name} - {vehicle.type || 'Unknown type'}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleAssign}
          variant="contained"
          color="primary"
          disabled={!selectedDriver || !selectedVehicle || loading || vehiclesLoading}
        >
          Dispatch
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DispatchDialog;
