import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

let socket;

export const initSocket = (token) => {
  // Close any existing connections
  if (socket) {
    socket.disconnect();
  }

  // Create new connection with authentication
  socket = io(process.env.NODE_ENV === 'production' 
    ? window.location.origin 
    : 'http://localhost:5000', {
    auth: {
      token
    }
  });

  // Set up event listeners
  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  // Job assignment notification
  socket.on('jobAssigned', (data) => {
    toast.info(`New job assigned: ${data.jobDetails.service} at ${data.jobDetails.location}`, {
      position: "top-right",
      autoClose: false,
      hideProgressBar: false,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: true,
    });
    
    // Play notification sound
    const audio = new Audio('/notification-sound.mp3');
    audio.play().catch(err => console.error('Error playing notification sound:', err));
    
    // Refresh jobs list if needed
    window.dispatchEvent(new CustomEvent('job-assigned', { detail: data }));
  });
  
  // Job auto-rejection notification
  socket.on('jobAutoRejected', (data) => {
    toast.error(`Job auto-rejected: ${data.message}`, {
      position: "top-right",
      autoClose: false,
      hideProgressBar: false,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: true,
    });
    
    // Refresh jobs list if needed
    window.dispatchEvent(new CustomEvent('job-auto-rejected', { detail: data }));
  });
  
  // Job acceptance notification
  socket.on('jobAccepted', (data) => {
    toast.success(`Job accepted: ${data.message}`, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
    
    // Refresh jobs list if needed
    window.dispatchEvent(new CustomEvent('job-accepted', { detail: data }));
  });
  
  // Job rejection notification
  socket.on('jobRejected', (data) => {
    toast.warning(`Job rejected: ${data.message}`, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
    
    // Refresh jobs list if needed
    window.dispatchEvent(new CustomEvent('job-rejected', { detail: data }));
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
  }
};
