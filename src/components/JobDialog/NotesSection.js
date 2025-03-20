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
 * @param {string} props.activeTab Active notes tab
 * @param {Function} props.handleTabChange Function to handle tab changes
 * @returns {JSX.Element} Notes section component
 */
const NotesSection = ({ jobData, handleInputChange, activeTab, handleTabChange }) => {
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
        </ButtonGroup>
      </Box>
      <TextField
        multiline
        rows={4}
        fullWidth
        placeholder={`Enter ${activeTab} notes here...`}
        value={jobData.notes}
        onChange={(e) => handleInputChange('notes', e.target.value)}
      />
    </Paper>
  );
};

export default NotesSection;
