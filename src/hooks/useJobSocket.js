// useJobSocket.js
import { useState, useEffect, useRef, useCallback } from 'react';

const useJobSocket = ({ onSocketStatusChange }) => {
  const [socketConnected, setSocketConnected] = useState(false);
  const fetchInProgressRef = useRef(false);
  const listenersSetupRef = useRef(false);

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
        
        // Set up socket event listeners when connected, but only once
        if (!listenersSetupRef.current) {
          setupSocketListeners();
          listenersSetupRef.current = true;
        }
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
  }, []); // Empty dependency array to prevent re-running and avoid reference errors

  // Handle job events - using useCallback to maintain stable reference
  const handleJobEvent = useCallback((event) => {
    console.log(`${event.type} event received:`, event.detail);
    
    // Update socket status in parent component if callback provided
    if (onSocketStatusChange) {
      onSocketStatusChange({ 
        connected: true, 
        lastEvent: { 
          type: event.type, 
          time: Date.now(),
          data: event.detail // Include the event data
        } 
      });
    }
  }, [onSocketStatusChange]);
  
// Handle jobUpdated event for real-time job updates - using useCallback to maintain stable reference
  const handleJobUpdated = useCallback((event) => {
    console.log('jobUpdated event received:', event.detail);
    
    // Check if this is a job unassignment update (when driver is cleared)
    const updatedJob = event.detail;
    const previousState = updatedJob?._previousState;
    
    if (previousState) {
      // If we have previous state with a driver but the current job has no driver,
      // this is an unassignment notification
      if (previousState.driverId && !updatedJob.driverId) {
        console.log('Job unassignment detected:', {
          jobId: updatedJob._id || updatedJob.id,
          previousDriverId: previousState.driverId,
          previousDriver: previousState.driver,
          currentStatus: updatedJob.status
        });
        
        // Dispatch a custom event for job removal to force UI update
        const jobRemovedEvent = new CustomEvent('job-removed', {
          detail: {
            jobId: updatedJob._id || updatedJob.id,
            reason: updatedJob.status === 'Pending' ? 'unassigned' : updatedJob.status
          }
        });
        window.dispatchEvent(jobRemovedEvent);
      }
    }
    
    // Update socket status in parent component if callback provided
    if (onSocketStatusChange) {
      onSocketStatusChange({ 
        connected: true, 
        lastEvent: { 
          type: 'jobUpdated', 
          time: Date.now(),
          data: event.detail // Include the event data
        } 
      });
    }
  }, [onSocketStatusChange]);
  
  // Handle job removed event - using useCallback to maintain stable reference
  const handleJobRemoved = useCallback((event) => {
    console.log('jobRemoved event received:', event.detail);
    
    // Dispatch a custom event for job removal to force UI update
    const jobRemovedEvent = new CustomEvent('job-removed', {
      detail: event.detail
    });
    window.dispatchEvent(jobRemovedEvent);
    
    // Update socket status in parent component if callback provided
    if (onSocketStatusChange) {
      onSocketStatusChange({ 
        connected: true, 
        lastEvent: { 
          type: 'jobRemoved', 
          time: Date.now(),
          data: event.detail // Include the event data
        } 
      });
    }
  }, [onSocketStatusChange]);

  // Setup socket listeners for real-time updates
  const setupSocketListeners = useCallback(() => {
    try {
      console.log('Setting up socket event listeners');
      // Listen for custom events dispatched by socket handlers
      window.addEventListener('job-assigned', handleJobEvent);
      window.addEventListener('job-auto-rejected', handleJobEvent);
      window.addEventListener('job-accepted', handleJobEvent);
      window.addEventListener('job-rejected', handleJobEvent);
      window.addEventListener('jobUpdated', handleJobUpdated);
      window.addEventListener('jobRemoved', handleJobRemoved);
    } catch (error) {
      console.error('Error setting up socket listeners:', error);
    }
  }, [handleJobEvent, handleJobUpdated, handleJobRemoved]);
  
  // Cleanup socket listeners
  const cleanupSocketListeners = useCallback(() => {
    try {
      // Remove event listeners
      window.removeEventListener('job-assigned', handleJobEvent);
      window.removeEventListener('job-auto-rejected', handleJobEvent);
      window.removeEventListener('job-accepted', handleJobEvent);
      window.removeEventListener('job-rejected', handleJobEvent);
      window.removeEventListener('jobUpdated', handleJobUpdated);
      window.removeEventListener('jobRemoved', handleJobRemoved);
      window.removeEventListener('job-removed', handleJobRemoved); // Also remove any custom event
      
      // Reset the listeners setup flag
      listenersSetupRef.current = false;
    } catch (error) {
      console.error('Error cleaning up socket listeners:', error);
    }
  }, [handleJobEvent, handleJobUpdated, handleJobRemoved]);

  return {
    socketConnected,
    fetchInProgressRef,
    handleJobUpdated,
    handleJobRemoved
  };
};

export default useJobSocket;
