import React from 'react';
import { Box, Typography, TextField, Grid } from '@mui/material';

function InsuranceCoverageField({ application, editingFields, handleFieldEdit }) {
  const insurance = application.insurance || {};
  const editingInsurance = editingFields[application._id]?.insurance || {};
  
  const handleInsuranceChange = (field, value) => {
    handleFieldEdit(application._id, 'insurance', {
      ...insurance,
      ...editingInsurance,
      [field]: value
    });
  };
  
  return (
    <Box>
      <Typography variant="body2" color="textSecondary" fontWeight="bold">
        Insurance Coverage
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField
            fullWidth
            size="small"
            label="Policy Number"
            variant="outlined"
            value={editingInsurance.policyNumber !== undefined 
              ? editingInsurance.policyNumber 
              : insurance.policyNumber || ''}
            onChange={(e) => handleInsuranceChange('policyNumber', e.target.value)}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            size="small"
            label="Provider"
            variant="outlined"
            value={editingInsurance.provider !== undefined 
              ? editingInsurance.provider 
              : insurance.provider || ''}
            onChange={(e) => handleInsuranceChange('provider', e.target.value)}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            size="small"
            label="Coverage Amount"
            variant="outlined"
            value={editingInsurance.coverageAmount !== undefined 
              ? editingInsurance.coverageAmount 
              : insurance.coverageAmount || ''}
            onChange={(e) => handleInsuranceChange('coverageAmount', e.target.value)}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            size="small"
            label="Expiration Date"
            variant="outlined"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={editingInsurance.expirationDate !== undefined 
              ? editingInsurance.expirationDate 
              : insurance.expirationDate || ''}
            onChange={(e) => handleInsuranceChange('expirationDate', e.target.value)}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default InsuranceCoverageField;
