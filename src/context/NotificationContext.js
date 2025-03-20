import React, { createContext, useState, useContext } from 'react';

// Create the notification context
const NotificationContext = createContext();

// Global reference to the notification functions
// This allows non-React code (like socket.js) to access the notification functions
let notificationFunctions = {
  showNotification: () => console.warn('NotificationContext not initialized'),
  setNotification: () => console.warn('NotificationContext not initialized'),
};

// Custom hook to use the notification context
export const useNotification = () => useContext(NotificationContext);

// Function to show a notification from outside React components
export const showGlobalNotification = (message, severity = 'info', jobId = null) => {
  console.log('NotificationContext: showGlobalNotification called with:', { message, severity, jobId });
  
  // Call the notification function - sound will be played by showNotification
  try {
    notificationFunctions.showNotification(message, severity, jobId);
  } catch (error) {
    console.error('Error calling showNotification in NotificationContext:', error);
    
    // Fallback: Try to show a toast notification if the main notification fails
    try {
      // Check if we have access to the toast API
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.info(message, {
          position: "top-right",
          autoClose: false,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } catch (toastError) {
      console.error('Error showing fallback toast notification:', toastError);
    }
  }
};

// Provider component
export const NotificationProvider = ({ children }) => {
  // Notification state
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    jobId: null,
    severity: 'info' // Can be 'info', 'success', 'warning', or 'error'
  });

  // Function to close the notification
  const handleCloseNotification = () => {
    console.log('NotificationContext: handleCloseNotification called');
    setNotification(prev => ({ ...prev, show: false }));
  };

  // Audio context for Web Audio API
  const [audioContextUnlocked, setAudioContextUnlocked] = useState(false);
  const audioContextRef = React.useRef(null);
  
  // Function to unlock audio context after user interaction
  const unlockAudioContext = React.useCallback(() => {
    console.log('NotificationContext: Attempting to unlock audio context');
    
    // Check if audio is already unlocked
    if (audioContextUnlocked) {
      console.log('NotificationContext: Audio context already unlocked');
      return true;
    }
    
    try {
      // Create audio context if it doesn't exist
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      // Resume the audio context (this is what requires user interaction)
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().then(() => {
          console.log('NotificationContext: Audio context resumed successfully');
          setAudioContextUnlocked(true);
          // Store in localStorage that we've unlocked audio
          localStorage.setItem('audioContextUnlocked', 'true');
        }).catch(err => {
          console.error('NotificationContext: Failed to resume audio context:', err);
        });
      } else {
        console.log('NotificationContext: Audio context already running');
        setAudioContextUnlocked(true);
        localStorage.setItem('audioContextUnlocked', 'true');
      }
      
      return true;
    } catch (error) {
      console.error('NotificationContext: Error unlocking audio context:', error);
      return false;
    }
  }, [audioContextUnlocked]);
  
  // Check if audio was previously unlocked
  React.useEffect(() => {
    const wasUnlocked = localStorage.getItem('audioContextUnlocked') === 'true';
    if (wasUnlocked) {
      console.log('NotificationContext: Audio was previously unlocked');
      setAudioContextUnlocked(true);
    }
    
    // Add a one-time event listener to unlock audio on first user interaction
    const unlockOnInteraction = () => {
      unlockAudioContext();
      // Remove the event listeners after first interaction
      document.removeEventListener('click', unlockOnInteraction);
      document.removeEventListener('touchstart', unlockOnInteraction);
      document.removeEventListener('keydown', unlockOnInteraction);
    };
    
    document.addEventListener('click', unlockOnInteraction);
    document.addEventListener('touchstart', unlockOnInteraction);
    document.addEventListener('keydown', unlockOnInteraction);
    
    return () => {
      // Clean up event listeners
      document.removeEventListener('click', unlockOnInteraction);
      document.removeEventListener('touchstart', unlockOnInteraction);
      document.removeEventListener('keydown', unlockOnInteraction);
    };
  }, [unlockAudioContext]);
  
  // Play notification sound
  const playNotificationSound = React.useCallback(() => {
    console.log('NotificationContext: Playing notification sound');
    
    // Try to use Web Audio API if it's unlocked
    if (audioContextUnlocked && audioContextRef.current) {
      try {
        console.log('NotificationContext: Using Web Audio API');
        
        // Fetch the audio file
        fetch('/notification-sound.mp3')
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            console.log('Audio file fetched successfully');
            return response.arrayBuffer();
          })
          .then(arrayBuffer => {
            console.log('Decoding audio data');
            return audioContextRef.current.decodeAudioData(arrayBuffer);
          })
          .then(audioBuffer => {
            console.log('Audio data decoded successfully, playing sound');
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current.destination);
            source.start(0);
          })
          .catch(error => {
            console.error('Error with Web Audio API:', error);
            fallbackAudioPlay();
          });
      } catch (error) {
        console.error('Error with Web Audio API setup:', error);
        fallbackAudioPlay();
      }
    } else {
      // Fall back to simpler methods if Web Audio API is not available or unlocked
      fallbackAudioPlay();
    }
  }, [audioContextUnlocked]);
  
  // Fallback audio playback method
  const fallbackAudioPlay = () => {
    console.log('NotificationContext: Using fallback audio playback');
    
    try {
      // Create and play audio element
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 1.0;
      
      // Add event listeners to track playback
      audio.addEventListener('play', () => console.log('Audio playback started'));
      audio.addEventListener('error', (e) => console.error('Audio playback error:', e));
      
      // Try to play the sound
      const playPromise = audio.play();
      
      // Modern browsers return a promise from play()
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.error('Error playing notification sound:', err);
          
          // If autoplay is blocked, we can't do much about it
          console.log('Audio playback was prevented by the browser. This is normal for server-initiated sounds.');
        });
      }
    } catch (error) {
      console.error('Fallback audio playback failed:', error);
    }
  };
  
  // Show notification and play sound
  const showNotification = (message, severity = 'info', jobId = null) => {
    console.log('%c NotificationContext: showNotification called', 'background: #4CAF50; color: white; padding: 2px 5px; border-radius: 2px;', { message, severity, jobId });
    
    // Try to play notification sound
    playNotificationSound();
    
    // Update notification state
    setNotification({
      show: true,
      message,
      severity,
      jobId
    });
    
    console.log('NotificationContext: notification state updated to:', {
      show: true,
      message,
      severity,
      jobId
    });

    // Auto-hide after 10 seconds
    setTimeout(() => {
      console.log('NotificationContext: Auto-hiding notification after 10 seconds');
      setNotification(prev => ({ ...prev, show: false }));
    }, 10000);
  };

  // Update the global reference when the component mounts
  React.useEffect(() => {
    console.log('NotificationContext: Updating global reference to notification functions');
    
    // Immediately update the global reference to the notification functions
    notificationFunctions = {
      showNotification,
      setNotification,
    };
    
    // Also expose the notification context to the window object for direct access
    window.notificationContext = {
      showNotification,
      setNotification,
      handleCloseNotification,
      notification
    };
    
    // Track that we've initialized the notification context to prevent duplicate processing
    const hasProcessedEvents = sessionStorage.getItem('notificationContextInitialized');
    
    // Only process stored events if we haven't done so already in this session
    if (!hasProcessedEvents) {
      try {
        console.log('NotificationContext: First initialization, checking for stored events');
        const storedEvents = JSON.parse(sessionStorage.getItem('socketEvents') || '[]');
        
        if (storedEvents.length > 0) {
          console.log('NotificationContext: Found stored socket events:', storedEvents);
          
          // Check if any of the stored events are jobAssigned events
          const jobAssignedEvents = storedEvents.filter(event => event.type === 'jobAssigned');
          if (jobAssignedEvents.length > 0) {
            // Get the most recent jobAssigned event
            const latestEvent = jobAssignedEvents[jobAssignedEvents.length - 1];
            console.log('NotificationContext: Processing stored jobAssigned event:', latestEvent);
            
            // Show notification for this event
            if (latestEvent.data && latestEvent.data.jobDetails) {
              setTimeout(() => {
                showNotification(
                  `New job assigned: ${latestEvent.data.jobDetails.service} at ${latestEvent.data.jobDetails.location}`,
                  'info',
                  latestEvent.data.jobId
                );
              }, 2000); // Delay to ensure component is fully mounted
            }
          }
        }
        
        // Mark that we've processed events for this session
        sessionStorage.setItem('notificationContextInitialized', 'true');
      } catch (storageError) {
        console.error('Error processing stored events:', storageError);
      }
    } else {
      console.log('NotificationContext: Already initialized in this session, skipping event processing');
    }
    
    // Clear any existing showNotification flag
    sessionStorage.removeItem('showNotification');
    
    return () => {
      console.log('NotificationContext: Resetting global reference on unmount');
      // Reset on unmount
      notificationFunctions = {
        showNotification: () => console.warn('NotificationContext not initialized'),
        setNotification: () => console.warn('NotificationContext not initialized'),
      };
      
      // Remove the window reference
      delete window.notificationContext;
    };
  }, []);

  // Value to be provided to consumers
  const value = {
    notification,
    setNotification,
    handleCloseNotification,
    showNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
