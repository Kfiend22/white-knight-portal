import { useState, useEffect, useCallback } from 'react';
import useJobSocket from './useJobSocket';
import * as jobService from '../services/jobDashboardService';

const useJobData = (jobCategory, refreshTrigger = 0, onSocketStatusChange) => {
  // State management
  const [jobs, setJobs] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Custom hook for socket connection
  const { socketConnected, fetchInProgressRef, handleJobUpdated } = useJobSocket({
    onSocketStatusChange
  });
  
  // Fetch jobs from the server
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use the jobService to fetch jobs
      const processedJobs = await jobService.fetchJobs(jobCategory);
      setJobs(processedJobs);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err.response?.data?.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
    
    // Return a promise that resolves when the fetch is complete
    return Promise.resolve();
  }, [jobCategory]);

  // Fetch drivers from the server
  const fetchDrivers = useCallback(async () => {
    try {
      // Use the jobService to fetch drivers
      const driversData = await jobService.fetchDrivers();
      setDrivers(driversData);
    } catch (err) {
      console.error('Error fetching drivers:', err);
    }
  }, []);

  // Fetch current user information
  const fetchCurrentUser = useCallback(async () => {
    try {
      // Use the jobService to fetch the current user
      const userData = await jobService.fetchCurrentUser();
      if (userData) {
        setCurrentUser(userData);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }, []);

  // Auto-refresh interval disabled
  useEffect(() => {
    // Auto-refresh has been disabled as requested
    
    // No need to create an interval anymore
    // The jobs will still refresh when the socket receives updates
    // or when manually triggered via refreshJobs()
    
    console.log('Auto-refresh interval disabled');
    
    return () => {
      // No interval to clean up
    };
  }, [socketConnected, fetchJobs]);

  // Fetch data when category/refresh changes or when socket connects
  useEffect(() => {
    console.log(`Jobs component refreshing for category: ${jobCategory}, trigger: ${refreshTrigger}, socketConnected: ${socketConnected}`);
    
    // Only fetch if socket is connected and no fetch is already in progress
    if (socketConnected && !fetchInProgressRef.current) {
      console.log('Socket is connected, fetching jobs');
      fetchInProgressRef.current = true;
      
      // Fetch data
      fetchJobs()
        .then(() => fetchDrivers())
        .then(() => fetchCurrentUser())
        .finally(() => {
          fetchInProgressRef.current = false;
        });
    } else if (!socketConnected) {
      console.log('Socket not connected, will fetch data when socket connects');
    } else if (fetchInProgressRef.current) {
      console.log('Fetch already in progress, skipping');
    }
  }, [jobCategory, refreshTrigger, socketConnected, fetchJobs, fetchDrivers, fetchCurrentUser]);

  // Debug log when refreshTrigger changes
  useEffect(() => {
    console.log(`Jobs component refreshing for category: ${jobCategory}, trigger: ${refreshTrigger}`);
  }, [jobCategory, refreshTrigger]);

  // Helper to update jobs list after changes
  const refreshJobs = useCallback(() => {
    return fetchJobs();
  }, [fetchJobs]);

  return {
    jobs,
    setJobs,
    drivers,
    loading,
    setLoading,
    error,
    currentUser,
    socketConnected,
    refreshJobs
  };
};

export default useJobData;
