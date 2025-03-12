import React from 'react';
import { Typography, Box } from '@mui/material';

const HeroSection = () => {
  return (
    <Box sx={{ p: 4, textAlign: 'center', backgroundColor: '#f5f5f5' }}>
      <Typography variant="h4" gutterBottom>
        Welcome to Our Service Provider Application
      </Typography>
      <Typography variant="body1">
        Please fill out the form to become a certified service provider.
      </Typography>
    </Box>
  );
};

export default HeroSection;
