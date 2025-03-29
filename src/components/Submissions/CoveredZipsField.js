import React from 'react';
import { Box, Typography, TextField } from '@mui/material';

function CoveredZipsField({ application, editingFields, handleFieldEdit }) {
  const territories = application.territories || {};
  const editingTerritories = editingFields[application._id]?.territories || {};
  
  const handleZipCodesChange = (e) => {
    handleFieldEdit(application._id, 'territories', {
      ...territories,
      ...editingTerritories,
      zipCodes: e.target.value
    });
  };
  
  return (
    <Box>
      <Typography variant="body2" color="textSecondary" fontWeight="bold">
        Covered ZIP Codes
      </Typography>
      <TextField
        fullWidth
        size="small"
        variant="outlined"
        placeholder="Enter ZIP codes separated by commas"
        value={editingTerritories.zipCodes !== undefined 
          ? editingTerritories.zipCodes 
          : territories.zipCodes || ''}
        onChange={handleZipCodesChange}
        multiline
        rows={2}
      />
    </Box>
  );
}

export default CoveredZipsField;
