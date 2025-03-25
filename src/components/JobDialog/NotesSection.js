// NotesSection.js
// Notes section for the job dialog

import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  TextField,
  Box,
  ButtonGroup,
  Button
} from '@mui/material';

/**
 * Notes section component for the job dialog
 * @param {Object} props Component props
 * @param {Object} props.jobData Current job data
 * @param {Function} props.handleInputChange Function to handle input changes
 * @param {Function} props.handleNotesInputChange Function to handle notes input changes
 * @param {string} props.activeTab Active notes tab
 * @param {Function} props.handleTabChange Function to handle tab changes
 * @param {Object} props.userProfile User profile object
 * @returns {JSX.Element} Notes section component
 */
const NotesSection = ({ 
  jobData, 
  handleInputChange, 
  handleNotesInputChange, 
  activeTab, 
  handleTabChange,
  userProfile
}) => {
  // Debug log for user profile
  console.log('NotesSection - userProfile:', userProfile);
  console.log('NotesSection - primaryRole:', userProfile?.primaryRole);
  console.log('NotesSection - secondaryRoles:', userProfile?.secondaryRoles);
  console.log('NotesSection - secondaryRoles is Array?', Array.isArray(userProfile?.secondaryRoles));
  
  if (userProfile?.secondaryRoles && !Array.isArray(userProfile.secondaryRoles)) {
    console.log('NotesSection - secondaryRoles type:', typeof userProfile.secondaryRoles);
    console.log('NotesSection - secondaryRoles keys:', Object.keys(userProfile.secondaryRoles));
  }
  
  // Ensure secondaryRoles is always treated as an array
  let secondaryRolesArray = [];
  if (userProfile?.secondaryRoles) {
    if (Array.isArray(userProfile.secondaryRoles)) {
      secondaryRolesArray = userProfile.secondaryRoles;
    } else if (typeof userProfile.secondaryRoles === 'object') {
      // Convert object format {driver: true} to array format ['driver']
      secondaryRolesArray = Object.keys(userProfile.secondaryRoles)
        .filter(role => userProfile.secondaryRoles[role]);
    }
  }
  
  // Detailed logging for isDriver calculation
  console.log('NotesSection - isDriver calculation details:');
  console.log('- userProfile exists?', !!userProfile);
  console.log('- primaryRole === "N/A"?', userProfile?.primaryRole === 'N/A');
  console.log('- secondaryRolesArray:', secondaryRolesArray);
  console.log('- secondaryRolesArray.length === 1?', secondaryRolesArray.length === 1);
  console.log('- includes "Driver"?', secondaryRolesArray.includes('Driver'));
  console.log('- includes "driver"?', secondaryRolesArray.includes('driver')); // Check for lowercase
  
  // Determine if the user is ONLY a driver with no other roles
  const isDriver = userProfile && 
    userProfile.primaryRole === 'N/A' && 
    secondaryRolesArray.length === 1 && 
    secondaryRolesArray.includes('driver'); // Changed to lowercase
  
  console.log('NotesSection - isDriver:', isDriver);
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>Notes</Typography>
      <Box sx={{ mb: 2 }}>
        <ButtonGroup variant="outlined" fullWidth>
          <Button 
            variant={activeTab === 'internal' ? 'contained' : 'outlined'}
            onClick={() => handleTabChange('internal')}
          >
            Internal
          </Button>
          {/* Only show dispatcher and invoice tabs if user is not a driver */}
          {!isDriver && (
            <>
              <Button 
                variant={activeTab === 'dispatcher' ? 'contained' : 'outlined'}
                onClick={() => handleTabChange('dispatcher')}
              >
                Dispatcher
              </Button>
              <Button 
                variant={activeTab === 'invoice' ? 'contained' : 'outlined'}
                onClick={() => handleTabChange('invoice')}
              >
                Invoice
              </Button>
            </>
          )}
        </ButtonGroup>
      </Box>
      <TextField
        multiline
        rows={4}
        fullWidth
        placeholder={`Enter ${activeTab} notes here...`}
        value={jobData[`${activeTab}Notes`] || ""}
        onChange={(e) => handleNotesInputChange(activeTab, e.target.value)}
      />
    </Paper>
  );
};

export default NotesSection;
