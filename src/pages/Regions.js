// src/pages/Regions.js
import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import SideMenu from '../components/SideMenu';
import RegionManagement from '../settings/RegionManagement';

const Regions = () => {
  return (
    <>
      <SideMenu />
      <Container maxWidth={false}>
      <Box my={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Region Management
        </Typography>
        <Paper sx={{ p: 3 }}>
          <RegionManagement />
        </Paper>
      </Box>
      </Container>
    </>
  );
};

export default Regions;
