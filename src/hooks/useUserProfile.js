// useUserProfile.js
// Custom hook for fetching and managing user profile data

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Global reference to the refreshUser function from useJobData
// This will be set by useJobData when it initializes
window.refreshUserFromJobData = null;

/**
 * Custom hook for fetching and managing user profile data
 * @returns {Object} User profile data and related state
 */
const useUserProfile = () => {
  // State for user profile - initialize with default values to prevent null checks
  const [userProfile, setUserProfile] = useState({ primaryRole: '' });
  
  // State for user's companies
  const [userCompanies, setUserCompanies] = useState([]);
  
  // State for loading and error
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to get auth headers
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  // Function to fetch user profile
  const fetchUserProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    const token = localStorage.getItem('token');
    if (!token) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
      return;
    }
    
    try {
      const response = await axios.get('/api/v1/users/profile', {
        headers: getAuthHeader()
      });
      
      if (response.data) {
        // Check if primaryRole exists before using it
        if (response.data.primaryRole !== undefined) {
          setUserProfile(response.data);
          
          // Always use the correct company name
          setUserCompanies([
            { id: '1', name: 'White Knight Motor Club' }
          ]);
          
          // If useJobData has registered its refreshUser function, call it
          if (window.refreshUserFromJobData && typeof window.refreshUserFromJobData === 'function') {
            console.log('useUserProfile: Calling refreshUser from useJobData');
            window.refreshUserFromJobData();
          }
        } else {
          // Handle the case where primaryRole is missing
          console.error("User profile missing primaryRole:", response.data);
          // Keep the default userProfile with empty primaryRole
          setError("User profile missing primaryRole");
        }
      } else {
        // Handle empty response.data
        console.error("Empty response from user profile API");
        setError("Empty response from user profile API");
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError(error.message || 'Failed to fetch user profile');
      
      // Use default company if API fails
      setUserCompanies([
        { id: '1', name: 'White Knight Motor Club' }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch user profile on mount
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  return {
    userProfile,
    userCompanies,
    isLoading,
    error,
    refreshUserProfile: fetchUserProfile
  };
};

export default useUserProfile;
