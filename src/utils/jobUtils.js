// jobUtils.js

// Helper function to determine if a user is a dispatch user
export const isDispatchUser = (user) => {
  return user?.primaryRole === 'OW' || user?.primaryRole === 'sOW' || user?.primaryRole === 'RM';
};

// Helper function to determine if a user can reactivate completed jobs
export const canReactivateJob = (user) => {
  if (!user) return false;
  
  // Check primary role (OW, sOW, RM)
  const hasPrimaryRole = user.primaryRole === 'OW' || user.primaryRole === 'sOW' || user.primaryRole === 'RM';
  
  // Check secondary roles (dispatcher, answeringService)
  const hasSecondaryRole = user.secondaryRoles?.dispatcher || user.secondaryRoles?.answeringService;
  
  // Log for debugging
  console.log('canReactivateJob check:', { 
    user, 
    hasPrimaryRole, 
    hasSecondaryRole, 
    result: hasPrimaryRole || hasSecondaryRole 
  });
  
  return hasPrimaryRole || hasSecondaryRole;
};

// Helper function to determine status priority
export const getStatusPriority = (status) => {
  const priorityMap = {
    'Pending': 1,
    'Scheduled': 2,
    'Pending Acceptance': 3,
    'Dispatched': 4,
    'En Route': 5,
    'On Site': 6,
    'Completed': 7,
    'GOA': 8, // GOA and Expired are outside the normal flow
    'Unsuccessful': 9, // Unsuccessful is a terminal state like GOA
    'Expired': 10
  };
  return priorityMap[status] || 0; // Default to 0 for unknown statuses
};

// Helper function to determine job status color
export const getJobStatusColor = (status, job) => {
  if (!status) return 'transparent';
  
  // Check if job has a pending unsuccessful request
  if (job && job.approvalStatusUnsuccessful === 'pending' && job.unsuccessfulReason) {
    return 'rgba(255, 0, 0, 0.2)'; // Red with transparency for unsuccessful requests
  }
  
  // Check if job is expired (Pending Acceptance + past autoRejectAt time)
  if (job && status === 'Pending Acceptance' && job.autoRejectAt) {
    const autoRejectTime = new Date(job.autoRejectAt);
    const now = new Date();
    
    if (now > autoRejectTime) {
      console.log(`Job ${job.id} is expired (autoRejectAt: ${job.autoRejectAt})`);
      return 'rgba(255, 192, 203, 0.3)'; // Pink with transparency for expired jobs
    }
  }
  
  switch (status) {
    // Orange for Dispatched and Awaiting Approval
    case 'Dispatched':
    case 'Awaiting Approval':
      return 'rgba(255, 165, 0, 0.2)'; // Orange with transparency
    
    // Light green for En Route
    case 'En Route':
      return 'rgba(144, 238, 144, 0.3)'; // Light green with transparency
    
    // Blue for On Site/On Scene
    case 'On Site':
    case 'On Scene':
      return 'rgba(0, 0, 255, 0.15)'; // Blue with transparency
    
    // Forest green for Completed
    case 'Completed':
      return 'rgba(34, 139, 34, 0.2)'; // Forest green with transparency
    
    // Yellow for GOA
    case 'GOA':
      return 'rgba(255, 255, 0, 0.2)'; // Yellow with transparency
    
    // Red for Unsuccessful
    case 'Unsuccessful':
      return 'rgba(255, 0, 0, 0.2)'; // Red with transparency
    
    // Pink for Expired
    case 'Expired':
      return 'rgba(255, 192, 203, 0.3)'; // Pink with transparency
    
    // Sky blue for Waiting
    case 'Waiting':
      return 'rgba(135, 206, 235, 0.3)'; // Sky blue with transparency
    
    // Handle other statuses
    case 'Pending':
    case 'Scheduled':
    case 'Pending Acceptance':
    case 'In-Progress':
    case 'Rejected':
    case 'Accepted':
    case 'Canceled':
      return 'transparent'; // No specific color for these statuses
    
    default:
      console.log('Unknown status:', status);
      return 'transparent';
  }
};

// Helper function to determine if current user is the job provider (dispatcher)
export const isJobProvider = (job, currentUser) => {
  if (!currentUser || !job) return false;
  
  // Convert both IDs to strings for comparison to avoid type issues
  const providerId = job.provider?.toString();
  const userId = currentUser.id?.toString();
  
  console.log('Provider check:', { providerId, userId, isMatch: providerId === userId });
  return providerId === userId;
};

// Helper to store assigned job in local storage
export const trackAssignedJob = (jobId, userId) => {
  if (!jobId || !userId) return;
  
  try {
    // Get current assigned jobs
    let assignedJobs = {};
    const storedJobs = localStorage.getItem('wk_assigned_jobs');
    
    if (storedJobs) {
      assignedJobs = JSON.parse(storedJobs);
    }
    
    // Add or update this job assignment
    assignedJobs[jobId] = {
      userId,
      timestamp: Date.now()
    };
    
    // Store back to localStorage
    localStorage.setItem('wk_assigned_jobs', JSON.stringify(assignedJobs));
    
    console.log(`Job ${jobId} tracked as assigned to user ${userId} in localStorage`);
  } catch (e) {
    console.error('Error storing job assignment in localStorage:', e);
  }
};

// Helper to check if a job is assigned to a user in local storage
const isJobAssignedToUser = (jobId, userId) => {
  if (!jobId || !userId) return false;
  
  try {
    // Get stored assignments
    const storedJobs = localStorage.getItem('wk_assigned_jobs');
    if (!storedJobs) return false;
    
    const assignedJobs = JSON.parse(storedJobs);
    const assignment = assignedJobs[jobId];
    
    // Check if this job is assigned to this user
    if (assignment && assignment.userId === userId) {
      console.log(`Found job ${jobId} assigned to user ${userId} in localStorage`);
      return true;
    }
  } catch (e) {
    console.error('Error checking job assignment in localStorage:', e);
  }
  
  return false;
};

// Helper to check if a job is assigned to a user in local storage
const isJobAssignedToAnyUser = (jobId) => {
  if (!jobId) return false;
  
  try {
    // Get stored assignments
    const storedJobs = localStorage.getItem('wk_assigned_jobs');
    if (!storedJobs) return false;
    
    const assignedJobs = JSON.parse(storedJobs);
    // Check if this job has any assignment
    return !!assignedJobs[jobId];
  } catch (e) {
    console.error('Error checking job assignment in localStorage:', e);
  }
  
  return false;
};

// Helper to get the user ID a job is assigned to in localStorage
const getAssignedUserIdFromStorage = (jobId) => {
  if (!jobId) return null;
  
  try {
    // Get stored assignments
    const storedJobs = localStorage.getItem('wk_assigned_jobs');
    if (!storedJobs) return null;
    
    const assignedJobs = JSON.parse(storedJobs);
    const assignment = assignedJobs[jobId];
    
    // Return the user ID if found
    if (assignment && assignment.userId) {
      return assignment.userId;
    }
  } catch (e) {
    console.error('Error getting assigned user ID from localStorage:', e);
  }
  
  return null;
};

// Helper function to determine if current user is the assigned driver
export const isAssignedDriver = (job, currentUser) => {
  console.log('isAssignedDriver called with job:', job?.id);
  
  // Early check: if no job, we can't do anything
  if (!job) {
    console.log('isAssignedDriver: Missing job');
    return false;
  }
  
  // During the initial render, currentUser might be null or missing IDs
  // We need special handling for this case, especially for "Pending Acceptance" jobs
  const isUserDataIncomplete = !currentUser || (!currentUser.id && !currentUser._id);
  
  if (isUserDataIncomplete) {
    console.log('isAssignedDriver: currentUser data incomplete during initial render');
    
    // Even with incomplete user data, we can check if this specific job is in pending acceptance state
    // This ensures drivers see accept/reject buttons as soon as possible during initial page load
    if (job.status === 'Pending Acceptance') {
      // Check if the job has recent assignment information in localStorage
      const isJobInLocalStorage = isJobAssignedToAnyUser(job.id);
      
      if (isJobInLocalStorage) {
        const storedUserId = getAssignedUserIdFromStorage(job.id);
        console.log(`Job ${job.id} is assigned in localStorage to userId: ${storedUserId}`);
        
        // Since we don't know the current user yet, we can't determine if this is the correct user
        // We'll let JobsTable show the buttons during initial load if the job is in localStorage
        // The correct visibility will be determined on the next render when user data is available
        return true;
      }
      
      // If no localStorage assignment, we need to check if this job has a driverId or driver name
      if (job.driverId || job.driver) {
        console.log(`Job ${job.id} has driver info but currentUser not loaded - showing buttons during initial load`);
        // It has driver info, but we can't verify yet if it's the current user
        // Show buttons during initial render, next render will have full user data to verify
        return true;
      }
      
      // Use user data from localStorage as a fallback if available
      try {
        const storedUserData = localStorage.getItem('user');
        if (storedUserData) {
          const userData = JSON.parse(storedUserData);
          
          // Check if this is a driver or SP user from localStorage
          const isPossibleAssignee = 
            userData.primaryRole === 'SP' || 
            (userData.secondaryRoles && 
              (Array.isArray(userData.secondaryRoles) 
                ? userData.secondaryRoles.includes('driver')
                : userData.secondaryRoles.driver));
          
          if (isPossibleAssignee) {
            console.log(`Using localStorage user data (${userData.username}) - looks like a driver or SP - showing buttons during initial load`);
            return true;
          }
        }
      } catch (e) {
        console.error('Error checking user data in localStorage:', e);
      }
    }
    
    // For all other cases with incomplete user data, we can't determine if this user is the assigned driver
    return false;
  }
  
  // If we have complete user data, proceed with normal checks
  
  // First check: See if this job is assigned to anyone in localStorage
  const isJobInLocalStorage = isJobAssignedToAnyUser(job.id);
  if (isJobInLocalStorage) {
    console.log(`Job ${job.id} found in localStorage with assignment`);
    
    // Get the stored user ID from localStorage
    const storedUserId = getAssignedUserIdFromStorage(job.id);
    
    // Check if the assignment matches current user
    const userIdFromId = currentUser.id?.toString().trim() || '';
    const userIdFrom_Id = currentUser._id?.toString().trim() || '';
    
    const isCurrentUserAssigned = 
      storedUserId === userIdFromId || 
      storedUserId === userIdFrom_Id;
    
    console.log('LocalStorage assignment check:', {
      storedUserId,
      userIdFromId,
      userIdFrom_Id,
      isCurrentUserAssigned
    });
    
    // If the current user matches the stored assignment, return true
    if (isCurrentUserAssigned) {
      return true;
    }
    
    // If this user doesn't match the stored assignment, they should NOT see the buttons
    // This fixes the issue where all users were seeing Accept/Reject buttons
    if (job.status === 'Pending Acceptance') {
      console.log(`Job ${job.id} is assigned to userId ${storedUserId}, not current user - hiding Accept/Reject buttons`);
      return false;
    }
  }
  
  // At this point, we have job and currentUser, proceed with normal ID checks
  
  // Get all possible user IDs
  const userIdFromId = currentUser.id?.toString().trim() || '';
  const userIdFrom_Id = currentUser._id?.toString().trim() || '';
  const userName = (currentUser.name || currentUser.username || '').toLowerCase().trim();
  const userIds = [userIdFromId, userIdFrom_Id].filter(id => id.length > 0);
  
  // Log all user identifiers for debugging
  console.log('User identifiers:', {
    userIds,
    userName,
    email: currentUser.email,
    hasDriverRole: !!currentUser.secondaryRoles?.driver
  });
  
  // First check: by job.driverId - most direct way
  if (job.driverId) {
    // Normalize ID for comparison
    const driverId = job.driverId?.toString().trim();
    
    // Check if any user ID matches the driver ID
    const matchingId = userIds.find(id => id === driverId);
    const isMatch = !!matchingId;
    
    // Log detailed information for debugging
    console.log('Driver ID check:', { 
      driverId,
      isMatch,
      matchingId: matchingId || 'none',
      job: {
        id: job.id,
        status: job.status,
        driver: job.driver
      }
    });
    
    // If ID matches, store the assignment in localStorage for persistence
    if (isMatch) {
      trackAssignedJob(job.id, matchingId);
      return true;
    }
  }
  
  // Second check: by job.driver (string) and user.name/username
  if (job.driver && typeof job.driver === 'string') {
    const driverName = job.driver.toLowerCase().trim();
    const isNameMatch = userName.length > 0 && driverName.includes(userName);
    
    console.log('Driver name check:', {
      driverName,
      userName,
      isNameMatch
    });
    
    if (isNameMatch) {
      // Store by user's primary ID if name matches
      if (userIdFromId) trackAssignedJob(job.id, userIdFromId);
      return true;
    }
  }
  
  // Additional check for username in email
  if (job.driver && currentUser.email) {
    const driverName = job.driver.toLowerCase().trim();
    const emailName = currentUser.email.split('@')[0].toLowerCase().trim();
    const isEmailMatch = emailName.length > 0 && driverName.includes(emailName);
    
    console.log('Driver-email check:', {
      driverName,
      emailName,
      isEmailMatch
    });
    
    if (isEmailMatch) {
      // Store by user's primary ID if email matches
      if (userIdFromId) trackAssignedJob(job.id, userIdFromId);
      return true;
    }
  }
  
  // Check localStorage for persistent assignments
  // This helps maintain assignments across page refreshes
  const hasPersistedAssignment = userIds.some(userId => 
    isJobAssignedToUser(job.id, userId)
  );
  
  if (hasPersistedAssignment) {
    console.log(`Job ${job.id} found in localStorage as assigned to current user`);
    return true;
  }
  
  // Special handling for Pending Acceptance
  if (job.status === 'Pending Acceptance') {
    // Check if user has driver role
    let hasDriverRole = false;
    
    if (currentUser.secondaryRoles) {
      if (Array.isArray(currentUser.secondaryRoles)) {
        hasDriverRole = currentUser.secondaryRoles.includes('driver');
      } else if (typeof currentUser.secondaryRoles === 'object') {
        hasDriverRole = currentUser.secondaryRoles.driver === true;
      }
    }
    
    // Is this user a service provider (SP) or has the SP role?
    const isServiceProvider = currentUser.primaryRole === 'SP';
    
    console.log('Special handling for Pending Acceptance:', {
      hasDriverRole,
      isServiceProvider,
      hasPersistedAssignment,
      jobDriver: job.driver,
      jobDriverId: job.driverId
    });
    
    // Enhanced check for Pending Acceptance jobs:
    // 1. We need both name and ID matching to be more precise
    // 2. Include SP primary role check as they should see Accept/Reject for their jobs
    if (job.driver && (userIdFromId || userIdFrom_Id)) {
      // Strong match: name AND ID and job status is Pending Acceptance
      const driverName = typeof job.driver === 'string' ? job.driver.toLowerCase().trim() : '';
      const driverIdMatch = job.driverId && (job.driverId.toString() === userIdFromId || job.driverId.toString() === userIdFrom_Id);
      const nameMatch = userName && driverName.includes(userName);
      
      // If we have a strong ID match OR both driver role and name match
      if (driverIdMatch || (hasDriverRole && nameMatch) || (isServiceProvider && nameMatch)) {
        console.log('Strong match for Pending Acceptance job - showing Accept/Reject buttons');
        if (userIdFromId) trackAssignedJob(job.id, userIdFromId);
        return true;
      }
    }
  }
  
  // If all checks fail, the current user is not the assigned driver
  return false;
};

// Get the original timestamp to use as the base for ETA calculation
export const getOriginalETATimestamp = (job) => {
  // Create a unique job identifier for logging
  // eslint-disable-next-line no-unused-vars
  const jobIdentifier = `job-${job.id.substring(0, 6)}`;
  
  // Always use createdAt as the base time
  if (job.createdAt) {
    console.log(`${jobIdentifier}: Using createdAt for ETA base time: ${job.createdAt}`);
    return new Date(job.createdAt).getTime();
  }
  
  // Fallback to current time if no timestamps are available (should rarely happen)
  console.log(`${jobIdentifier}: No timestamps available, using current time for ETA base`);
  return Date.now();
};

// Calculate target time for ETA countdown
export const calculateTargetTime = (job) => {
  if (!job.eta) return null;
  
  // Create a unique job identifier for logging
  // eslint-disable-next-line no-unused-vars
  const jobIdentifier = `job-${job.id.substring(0, 6)}`;
  
  // If ETA is a number (minutes), calculate target time from original timestamp
  if (!isNaN(parseInt(job.eta))) {
    // Convert ETA minutes to milliseconds
    const etaMilliseconds = parseInt(job.eta) * 60 * 1000;
    
    // Get the original timestamp to use as the base for ETA calculation
    // This ensures the ETA countdown doesn't reset on redispatch
    const baseTime = getOriginalETATimestamp(job);
    
    // Calculate the target time by adding the ETA to the base time
    return baseTime + etaMilliseconds;
  }
  
  // If ETA is a scheduled date/time string, convert it to timestamp
  if (typeof job.eta === 'string' && job.eta.includes('Scheduled for')) {
    const dateTimeStr = job.eta.replace('Scheduled for ', '');
    return new Date(dateTimeStr).getTime();
  }
  
  return null;
};

// Calculate auto-rejection time (2 minutes from assignment)
export const calculateAutoRejectTime = (job) => {
  if (!job.autoRejectAt) return null;
  return new Date(job.autoRejectAt).getTime();
};

// Helper function for filtering jobs based on status and user role
export const filterJobs = (jobs, jobCategory, currentUser) => {
  if (jobCategory === 'pending') {
    // Include 'Pending', 'Pending Acceptance', and 'Waiting' statuses in the pending section
    return jobs.filter((job) => {
      const isPending = job.status === 'Pending';
      const isPendingAcceptance = job.status === 'Pending Acceptance';
      const isWaiting = job.status === 'Waiting';
      
      // Debug log to see what jobs are being filtered
      if (isPendingAcceptance) {
        console.log('Found Pending Acceptance job:', job);
      }
      
      // For drivers, exclude expired 'Pending Acceptance' jobs
      if (currentUser?.primaryRole === 'driver' && isPendingAcceptance) {
        // Check if job is expired (Pending Acceptance + past autoRejectAt time)
        const isExpired = job.autoRejectAt && new Date() > new Date(job.autoRejectAt);
        if (isExpired) {
          console.log(`Excluding expired job ${job.id} from driver view (autoRejectAt: ${job.autoRejectAt})`);
          return false; // Exclude this job
        }
      }
      
      return isPending || isPendingAcceptance || isWaiting;
    });
  } else if (jobCategory === 'inProgress') {
    // For inProgress, exclude jobs that should be in the Scheduled tab
    return isDispatchUser(currentUser)
      ? jobs.filter((job) => {
          // Check if this is a scheduled job that should be in the Scheduled tab
          const isScheduledJob = job.eta && job.eta.includes('Scheduled for') && 
                                ['Scheduled', 'Waiting', 'Dispatched'].includes(job.status);
          
          // If it's a scheduled job that belongs in the Scheduled tab, exclude it
          if (isScheduledJob) return false;
          
          // Otherwise, include jobs with these statuses
          return ['In-Progress', 'Dispatched', 'En Route', 'On Site', 'Awaiting Approval', 'Rejected', 'Accepted', 'Completed', 'Pending', 'Pending Acceptance'].includes(job.status);
        })
      : jobs.filter((job) => {
          // Check if this is a scheduled job that should be in the Scheduled tab
          const isScheduledJob = job.eta && job.eta.includes('Scheduled for') && 
                                ['Scheduled', 'Waiting', 'Dispatched'].includes(job.status);
          
          // If it's a scheduled job that belongs in the Scheduled tab, exclude it
          if (isScheduledJob) return false;
          
          // Otherwise, include jobs with these statuses
          return ['In-Progress', 'Dispatched', 'En Route', 'On Site', 'Awaiting Approval', 'Rejected', 'Accepted'].includes(job.status);
        });
  } else if (jobCategory === 'scheduled') {
    // For scheduled tab, only include jobs with scheduled ETA and appropriate status
    return jobs.filter((job) => 
      // Check if the job has a scheduled ETA
      job.eta && job.eta.includes('Scheduled for') && 
      // And has one of these statuses
      ['Scheduled', 'Waiting', 'Dispatched'].includes(job.status)
    );
  } else if (jobCategory === 'completed') {
    return jobs.filter((job) => job.status === 'Completed' || job.status === 'GOA' || job.status === 'Unsuccessful');
  } else if (jobCategory === 'canceled') {
    return jobs.filter((job) => job.status === 'Canceled');
  }
  
  return [];
};

// Helper function to check if a user can manage unsuccessful requests
export const canManageUnsuccessful = (user) => {
  if (!user) return false;
  
  // Check if the user has the required role (OW, sOW, RM)
  const allowedPrimaryRoles = ['OW', 'sOW', 'RM'];
  const allowedSecondaryRoles = ['dispatcher', 'answeringService', 'admin'];
  
  const hasAllowedPrimaryRole = allowedPrimaryRoles.includes(user.primaryRole);
  
  // Check if user has any of the allowed secondary roles
  let hasAllowedSecondaryRole = false;
  if (user.secondaryRoles) {
    if (Array.isArray(user.secondaryRoles)) {
      // If secondaryRoles is an array, check if it includes any of the allowed roles
      hasAllowedSecondaryRole = allowedSecondaryRoles.some(role => user.secondaryRoles.includes(role));
    } else if (typeof user.secondaryRoles === 'object') {
      // If secondaryRoles is an object, check if any of the allowed roles is true
      hasAllowedSecondaryRole = allowedSecondaryRoles.some(role => user.secondaryRoles[role]);
    }
  }
  
  // Log for debugging
  console.log('canManageUnsuccessful check:', { 
    user, 
    hasAllowedPrimaryRole,
    hasAllowedSecondaryRole,
    primaryRole: user.primaryRole,
    secondaryRoles: user.secondaryRoles
  });
  
  // User must have either an allowed primary role OR an allowed secondary role
  return hasAllowedPrimaryRole || hasAllowedSecondaryRole;
};

/**
 * Check if a user can approve or deny GOA requests.
 * 
 * A user can approve/deny GOA if:
 * 1. Their primary role is NOT 'N/A'
 * 2. They do NOT have 'driver' as their only secondary role
 * 3. They have access to the job (job is visible to them)
 * 
 * @param {Object} user - The user object
 * @param {Object} job - The job object
 * @returns {boolean} - Whether the user can approve/deny GOA
 */
export const canApproveGOA = (user, job) => {
  if (!user || !job) return false;
  
  // Check if user's primary role is not N/A
  const hasValidPrimaryRole = user.primaryRole !== 'N/A';
  
  // Check if user is not a driver-only user
  let isDriverOnly = false;
  
  if (user.secondaryRoles) {
    if (Array.isArray(user.secondaryRoles)) {
      // If secondaryRoles is an array, check if it only contains 'driver'
      isDriverOnly = user.secondaryRoles.length === 1 && user.secondaryRoles.includes('driver');
    } else if (typeof user.secondaryRoles === 'object') {
      // If secondaryRoles is an object, check if only driver is true
      const roles = Object.keys(user.secondaryRoles).filter(role => user.secondaryRoles[role]);
      isDriverOnly = roles.length === 1 && roles[0] === 'driver';
    }
  }
  
  // Check if job is visible to the user
  let hasJobAccess = false;
  
  if (job.visibleTo) {
    if (Array.isArray(job.visibleTo)) {
      // Convert user ID to string for comparison
      const userId = user._id?.toString() || user.id?.toString();
      hasJobAccess = job.visibleTo.some(id => id.toString() === userId);
    }
  }
  
  // Log for debugging
  console.log('canApproveGOA check:', { 
    user, 
    job: job.id,
    hasValidPrimaryRole,
    isDriverOnly,
    hasJobAccess,
    result: hasValidPrimaryRole && !isDriverOnly && hasJobAccess
  });
  
  // User must meet all three conditions
  return hasValidPrimaryRole && !isDriverOnly && hasJobAccess;
};

// Helper function to check if a user is a "driver only" user
export const isDriverOnlyUser = (user) => {
  if (!user) return false;
  
  // Check if primary role is "N/A"
  const hasNAPrimaryRole = user.primaryRole === 'N/A';
  
  // Check if the only secondary role is "driver"
  let hasOnlyDriverSecondaryRole = false;
  
  if (user.secondaryRoles) {
    if (Array.isArray(user.secondaryRoles)) {
      // If secondaryRoles is an array, check if it only contains "driver"
      hasOnlyDriverSecondaryRole = user.secondaryRoles.length === 1 && user.secondaryRoles.includes('driver');
    } else if (typeof user.secondaryRoles === 'object') {
      // If secondaryRoles is an object, check if only driver is true
      const roles = Object.keys(user.secondaryRoles).filter(role => user.secondaryRoles[role]);
      hasOnlyDriverSecondaryRole = roles.length === 1 && roles[0] === 'driver';
    }
  }
  
  return hasNAPrimaryRole && hasOnlyDriverSecondaryRole;
};

// Helper function to get auth headers
export const authHeader = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};
