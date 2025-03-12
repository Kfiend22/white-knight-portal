// Rates.js
import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemButton as MuiListItemButton,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';

function Rates({ locations, selectedLocation, setSelectedLocation }) {
  const [ratesData, setRatesData] = useState({});
  const [expandedServices, setExpandedServices] = useState({});

  useEffect(() => {
    // Load sample data
    loadSampleData();
  }, []);

  const loadSampleData = () => {
    // Sample Rates Data Structure
    setRatesData({
      'New York': {
        basicLightDuty: {
          defaultRate: '75',
          services: {
            'Battery Service': {
              baseRate: '80',
              enRouteMilesFree: '10',
              ratePerMile: '3',
            },
            'Tire Service': {
              baseRate: '70',
              enRouteMilesFree: '10',
              ratePerMile: '2',
            },
            'Lock Out Service': {
              baseRate: '65',
              enRouteMilesFree: '10',
              ratePerMile: '1.5',
            },
            'Fuel Delivery Service': {
              baseRate: '60',
              enRouteMilesFree: '10',
              ratePerMile: '2',
            },
          },
        },
        // ... other categories
      },
      // ... other locations
    });
  };

  const handleServiceClick = (serviceKey) => {
    setExpandedServices((prev) => ({
      ...prev,
      [serviceKey]: !prev[serviceKey],
    }));
  };

  const handleLocationChange = (event) => {
    setSelectedLocation(event.target.value);
    setExpandedServices({});
  };

  return (
    <Box mt={2}>
      {/* Location Selector */}
      <FormControl sx={{ minWidth: 200, mb: 2 }}>
        <InputLabel>Location</InputLabel>
        <Select
          value={selectedLocation}
          onChange={handleLocationChange}
          label="Location"
        >
          {locations.map((location) => (
            <MenuItem key={location} value={location}>
              {location}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Services */}
      <Paper elevation={3} sx={{ padding: 2 }}>
        <Typography variant="h6">Services</Typography>
        <Divider sx={{ my: 2 }} />

        {/* Helper function to render service items */}
        {['basicLightDuty', 'basicMediumDuty', 'basicHeavyDuty', 'towServices'].map(
          (categoryKey) => {
            const category =
              categoryKey === 'basicLightDuty'
                ? 'Basic Light Duty Services'
                : categoryKey === 'basicMediumDuty'
                ? 'Basic Medium Duty Services'
                : categoryKey === 'basicHeavyDuty'
                ? 'Basic Heavy Duty Services'
                : 'Tow Services';
            const services =
              ratesData[selectedLocation]?.[categoryKey]?.services || {};

            return (
              <Box key={categoryKey}>
                <Typography variant="subtitle1" sx={{ mt: 2 }}>
                  {category}
                </Typography>
                <Box sx={{ ml: 2, mt: 1 }}>
                  <List disablePadding>
                    {Object.keys(services).map((serviceName) => {
                      const serviceKey = `${categoryKey}-${serviceName}`;
                      const isExpanded = expandedServices[serviceKey];

                      return (
                        <MuiListItemButton
                          key={serviceKey}
                          onClick={() => handleServiceClick(serviceKey)}
                        >
                          <ListItemText primary={serviceName} />
                          {isExpanded ? (
                            <ExpandMoreIcon />
                          ) : (
                            <ChevronRightIcon />
                          )}
                          {/* Service parameters displayed inline when expanded */}
                          {isExpanded && (
                            <Box sx={{ ml: 2, width: '100%' }}>
                              <List disablePadding>
                                {Object.entries(services[serviceName]).map(
                                  ([paramKey, paramValue]) => (
                                    <ListItem key={paramKey} disablePadding>
                                      <ListItemText
                                        primary={`${formatParamKey(
                                          paramKey
                                        )}: ${paramValue}`}
                                        sx={{ pl: 2 }}
                                      />
                                    </ListItem>
                                  )
                                )}
                              </List>
                            </Box>
                          )}
                        </MuiListItemButton>
                      );
                    })}
                  </List>
                </Box>
              </Box>
            );
          }
        )}
      </Paper>
    </Box>
  );
}

// Helper function to format parameter keys
function formatParamKey(key) {
  switch (key) {
    case 'baseRate':
      return 'Contracted Base Rate';
    case 'enRouteMilesFree':
      return 'En Route Miles Minus X Free Miles';
    case 'ratePerMile':
      return 'Rate Per Mile';
    case 'onHookFee':
      return 'On Hook Fee';
    case 'toDestinationMilesFree':
      return 'To Destination Miles Minus X Free Miles';
    default:
      return key;
  }
}

export default Rates;
