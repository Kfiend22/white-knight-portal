// DebugPanel.js
// Debug panel component for the Dashboard

import React from 'react';
import {
  Box,
  Typography,
  Switch,
  Card,
  CardContent,
  Button,
  Divider
} from '@mui/material';

/**
 * Debug panel component for displaying debug information
 * @param {Object} props Component props
 * @param {boolean} props.debugMode Debug mode state
 * @param {Function} props.setDebugMode Function to toggle debug mode
 * @param {Object} props.userProfile User profile data
 * @param {Object} props.socketStatus Socket connection status
 * @param {Function} props.setSocketStatus Function to update socket status
 * @param {Function} props.setNotification Function to show notifications
 * @returns {JSX.Element} Debug panel component
 */
const DebugPanel = ({ 
  debugMode, 
  setDebugMode, 
  userProfile, 
  socketStatus, 
  setSocketStatus,
  setNotification 
}) => {
  // Handler for test event dispatch
  const handleTestEvent = () => {
    // Manually dispatch a test event
    window.dispatchEvent(new CustomEvent('job-assigned', { 
      detail: { message: 'Test job assignment event' } 
    }));
    
    setSocketStatus(prev => ({
      ...prev,
      lastEvent: { type: 'job-assigned (test)', time: Date.now() }
    }));
    
    setNotification({
      open: true,
      message: 'Test job-assigned event dispatched',
      severity: 'info'
    });
  };

  return (
    <Box mb={2}>
      <Box display="flex" justifyContent="flex-end" alignItems="center">
        <Typography variant="caption" sx={{ mr: 1 }}>Debug Mode</Typography>
        <Switch
          checked={debugMode}
          onChange={(e) => setDebugMode(e.target.checked)}
          size="small"
        />
      </Box>
      
      {debugMode && (
        <Card variant="outlined" sx={{ mt: 1, mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Debug Information</Typography>
            
            <Typography variant="subtitle1">User Profile</Typography>
            <Box sx={{ p: 1, mb: 2, bgcolor: 'background.paper', borderRadius: 1, fontSize: '0.875rem' }}>
              <pre style={{ margin: 0, overflow: 'auto' }}>
                {JSON.stringify(userProfile, null, 2)}
              </pre>
            </Box>
            
            <Typography variant="subtitle1">Socket Status</Typography>
            <Box sx={{ p: 1, bgcolor: 'background.paper', borderRadius: 1, fontSize: '0.875rem' }}>
              <Typography>
                Connected: <span style={{ color: socketStatus.connected ? 'green' : 'red' }}>
                  {socketStatus.connected ? 'Yes' : 'No'}
                </span>
              </Typography>
              {socketStatus.lastEvent && (
                <Typography>
                  Last Event: {socketStatus.lastEvent.type} at {new Date(socketStatus.lastEvent.time).toLocaleTimeString()}
                </Typography>
              )}
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle1">Socket Event Listeners</Typography>
            <Button 
              variant="outlined" 
              color="primary" 
              size="small"
              onClick={handleTestEvent}
            >
              Test Job Assigned Event
            </Button>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default DebugPanel;
