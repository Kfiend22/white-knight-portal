// useJobSocket.js
import { useState, useEffect, useRef } from 'react';

const useJobSocket = ({ onSocketStatusChange }) => {
  const [socketConnected, setSocketConnected] = useState(false);
  const fetchInProgressRef = useRef(false);

  // Set up listeners for socket connection events
  useEffect(() => {
    try {
      // Only listen for socket events, don't try to initialize the socket here
      const { getSocket } = require('../utils/socket');
      let socket;
      
      try {
        socket = getSocket();
        // Check if socket is already connected
        if (socket && socket.connected) {
          console.log('Socket is already connected');
          setSocketConnected(true);
          
          // Update parent component if callback provided
          if (onSocketStatusChange) {
            onSocketStatusChange({ connected: true, lastEvent: null });
          }
        }
      } catch (error) {
        console.warn('Socket not initialized yet, will wait for connection event');
      }
      
      // Set up listeners for custom socket events
      const handleSocketConnected = (event) => {
        console.log('Jobs: socket-connected event received:', event.detail);
        setSocketConnected(true);
        
        // Update parent component if callback provided
        if (onSocketStatusChange) {
          onSocketStatusChange({ connected: true, lastEvent: null });
        }
        
        // Set up socket event listeners when connected
        setupSocketListeners();
      };
      
      const handleSocketDisconnected = (event) => {
        console.log('Jobs: socket-disconnected event received:', event.detail);
        setSocketConnected(false);
        
        // Update parent component if callback provided
        if (onSocketStatusChange) {
          onSocketStatusChange({ connected: false, lastEvent: null });
        }
      };
      
      // Add event listeners for socket connection events
      window.addEventListener('socket-connected', handleSocketConnected);
      window.addEventListener('socket-disconnected', handleSocketDisconnected);
      
      // Cleanup function
      return () => {
        try {
          // Remove event listeners
          window.removeEventListener('socket-connected', handleSocketConnected);
          window.removeEventListener('socket-disconnected', handleSocketDisconnected);
          
          // Clean up socket listeners
          cleanupSocketListeners();
        } catch (error) {
          console.error('Error cleaning up socket connection listeners:', error);
        }
      };
    } catch (error) {
      console.error('Error setting up socket connection listeners:', error);
    }
  }, [onSocketStatusChange]);

  // Setup socket listeners for real-time updates
  const setupSocketListeners = () => {
    try {
      console.log('Setting up socket event listeners');
      // Listen for custom events dispatched by socket handlers
      window.addEventListener('job-assigned', handleJobEvent);
      window.addEventListener('job-auto-rejected', handleJobEvent);
      window.addEventListener('job-accepted', handleJobEvent);
      window.addEventListener('job-rejected', handleJobEvent);
      window.addEventListener('jobUpdated', handleJobUpdated);
    } catch (error) {
      console.error('Error setting up socket listeners:', error);
    }
  };
  
  // Handle job events
  const handleJobEvent = (event) => {
    console.log(`${event.type} event received:`, event.detail);
    
    // Update socket status in parent component if callback provided
    if (onSocketStatusChange) {
      onSocketStatusChange({ 
        connected: true, 
        lastEvent: { 
          type: event.type, 
          time: Date.now() 
        } 
      });
    }
  };
  
  // Handle jobUpdated event for real-time job updates
  const handleJobUpdated = (event) => {
    console.log('jobUpdated event received:', event.detail);
    
    // Update socket status in parent component if callback provided
    if (onSocketStatusChange) {
      onSocketStatusChange({ 
        connected: true, 
        lastEvent: { 
          type: 'jobUpdated', 
          time: Date.now() 
        } 
      });
    }
  };
  
  // Cleanup socket listeners
  const cleanupSocketListeners = () => {
    try {
      // Remove event listeners
      window.removeEventListener('job-assigned', handleJobEvent);
      window.removeEventListener('job-auto-rejected', handleJobEvent);
      window.removeEventListener('job-accepted', handleJobEvent);
      window.removeEventListener('job-rejected', handleJobEvent);
      window.removeEventListener('jobUpdated', handleJobUpdated);
    } catch (error) {
      console.error('Error cleaning up socket listeners:', error);
    }
  };

  return {
    socketConnected,
    fetchInProgressRef,
    handleJobUpdated
  };
};

export default useJobSocket;
