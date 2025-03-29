import { useState, useEffect, useCallback } from 'react';
import useJobSocket from './useJobSocket';
import * as jobService from '../services/jobDashboardService';
import * as authUtils from '../utils/authUtils';
import { useLoading } from '../context/LoadingContext'; // Import useLoading

const useJobData = (jobCategory, onSocketStatusChange) => {
  // State management
  const [jobs, setJobs] = useState([]);
  const [drivers, setDrivers] = useState([]);
  // const [loading, setLoading] = useState(true); // Remove local loading state
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const { startLoading } = useLoading(); // Get startLoading from global context

  // Custom hook for socket connection with custom handler for job updates
  const { socketConnected, fetchInProgressRef } = useJobSocket({
    onSocketStatusChange: (status) => {
      // Call the original onSocketStatusChange if provided
      if (onSocketStatusChange) {
        onSocketStatusChange(status);
      }
      
      // If this is a jobUpdated event and we have event details, update the jobs state
      if (status.lastEvent && status.lastEvent.type === 'jobUpdated' && status.lastEvent.data) {
        console.log('Received jobUpdated event in useJobData, updating jobs state:', status.lastEvent.data);
        setJobs(prevJobs => jobService.processJobUpdate(status.lastEvent.data, prevJobs));
      }
    }
  });
  
  // Fetch jobs from the server
  const fetchJobs = useCallback(async () => {
    const stopLoading = startLoading(); // Start global loading
    setError(null);
    
    try {
      // Use the jobService to fetch jobs, passing current jobs to preserve expanded state
      const processedJobs = await jobService.fetchJobs(jobCategory, jobs);
      console.log('Fetched jobs with preserved expanded state:', 
        processedJobs.map(job => ({ id: job.id, expanded: job.expanded }))
      );
      setJobs(processedJobs);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err.response?.data?.message || 'Failed to load jobs');
    } finally {
      stopLoading(); // Stop global loading
    }
    
    // Return a promise that resolves when the fetch is complete
    return Promise.resolve();
  }, [jobCategory, jobs]); // Added 'jobs' to dependency array to fix ESLint warning

  // Fetch drivers from the server - Also use global loading
  const fetchDrivers = useCallback(async () => {
    const stopLoading = startLoading(); // Start global loading
    try {
      // Use the jobService to fetch drivers
      const driversData = await jobService.fetchDrivers();
      setDrivers(driversData);
    } catch (err) {
      console.error('Error fetching drivers:', err);
    } finally {
      stopLoading(); // Stop global loading
    }
  }, [startLoading]); // Add startLoading dependency

  // Fetch current user information - Also use global loading
  const fetchCurrentUser = useCallback(async () => {
    const stopLoading = startLoading(); // Start global loading
    try {
      // Use the jobService to fetch the current user
      const userData = await jobService.fetchCurrentUser();
      if (userData) {
        setCurrentUser(userData);
        
        // Process and store permissions
        authUtils.processUserPermissions(userData);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      stopLoading(); // Stop global loading
    }
  }, [startLoading]); // Add startLoading dependency

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

  // Track previous job category to detect changes
  const [prevJobCategory, setPrevJobCategory] = useState(jobCategory);
  
  // Fetch data when component loads, category changes, or when socket connects
  useEffect(() => {
    console.log(`Jobs component refreshing for category: ${jobCategory}, socketConnected: ${socketConnected}`);
    console.log(`Previous category: ${prevJobCategory}, Current category: ${jobCategory}`);
    console.log(`Fetch in progress: ${fetchInProgressRef.current}`);
    
    // Always fetch when job category changes, regardless of socket status
    const categoryChanged = prevJobCategory !== jobCategory;
    const initialLoad = jobs.length === 0;
    
    if (categoryChanged) {
      console.log(`Job category changed from ${prevJobCategory} to ${jobCategory}, forcing fetch`);
      setPrevJobCategory(jobCategory);
      
      // Set fetch in progress
      fetchInProgressRef.current = true;
      
      // Fetch data
      fetchJobs()
        .then(() => fetchDrivers())
        .then(() => fetchCurrentUser())
        .finally(() => {
          fetchInProgressRef.current = false;
        });
    }
    // Always do an initial fetch when the component loads and jobs array is empty
    else if (initialLoad && !fetchInProgressRef.current) {
      console.log('Initial load detected with empty jobs array, forcing initial fetch');
      fetchInProgressRef.current = true;
      
      // Fetch data immediately regardless of socket status
      fetchJobs()
        .then(() => fetchDrivers())
        .then(() => fetchCurrentUser())
        .finally(() => {
          fetchInProgressRef.current = false;
        });
    }
    // Otherwise, only fetch if socket is connected and no fetch is already in progress
    else if (socketConnected && !fetchInProgressRef.current) {
      console.log('Socket is connected, fetching jobs');
      fetchInProgressRef.current = true;
      
      // Fetch data
      fetchJobs()
        .then(() => fetchDrivers())
        .then(() => fetchCurrentUser())
        .finally(() => {
          fetchInProgressRef.current = false;
        });
    } else if (!socketConnected && !initialLoad) {
      console.log('Socket not connected, will fetch data when socket connects');
    } else if (fetchInProgressRef.current) {
      console.log('Fetch already in progress, skipping');
    }
  }, [
    jobCategory, 
    socketConnected, 
    fetchJobs, 
    fetchDrivers, 
    fetchCurrentUser, 
    prevJobCategory, 
    jobs.length, 
    fetchInProgressRef // Add fetchInProgressRef to the dependency array
  ]);

  // Helper to update jobs list after changes
  const refreshJobs = useCallback(() => {
    return fetchJobs();
  }, [fetchJobs]);
  
  // Helper to update current user data
  const refreshUser = useCallback(async () => {
    console.log('useJobData: Explicitly refreshing user data');
    try {
      const userData = await jobService.fetchCurrentUser();
      if (userData) {
        console.log('useJobData: Refreshed user data:', userData);
        console.log('useJobData: secondaryRoles:', userData.secondaryRoles);
        console.log('useJobData: secondaryRoles is Array?', Array.isArray(userData.secondaryRoles));
        setCurrentUser(userData);
      }
      return userData;
    } catch (error) {
      console.error('Error refreshing user profile:', error);
      return null;
    }
  }, []);
  
  // Register the refreshUser function with useUserProfile
  useEffect(() => {
    // Make refreshUser available to useUserProfile
    window.refreshUserFromJobData = refreshUser;
    
    // Clean up when component unmounts
    return () => {
      window.refreshUserFromJobData = null;
    };
  }, [refreshUser]);

  // Delete a job - Also use global loading
  const deleteJob = useCallback(async (jobId) => {
    const stopLoading = startLoading(); // Start global loading
    try {
      // Call the service to delete the job
      await jobService.deleteJob(jobId);
      
      // Remove the job from the local state
      setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
      
      return { success: true, message: 'Job deleted successfully' };
    } catch (error) {
      console.error('Error deleting job:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to delete job' 
      };
    } finally {
      stopLoading(); // Stop global loading
    }
  }, [startLoading]); // Add startLoading dependency

  return {
    jobs,
    setJobs,
    drivers,
    // loading, // Removed local loading state
    // setLoading, // Removed local loading state setter
    error,
    currentUser,
    socketConnected,
    refreshJobs,
    refreshUser,
    deleteJob
  };
};

export default useJobData;
