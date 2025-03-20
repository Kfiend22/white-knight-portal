// useVehicleData.js
// Custom hook for fetching and managing vehicle data

import { useState, useEffect } from 'react';
import Papa from 'papaparse';

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
  
  // Load CSV data when component mounts
  useEffect(() => {
    const loadVehicleData = async () => {
      setIsLoading(true);
      setError(null);
      
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
            
            setIsLoading(false);
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
            setError(error.message || 'Error parsing CSV');
            setIsLoading(false);
          }
        });
      } catch (error) {
        console.error('Error loading CSV file:', error);
        setError(error.message || 'Error loading CSV file');
        setIsLoading(false);
      }
    };
  
    loadVehicleData();
  }, []);

  return {
    vehicleData,
    isLoading,
    error
  };
};

export default useVehicleData;
