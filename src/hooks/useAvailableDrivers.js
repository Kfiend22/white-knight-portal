// useAvailableDrivers.js
// Custom hook for fetching and managing available drivers

import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Custom hook for fetching and managing available drivers
 * @param {boolean} enabled Flag to enable/disable the hook
 * @returns {Object} Available drivers data and related state
 */
const useAvailableDrivers = (enabled = true) => {
  // State for available drivers
  const [availableDrivers, setAvailableDrivers] = useState([]);
  
  // State for loading and error
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper function to get auth headers
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  // Fetch available drivers when enabled
  useEffect(() => {
    if (!enabled) {
      return;
    }
    
    const fetchAvailableDrivers = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await axios.get('/api/drivers/available', {
          headers: getAuthHeader()
        });
        
        setAvailableDrivers(response.data);
      } catch (error) {
        console.error('Error fetching available drivers:', error);
        setError(error.message || 'Failed to load available drivers');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAvailableDrivers();
  }, [enabled]);

  return {
    availableDrivers,
    isLoading,
    error
  };
};

export default useAvailableDrivers;
