// useLocationRequest.js
// Custom hook for handling location requests

import { useState, useCallback } from 'react';
import axios from 'axios';

/**
 * Custom hook for handling location requests
 * @returns {Object} Location request state and functions
 */
const useLocationRequest = () => {
  // State for location request
  const [locationRequestSent, setLocationRequestSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [locationData, setLocationData] = useState(null);
  const [error, setError] = useState(null);
  const [requestId, setRequestId] = useState(null);
  const [pollInterval, setPollInterval] = useState(null);

  // Helper function to get auth headers
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  // Function to parse location address
  const parseLocationAddress = useCallback((locationData) => {
    if (!locationData || !locationData.address) {
      return null;
    }
    
    const address = locationData.address;
    
    // Parse the address into components if possible
    const addressParts = address.split(',');
    if (addressParts.length >= 3) {
      // Try to parse the address into street, city, state, zip
      const street = addressParts[0].trim();
      const city = addressParts[1].trim();
      
      // Try to extract state and zip from the last part
      const stateZipMatch = addressParts[2].trim().match(/^([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
      let state = '';
      let zip = '';
      
      if (stateZipMatch) {
        state = stateZipMatch[1];
        zip = stateZipMatch[2];
      } else {
        // If we can't parse state and zip, just use the last part as state
        state = addressParts[2].trim();
      }
      
      return {
        street,
        city,
        state,
        zip,
        country: 'USA'
      };
    } else if (addressParts.length === 2) {
      // If we only have two parts, assume it's street and city
      return {
        street: addressParts[0].trim(),
        city: addressParts[1].trim(),
        state: '',
        zip: '',
        country: 'USA'
      };
    } else {
      // If we can't parse the address, just put everything in street
      return {
        street: address,
        city: '',
        state: '',
        zip: '',
        country: 'USA'
      };
    }
  }, []);

  // Function to send location request
  const sendLocationRequest = useCallback(async (phoneNumber) => {
    if (!phoneNumber) {
      setError('Phone number is required');
      return false;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Generate a unique request ID for this location request
      const newRequestId = Date.now().toString();
      setRequestId(newRequestId);
      
      // Format the phone number (remove any non-numeric characters)
      const formattedPhone = phoneNumber.replace(/\D/g, '');
      
      // Make API call to send location request text
      const response = await axios.post('/api/location/request', {
        phone: formattedPhone,
        requestId: newRequestId
      }, {
        headers: getAuthHeader()
      });
      
      if (response.data.success) {
        setLocationRequestSent(true);
        
        // Start polling for location updates
        const interval = setInterval(async () => {
          try {
            const pollResponse = await axios.get(`/api/location/${newRequestId}`, {
              headers: getAuthHeader()
            });
            
            // Check if location has been received
            if (pollResponse.data.status === 'completed' && pollResponse.data.location) {
              // Clear the polling interval
              clearInterval(interval);
              setPollInterval(null);
              
              // Set the location data
              setLocationData(pollResponse.data.location);
            }
          } catch (pollError) {
            console.error('Error polling for location:', pollError);
          }
        }, 5000); // Poll every 5 seconds
        
        setPollInterval(interval);
        
        // Stop polling after 5 minutes (300000 ms)
        setTimeout(() => {
          if (pollInterval) {
            clearInterval(pollInterval);
            setPollInterval(null);
          }
        }, 300000);
        
        return true;
      } else {
        throw new Error('Failed to send location request');
      }
    } catch (error) {
      console.error('Error requesting location:', error);
      setError(error.message || 'Failed to send location request');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [pollInterval]);

  // Function to reset location request
  const resetLocationRequest = useCallback(() => {
    setLocationRequestSent(false);
    setLocationData(null);
    setError(null);
    
    // Clear polling interval if it exists
    if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }
  }, [pollInterval]);

  return {
    locationRequestSent,
    isLoading,
    locationData,
    error,
    sendLocationRequest,
    resetLocationRequest,
    parseLocationAddress
  };
};

export default useLocationRequest;
