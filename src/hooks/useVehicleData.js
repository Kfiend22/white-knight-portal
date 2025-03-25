// useVehicleData.js
// Custom hook for fetching and managing vehicle data

import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import axios from 'axios';

/**
 * Custom hook for fetching and managing vehicle data
 * @returns {Object} Vehicle data and related state
 */
const useVehicleData = () => {
  // State for vehicle data
  const [vehicleData, setVehicleData] = useState({
    makes: [],
    models: {},
    years: [],
    colors: ['Black', 'White', 'Silver', 'Red', 'Blue', 'Gray', 'Green', 'Brown', 'Yellow', 'Orange', 'Purple', 'Gold']
  });
  
  // State for fleet vehicles from the API
  const [fleetVehicles, setFleetVehicles] = useState([]);
  
  // State for available vehicles (not assigned to any driver)
  const [availableVehicles, setAvailableVehicles] = useState([]);
  
  // State for loading and error
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Generate years from 1885 (first automobile) to current year
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= 1885; year--) {
      years.push(year.toString());
    }
    setVehicleData(prevData => ({
      ...prevData,
      years: years
    }));
  }, []);
  
  // Helper function to get auth headers
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  // Function to fetch available vehicles
  const fetchAvailableVehicles = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch available vehicles from the API
      const response = await axios.get('/api/vehicles/available', {
        headers: getAuthHeader()
      });
      
      console.log('Fetched available vehicles from API:', response.data);
      
      // Store the available vehicles in state
      setAvailableVehicles(response.data);
      
      setIsLoading(false);
      return response.data;
    } catch (error) {
      console.error('Error fetching available vehicles:', error);
      setError(error.message || 'Error fetching available vehicles');
      setIsLoading(false);
      return [];
    }
  };

  // Load fleet vehicles from API when component mounts
  useEffect(() => {
    const fetchFleetVehicles = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch vehicles from the API
        const response = await axios.get('/api/vehicles', {
          headers: getAuthHeader()
        });
        
        console.log('Fetched fleet vehicles from API:', response.data);
        
        // Store the vehicles in state
        setFleetVehicles(response.data);
        
        // Also store in localStorage for components that might use it
        localStorage.setItem('fleetVehicles', JSON.stringify(response.data));
        
        // Removed call to fetchAvailableVehicles() to prevent repeated calls
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching fleet vehicles:', error);
        setError(error.message || 'Error fetching fleet vehicles');
        setIsLoading(false);
      }
    };
    
    fetchFleetVehicles();
  }, []);
  
  // Fetch available vehicles once when the component mounts
  useEffect(() => {
    fetchAvailableVehicles();
  }, []);
  
  // Load CSV data for vehicle makes/models (used in vehicle creation form)
  useEffect(() => {
    const loadVehicleData = async () => {
      try {
        // Use the direct path to the file in the public folder
        const response = await fetch('/csvs/VehicleList.csv');
        const csvText = await response.text();
      
        Papa.parse(csvText, {
          header: true,
          complete: (results) => {
            const parsedData = results.data;
          
            // Extract makes
            const uniqueMakes = [...new Set(parsedData
              .filter(row => row.Make && row.Make.trim() !== '')
              .map(row => row.Make.trim()))];
          
            // Extract models by make
            const modelsByMake = {};
            uniqueMakes.forEach(make => {
              modelsByMake[make] = [...new Set(parsedData
                .filter(row => row.Make === make && row.Model && row.Model.trim() !== '')
                .map(row => row.Model.trim()))];
            });
          
            // Use functional update pattern to avoid dependency on vehicleData.colors and years
            setVehicleData(prevData => ({
              makes: uniqueMakes,
              models: modelsByMake,
              years: prevData.years, // Keep the years we generated in the other useEffect
              colors: prevData.colors // Keep existing colors using prevData
            }));
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
          }
        });
      } catch (error) {
        console.error('Error loading CSV file:', error);
      }
    };
  
    loadVehicleData();
  }, []);

  return {
    vehicleData,
    fleetVehicles,
    availableVehicles,
    fetchAvailableVehicles,
    isLoading,
    error
  };
};

export default useVehicleData;
