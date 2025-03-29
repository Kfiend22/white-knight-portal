import React from 'react';
import { Box, Typography, TextField, Grid } from '@mui/material';

function OwnershipField({ application, editingFields, handleFieldEdit }) {
  const ownership = application.ownership || {};
  const editingOwnership = editingFields[application._id]?.ownership || {};
  
  const handleOwnershipChange = (field, value) => {
    handleFieldEdit(application._id, 'ownership', {
      ...ownership,
      ...editingOwnership,
      [field]: value
    });
  };
  
  return (
    <Box>
      <Typography variant="body2" color="textSecondary" fontWeight="bold">
        Ownership Information
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField
            fullWidth
            size="small"
            label="Owner Name"
            variant="outlined"
            value={editingOwnership.ownerName !== undefined 
              ? editingOwnership.ownerName 
              : ownership.ownerName || ''}
            onChange={(e) => handleOwnershipChange('ownerName', e.target.value)}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            size="small"
            label="Ownership Type"
            variant="outlined"
            value={editingOwnership.type !== undefined 
              ? editingOwnership.type 
              : ownership.type || ''}
            onChange={(e) => handleOwnershipChange('type', e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            size="small"
            label="Additional Owners"
            variant="outlined"
            multiline
            rows={2}
            value={editingOwnership.additionalOwners !== undefined 
              ? editingOwnership.additionalOwners 
              : ownership.additionalOwners || ''}
            onChange={(e) => handleOwnershipChange('additionalOwners', e.target.value)}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default OwnershipField;
