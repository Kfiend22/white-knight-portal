import React from 'react';
import { Box, Typography, TextField, Grid } from '@mui/material';

function BusinessInfoField({ application, editingFields, handleFieldEdit }) {
  const businessInfo = application.businessInfo || {};
  const editingBusinessInfo = editingFields[application._id]?.businessInfo || {};
  
  const handleBusinessInfoChange = (field, value) => {
    handleFieldEdit(application._id, 'businessInfo', {
      ...businessInfo,
      ...editingBusinessInfo,
      [field]: value
    });
  };
  
  return (
    <Box>
      <Typography variant="body2" color="textSecondary" fontWeight="bold">
        Business Information
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField
            fullWidth
            size="small"
            label="Business Type"
            variant="outlined"
            value={editingBusinessInfo.type !== undefined 
              ? editingBusinessInfo.type 
              : businessInfo.type || ''}
            onChange={(e) => handleBusinessInfoChange('type', e.target.value)}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            size="small"
            label="Years in Business"
            variant="outlined"
            type="number"
            value={editingBusinessInfo.yearsInBusiness !== undefined 
              ? editingBusinessInfo.yearsInBusiness 
              : businessInfo.yearsInBusiness || ''}
            onChange={(e) => handleBusinessInfoChange('yearsInBusiness', e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            size="small"
            label="Tax ID / EIN"
            variant="outlined"
            value={editingBusinessInfo.taxId !== undefined 
              ? editingBusinessInfo.taxId 
              : businessInfo.taxId || ''}
            onChange={(e) => handleBusinessInfoChange('taxId', e.target.value)}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default BusinessInfoField;
