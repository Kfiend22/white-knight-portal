import React from 'react';
import { Box, Typography, Checkbox, FormGroup, FormControlLabel } from '@mui/material';

function ServicesField({ application, editingFields, handleFieldEdit }) {
  const services = application.services || {};
  const editingServices = editingFields[application._id]?.services || {};
  
  const handleServiceChange = (service, checked) => {
    handleFieldEdit(application._id, 'services', {
      ...services,
      ...editingServices,
      [service]: checked
    });
  };
  
  return (
    <Box>
      <Typography variant="body2" color="textSecondary" fontWeight="bold">
        Services
      </Typography>
      <FormGroup>
        {['towing', 'roadside', 'transport', 'storage'].map(service => (
          <FormControlLabel
            key={service}
            control={
              <Checkbox
                checked={editingServices[service] !== undefined 
                  ? editingServices[service] 
                  : services[service] || false}
                onChange={(e) => handleServiceChange(service, e.target.checked)}
                size="small"
              />
            }
            label={service.charAt(0).toUpperCase() + service.slice(1)}
          />
        ))}
      </FormGroup>
    </Box>
  );
}

export default ServicesField;
