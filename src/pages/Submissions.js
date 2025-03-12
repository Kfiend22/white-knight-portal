// Submissions.js
import React, { useState } from 'react';
import {
  Container,
  Box,
  Tabs,
  Tab,
  Typography,
  TextField,
  Button,
} from '@mui/material';
import SideMenu from '../components/SideMenu';
import Apps from '../components/Submissions/Apps';
import AdvancedAppSearch from '../components/Submissions/AdvancedAppSearch';

function Submissions() {
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const [advancedSearchCriteria, setAdvancedSearchCriteria] = useState({});

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setAdvancedSearchCriteria({});
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
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
      <Container maxWidth="lg">
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
            <Tab label="New" />
            <Tab label="In Review" />
            <Tab label="Approved" />
            <Tab label="Denied" />
            <Tab label="Completed" />
          </Tabs>
          {/* Search Functionality */}
          <Box display="flex" justifyContent="flex-end" mt={2}>
            <TextField
              label="Search"
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={() => setSearchQuery(searchQuery)}
              style={{ marginLeft: 8 }}
            >
              Search
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAdvancedSearchOpen}
              style={{ marginLeft: 8 }}
            >
              Advanced Search
            </Button>
          </Box>
          {/* Apps Component */}
          <Box mt={2}>
            {tabValue === 0 && (
              <Apps
                step={0}
                searchQuery={searchQuery}
                advancedSearchCriteria={advancedSearchCriteria}
              />
            )}
            {tabValue === 1 && (
              <Apps
                step={1}
                searchQuery={searchQuery}
                advancedSearchCriteria={advancedSearchCriteria}
              />
            )}
            {tabValue === 2 && (
              <Apps
                step={2}
                searchQuery={searchQuery}
                advancedSearchCriteria={advancedSearchCriteria}
              />
            )}
            {tabValue === 3 && (
              <Apps
                step={3}
                searchQuery={searchQuery}
                advancedSearchCriteria={advancedSearchCriteria}
              />
            )}
            {tabValue === 4 && (
              <Apps
                step={4}
                searchQuery={searchQuery}
                advancedSearchCriteria={advancedSearchCriteria}
              />
            )}
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
