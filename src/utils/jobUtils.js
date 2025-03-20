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
    'Expired': 9
  };
  return priorityMap[status] || 0; // Default to 0 for unknown statuses
};

// Helper function to determine job status color
export const getJobStatusColor = (status, job) => {
  if (!status) return 'transparent';
  
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
    
    // Pink for Expired
    case 'Expired':
      return 'rgba(255, 192, 203, 0.3)'; // Pink with transparency
    
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

// Helper function to determine if current user is the assigned driver
export const isAssignedDriver = (job, currentUser) => {
  console.log('isAssignedDriver called with job:', job);
  console.log('Current user:', currentUser);
  
  if (!currentUser || !job || !job.driverId) {
    console.log('isAssignedDriver: Missing required data', { 
      hasCurrentUser: !!currentUser, 
      hasJob: !!job, 
      hasDriverId: job ? !!job.driverId : false,
      currentUserRole: currentUser?.primaryRole,
      currentUserSecondaryRoles: currentUser?.secondaryRoles,
      jobStatus: job?.status
    });
    return false;
  }
  
  // Convert both IDs to strings for comparison to avoid type issues
  const driverId = job.driverId?.toString();
  const userId = currentUser._id?.toString() || currentUser.id?.toString();
  
  // Log detailed information for debugging
  console.log('Driver check:', { 
    driverId, 
    userId, 
    driverIdType: typeof job.driverId,
    userIdType: typeof currentUser.id,
    isMatch: driverId === userId,
    currentUserRole: currentUser.primaryRole,
    hasDriverSecondaryRole: currentUser.secondaryRoles?.driver,
    job: {
      id: job.id,
      status: job.status,
      needsAcceptance: job.needsAcceptance,
      autoRejectAt: job.autoRejectAt
    }
  });
  
  // Return true only if the IDs match (removed hasDriverRole check)
  return driverId === userId;
};

// Calculate target time for ETA countdown
export const calculateTargetTime = (job) => {
  if (!job.eta) return null;
  
  // Create a unique job identifier for logging
  const jobIdentifier = `job-${job.id.substring(0, 6)}`;
  
  // If ETA is a number (minutes), calculate target time from creation or acceptance
  if (!isNaN(parseInt(job.eta))) {
    // Convert ETA minutes to milliseconds
    const etaMilliseconds = parseInt(job.eta) * 60 * 1000;
    
    // Use acceptedAt as base time if available (when driver accepted the job)
    if (job.acceptedAt) {
      // Don't log this common case to reduce console noise
      return new Date(job.acceptedAt).getTime() + etaMilliseconds;
    }
    
    // For assigned jobs, prioritize firstAssignedAt (original assignment time) if available
    // This ensures the ETA timer doesn't restart when a job is redispatched
    if (job.firstAssignedAt) {
      // Log with job identifier to track which job this calculation is for
      console.log(`${jobIdentifier}: Using firstAssignedAt for ETA calculation: ${job.firstAssignedAt}`);
      return new Date(job.firstAssignedAt).getTime() + etaMilliseconds;
    }
    
    // If no firstAssignedAt, fall back to assignedAt
    if (job.assignedAt) {
      // Log with job identifier to track which job this calculation is for
      console.log(`${jobIdentifier}: Using assignedAt for ETA calculation: ${job.assignedAt}`);
      return new Date(job.assignedAt).getTime() + etaMilliseconds;
    }
    
    // Otherwise fall back to job.createdAt or current time
    const baseTime = job.createdAt ? new Date(job.createdAt).getTime() : Date.now();
    // Log with job identifier to track which job this calculation is for
    console.log(`${jobIdentifier}: Using createdAt for ETA calculation: ${job.createdAt || 'current time'}`);
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
    // Include both 'Pending' and 'Pending Acceptance' statuses in the pending section
    return jobs.filter((job) => {
      const isPending = job.status === 'Pending';
      const isPendingAcceptance = job.status === 'Pending Acceptance';
      
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
      
      return isPending || isPendingAcceptance;
    });
  } else if (jobCategory === 'inProgress') {
    return isDispatchUser(currentUser)
      ? jobs.filter((job) => 
          ['In-Progress', 'Dispatched', 'En Route', 'On Site', 'Awaiting Approval', 'Rejected', 'Accepted', 'Completed', 'Pending', 'Scheduled', 'Pending Acceptance'].includes(job.status)
        )
      : jobs.filter((job) => 
          ['In-Progress', 'Dispatched', 'En Route', 'On Site', 'Awaiting Approval', 'Rejected', 'Accepted'].includes(job.status)
        );
  } else if (jobCategory === 'scheduled') {
    return jobs.filter((job) => job.status === 'Scheduled');
  } else if (jobCategory === 'completed') {
    return jobs.filter((job) => job.status === 'Completed');
  } else if (jobCategory === 'canceled') {
    return jobs.filter((job) => job.status === 'Canceled');
  }
  
  return [];
};

// Helper function to get auth headers
export const authHeader = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};
