// Submissions.js
import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Tabs,
  Tab,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';
import SideMenu from '../components/SideMenu';
import Apps from '../components/Submissions/Apps';
import AdvancedAppSearch from '../components/Submissions/AdvancedAppSearch';

function Submissions() {
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInputValue, setSearchInputValue] = useState('');
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const [advancedSearchCriteria, setAdvancedSearchCriteria] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Tab labels and corresponding step values
  const tabs = [
    { label: "New", step: 0 },
    { label: "In Review", step: 1 },
    { label: "Approved", step: 2 },
    { label: "Denied", step: 3 },
    { label: "Completed", step: 4 }
  ];
  
  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
    }
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    // Clear search criteria when changing tabs
    setSearchQuery('');
    setSearchInputValue('');
    setAdvancedSearchCriteria({});
  };

  const handleSearchChange = (event) => {
    setSearchInputValue(event.target.value);
  };
  
  const handleSearchSubmit = () => {
    setSearchQuery(searchInputValue);
  };
  
  const handleSearchClear = () => {
    setSearchInputValue('');
    setSearchQuery('');
  };
  
  // Handle Enter key in search field
  const handleSearchKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const handleAdvancedSearchOpen = () => {
    setAdvancedSearchOpen(true);
  };

  const handleAdvancedSearchClose = () => {
    setAdvancedSearchOpen(false);
  };

  const handleAdvancedSearchSubmit = (criteria) => {
    setAdvancedSearchCriteria(criteria);
    setAdvancedSearchOpen(false);
  };

  return (
    <div>
      <SideMenu />
      <Container maxWidth={false}>
        <Box mt={4}>
          <Typography variant="h4">Submissions</Typography>
          {/* Tabs Navigation */}
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="application status tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            {tabs.map((tab, index) => (
              <Tab key={index} label={tab.label} />
            ))}
          </Tabs>
          {/* Search Functionality */}
          <Box display="flex" justifyContent="flex-end" mt={2}>
            <TextField
              label="Search"
              variant="outlined"
              size="small"
              value={searchInputValue}
              onChange={handleSearchChange}
              onKeyPress={handleSearchKeyPress}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {searchInputValue && (
                      <IconButton
                        aria-label="clear search"
                        onClick={handleSearchClear}
                        edge="end"
                        size="small"
                      >
                        <ClearIcon />
                      </IconButton>
                    )}
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleSearchSubmit}
              startIcon={<SearchIcon />}
              sx={{ ml: 1 }}
            >
              Search
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAdvancedSearchOpen}
              sx={{ ml: 1 }}
            >
              Advanced Search
            </Button>
          </Box>
          
          {/* Error display */}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          {/* Apps Component */}
          <Box mt={2} position="relative">
            {isLoading && (
              <Box 
                position="absolute" 
                top="50%" 
                left="50%" 
                sx={{ transform: 'translate(-50%, -50%)' }}
              >
                <CircularProgress />
              </Box>
            )}
            
            {/* Render the current tab's content */}
            <Apps
              step={tabs[tabValue].step}
              searchQuery={searchQuery}
              advancedSearchCriteria={advancedSearchCriteria}
              setIsLoading={setIsLoading}
              setError={setError}
            />
          </Box>
          {/* Advanced Search Dialog */}
          <AdvancedAppSearch
            open={advancedSearchOpen}
            onClose={handleAdvancedSearchClose}
            onSubmit={handleAdvancedSearchSubmit}
          />
        </Box>
      </Container>
    </div>
  );
}

export default Submissions;
