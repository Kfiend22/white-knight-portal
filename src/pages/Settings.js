import React, { useState, useEffect } from 'react';
import { Typography, Container, Box, Tabs, Tab, useMediaQuery } from '@mui/material';
import SideMenu from '../components/SideMenu';
import axios from 'axios';

// Import the separated components
import Rates from '../settings/Rates';
import Sites from '../settings/Sites';
import Fleet from '../settings/Fleet';
import Users from '../settings/Users';
import Drivers from '../settings/Drivers';

function Settings() {
  const isSmallScreen = useMediaQuery('(max-width:600px)');
  const [tabValue, setTabValue] = useState(0);

  // Shared state for settings fetched from backend
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [sites, setSites] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [users, setUsers] = useState([]);

  // Fetch settings from the backend
  useEffect(() => {
    fetchSettings();
  }, []);

  // Helper function to get auth headers
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/api/settings', {
        headers: getAuthHeader()
      });
      
      const { locations, selectedLocation, sites, vehicles, users } = response.data;

      console.log('Settings.js - Fetched settings data', response.data);
      console.log('Settings.js - Vehicles data:', vehicles);

      // Populate the state with data from the backend
      setLocations(locations || []);
      setSelectedLocation(selectedLocation || '');
      setSites(sites || []);
      setVehicles(vehicles || []);
      setUsers(users || []);
      
      // Store vehicles in localStorage to make them available to all components
      if (vehicles && Array.isArray(vehicles)) {
        localStorage.setItem('fleetVehicles', JSON.stringify(vehicles));
        console.log('Settings.js - Stored fleet vehicles in localStorage');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      
      // If unauthorized, redirect to login
      if (error.response && error.response.status === 401) {
        window.location.href = '/login';
      }
    }
  };

  const updateSettings = async (updatedSettings) => {
    try {
      await axios.put('/api/settings', updatedSettings, {
        headers: getAuthHeader()
      });
      
      // Refresh settings after update
      fetchSettings();
      
      return true; // Return success status
    } catch (error) {
      console.error('Error updating settings:', error);
      
      // If unauthorized, redirect to login
      if (error.response && error.response.status === 401) {
        window.location.href = '/login';
      }
      
      return false; // Return failure status
    }
  };

  // Tab change handler
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <>
      {/* Side Menu */}
      <SideMenu />

      {/* Main Content */}
      <Container maxWidth={false}>
        <Box
          mt={4}
          mb={2}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h4">Settings</Typography>
        </Box>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="settings tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Rates" />
          <Tab label="Sites" />
          <Tab label="Fleet" />
          <Tab label="Users" />
          <Tab label="Drivers" />
          {/* Other tabs */}
        </Tabs>

        {/* Render components based on the selected tab */}
        {tabValue === 0 && (
          <Rates
            locations={locations}
            selectedLocation={selectedLocation}
            setSelectedLocation={setSelectedLocation}
            updateSettings={updateSettings}
          />
        )}
        {tabValue === 1 && (
          <Sites sites={sites} setSites={setSites} updateSettings={updateSettings} />
        )}
        {tabValue === 2 && (
          <Fleet vehicles={vehicles} setVehicles={setVehicles} updateSettings={updateSettings} />
        )}
        {tabValue === 3 && (
          <Users users={users} setUsers={setUsers} updateSettings={updateSettings} />
        )}
        {tabValue === 4 && (
          <Drivers />
        )}
        {/* Other sections */}
      </Container>
    </>
  );
}

export default Settings;
