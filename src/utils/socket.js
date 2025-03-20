import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { showGlobalNotification } from '../context/NotificationContext';

let socket;

export const initSocket = (token) => {
  // Close any existing connections
  if (socket) {
    console.log('Closing existing socket connection:', socket.id);
    socket.disconnect();
  }

  console.log('Initializing new socket connection with token:', token ? 'Token provided' : 'No token');
  
  // Create new connection with authentication
  socket = io(process.env.NODE_ENV === 'production' 
    ? window.location.origin 
    : 'http://localhost:5000', {
    auth: {
      token
    },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });

  // Set up event listeners
  socket.on('connect', () => {
    console.log('Socket connected successfully with ID:', socket.id);
    
    // Store socket ID in window for debugging
    window.socketId = socket.id;
    
    // Dispatch a custom event that other components can listen for
    window.dispatchEvent(new CustomEvent('socket-connected', { 
      detail: { socketId: socket.id } 
    }));
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected. Reason:', reason);
    
    // Dispatch a custom event that other components can listen for
    window.dispatchEvent(new CustomEvent('socket-disconnected', { 
      detail: { reason } 
    }));
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
  
  // Listen for connection test event from server
  socket.on('connectionTest', (data) => {
    console.log('Connection test received from server:', data);
    
    // Play a test sound to ensure audio is working
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.1; // Low volume for test
      audio.play().catch(err => console.log('Test sound play failed (expected if not triggered by user action):', err));
    } catch (audioError) {
      console.error('Error playing test sound:', audioError);
    }
  });

  // Job assignment notification
  socket.on('jobAssigned', (data) => {
    console.log('%c Socket: jobAssigned event received', 'background: #ff9800; color: white; padding: 2px 5px; border-radius: 2px;', data);
    
    // Validate the data structure
    if (!data || !data.jobDetails) {
      console.error('Invalid jobAssigned data received:', data);
      return;
    }
    
    // Create a timestamp for this event
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Processing jobAssigned event`);
    
    // Store the event in sessionStorage for debugging and for later playback if audio isn't unlocked
    try {
      const storedEvents = JSON.parse(sessionStorage.getItem('socketEvents') || '[]');
      storedEvents.push({
        type: 'jobAssigned',
        timestamp,
        data,
        soundPlayed: false // Track if sound has been played for this event
      });
      sessionStorage.setItem('socketEvents', JSON.stringify(storedEvents.slice(-10))); // Keep last 10 events
      
      // Set a flag to indicate there's a pending notification sound
      sessionStorage.setItem('pendingNotificationSound', 'true');
    } catch (storageError) {
      console.error('Error storing event in sessionStorage:', storageError);
    }
    
    // Try to use the window.socketEventHandlers first (set in App.js)
    if (window.socketEventHandlers && typeof window.socketEventHandlers.jobAssigned === 'function') {
      console.log('Socket: Using window.socketEventHandlers.jobAssigned');
      try {
        window.socketEventHandlers.jobAssigned(data);
      } catch (handlerError) {
        console.error('Error using window.socketEventHandlers.jobAssigned:', handlerError);
        // Fall back to showGlobalNotification
        fallbackToGlobalNotification(data);
      }
    } else {
      // Fall back to showGlobalNotification
      fallbackToGlobalNotification(data);
    }
    
    try {
      // Dispatch custom event for backward compatibility
      console.log('Socket: Dispatching job-assigned custom event');
      window.dispatchEvent(new CustomEvent('job-assigned', { detail: data }));
    } catch (eventError) {
      console.error('Error dispatching custom event:', eventError);
    }
    
    // Check if audio is unlocked before trying to play sound
    const isAudioUnlocked = localStorage.getItem('audioContextUnlocked') === 'true';
    
    if (isAudioUnlocked) {
      console.log('Socket: Audio is unlocked, playing notification sound immediately');
      // Play notification sound directly to ensure it plays
      playNotificationSound();
      
      // Mark this event as having played sound
      try {
        const storedEvents = JSON.parse(sessionStorage.getItem('socketEvents') || '[]');
        const updatedEvents = storedEvents.map(event => {
          if (event.type === 'jobAssigned' && event.timestamp === timestamp) {
            return { ...event, soundPlayed: true };
          }
          return event;
        });
        sessionStorage.setItem('socketEvents', JSON.stringify(updatedEvents));
      } catch (updateError) {
        console.error('Error updating stored event sound status:', updateError);
      }
    } else {
      console.log('Socket: Audio is not unlocked, sound will play on next user interaction');
      
      // Set up a one-time event listener to play sound on next user interaction
      const playPendingSound = () => {
        console.log('Socket: User interaction detected, playing pending notification sound');
        playNotificationSound();
        
        // Mark this event as having played sound
        try {
          const storedEvents = JSON.parse(sessionStorage.getItem('socketEvents') || '[]');
          const updatedEvents = storedEvents.map(event => {
            if (event.type === 'jobAssigned' && !event.soundPlayed) {
              return { ...event, soundPlayed: true };
            }
            return event;
          });
          sessionStorage.setItem('socketEvents', JSON.stringify(updatedEvents));
          
          // Clear the pending notification sound flag
          sessionStorage.removeItem('pendingNotificationSound');
        } catch (updateError) {
          console.error('Error updating stored event sound status:', updateError);
        }
        
        // Remove the event listeners after playing the sound
        document.removeEventListener('click', playPendingSound);
        document.removeEventListener('touchstart', playPendingSound);
        document.removeEventListener('keydown', playPendingSound);
      };
      
      // Add event listeners for user interaction
      document.addEventListener('click', playPendingSound, { once: true });
      document.addEventListener('touchstart', playPendingSound, { once: true });
      document.addEventListener('keydown', playPendingSound, { once: true });
    }
  });
  
  // Helper function to fall back to showGlobalNotification
  const fallbackToGlobalNotification = (data) => {
    console.log('Socket: Falling back to showGlobalNotification');
    try {
      // Show global notification (new)
      console.log('Socket: Calling showGlobalNotification with:', {
        message: `New job assigned: ${data.jobDetails.service} at ${data.jobDetails.location}`,
        severity: 'info',
        jobId: data.jobId
      });
      
      // Call the global notification function
      showGlobalNotification(
        `New job assigned: ${data.jobDetails.service} at ${data.jobDetails.location}`,
        'info',
        data.jobId
      );
    } catch (notificationError) {
      console.error('Error showing global notification:', notificationError);
    }
  };
  
  // Enhanced function to play notification sound - with multiple methods and fallbacks
  const playNotificationSound = () => {
    console.log('Socket: Attempting to play notification sound with enhanced reliability');
    
    // Track if sound played successfully with any method
    let soundPlayed = false;
    
    // Method 1: Use notification context if available (preferred)
    if (window.notificationContext && typeof window.notificationContext.showNotification === 'function') {
      console.log('Socket: Method 1 - Using notification context for sound playback');
      try {
        // This typically handles audio in the context
        window.notificationContext.playSound && window.notificationContext.playSound();
        soundPlayed = true;
        console.log('Socket: Method 1 succeeded');
      } catch (error) {
        console.error('Socket: Method 1 failed:', error);
      }
    }
    
    // Method 2: Standard Audio API (if method 1 didn't work or is unavailable)
    if (!soundPlayed) {
      console.log('Socket: Method 2 - Using standard Audio API');
      try {
        const audio = new Audio('/notification-sound.mp3');
        // Preload the audio
        audio.preload = 'auto';
        
        // Add event listeners for debugging
        audio.addEventListener('play', () => console.log('Socket: Audio play event fired'));
        audio.addEventListener('playing', () => console.log('Socket: Audio playing event fired'));
        audio.addEventListener('ended', () => console.log('Socket: Audio ended event fired'));
        audio.addEventListener('error', (e) => console.error('Socket: Audio error event:', e));
        
        // Set volume (full volume)
        audio.volume = 1.0;
        
        // Try to play the sound
        const playPromise = audio.play();
        
        // Modern browsers return a promise from play()
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Socket: Method 2 succeeded');
              soundPlayed = true;
              // Mark audio as unlocked for future reference
              localStorage.setItem('audioContextUnlocked', 'true');
            })
            .catch(err => {
              console.error('Socket: Method 2 failed:', err);
              console.log('Socket: Trying fallback methods');
            });
        } else {
          // Older browsers don't return a promise
          console.log('Socket: Browser didn\'t return a play promise, assuming successful playback');
          soundPlayed = true;
        }
      } catch (error) {
        console.error('Socket: Method 2 complete failure:', error);
      }
    }
    
    // Method 3: Create and trigger an audio element in the DOM (last resort)
    if (!soundPlayed) {
      console.log('Socket: Method 3 - Creating and triggering DOM audio element');
      try {
        // Create audio element and append to DOM
        const audioElement = document.createElement('audio');
        audioElement.src = '/notification-sound.mp3';
        audioElement.id = 'notification-sound-' + Date.now();
        audioElement.style.display = 'none';
        document.body.appendChild(audioElement);
        
        // Add event listeners
        audioElement.addEventListener('play', () => console.log('Socket: DOM Audio play event fired'));
        audioElement.addEventListener('playing', () => console.log('Socket: DOM Audio playing event fired'));
        audioElement.addEventListener('ended', () => {
          console.log('Socket: DOM Audio ended event fired');
          // Clean up - remove element after playback
          document.body.removeChild(audioElement);
        });
        audioElement.addEventListener('error', (e) => {
          console.error('Socket: DOM Audio error event:', e);
          // Clean up on error too
          document.body.removeChild(audioElement);
        });
        
        // Try to play
        const domPlayPromise = audioElement.play();
        if (domPlayPromise !== undefined) {
          domPlayPromise
            .then(() => {
              console.log('Socket: Method 3 succeeded');
              soundPlayed = true;
            })
            .catch(err => {
              console.error('Socket: Method 3 failed:', err);
              // Clean up if failed
              if (document.body.contains(audioElement)) {
                document.body.removeChild(audioElement);
              }
            });
        }
      } catch (error) {
        console.error('Socket: Method 3 complete failure:', error);
      }
    }
    
    // Log final result
    setTimeout(() => {
      console.log(`Socket: Notification sound playback ${soundPlayed ? 'succeeded' : 'failed'} with available methods`);
      
      if (!soundPlayed) {
        console.log('Socket: All sound playback methods failed. This might be due to browser autoplay restrictions.');
        
        // Store the failure for debugging
        try {
          sessionStorage.setItem('lastSoundPlaybackFailed', 'true');
          sessionStorage.setItem('lastSoundPlaybackAttempt', new Date().toISOString());
        } catch (e) {
          console.error('Socket: Failed to store sound playback status:', e);
        }
      }
    }, 500); // Short delay to allow promises to resolve
    
    return soundPlayed;
  };
  
  // Job auto-rejection notification
  socket.on('jobAutoRejected', (data) => {
    // Show global notification
    showGlobalNotification(
      `Job auto-rejected: ${data.message}`,
      'error',
      data.jobId
    );
    
    // Dispatch custom event for backward compatibility
    window.dispatchEvent(new CustomEvent('job-auto-rejected', { detail: data }));
  });
  
  // Job acceptance notification
  socket.on('jobAccepted', (data) => {
    // Show global notification
    showGlobalNotification(
      `Job accepted: ${data.message}`,
      'success',
      data.jobId
    );
    
    // Dispatch custom event for backward compatibility
    window.dispatchEvent(new CustomEvent('job-accepted', { detail: data }));
  });
  
  // Job rejection notification
  socket.on('jobRejected', (data) => {
    // Show global notification
    showGlobalNotification(
      `Job rejected: ${data.message}`,
      'warning',
      data.jobId
    );
    
    // Dispatch custom event for backward compatibility
    window.dispatchEvent(new CustomEvent('job-rejected', { detail: data }));
  });
  
  // General job update notification
  socket.on('jobUpdated', (data) => {
    // No toast notification for general updates to avoid too many notifications
    // Just dispatch the event to update the UI
    window.dispatchEvent(new CustomEvent('jobUpdated', { detail: data }));
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
  }
};
