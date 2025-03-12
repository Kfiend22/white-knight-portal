import axios from 'axios';

/**
 * Configure axios with interceptors for handling authentication
 * This includes handling token expiration and redirecting to login
 */
const setupAxiosInterceptors = () => {
  // Response interceptor
  axios.interceptors.response.use(
    // For successful responses, just return the response
    (response) => response,
    
    // For error responses, check if it's an authentication error
    (error) => {
      // Check if the error is a 401 Unauthorized
      if (error.response && error.response.status === 401) {
        console.log('Authentication error detected:', error.response.data);
        
        // Clear authentication data from localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect to login page
        window.location.href = '/login';
        
        // Show a message to the user
        alert('Your session has expired. Please log in again.');
      }
      
      // Return the error for further processing
      return Promise.reject(error);
    }
  );
  
  // Request interceptor to add token to all requests
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      
      // If token exists, add it to the request headers
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      return config;
    },
    (error) => Promise.reject(error)
  );
};

export default setupAxiosInterceptors;
