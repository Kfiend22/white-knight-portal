/**
 * permissionStore.js
 * Comprehensive permission management system for the Motorclub Service Provider Portal
 */

// Constants for permission types
export const PERMISSION_TYPES = {
  PAGE_ACCESS: 'pageAccess',
  JOB_ACTIONS: 'jobActions',
  USER_MANAGEMENT: 'userManagement',
  JOB_CREATION: 'jobCreation',
  JOB_VIEWING: 'jobViewing',
  JOB_EDITING: 'jobEditing',
  JOB_DISPATCHING: 'jobDispatching',
  GOA_APPROVAL: 'goaApproval',
  UNSUCCESSFUL_APPROVAL: 'unsuccessfulApproval',
  GOA_REQUEST: 'goaRequest',
  UNSUCCESSFUL_REQUEST: 'unsuccessfulRequest',
};

// Constants for primary roles
export const PRIMARY_ROLES = {
  OWNER: 'OW',
  SUB_OWNER: 'sOW',
  REGIONAL_MANAGER: 'RM',
  SERVICE_PROVIDER: 'SP',
  UNDEFINED: 'N/A',
};

// Constants for secondary roles
export const SECONDARY_ROLES = {
  ADMIN: 'admin',
  DISPATCHER: 'dispatcher',
  ANSWERING_SERVICE: 'answeringService',
  DRIVER: 'driver',
};

// Constants for pages
export const PAGES = {
  DASHBOARD: 'Dashboard',
  SETTINGS: 'Settings',
  USERS: 'Users',
  PERFORMANCE: 'Performance',
  SUBMISSIONS: 'Submissions',
  REGIONS: 'Regions',
  PAYMENTS: 'Payments',
};

// Constants for job status sequence (forward progression only for drivers)
export const JOB_STATUS_SEQUENCE = [
  'Pending',
  'Scheduled',
  'Pending Acceptance',
  'Dispatched',
  'En Route',
  'On Site',
  'Completed',
  'GOA',
  'Unsuccessful',
  'Expired',
];

// Local storage key for permissions
const PERMISSIONS_STORAGE_KEY = 'wk_user_permissions';

/**
 * Process user data into a comprehensive permission object
 * @param {Object} userData - User data from API or localStorage
 * @returns {Object} Processed permission object
 */
export function processPermissions(userData) {
  if (!userData) {
    console.error('Cannot process permissions: No user data provided');
    return {
      isAuthenticated: false,
      permissions: {},
      userData: null,
    };
  }

  try {
    console.log('Processing permissions for user:', userData.username || userData.email);

    // Extract primary role
    const primaryRole = userData.primaryRole || PRIMARY_ROLES.UNDEFINED;
    
    // Extract secondary roles
    let secondaryRoles = [];
    if (userData.secondaryRoles) {
      // Handle array format
      if (Array.isArray(userData.secondaryRoles)) {
        secondaryRoles = userData.secondaryRoles;
      } 
      // Handle object format where values are boolean
      else if (typeof userData.secondaryRoles === 'object') {
        secondaryRoles = Object.keys(userData.secondaryRoles)
          .filter(role => userData.secondaryRoles[role] === true);
      }
    }

    // Extract vendor and region information
    const vendorId = userData.vendorId || userData.vendorNumber || '';
    const regions = Array.isArray(userData.regions) ? userData.regions : 
                   (userData.region ? [userData.region] : []);

    // Check if user is a driver-only user
    const isDriverOnlyUser = isDriverOnly(primaryRole, secondaryRoles);
    
    // Process into permissions object
    const permissions = {
      // Basic user info for reference
      userId: userData._id || userData.id || '',
      username: userData.username || '',
      email: userData.email || '',
      fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
      primaryRole,
      secondaryRoles,
      vendorId,
      regions,
      
      // Permission calculations
      pageAccess: calculatePageAccess(primaryRole, secondaryRoles),
      canCreateJobs: canCreateJobs(primaryRole, secondaryRoles, vendorId),
      canDispatchJobs: canDispatchJobs(primaryRole, secondaryRoles, vendorId),
      canApproveGOA: canApproveGOA(primaryRole, secondaryRoles),
      canRequestGOA: canRequestGOA(primaryRole, secondaryRoles),
      canApproveUnsuccessful: canApproveUnsuccessful(primaryRole, secondaryRoles),
      canRequestUnsuccessful: canRequestUnsuccessful(primaryRole, secondaryRoles),
      canManageUsers: canManageUsers(primaryRole, secondaryRoles),
      isDriverOnly: isDriverOnlyUser,
      
      // Specific permissions for job actions
      markJobsGoa: !isDriverOnlyUser, // All non-driver users can mark jobs as GOA
      markJobsUnsuccessful: !isDriverOnlyUser, // All non-driver users can mark jobs as unsuccessful
      duplicateJobs: !isDriverOnlyUser, // All non-driver users can duplicate jobs
      reactivateJobs: !isDriverOnlyUser, // All non-driver users can reactivate completed/canceled jobs
      updateJobsInCompletedTabs: !isDriverOnlyUser, // All non-driver users can modify status in completed tabs
      updateJobsInCanceledTabs: !isDriverOnlyUser, // All non-driver users can modify status in canceled tabs
      
      // Permission to delete jobs from canceled jobs tab
      // Only OW, sOW, RM, and dispatchers with OW Vendor ID/Number can delete jobs
      deleteJobs: [PRIMARY_ROLES.OWNER, PRIMARY_ROLES.SUB_OWNER, PRIMARY_ROLES.REGIONAL_MANAGER].includes(primaryRole) || 
                 (primaryRole === PRIMARY_ROLES.UNDEFINED && 
                  secondaryRoles.includes(SECONDARY_ROLES.DISPATCHER) && 
                  (vendorId === '1' || (vendorId && vendorId.startsWith('OW')))),
                  
      // Permission to cancel jobs via the ellipsis menu
      // All non-driver users can cancel jobs
      cancelJobs: !isDriverOnlyUser,
      
      // Job status progression restrictions
      allowedJobProgressions: calculateAllowedJobProgressions(primaryRole, secondaryRoles),
    };

    return {
      isAuthenticated: true,
      permissions,
      userData,
    };
  } catch (error) {
    console.error('Error processing permissions:', error);
    return {
      isAuthenticated: false,
      permissions: {},
      userData: null,
    };
  }
}

/**
 * Calculate which pages a user can access
 * @param {string} primaryRole - User's primary role
 * @param {Array} secondaryRoles - User's secondary roles
 * @returns {Object} Object with page names as keys and boolean access as values
 */
function calculatePageAccess(primaryRole, secondaryRoles) {
  console.log(`Calculating page access for role: ${primaryRole}, secondaryRoles:`, secondaryRoles);
  
  const access = {
    [PAGES.DASHBOARD]: true, // Everyone can access Dashboard
    [PAGES.SETTINGS]: false,
    [PAGES.USERS]: false,
    [PAGES.PERFORMANCE]: false,
    [PAGES.SUBMISSIONS]: false,
    [PAGES.REGIONS]: false,
    [PAGES.PAYMENTS]: false,
  };
  
  // Force dashboard access to be true regardless of other settings
  access[PAGES.DASHBOARD.toLowerCase()] = true; // Also add lowercase version for case-insensitive matching

  // Grant access based on primary role
  if ([PRIMARY_ROLES.OWNER, PRIMARY_ROLES.SUB_OWNER].includes(primaryRole)) {
    // OW and sOW have access to everything
    Object.keys(access).forEach(page => access[page] = true);
  } else if (primaryRole === PRIMARY_ROLES.REGIONAL_MANAGER) {
    // RM has access to most pages except Regions
    access[PAGES.SETTINGS] = true;
    access[PAGES.USERS] = true;
    access[PAGES.PERFORMANCE] = true;
    access[PAGES.PAYMENTS] = true;
  } else if (primaryRole === PRIMARY_ROLES.SERVICE_PROVIDER) {
    // SP has access to some pages
    access[PAGES.SETTINGS] = true;
    access[PAGES.USERS] = true;
    access[PAGES.PERFORMANCE] = true;
    access[PAGES.PAYMENTS] = true;
  }

  // Adjust access based on secondary roles
  if (secondaryRoles.includes(SECONDARY_ROLES.ADMIN)) {
    // Admin access depends on primary role
    if (primaryRole === PRIMARY_ROLES.SERVICE_PROVIDER) {
      // SP Admin still can't access Submissions and Regions
    } else if (primaryRole === PRIMARY_ROLES.REGIONAL_MANAGER) {
      // RM Admin still can't access Regions
    } else if (primaryRole === PRIMARY_ROLES.UNDEFINED) {
      // N/A with Admin has access based on vendor ID (handled elsewhere)
    }
  }

  if (secondaryRoles.includes(SECONDARY_ROLES.DISPATCHER) || 
      secondaryRoles.includes(SECONDARY_ROLES.ANSWERING_SERVICE)) {
    access[PAGES.PERFORMANCE] = true;
    // Limited settings access is handled by component-level permissions
  }

  // Driver secondary role doesn't grant additional page access
  
  return access;
}

/**
 * Check if user can create jobs
 * @param {string} primaryRole - User's primary role
 * @param {Array} secondaryRoles - User's secondary roles
 * @param {string} vendorId - User's vendor ID
 * @returns {boolean} Whether user can create jobs
 */
function canCreateJobs(primaryRole, secondaryRoles, vendorId) {
  // OW, sOW, and RM can create jobs regardless of secondary roles
  if ([PRIMARY_ROLES.OWNER, PRIMARY_ROLES.SUB_OWNER, PRIMARY_ROLES.REGIONAL_MANAGER].includes(primaryRole)) {
    return true;
  }
  
  // SP cannot create jobs regardless of secondary roles
  if (primaryRole === PRIMARY_ROLES.SERVICE_PROVIDER) {
    return false;
  }
  
  // N/A role with dispatcher or answering service secondary role can create jobs if they have owner's vendor ID
  if (primaryRole === PRIMARY_ROLES.UNDEFINED && 
     (secondaryRoles.includes(SECONDARY_ROLES.DISPATCHER) || 
      secondaryRoles.includes(SECONDARY_ROLES.ANSWERING_SERVICE))) {
    // Note: In a real implementation, we would check against the owner's vendor ID
    // For now, we'll assume a convention like vendorId === '1' or vendorId.startsWith('OW')
    return vendorId === '1' || vendorId.startsWith('OW');
  }
  
  return false;
}

/**
 * Check if user can dispatch jobs
 * @param {string} primaryRole - User's primary role
 * @param {Array} secondaryRoles - User's secondary roles
 * @param {string} vendorId - User's vendor ID
 * @returns {boolean} Whether user can dispatch jobs
 */
function canDispatchJobs(primaryRole, secondaryRoles, vendorId) {
  // OW, sOW, and RM can dispatch jobs
  if ([PRIMARY_ROLES.OWNER, PRIMARY_ROLES.SUB_OWNER, PRIMARY_ROLES.REGIONAL_MANAGER].includes(primaryRole)) {
    return true;
  }
  
  // SP can dispatch jobs to their own drivers
  if (primaryRole === PRIMARY_ROLES.SERVICE_PROVIDER) {
    return true;
  }
  
  // N/A role with dispatcher or answering service can dispatch jobs
  if (primaryRole === PRIMARY_ROLES.UNDEFINED && 
     (secondaryRoles.includes(SECONDARY_ROLES.DISPATCHER) || 
      secondaryRoles.includes(SECONDARY_ROLES.ANSWERING_SERVICE))) {
    return true;
  }
  
  return false;
}

/**
 * Check if user can approve GOA requests
 * @param {string} primaryRole - User's primary role
 * @param {Array} secondaryRoles - User's secondary roles
 * @returns {boolean} Whether user can approve GOA requests
 */
function canApproveGOA(primaryRole, secondaryRoles) {
  // OW, sOW, and RM can approve GOA
  if ([PRIMARY_ROLES.OWNER, PRIMARY_ROLES.SUB_OWNER, PRIMARY_ROLES.REGIONAL_MANAGER].includes(primaryRole)) {
    return true;
  }
  
  // N/A role with admin and owner's vendor ID can approve (handled at runtime)
  if (primaryRole === PRIMARY_ROLES.UNDEFINED && secondaryRoles.includes(SECONDARY_ROLES.ADMIN)) {
    // We'll do the vendor ID check at runtime
    return true;
  }
  
  return false;
}

/**
 * Check if user can request GOA
 * @param {string} primaryRole - User's primary role
 * @param {Array} secondaryRoles - User's secondary roles
 * @returns {boolean} Whether user can request GOA
 */
function canRequestGOA(primaryRole, secondaryRoles) {
  // OW, sOW, RM can effectively make a direct GOA (by approving their own request)
  if ([PRIMARY_ROLES.OWNER, PRIMARY_ROLES.SUB_OWNER, PRIMARY_ROLES.REGIONAL_MANAGER].includes(primaryRole)) {
    return true;
  }
  
  // SP can request GOA
  if (primaryRole === PRIMARY_ROLES.SERVICE_PROVIDER) {
    return true;
  }
  
  // N/A with dispatcher, answering service, or admin can request GOA
  if (primaryRole === PRIMARY_ROLES.UNDEFINED && 
     (secondaryRoles.includes(SECONDARY_ROLES.DISPATCHER) || 
      secondaryRoles.includes(SECONDARY_ROLES.ANSWERING_SERVICE) ||
      secondaryRoles.includes(SECONDARY_ROLES.ADMIN))) {
    return true;
  }
  
  // Drivers cannot request GOA
  return false;
}

/**
 * Check if user can approve Unsuccessful requests
 * @param {string} primaryRole - User's primary role
 * @param {Array} secondaryRoles - User's secondary roles
 * @returns {boolean} Whether user can approve Unsuccessful requests
 */
function canApproveUnsuccessful(primaryRole, secondaryRoles) {
  // Same logic as GOA approval
  return canApproveGOA(primaryRole, secondaryRoles);
}

/**
 * Check if user can request marking jobs as Unsuccessful
 * @param {string} primaryRole - User's primary role
 * @param {Array} secondaryRoles - User's secondary roles
 * @returns {boolean} Whether user can request marking jobs as Unsuccessful
 */
function canRequestUnsuccessful(primaryRole, secondaryRoles) {
  // Same logic as GOA requests
  return canRequestGOA(primaryRole, secondaryRoles);
}

/**
 * Check if user can manage other users
 * @param {string} primaryRole - User's primary role
 * @param {Array} secondaryRoles - User's secondary roles
 * @returns {boolean} Whether user can manage users
 */
function canManageUsers(primaryRole, secondaryRoles) {
  // OW, sOW, RM can manage users (within their scope)
  if ([PRIMARY_ROLES.OWNER, PRIMARY_ROLES.SUB_OWNER, PRIMARY_ROLES.REGIONAL_MANAGER].includes(primaryRole)) {
    return true;
  }
  
  // SP can manage their own users
  if (primaryRole === PRIMARY_ROLES.SERVICE_PROVIDER) {
    return true;
  }
  
  // N/A with admin can manage users within their scope
  if (primaryRole === PRIMARY_ROLES.UNDEFINED && secondaryRoles.includes(SECONDARY_ROLES.ADMIN)) {
    return true;
  }
  
  return false;
}

/**
 * Check if user is a "driver only" user
 * @param {string} primaryRole - User's primary role
 * @param {Array} secondaryRoles - User's secondary roles
 * @returns {boolean} Whether user is driver-only
 */
function isDriverOnly(primaryRole, secondaryRoles) {
  return primaryRole === PRIMARY_ROLES.UNDEFINED && 
         secondaryRoles.length === 1 && 
         secondaryRoles.includes(SECONDARY_ROLES.DRIVER);
}

/**
 * Calculate allowed job status progressions based on role
 * @param {string} primaryRole - User's primary role
 * @param {Array} secondaryRoles - User's secondary roles
 * @returns {Object} Mapping of current status to allowed next statuses
 */
function calculateAllowedJobProgressions(primaryRole, secondaryRoles) {
  const progressions = {};
  
  // If user is a driver or has N/A primary role, restrict status progression
  const isDriverRestricted = isDriverOnly(primaryRole, secondaryRoles) ||
                             primaryRole === PRIMARY_ROLES.UNDEFINED;
  
  if (isDriverRestricted) {
    // Driver can only progress forward in the sequence
    progressions['Dispatched'] = ['En Route'];
    progressions['En Route'] = ['On Site'];
    progressions['On Site'] = ['Completed'];
    // Other statuses have no allowed progressions for drivers
  } else {
    // Non-driver users can change to any status
    // For each status, allow changing to any other status
    JOB_STATUS_SEQUENCE.forEach(currentStatus => {
      progressions[currentStatus] = [...JOB_STATUS_SEQUENCE];
    });
  }
  
  return progressions;
}

/**
 * Store permissions in localStorage
 * @param {Object} permissionsData - Processed permissions data
 */
export function storePermissions(permissionsData) {
  if (!permissionsData) {
    console.error('Cannot store permissions: No data provided');
    return;
  }
  
  try {
    localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(permissionsData));
    console.log('Permissions stored successfully');
  } catch (error) {
    console.error('Error storing permissions:', error);
  }
}

/**
 * Retrieve permissions from localStorage
 * @returns {Object|null} Stored permissions or null if not found
 */
export function getStoredPermissions() {
  try {
    const permissionsData = localStorage.getItem(PERMISSIONS_STORAGE_KEY);
    return permissionsData ? JSON.parse(permissionsData) : null;
  } catch (error) {
    console.error('Error retrieving stored permissions:', error);
    return null;
  }
}

/**
 * Clear stored permissions (used during logout)
 */
export function clearPermissions() {
  try {
    localStorage.removeItem(PERMISSIONS_STORAGE_KEY);
    console.log('Permissions cleared successfully');
  } catch (error) {
    console.error('Error clearing permissions:', error);
  }
}

/**
 * Check if user can access a specific page
 * @param {string} pageName - Name of the page to check
 * @returns {boolean} Whether user can access the page
 */
export function canAccessPage(pageName) {
  // Log the actual page name being checked
  console.log(`Checking access for page: "${pageName}"`);
  
  // Special case: dashboard should always be accessible
  if (pageName === 'dashboard' || pageName === 'Dashboard') {
    console.log('Dashboard page - automatically granting access');
    return true;
  }
  
  const storedPermissions = getStoredPermissions();
  if (!storedPermissions || !storedPermissions.isAuthenticated) {
    console.log('No stored permissions or not authenticated, denying access');
    return false;
  }
  
  const { permissions } = storedPermissions;
  
  if (!permissions.pageAccess) {
    console.log('No pageAccess object in permissions, denying access');
    return false;
  }
  
  // Check for exact match first
  if (permissions.pageAccess[pageName] === true) {
    console.log(`Access granted for page "${pageName}" (exact match)`);
    return true;
  }
  
  // Try case-insensitive match
  const pageAccessKeys = Object.keys(permissions.pageAccess);
  const matchingKey = pageAccessKeys.find(
    key => key.toLowerCase() === pageName.toLowerCase()
  );
  
  if (matchingKey && permissions.pageAccess[matchingKey] === true) {
    console.log(`Access granted for page "${pageName}" (case-insensitive match with "${matchingKey}")`);
    return true;
  }
  
  console.log(`Access denied for page "${pageName}"`);
  return false;
}

/**
 * Check if user can view a specific job
 * @param {Object} job - The job to check
 * @returns {boolean} Whether user can view the job
 */
export function canViewJob(job) {
  const storedPermissions = getStoredPermissions();
  if (!storedPermissions || !storedPermissions.isAuthenticated) {
    return false;
  }
  
  const { permissions } = storedPermissions;
  
  // OW and sOW can view all jobs
  if ([PRIMARY_ROLES.OWNER, PRIMARY_ROLES.SUB_OWNER].includes(permissions.primaryRole)) {
    return true;
  }
  
  // Check if job has visibleTo array and user is in it
  if (job.visibleTo && Array.isArray(job.visibleTo)) {
    return job.visibleTo.includes(permissions.userId);
  }
  
  // RM can view jobs in their region
  if (permissions.primaryRole === PRIMARY_ROLES.REGIONAL_MANAGER) {
    // If job has region, check if user's regions include it
    if (job.region) {
      return permissions.regions.includes(job.region);
    }
  }
  
  // SP can view jobs for their vendor
  if (permissions.vendorId && job.vendorId) {
    return permissions.vendorId === job.vendorId;
  }
  
  // Driver can only view assigned jobs
  if (permissions.isDriverOnly) {
    return job.driverId === permissions.userId || job.driver === permissions.fullName;
  }
  
  return false;
}

/**
 * Check if user can edit a specific job
 * @param {Object} job - The job to check
 * @returns {boolean} Whether user can edit the job
 */
export function canEditJob(job) {
  const storedPermissions = getStoredPermissions();
  if (!storedPermissions || !storedPermissions.isAuthenticated) {
    return false;
  }
  
  const { permissions } = storedPermissions;
  
  // OW and sOW can edit all jobs
  if ([PRIMARY_ROLES.OWNER, PRIMARY_ROLES.SUB_OWNER].includes(permissions.primaryRole)) {
    return true;
  }
  
  // RM can edit jobs in their region
  if (permissions.primaryRole === PRIMARY_ROLES.REGIONAL_MANAGER) {
    if (job.region) {
      return permissions.regions.includes(job.region);
    }
  }
  
  // SP can edit jobs for their vendor
  if (permissions.vendorId && job.vendorId) {
    return permissions.vendorId === job.vendorId;
  }
  
  // Dispatcher and Answering Service can edit jobs based on vendor/region
  if (permissions.secondaryRoles.includes(SECONDARY_ROLES.DISPATCHER) || 
      permissions.secondaryRoles.includes(SECONDARY_ROLES.ANSWERING_SERVICE)) {
    if (permissions.vendorId && job.vendorId) {
      return permissions.vendorId === job.vendorId;
    }
  }
  
  // Driver can update status of assigned jobs, but not edit details
  if (permissions.isDriverOnly) {
    return false;
  }
  
  return false;
}

/**
 * Check if user can change a job's status to a specific target status
 * @param {string} currentStatus - Current job status
 * @param {string} targetStatus - Target job status
 * @returns {boolean} Whether the status change is allowed
 */
export function canChangeJobStatus(currentStatus, targetStatus) {
  const storedPermissions = getStoredPermissions();
  if (!storedPermissions || !storedPermissions.isAuthenticated) {
    return false;
  }
  
  const { permissions } = storedPermissions;
  
  // Get allowed progressions for current status
  const allowedProgressions = permissions.allowedJobProgressions[currentStatus] || [];
  
  // Check if target status is in allowed progressions
  return allowedProgressions.includes(targetStatus);
}

/**
 * Initialize permissions from current user data
 * Should be called after login or on app initialization
 */
export function initializePermissions() {
  try {
    // Try to get user data from localStorage - checking both 'userInfo' and 'user' keys
    let userDataString = localStorage.getItem('userInfo');
    
    // If not found in 'userInfo', try 'user' key
    if (!userDataString) {
      userDataString = localStorage.getItem('user');
      if (userDataString) {
        console.log('User data found in localStorage under "user" key');
      }
    }
    
    // If still no data found, log and clear permissions
    if (!userDataString) {
      console.log('No user data found in localStorage under either "userInfo" or "user" keys');
      clearPermissions();
      return;
    }
    
    // Parse the user data
    const userData = JSON.parse(userDataString);
    if (!userData || (!userData.id && !userData._id)) {
      console.log('Invalid user data in localStorage');
      clearPermissions();
      return;
    }
    
    // Process and store permissions
    const permissionsData = processPermissions(userData);
    storePermissions(permissionsData);
    
    console.log('Permissions initialized successfully');
    return permissionsData;
  } catch (error) {
    console.error('Error initializing permissions:', error);
    clearPermissions();
    return null;
  }
}

// Export a default object with all permission functions
export default {
  processPermissions,
  storePermissions,
  getStoredPermissions,
  clearPermissions,
  canAccessPage,
  canViewJob,
  canEditJob,
  canChangeJobStatus,
  initializePermissions,
  
  // Constants
  PERMISSION_TYPES,
  PRIMARY_ROLES,
  SECONDARY_ROLES,
  PAGES,
  JOB_STATUS_SEQUENCE,
};
