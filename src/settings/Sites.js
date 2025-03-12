// Sites.js
import React, { useState } from 'react';
import {
  Typography,
  Container,
  Button,
  Box,
  Paper,
  Divider,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  MyLocation as MyLocationIcon,
  LocationOn as LocationOnIcon,
} from '@mui/icons-material';
import GoogleMapReact from 'google-map-react';

function Sites({ sites, setSites }) {
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);
  const [mapCoordinates, setMapCoordinates] = useState({ lat: 0, lng: 0 });

  // Handle opening edit dialog
  const handleEditSite = (site) => {
    setSelectedSite(site);
    setMapCoordinates({ lat: site.lat, lng: site.lng });
    setOpenEditDialog(true);
  };

  // Handle closing edit dialog
  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setSelectedSite(null);
  };

  // Handle saving site changes
  const handleSaveSite = () => {
    setSites((prevSites) =>
      prevSites.map((site) =>
        site.id === selectedSite.id
          ? { ...selectedSite, lat: mapCoordinates.lat, lng: mapCoordinates.lng }
          : site
      )
    );
    setOpenEditDialog(false);
    setSelectedSite(null);
  };

  // Handle delete site
  const handleDeleteSite = (siteId) => {
    setSites((prevSites) => prevSites.filter((site) => site.id !== siteId));
  };

  // Handle geolocation
  const handleDetectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          // For simplicity, we'll set the address as coordinates
          setSelectedSite({
            ...selectedSite,
            address: `Lat: ${position.coords.latitude.toFixed(
              4
            )}, Lng: ${position.coords.longitude.toFixed(4)}`,
          });
        },
        () => {
          alert('Geolocation not supported or permission denied');
        }
      );
    } else {
      alert('Geolocation not supported by this browser');
    }
  };

  // Handle map interaction
  const handleMapClick = ({ lat, lng }) => {
    setMapCoordinates({ lat, lng });
    // For simplicity, we'll set the address as coordinates
    setSelectedSite({
      ...selectedSite,
      address: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`,
    });
  };

  return (
    <Box mt={2}>
      <Paper elevation={3} sx={{ padding: 2 }}>
        <Typography variant="h6">Sites</Typography>
        <Divider sx={{ my: 2 }} />

        {/* Table Structure */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sites.map((site) => (
                <TableRow key={site.id}>
                  <TableCell>{site.name}</TableCell>
                  <TableCell>{site.address}</TableCell>
                  <TableCell>{site.phone}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      onClick={() => handleEditSite(site)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDeleteSite(site.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Edit Site Dialog */}
      <Dialog
        open={openEditDialog}
        onClose={handleCloseEditDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Site</DialogTitle>
        <DialogContent>
          {selectedSite && (
            <>
              <TextField
                margin="dense"
                label="Name"
                fullWidth
                value={selectedSite.name}
                onChange={(e) =>
                  setSelectedSite({ ...selectedSite, name: e.target.value })
                }
              />
              <Box display="flex" alignItems="flex-end">
                <TextField
                  margin="dense"
                  label="Address"
                  fullWidth
                  value={selectedSite.address}
                  onChange={(e) =>
                    setSelectedSite({ ...selectedSite, address: e.target.value })
                  }
                />
                <IconButton
                  edge="end"
                  aria-label="detect location"
                  onClick={handleDetectLocation}
                  sx={{ mb: 1 }}
                >
                  <MyLocationIcon />
                </IconButton>
              </Box>
              <TextField
                margin="dense"
                label="Phone"
                fullWidth
                value={selectedSite.phone}
                onChange={(e) =>
                  setSelectedSite({ ...selectedSite, phone: e.target.value })
                }
              />

              {/* Map Interaction */}
              <Box mt={2} style={{ height: '300px' }}>
                <GoogleMapReact
                  bootstrapURLKeys={{ key: 'YOUR_GOOGLE_MAPS_API_KEY' }}
                  center={mapCoordinates}
                  defaultZoom={14}
                  onClick={handleMapClick}
                >
                  <LocationOnIcon
                    lat={mapCoordinates.lat}
                    lng={mapCoordinates.lng}
                    color="red"
                  />
                </GoogleMapReact>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button onClick={handleSaveSite} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Sites;
