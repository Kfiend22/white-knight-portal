import React from 'react';
import { useLoading } from '../context/LoadingContext';
import { Box, CircularProgress, Backdrop } from '@mui/material';

const GlobalSpinner = () => {
  const { isLoading } = useLoading();

  return (
    <Backdrop
      sx={{
        color: '#fff',
        // Ensure spinner is above everything except modals/dialogs (usually z-index 1300+)
        // Use a value slightly lower than MUI's Modal z-index (1300) but higher than most content (e.g., AppBar is 1100)
        zIndex: (theme) => theme.zIndex.drawer + 10, // Example: 1210 if drawer is 1200
        // Make backdrop slightly transparent
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      }}
      open={isLoading}
    >
      <CircularProgress color="inherit" size={60} thickness={4} />
    </Backdrop>
  );
};

export default GlobalSpinner;
