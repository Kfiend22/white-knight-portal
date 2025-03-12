// Fleet.js
import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Add as AddIcon,
  MyLocation as MyLocationIcon,
} from '@mui/icons-material';
import GoogleMapReact from 'google-map-react';

function Fleet({ vehicles, setVehicles }) {
  const [openAddVehicleDialog, setOpenAddVehicleDialog] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    name: '',
    make: '',
    model: '',
    year: '',
    type: '',
  });

  const isSmallScreen = useMediaQuery('(max-width:600px)');

  // Handle Add Vehicle Dialog
  const handleOpenAddVehicleDialog = () => {
    setOpenAddVehicleDialog(true);
  };

  const handleCloseAddVehicleDialog = () => {
    setOpenAddVehicleDialog(false);
    setNewVehicle({ name: '', make: '', model: '', year: '', type: '' });
  };

  const handleSaveNewVehicle = () => {
    if (newVehicle.name && newVehicle.type) {
      setVehicles([
        ...vehicles,
        { ...newVehicle, driver: null, status: 'Off Duty', lat: 0, lng: 0 },
      ]);
      handleCloseAddVehicleDialog();
    } else {
      alert('Please complete all required fields.');
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
                <Switch
                  checked={vehicle.status === 'On Duty'}
                  onChange={() => handleToggleStatus(index)}
                  color="primary"
                  inputProps={{ 'aria-label': 'controlled' }}
                />
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
          <TextField
            margin="dense"
            label="Name"
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
            <InputLabel>Type*</InputLabel>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddVehicleDialog}>Cancel</Button>
          <Button onClick={handleSaveNewVehicle} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Fleet;
