// File: backend/middleware/roleMiddleware.js

/**
 * Middleware for role-based access control
 */

// Check if user has a specific primary role
const hasPrimaryRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const userRole = req.user.primaryRole;
    
    // If roles is a string, convert to array
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
    }
    
    next();
  };
};

// Check if user has a specific secondary role
const hasSecondaryRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const userSecondaryRoles = req.user.secondaryRoles || {};
    
    // If roles is a string, convert to array
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    const hasRole = allowedRoles.some(role => userSecondaryRoles[role] === true);
    
    if (!hasRole) {
      return res.status(403).json({ 
        message: `Access denied. Required secondary role: ${allowedRoles.join(' or ')}`
      });
    }
    
    next();
  };
};

// Check if user has access to a specific page
const hasPageAccess = (page) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    // Get accessible pages for the user
    const accessiblePages = req.user.accessiblePages || [];
    
    if (!accessiblePages.includes(page)) {
      return res.status(403).json({ 
        message: `Access denied to page: ${page}`
      });
    }
    
    next();
  };
};

// Check if user can create a specific role
const canCreateRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    // Role creation permission matrix
    const allowedCreations = {
      'OW': ['OW', 'sOW', 'RM', 'SP'],
      'sOW': ['RM', 'SP'],
      'RM': ['SP'],
      'SP': []
    };
    
    const userRole = req.user.primaryRole;
    
    if (!allowedCreations[userRole]?.includes(role)) {
      return res.status(403).json({ 
        message: `${userRole} cannot create users with ${role} role`
      });
    }
    
    next();
  };
};

// Check if user can manage another user
const canManageUser = () => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
      const User = require('../models/userModel');
      
      // Get the target user from the database
      const targetUser = await User.findById(req.params.id);
      
      if (!targetUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Get the current user with full details
      const currentUser = await User.findById(req.user.id);
      
      if (!currentUser) {
        return res.status(401).json({ message: 'Current user not found' });
      }
      
      // Check if current user can manage target user
      if (!currentUser.canManageUser(targetUser)) {
        return res.status(403).json({ 
          message: 'You do not have permission to manage this user'
        });
      }
      
      // Add target user to request for later use
      req.targetUser = targetUser;
      
      next();
    } catch (error) {
      console.error('Error in canManageUser middleware:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
};

// Ensure vendor isolation - users can only access data from their own vendor
const ensureVendorIsolation = () => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    // Add vendor number to query parameters
    if (!req.query) {
      req.query = {};
    }
    
    // OW and sOW can see all vendors if they explicitly request it
    if ((req.user.primaryRole === 'OW' || req.user.primaryRole === 'sOW') && 
        req.query.allVendors === 'true') {
      // Remove vendor filter for OW/sOW when explicitly requested
      delete req.query.vendorNumber;
    } else {
      // For everyone else, enforce vendor isolation
      req.query.vendorNumber = req.user.vendorNumber;
    }
    
    next();
  };
};

// Ensure region isolation - RMs can only access data from their assigned regions
const ensureRegionIsolation = () => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    // Only apply to Regional Managers
    if (req.user.primaryRole === 'RM') {
      if (!req.query) {
        req.query = {};
      }
      
      // Add region filter
      if (req.user.regions && req.user.regions.length > 0) {
        req.query.region = { $in: req.user.regions };
      } else {
        // If RM has no regions assigned, they can't see any data
        req.query.region = null;
      }
    }
    
    next();
  };
};

// Check if a user can view a specific job
const canViewJob = async (userId, job) => {
  try {
    const User = require('../models/userModel');
    const Region = require('../models/Region');
    
    // Get the user
    const user = await User.findById(userId);
    
    if (!user) {
      console.log(`canViewJob: User ${userId} not found`);
      return false;
    }
    
    // If the job has a visibleTo array and the user is in it, they can view the job
    if (job.visibleTo && job.visibleTo.some(id => id.toString() === userId.toString())) {
      console.log(`canViewJob: User ${userId} is in visibleTo array`);
      return true;
    }
    
    // OW and sOW can view all jobs
    if (user.primaryRole === 'OW' || user.primaryRole === 'sOW') {
      console.log(`canViewJob: User ${userId} is OW or sOW`);
      return true;
    }
    
    // RM can only view jobs in their assigned regions
    if (user.primaryRole === 'RM') {
      // Extract the state from the job's serviceLocation
      const jobState = job.serviceLocation?.state;
      
      if (!jobState) {
        console.log(`canViewJob: Job ${job._id} has no state in serviceLocation`);
        return false;
      }
      
      // Get the RM's regions
      const regions = await Region.find({ _id: { $in: user.regions } });
      
      // Check if the job's state is in any of the RM's regions
      let stateInRegion = false;
      for (const region of regions) {
        if (region.states && region.states.some(state => 
          state.state.trim().toLowerCase() === jobState.trim().toLowerCase())) {
          stateInRegion = true;
          break;
        }
      }
      
      if (!stateInRegion) {
        console.log(`canViewJob: Job state ${jobState} not in RM's regions`);
        return false;
      }
      
      console.log(`canViewJob: RM ${userId} can view job in their region`);
      return true;
    }
    
    // Dispatchers can view jobs if they share the same vendor ID as an OW, sOW, or RM
    if (user.secondaryRoles && user.secondaryRoles.dispatcher) {
      // Get the job creator
      const jobCreator = await User.findById(job.provider);
      
      if (!jobCreator) {
        console.log(`canViewJob: Job creator not found for job ${job._id}`);
        return false;
      }
      
      // Check if the dispatcher has the same vendor ID as the job creator
      const dispatcherVendorId = user.vendorId || user.vendorNumber;
      const creatorVendorId = jobCreator.vendorId || jobCreator.vendorNumber;
      
      if (dispatcherVendorId === creatorVendorId) {
        console.log(`canViewJob: Dispatcher ${userId} has same vendor ID as job creator`);
        return true;
      }
      
      // Find all OW, sOW, and RM users
      const ownerUsers = await User.find({
        primaryRole: { $in: ['OW', 'sOW', 'RM'] },
        isActive: true
      });
      
      // Check if the dispatcher shares a vendor ID with any OW, sOW, or RM
      for (const owner of ownerUsers) {
        const ownerVendorId = owner.vendorId || owner.vendorNumber;
        if (dispatcherVendorId === ownerVendorId) {
          console.log(`canViewJob: Dispatcher ${userId} has same vendor ID as an owner`);
          return true;
        }
      }
      
      console.log(`canViewJob: Dispatcher ${userId} does not have matching vendor ID`);
      return false;
    }
    
    // SP can only view jobs assigned to them
    if (user.primaryRole === 'SP') {
      const canView = job.driverId && job.driverId.toString() === userId.toString();
      console.log(`canViewJob: SP ${userId} ${canView ? 'can' : 'cannot'} view job ${job._id}`);
      return canView;
    }
    
    // Users with driver secondary role can view jobs assigned to them
    if (user.secondaryRoles && user.secondaryRoles.driver) {
      // Check by driver ID
      if (job.driverId && job.driverId.toString() === userId.toString()) {
        console.log(`canViewJob: Driver ${userId} is assigned to job ${job._id} by ID`);
        return true;
      }
      
      // Check by driver name
      const driverName = `${user.firstName} ${user.lastName}`;
      const matchesByName = job.driver === driverName;
      if (matchesByName) {
        console.log(`canViewJob: Driver ${userId} is assigned to job ${job._id} by name`);
      }
      return matchesByName;
    }
    
    // Driver can view jobs assigned to them by name or ID
    // Only apply this restriction if the user's primary role is driver
    if (user.primaryRole === 'driver') {
      // Check by driver ID
      if (job.driverId && job.driverId.toString() === userId.toString()) {
        console.log(`canViewJob: Driver ${userId} (primary role) is assigned to job ${job._id} by ID`);
        return true;
      }
      
      // Check by driver name
      const driverName = `${user.firstName} ${user.lastName}`;
      const matchesByName = job.driver === driverName;
      if (matchesByName) {
        console.log(`canViewJob: Driver ${userId} (primary role) is assigned to job ${job._id} by name`);
      }
      return matchesByName;
    }
    
    // By default, users cannot view jobs
    console.log(`canViewJob: User ${userId} with role ${user.primaryRole} cannot view job ${job._id}`);
    return false;
  } catch (error) {
    console.error('Error in canViewJob function:', error);
    return false;
  }
};

// Middleware to check if user can view a specific job
const checkJobAccess = () => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
      const Job = require('../models/Job');
      
      // Get the job from the database
      const job = await Job.findById(req.params.id);
      
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }
      
      // Check if user can view the job
      const canView = await canViewJob(req.user.id, job);
      
      if (!canView) {
        return res.status(403).json({ 
          message: 'You do not have permission to view this job'
        });
      }
      
      // Add job to request for later use
      req.job = job;
      
      next();
    } catch (error) {
      console.error('Error in checkJobAccess middleware:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
};

module.exports = {
  hasPrimaryRole,
  hasSecondaryRole,
  hasPageAccess,
  canCreateRole,
  canManageUser,
  ensureVendorIsolation,
  ensureRegionIsolation,
  canViewJob,
  checkJobAccess
};
