// src/settings/RegionManagement.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  Checkbox,
  FormControlLabel,
  FormGroup
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from 'axios';

const RegionManagement = () => {
  // State for regions
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // State for dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create' or 'edit'
  const [selectedRegion, setSelectedRegion] = useState(null);
  
  // State for form
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    countries: [],
    states: []
  });
  
  // State for reference data
  const [referenceData, setReferenceData] = useState({
    countries: [],
    states: {}
  });
  
  // State for selected countries and states
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [selectedStates, setSelectedStates] = useState({});
  
  // Fetch regions on component mount
  useEffect(() => {
    fetchRegions();
    fetchReferenceData();
  }, []);
  
  // Fetch regions from API
  const fetchRegions = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/regions', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setRegions(response.data);
    } catch (error) {
      console.error('Error fetching regions:', error);
      setError('Failed to fetch regions. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch reference data (countries and states)
  const fetchReferenceData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/regions/reference-data', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setReferenceData(response.data);
    } catch (error) {
      console.error('Error fetching reference data:', error);
    }
  };
  
  // Open dialog for creating a new region
  const handleCreateRegion = () => {
    setDialogMode('create');
    setSelectedRegion(null);
    setFormData({
      name: '',
      description: '',
      countries: [],
      states: []
    });
    setSelectedCountries([]);
    setSelectedStates({});
    setDialogOpen(true);
  };
  
  // Open dialog for editing an existing region
  const handleEditRegion = (region) => {
    setDialogMode('edit');
    setSelectedRegion(region);
    
    // Extract countries and states from region
    const countries = region.countries || [];
    const states = region.states || [];
    
    // Create selectedStates object
    const statesByCountry = {};
    states.forEach(state => {
      if (!statesByCountry[state.country]) {
        statesByCountry[state.country] = [];
      }
      statesByCountry[state.country].push(state.state);
    });
    
    setFormData({
      name: region.name || '',
      description: region.description || '',
      countries,
      states
    });
    
    setSelectedCountries(countries);
    setSelectedStates(statesByCountry);
    
    setDialogOpen(true);
  };
  
  // Handle dialog close
  const handleDialogClose = () => {
    setDialogOpen(false);
  };
  
  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle country selection change
  const handleCountryChange = (event) => {
    const { value } = event.target;
    setSelectedCountries(value);
    
    // Remove states for countries that are no longer selected
    const newSelectedStates = { ...selectedStates };
    Object.keys(newSelectedStates).forEach(country => {
      if (!value.includes(country)) {
        delete newSelectedStates[country];
      }
    });
    
    setSelectedStates(newSelectedStates);
  };
  
  // Handle state selection change for a specific country
  const handleStateChange = (country, event) => {
    const { value } = event.target;
    setSelectedStates(prev => ({
      ...prev,
      [country]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      
      // Prepare data for API
      const apiData = {
        name: formData.name,
        description: formData.description,
        countries: selectedCountries,
        states: []
      };
      
      // Add states
      Object.entries(selectedStates).forEach(([country, states]) => {
        states.forEach(state => {
          apiData.states.push({
            country,
            state
          });
        });
      });
      
      if (dialogMode === 'create') {
        // Create new region
        await axios.post('/api/regions', apiData, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } else {
        // Update existing region
        await axios.put(`/api/regions/${selectedRegion._id}`, apiData, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
      
      // Refresh regions
      fetchRegions();
      
      // Close dialog
      handleDialogClose();
    } catch (error) {
      console.error('Error saving region:', error);
      setError('Failed to save region. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle region deletion
  const handleDeleteRegion = async (region) => {
    if (!window.confirm(`Are you sure you want to delete the region "${region.name}"?`)) {
      return;
    }
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/regions/${region._id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Refresh regions
      fetchRegions();
    } catch (error) {
      console.error('Error deleting region:', error);
      setError('Failed to delete region. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Region Management</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateRegion}
        >
          Create Region
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}
      
      {!loading && regions.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">No regions found. Create your first region!</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Countries</TableCell>
                <TableCell>States/Provinces</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {regions.map((region) => (
                <TableRow key={region._id}>
                  <TableCell>{region.name}</TableCell>
                  <TableCell>{region.description}</TableCell>
                  <TableCell>
                    {region.countries?.map((country) => (
                      <Chip 
                        key={country} 
                        label={referenceData.countries.find(c => c.code === country)?.name || country} 
                        size="small" 
                        sx={{ m: 0.5 }} 
                      />
                    ))}
                  </TableCell>
                  <TableCell>
                    {region.states?.length > 0 ? (
                      `${region.states.length} states/provinces`
                    ) : (
                      'None'
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEditRegion(region)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteRegion(region)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Region Dialog */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'Create Region' : 'Edit Region'}
        </DialogTitle>
        <DialogContent>
          <Box my={2}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Region Name"
                  name="name"
                  fullWidth
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  name="description"
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Countries</InputLabel>
                  <Select
                    multiple
                    value={selectedCountries}
                    onChange={handleCountryChange}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip 
                            key={value} 
                            label={referenceData.countries.find(c => c.code === value)?.name || value} 
                            size="small" 
                          />
                        ))}
                      </Box>
                    )}
                  >
                    {referenceData.countries.map((country) => (
                      <MenuItem key={country.code} value={country.code}>
                        {country.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* States/Provinces Selection */}
              {selectedCountries.map((country) => (
                <Grid item xs={12} key={country}>
                  <Typography variant="subtitle1" gutterBottom>
                    {referenceData.countries.find(c => c.code === country)?.name || country} States/Provinces
                  </Typography>
                  <FormControl fullWidth>
                    <InputLabel>{`Select States/Provinces`}</InputLabel>
                    <Select
                      multiple
                      value={selectedStates[country] || []}
                      onChange={(e) => handleStateChange(country, e)}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip 
                              key={value} 
                              label={referenceData.states[country]?.find(s => s.code === value)?.name || value} 
                              size="small" 
                            />
                          ))}
                        </Box>
                      )}
                    >
                      {referenceData.states[country]?.map((state) => (
                        <MenuItem key={state.code} value={state.code}>
                          {state.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              ))}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            color="primary" 
            disabled={loading || !formData.name || selectedCountries.length === 0}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RegionManagement;
