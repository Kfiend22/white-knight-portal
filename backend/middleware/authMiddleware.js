const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

/**
 * Middleware to protect routes that require authentication
 * Verifies the JWT token and adds the user to the request object
 */
const protect = async (req, res, next) => {
  let token;

  // Log the entire request headers for debugging
  console.log('Request Headers:', req.headers);

  // Check if authorization header exists and starts with Bearer
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      console.log('Token:', token); // Log the extracted token
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'defaultsecret');
      console.log('Decoded Token:', decoded); // Log the decoded token
      
      // Get user from the token and exclude the password field
      // The user ID could be in decoded.id or decoded.user.id depending on how the token was created
      const userId = decoded.user ? decoded.user.id : decoded.id;
      console.log('User ID:', userId); // Log the extracted user ID
      
      // Get user with full details
      const user = await User.findById(userId).select('-password');
      console.log('User from DB:', user); // Log the fetched user object
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      
      // Add user to request
      req.user = user;
      
      // Add token data to request for access control
      req.userToken = {
        primaryRole: decoded.user.primaryRole,
        secondaryRoles: decoded.user.secondaryRoles || {},
        vendorNumber: decoded.user.vendorNumber,
        regions: decoded.user.regions || [],
        accessiblePages: decoded.user.accessiblePages || [],
        permissions: decoded.user.permissions || { pages: [], actions: [] }
      };
      
      // Merge token permissions with user object for backward compatibility
      if (!user.permissions) {
        user.permissions = {};
      }
      
      // If token has permissions data, use it
      if (decoded.user.permissions) {
        user.permissions.pages = decoded.user.permissions.pages || [];
        user.permissions.actions = decoded.user.permissions.actions || [];
      }
      
      // If token has accessiblePages, add them to user permissions
      if (decoded.user.accessiblePages && decoded.user.accessiblePages.length > 0) {
        if (!user.permissions.pages) {
          user.permissions.pages = [];
        }
        
        // Add any missing pages from accessiblePages to permissions.pages
        decoded.user.accessiblePages.forEach(page => {
          if (!user.permissions.pages.includes(page)) {
            user.permissions.pages.push(page);
          }
        });
      }
      
      // Check if user needs to change password on first login
      if (user.isFirstLogin && 
          !req.path.includes('/change-password') && 
          !req.originalUrl.includes('/change-password')) {
        return res.status(403).json({ 
          message: 'Password change required', 
          requiresPasswordChange: true 
        });
      }
      
      // Check if user is active
      if (user.isActive === false) {
        return res.status(403).json({
          message: 'Account is inactive. Please contact an administrator.'
        });
      }
      
      console.log('Middleware complete - calling next()'); // Log before calling next()
      next();
    } catch (error) {
      console.error('Error in protect middleware:', error); // Enhanced error logging
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired, please log in again' });
      }
      
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

/**
 * Middleware to check if user has a specific primary role
 * @param {Array|String} roles - Array or string of allowed roles
 * @returns {Function} Middleware function
 */
const checkPrimaryRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Convert roles to array if it's a string
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    // Check if user's primary role is in the allowed roles
    const userRole = req.user.primaryRole || req.user.role; // Support both new and legacy schema
    
    if (allowedRoles.includes(userRole)) {
      next();
    } else {
      res.status(403).json({ 
        message: `Not authorized. Required role: ${allowedRoles.join(' or ')}` 
      });
    }
  };
};

/**
 * Middleware to check if user has a specific secondary role
 * @param {Array|String} roles - Array or string of allowed roles
 * @returns {Function} Middleware function
 */
const checkSecondaryRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Convert roles to array if it's a string
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    // Check if user has any of the allowed secondary roles
    const userSecondaryRoles = req.user.secondaryRoles || {};
    
    const hasRole = allowedRoles.some(role => userSecondaryRoles[role] === true);
    
    if (hasRole) {
      next();
    } else {
      res.status(403).json({ 
        message: `Not authorized. Required secondary role: ${allowedRoles.join(' or ')}` 
      });
    }
  };
};

/**
 * Middleware to check if user has access to a specific page
 * @param {String} page - Page name
 * @returns {Function} Middleware function
 */
const pageAccess = (page) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Get accessible pages for the user
    const accessiblePages = req.user.accessiblePages || [];
    
    if (accessiblePages.includes(page)) {
      next();
    } else {
      res.status(403).json({ message: `Not authorized to access ${page}` });
    }
  };
};

/**
 * Middleware to check if user can create a specific role
 * @param {String} role - Role to check
 * @returns {Function} Middleware function
 */
const canCreateRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Check if user can create the specified role
    if (req.user.canCreateRole(role)) {
      next();
    } else {
      res.status(403).json({ 
        message: `You cannot create users with ${role} role` 
      });
    }
  };
};

/**
 * Middleware to check if user can manage another user
 * Must be used after the protect middleware
 * Expects the target user ID in req.params.id
 */
const canManageUser = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    // Get the target user from the database
    const targetUser = await User.findById(req.params.id);
    
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if current user can manage target user
    if (req.user.canManageUser(targetUser)) {
      // Add target user to request for later use
      req.targetUser = targetUser;
      next();
    } else {
      res.status(403).json({ 
        message: 'You do not have permission to manage this user' 
      });
    }
  } catch (error) {
    console.error('Error in canManageUser middleware:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Middleware to ensure vendor isolation
 * Users can only access data from their own vendor
 */
const ensureVendorIsolation = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
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
    req.query.vendorNumber = req.user.vendorNumber || req.user.vendorId;
  }
  
  next();
};

/**
 * Middleware to ensure region isolation
 * RMs can only access data from their assigned regions
 */
const ensureRegionIsolation = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  // Only apply to Regional Managers
  if (req.user.primaryRole === 'RM' || req.user.role === 'RM') {
    if (!req.query) {
      req.query = {};
    }
    
    // Add region filter
    const userRegions = req.user.regions || [];
    if (req.user.region) {
      userRegions.push(req.user.region);
    }
    
    if (userRegions.length > 0) {
      req.query.region = { $in: userRegions };
    } else {
      // If RM has no regions assigned, they can't see any data
      req.query.region = null;
    }
  }
  
  next();
};

/**
 * Legacy middleware for backward compatibility
 */

/**
 * Middleware to check if user is an Owner (OW)
 * Must be used after the protect middleware
 */
const owner = (req, res, next) => {
  if (req.user && (req.user.primaryRole === 'OW' || req.user.role === 'OW')) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an Owner' });
  }
};

/**
 * Middleware to check if user is a Regional Manager (RM)
 * Must be used after the protect middleware
 */
const regionalManager = (req, res, next) => {
  if (req.user && 
      (req.user.primaryRole === 'RM' || req.user.primaryRole === 'OW' || 
       req.user.role === 'RM' || req.user.role === 'OW')) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as a Regional Manager' });
  }
};

/**
 * Middleware to check if user has a specific role (legacy)
 * @param {Array} roles - Array of allowed roles
 * @returns {Function} Middleware function
 */
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Check both primary role and legacy role
    const userRole = req.user.primaryRole || req.user.role;
    
    if (roles.includes(userRole)) {
      next();
    } else {
      res.status(403).json({ message: 'Not authorized for this action' });
    }
  };
};

module.exports = { 
  protect, 
  checkPrimaryRole,
  checkSecondaryRole,
  pageAccess,
  canCreateRole,
  canManageUser,
  ensureVendorIsolation,
  ensureRegionIsolation,
  // Legacy middleware
  checkRole, 
  owner, 
  regionalManager
};
