import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Payments from './pages/Payments';
import Performance from './pages/Performance';
import Settings from './pages/Settings';
import ApplicationForm from './pages/ApplicationForm.js'
import Submissions from './pages/Submissions';
import Regions from './pages/Regions';
import { isTokenExpired, verifyToken } from './utils/authUtils';
import { initSocket, disconnectSocket } from './utils/socket';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { NotificationProvider, useNotification, showGlobalNotification } from './context/NotificationContext';
import { Snackbar, Alert } from '@mui/material';

// Protected route component
const ProtectedRoute = ({ element, allowedRoles = [] }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [secondaryRoles, setSecondaryRoles] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthentication = async () => {
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      const userJson = localStorage.getItem('user');
      
      console.log('ProtectedRoute - Token:', token ? 'exists' : 'missing');
      
      if (!token) {
        console.log('ProtectedRoute - No token found');
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      
      // Check if token is expired
      if (isTokenExpired(token)) {
        console.log('ProtectedRoute - Token is expired');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      
      // Verify token with server
      const isValid = await verifyToken();
      if (!isValid) {
        console.log('ProtectedRoute - Token verification failed');
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      
      // If we have a valid token and user data, set authenticated
      if (userJson) {
        try {
          const user = JSON.parse(userJson);
          console.log('ProtectedRoute - Parsed user:', user);
          
          setIsAuthenticated(true);
          
          // Check for primaryRole first, then fall back to legacy role field
          if (user.primaryRole || user.role) {
            const effectiveRole = user.primaryRole || user.role;
            console.log('ProtectedRoute - Setting user role:', effectiveRole);
            setUserRole(effectiveRole);
            
            // Store secondary roles if available
            if (user.secondaryRoles) {
              console.log('ProtectedRoute - Setting secondary roles:', user.secondaryRoles);
              setSecondaryRoles(user.secondaryRoles);
            }
          } else {
            console.warn('ProtectedRoute - No role in user data');
            // Set a default role to ensure basic access
            setUserRole('SP'); // Service Provider as default
          }
        } catch (error) {
          console.error('ProtectedRoute - Error parsing user data:', error);
          setIsAuthenticated(false);
        }
      } else {
        console.log('ProtectedRoute - No user data found');
        setIsAuthenticated(false);
      }
      
      setLoading(false);
    };
    
    checkAuthentication();
  }, []);

  // Helper function to check if user has access to a route
  const hasAccess = (roles) => {
    // If no roles specified, everyone has access
    if (!roles || roles.length === 0) return true;
    
    // Check if primary role has access
    if (roles.includes(userRole)) return true;
    
    // For sOW users, always grant access to all pages
    if (userRole === 'sOW') return true;
    
    // Check if any secondary role has access
    if (secondaryRoles) {
      for (const [role, hasRole] of Object.entries(secondaryRoles)) {
        if (hasRole && roles.includes(role)) return true;
      }
    }
    
    return false;
  };

  console.log('ProtectedRoute - State:', { 
    isAuthenticated, 
    userRole,
    secondaryRoles,
    loading, 
    allowedRoles 
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log('ProtectedRoute - Not authenticated, redirecting to login');
    return <Navigate to="/login" />;
  }

  // If role check is required and user doesn't have the required role
  if (allowedRoles.length > 0 && !hasAccess(allowedRoles)) {
    console.log(`ProtectedRoute - User with role ${userRole} and secondary roles ${JSON.stringify(secondaryRoles)} does not have access to route with allowed roles:`, allowedRoles);
    return <Navigate to="/dashboard" />;
  }

  // If authenticated and has the required role, render the component
  console.log('ProtectedRoute - Rendering component');
  return element;
};

// Global notification component
const GlobalNotification = () => {
  const { notification, handleCloseNotification } = useNotification();
  
  console.log('%c GlobalNotification: Rendering', 'background: #2196F3; color: white; padding: 2px 5px; border-radius: 2px;', notification);
  
  // Log when the notification changes
  React.useEffect(() => {
    console.log('GlobalNotification: notification state changed to:', notification);
  }, [notification]);
  
  return (
    <Snackbar
      open={notification.show}
      autoHideDuration={10000}
      onClose={handleCloseNotification}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      sx={{ 
        width: '100%',
        zIndex: 9999, // Ensure it appears on top of everything
        position: 'fixed', // Force fixed positioning
        top: 0,
        left: 0,
        right: 0,
        '& .MuiPaper-root': { 
          width: '100%', 
          maxWidth: '600px',
          boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.3)' // Stronger shadow
        }
      }}
    >
      <Alert 
        onClose={handleCloseNotification} 
        severity={notification.severity || 'info'} 
        variant="filled"
        sx={{ 
          width: '100%',
          fontSize: '1.1rem', // Larger text
          fontWeight: 'bold', // Bold text
          '& .MuiAlert-icon': {
            fontSize: '1.8rem' // Larger icon
          },
          '& .MuiAlert-action': {
            paddingTop: 0 // Align close button
          }
        }}
      >
        {notification.message || 'Notification'}
      </Alert>
    </Snackbar>
  );
};

// Test component to trigger notifications manually
const TestNotificationButton = () => {
  const { showNotification } = useNotification();
  const [audioUnlocked, setAudioUnlocked] = useState(
    localStorage.getItem('audioContextUnlocked') === 'true'
  );
  
  // Check if audio is unlocked
  useEffect(() => {
    const checkAudioUnlocked = () => {
      const isUnlocked = localStorage.getItem('audioContextUnlocked') === 'true';
      setAudioUnlocked(isUnlocked);
    };
    
    // Check initially
    checkAudioUnlocked();
    
    // Set up an interval to check periodically
    const intervalId = setInterval(checkAudioUnlocked, 2000);
    
    // Clean up
    return () => clearInterval(intervalId);
  }, []);
  
  const handleTestClick = () => {
    console.log('TestNotificationButton: Triggering test notification');
    
    // Show notification
    showNotification('This is a test notification', 'info', null);
    
    // Also store a test event in sessionStorage
    try {
      const testEvent = {
        type: 'jobAssigned',
        timestamp: new Date().toISOString(),
        data: {
          jobId: 'test-' + Date.now(),
          jobDetails: {
            service: 'Test Service',
            location: 'Test Location'
          }
        }
      };
      
      const storedEvents = JSON.parse(sessionStorage.getItem('socketEvents') || '[]');
      storedEvents.push(testEvent);
      sessionStorage.setItem('socketEvents', JSON.stringify(storedEvents.slice(-10))); // Keep last 10 events
      
      // Set the flag to show notification
      sessionStorage.setItem('showNotification', 'true');
    } catch (storageError) {
      console.error('Error storing test event in sessionStorage:', storageError);
    }
  };
  
  const handleSoundTestClick = () => {
    console.log('TestNotificationButton: Testing sound only');
    
    // Use the showNotification function to play the sound
    showNotification('Testing sound only', 'info', null);
    
    // Mark audio as unlocked since this is a user interaction
    localStorage.setItem('audioContextUnlocked', 'true');
    setAudioUnlocked(true);
  };
  
  const handleSimulateJobAssigned = () => {
    console.log('TestNotificationButton: Simulating jobAssigned event');
    
    // Create a simulated jobAssigned event
    const simulatedData = {
      jobId: 'sim-' + Date.now(),
      jobDetails: {
        service: 'Simulated Service',
        location: 'Simulated Location',
        status: 'Pending Acceptance',
        autoRejectAt: new Date(Date.now() + 360000).toISOString(), // 6 minutes from now
        needsAcceptance: true
      },
      message: 'New job assigned: Simulated Service at Simulated Location'
    };
    
    // Dispatch a custom event to simulate the socket event
    window.dispatchEvent(new CustomEvent('job-assigned', { detail: simulatedData }));
    
    // Also call the socket event handler directly
    if (window.socketEventHandlers && typeof window.socketEventHandlers.jobAssigned === 'function') {
      window.socketEventHandlers.jobAssigned(simulatedData);
    } else {
      console.log('Socket event handlers not available, using showGlobalNotification directly');
      showGlobalNotification(
        `New job assigned: ${simulatedData.jobDetails.service} at ${simulatedData.jobDetails.location}`,
        'info',
        simulatedData.jobId
      );
    }
  };
  
  const handleUnlockAudio = () => {
    console.log('TestNotificationButton: Unlocking audio');
    
    // Play a silent sound to unlock audio
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.1; // Low volume
      
      // Try to play the sound
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('Audio unlocked successfully');
          localStorage.setItem('audioContextUnlocked', 'true');
          setAudioUnlocked(true);
          
          // Show a success notification
          showNotification('Audio notifications enabled!', 'success', null);
        }).catch(err => {
          console.error('Error unlocking audio:', err);
        });
      }
    } catch (error) {
      console.error('Error with audio unlock:', error);
    }
  };
  
  return (
    <div style={{ 
      position: 'fixed',
      top: '70px', // Position from the top, increased to avoid overlap with global notification
      left: '50%',  // Start at the horizontal center
      transform: 'translateX(-50%)', // Center precisely
      zIndex: 9999,
      padding: '10px',
      backgroundColor: '#f0f0f0',
      borderRadius: '5px',
      boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
      display: 'flex', // Use flexbox for horizontal centering of buttons
      flexDirection: 'row', // Arrange buttons horizontally
      justifyContent: 'center', // Center buttons horizontally
      gap: '8px' // Add some space between the buttons
    }}>
      {!audioUnlocked && (
        <button 
          onClick={handleUnlockAudio}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ff5722',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Enable Audio
        </button>
      )}
      <button 
        onClick={handleTestClick}
        style={{
          padding: '8px 16px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        Test Notification
      </button>
      <button 
        onClick={handleSoundTestClick}
        style={{
          padding: '8px 16px',
          backgroundColor: '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        Test Sound
      </button>
      <button 
        onClick={handleSimulateJobAssigned}
        style={{
          padding: '8px 16px',
          backgroundColor: '#FF9800',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        Simulate Job
      </button>
    </div>
  );
};

function App() {
  // State to track if socket is initialized
  const [socketInitialized, setSocketInitialized] = useState(false);
  
  // Initialize socket connection when app loads or when token changes
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      console.log('App: Initializing socket connection');
      
      // Check if socket is already initialized to prevent duplicate connections
      try {
        const { getSocket } = require('./utils/socket');
        const existingSocket = getSocket();
        
        if (existingSocket && existingSocket.connected) {
          console.log('App: Socket already connected, skipping initialization');
          setSocketInitialized(true);
          return;
        }
      } catch (error) {
        // If getSocket throws an error, it means the socket isn't initialized yet
        console.log('App: No existing socket connection found, proceeding with initialization');
      }
      
      // Initialize the socket
      const socket = initSocket(token);
      
      // Store socket event handlers on window for direct access
      window.socketEventHandlers = {
        jobAssigned: (data) => {
          console.log('App: Direct jobAssigned handler called with:', data);
          
          // Use the global notification function which will handle sound playback
          // Add a small delay to ensure the notification context is ready
          setTimeout(() => {
            showGlobalNotification(
              `New job assigned: ${data.jobDetails.service} at ${data.jobDetails.location}`,
              'info',
              data.jobId
            );
          }, 100);
        }
      };
      
      setSocketInitialized(true);
      
      // Set up a listener for the socket-connected event
      const handleSocketConnected = (event) => {
        console.log('App: Socket connected event received:', event.detail);
        setSocketInitialized(true);
      };
      
      // Set up a listener for the socket-disconnected event
      const handleSocketDisconnected = (event) => {
        console.log('App: Socket disconnected event received:', event.detail);
        
        // Try to reconnect after a short delay, but only if we're still mounted
        // Use a ref to track if we're still mounted
        const reconnectTimeout = setTimeout(() => {
          console.log('App: Attempting to reconnect socket');
          initSocket(token);
        }, 5000); // Increased delay to 5 seconds to reduce reconnection frequency
        
        // Store the timeout ID so we can clear it if the component unmounts
        window.reconnectTimeoutId = reconnectTimeout;
      };
      
      // Add event listeners
      window.addEventListener('socket-connected', handleSocketConnected);
      window.addEventListener('socket-disconnected', handleSocketDisconnected);
      
      // Cleanup socket connection and event listeners when component unmounts or token changes
      return () => {
        console.log('App: Cleaning up socket connection');
        
        // Clear any pending reconnect timeout
        if (window.reconnectTimeoutId) {
          clearTimeout(window.reconnectTimeoutId);
          delete window.reconnectTimeoutId;
        }
        
        // Disconnect the socket
        disconnectSocket();
        
        // Remove socket event handlers
        delete window.socketEventHandlers;
        
        // Remove event listeners
        window.removeEventListener('socket-connected', handleSocketConnected);
        window.removeEventListener('socket-disconnected', handleSocketDisconnected);
      };
    } else {
      console.log('App: No token found, socket not initialized');
      setSocketInitialized(false);
    }
  }, []);
  
  // Check for pending notification sounds and handle notifications across tabs
  useEffect(() => {
    // Function to check and play pending notification sounds
    const checkPendingNotifications = () => {
      console.log('App: Checking for pending notification sounds');
      
      // Check if there's a pending notification sound
      const hasPendingSound = sessionStorage.getItem('pendingNotificationSound') === 'true';
      
      if (hasPendingSound) {
        console.log('App: Found pending notification sound, playing it now');
        
        // Get the stored events
        try {
          const storedEvents = JSON.parse(sessionStorage.getItem('socketEvents') || '[]');
          const unplayedEvents = storedEvents.filter(event => 
            event.type === 'jobAssigned' && event.soundPlayed === false
          );
          
          if (unplayedEvents.length > 0) {
            console.log(`App: Found ${unplayedEvents.length} unplayed notification events`);
            
            // Play notification sound
            try {
              const audio = new Audio('/notification-sound.mp3');
              audio.volume = 1.0;
              audio.play().catch(err => {
                console.error('App: Error playing notification sound:', err);
              });
            } catch (audioError) {
              console.error('App: Error with audio playback:', audioError);
            }
            
            // Mark all events as having played sound
            const updatedEvents = storedEvents.map(event => {
              if (event.type === 'jobAssigned' && !event.soundPlayed) {
                return { ...event, soundPlayed: true };
              }
              return event;
            });
            
            sessionStorage.setItem('socketEvents', JSON.stringify(updatedEvents));
            
            // Clear the pending notification sound flag
            sessionStorage.removeItem('pendingNotificationSound');
          }
        } catch (storageError) {
          console.error('App: Error processing stored events:', storageError);
        }
      }
    };
    
    // Check for pending notifications when the component mounts
    // This ensures that if a job was dispatched while the user was away,
    // the sound will play when they return to the app
    checkPendingNotifications();
    
    // Handle storage events for cross-tab notifications
    const handleStorageChange = (e) => {
      if (e.key === 'showNotification' && e.newValue === 'true') {
        console.log('App: Detected showNotification flag in storage event');
        
        // Get the stored events
        try {
          const storedEvents = JSON.parse(sessionStorage.getItem('socketEvents') || '[]');
          if (storedEvents.length > 0) {
            // Get the most recent jobAssigned event
            const jobAssignedEvents = storedEvents.filter(event => event.type === 'jobAssigned');
            if (jobAssignedEvents.length > 0) {
              const latestEvent = jobAssignedEvents[jobAssignedEvents.length - 1];
              
              // Show notification for this event using the global function
              if (latestEvent.data && latestEvent.data.jobDetails) {
                showGlobalNotification(
                  `New job assigned: ${latestEvent.data.jobDetails.service} at ${latestEvent.data.jobDetails.location}`,
                  'info',
                  latestEvent.data.jobId
                );
              }
            }
          }
          
          // Clear the flag
          sessionStorage.removeItem('showNotification');
        } catch (storageError) {
          console.error('Error processing stored events in storage event handler:', storageError);
        }
      } else if (e.key === 'pendingNotificationSound' && e.newValue === 'true') {
        // If another tab sets the pendingNotificationSound flag, check for pending notifications
        checkPendingNotifications();
      }
    };
    
    // Add event listener
    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  return (
    <NotificationProvider>
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column' 
      }}>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatRoutes: true,
            v7_relativeSplatPath: true
          }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        >
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
            <Route path="/payments" element={<ProtectedRoute element={<Payments />} />} />
            <Route path="/performance" element={<ProtectedRoute element={<Performance />} />} />
            <Route path="/settings" element={<ProtectedRoute element={<Settings />} />} />
            <Route path="/applicationform" element={<ProtectedRoute element={<ApplicationForm />} />} />
            <Route path="/submissions" element={<ProtectedRoute element={<Submissions />} allowedRoles={['OW', 'RM', 'sOW']} />} />
            
            {/* Owner-only routes */}
            <Route path="/regions" element={<ProtectedRoute element={<Regions />} allowedRoles={['OW', 'sOW']} />} />
          </Routes>
        </Router>
        
        {/* Global notification */}
        <GlobalNotification />
        
        {/* Test notification button */}
        <TestNotificationButton />
        
        {/* Toast container for notifications */}
        <ToastContainer position="top-right" />
      </div>
    </NotificationProvider>
  );
}

export default App;
