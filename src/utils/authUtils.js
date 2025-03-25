/**
 * Utility functions for authentication
 */
import permissionStore from './permissionStore';

/**
 * Check if a JWT token is expired
 * @param {string} token - The JWT token to check
 * @returns {boolean} - True if token is expired or invalid, false otherwise
 */
export const isTokenExpired = (token) => {
  if (!token) {
    return true;
  }
  
  try {
    // Get the payload part of the JWT (second part)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const { exp } = JSON.parse(jsonPayload);
    
    // Check if expiration time is in the past
    return exp * 1000 < Date.now();
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true; // Consider invalid tokens as expired
  }
};

/**
 * Verify token validity by making a lightweight API call
 * @returns {Promise<boolean>} - Promise resolving to true if token is valid, false otherwise
 */
export const verifyToken = async () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return false;
  }
  
  // First check if token is expired based on its payload
  if (isTokenExpired(token)) {
    console.log('Token is expired, clearing storage');
    
    // Clear authentication data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Also clear backup data from sessionStorage
    sessionStorage.removeItem('backup_token');
    sessionStorage.removeItem('backup_user');
    
    return false;
  }
  
  try {
    // Make a lightweight API call to verify token on the server
    const response = await fetch('/api/auth/verify', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error verifying token:', error);
    return false;
  }
};

/**
 * Log out the user by clearing localStorage and sessionStorage, then redirecting to login
 */
export const logout = () => {
  console.log('Logging out user...');
  
  // Clear authentication data from localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('userInfo');
  
  // Also clear backup data from sessionStorage
  sessionStorage.removeItem('backup_token');
  sessionStorage.removeItem('backup_user');
  
  // Clear any other potential auth-related items
  localStorage.removeItem('audioContextUnlocked');
  sessionStorage.removeItem('socketEvents');
  sessionStorage.removeItem('showNotification');
  sessionStorage.removeItem('pendingNotificationSound');
  
  // Clear permissions
  permissionStore.clearPermissions();
  
  console.log('Storage cleared, redirecting to login page');
  
  // Redirect to login page
  window.location.href = '/login';
};

/**
 * Initialize user permissions from localStorage data
 * @returns {Object|null} Processed permissions object or null if not found
 */
export const initializePermissions = () => {
  return permissionStore.initializePermissions();
};

/**
 * Process and store user permissions on login
 * @param {Object} userData - User data returned from login API
 */
export const processUserPermissions = (userData) => {
  if (!userData) {
    console.error('Cannot process permissions: No user data provided');
    return null;
  }
  
  // Process the user data into a permissions object
  const permissionsData = permissionStore.processPermissions(userData);
  
  // Store the permissions in localStorage
  permissionStore.storePermissions(permissionsData);
  
  return permissionsData;
};

/**
 * Check if user can access a specific page
 * @param {string} pageName - Name of the page to check
 * @returns {boolean} Whether user can access the page
 */
export const canAccessPage = (pageName) => {
  return permissionStore.canAccessPage(pageName);
};

/**
 * Check if user can view a specific job
 * @param {Object} job - The job to check
 * @returns {boolean} Whether user can view the job
 */
export const canViewJob = (job) => {
  return permissionStore.canViewJob(job);
};

/**
 * Check if user can edit a specific job
 * @param {Object} job - The job to check
 * @returns {boolean} Whether user can edit the job
 */
export const canEditJob = (job) => {
  return permissionStore.canEditJob(job);
};

/**
 * Check if user can change a job's status to a specific target status
 * @param {string} currentStatus - Current job status
 * @param {string} targetStatus - Target job status
 * @returns {boolean} Whether the status change is allowed
 */
export const canChangeJobStatus = (currentStatus, targetStatus) => {
  return permissionStore.canChangeJobStatus(currentStatus, targetStatus);
};

/**
 * Get all user permissions
 * @returns {Object|null} User permissions or null if not found
 */
export const getUserPermissions = () => {
  const storedPermissions = permissionStore.getStoredPermissions();
  return storedPermissions ? storedPermissions.permissions : null;
};

/**
 * Check if user has a specific permission
 * @param {string} permission - The permission to check
 * @returns {boolean} Whether user has the permission
 */
export const hasPermission = (permission) => {
  const storedPermissions = permissionStore.getStoredPermissions();
  if (!storedPermissions || !storedPermissions.isAuthenticated) {
    return false;
  }
  
  const { permissions } = storedPermissions;
  return !!permissions[permission];
};

/**
 * Get allowed status transitions for a job's current status
 * @param {string} currentStatus - Current job status
 * @returns {Array} Array of allowed next statuses
 */
export const getAllowedStatusTransitions = (currentStatus) => {
  const storedPermissions = permissionStore.getStoredPermissions();
  if (!storedPermissions || !storedPermissions.isAuthenticated) {
    return [];
  }
  
  const { permissions } = storedPermissions;
  return permissions.allowedJobProgressions[currentStatus] || [];
};

/**
 * Check if user can manage GOA requests
 * @param {Object} job - The job to check
 * @returns {boolean} Whether user can manage GOA requests
 */
export const canManageGoaRequests = (job) => {
  const storedPermissions = permissionStore.getStoredPermissions();
  if (!storedPermissions || !storedPermissions.isAuthenticated) {
    return false;
  }
  
  return storedPermissions.permissions.canApproveGOA === true;
};

/**
 * Check if user is a driver
 * @param {Object} user - User object to check
 * @returns {boolean} Whether user is a driver
 */
export const isDriverUser = (user) => {
  if (!user) return false;
  
  const primaryRole = user.primaryRole || '';
  
  // Extract secondary roles
  let secondaryRoles = [];
  if (user.secondaryRoles) {
    // Handle array format
    if (Array.isArray(user.secondaryRoles)) {
      secondaryRoles = user.secondaryRoles;
    } 
    // Handle object format where values are boolean
    else if (typeof user.secondaryRoles === 'object') {
      secondaryRoles = Object.keys(user.secondaryRoles)
        .filter(role => user.secondaryRoles[role] === true);
    }
  }
  
  // Check if user is a driver-only user
  return primaryRole === 'N/A' && 
         secondaryRoles.length === 1 && 
         secondaryRoles.includes('driver');
};

/**
 * Check if user can manage unsuccessful job reports
 * @param {Object} user - User object to check
 * @returns {boolean} Whether user can manage unsuccessful reports
 */
export const canManageUnsuccessfulRequests = (user) => {
  const storedPermissions = permissionStore.getStoredPermissions();
  if (!storedPermissions || !storedPermissions.isAuthenticated) {
    return false;
  }
  
  return storedPermissions.permissions.canApproveUnsuccessful === true;
};

/**
 * Check if user can dispatch jobs
 * @returns {boolean} Whether user can dispatch jobs
 */
export const canDispatchJobs = () => {
  const storedPermissions = permissionStore.getStoredPermissions();
  if (!storedPermissions || !storedPermissions.isAuthenticated) {
    return false;
  }
  
  return storedPermissions.permissions.canDispatchJobs === true;
};
