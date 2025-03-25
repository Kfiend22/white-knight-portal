/**
 * PermissionManager.js
 * Comprehensive permission validation framework for the White Knight Portal
 * 
 * This class serves as the single source of truth for all permission-related operations
 * throughout the application, implementing a hierarchical validation process.
 */

import permissionStore, {
  PRIMARY_ROLES,
  SECONDARY_ROLES,
  PAGES
} from './permissionStore';

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

class PermissionManager {
  // Singleton instance
  static #instance;
  
  // Cache for permissions
  #cachedPermissions = null;
  #cacheTimestamp = 0;
  
  /**
   * Private constructor - use getInstance() instead
   */
  constructor() {
    if (PermissionManager.#instance) {
      throw new Error('Use PermissionManager.getInstance() instead of new operator');
    }
    
    console.log('PermissionManager: Initializing singleton instance');
  }
  
  /**
   * Get the singleton instance
   * @returns {PermissionManager} The singleton instance
   */
  static getInstance() {
    if (!PermissionManager.#instance) {
      PermissionManager.#instance = new PermissionManager();
    }
    return PermissionManager.#instance;
  }
  
  /**
   * Get the current user's permissions with optimized caching
   * @returns {Object|null} The current permissions or null if not available
   */
  getPermissions() {
    try {
      // 1. Try to get from memory cache first (fastest)
      if (this.#cachedPermissions && this.#cacheTimestamp > Date.now() - CACHE_TTL) {
        return this.#cachedPermissions;
      }
      
      // 2. Try to get from localStorage (slower but persistent)
      const storedPermissions = permissionStore.getStoredPermissions();
      if (storedPermissions) {
        this.#cachedPermissions = storedPermissions;
        this.#cacheTimestamp = Date.now();
        return storedPermissions;
      }
      
      // 3. Initialize permissions from user data if available
      const initializedPermissions = this.initializePermissions();
      return initializedPermissions;
    } catch (error) {
      console.error('PermissionManager: Error getting permissions', error);
      return null;
    }
  }
  
  /**
   * Initialize permissions from current user data
   * @returns {Object|null} The initialized permissions or null if not available
   */
  initializePermissions() {
    try {
      const permissions = permissionStore.initializePermissions();
      if (permissions) {
        this.#cachedPermissions = permissions;
        this.#cacheTimestamp = Date.now();
      }
      return permissions;
    } catch (error) {
      console.error('PermissionManager: Error initializing permissions', error);
      return null;
    }
  }
  
  /**
   * Clear the cached permissions
   * Used during logout or when permissions need to be refreshed
   */
  clearCache() {
    console.log('PermissionManager: Clearing permission cache');
    this.#cachedPermissions = null;
    this.#cacheTimestamp = 0;
    permissionStore.clearPermissions();
  }
  
  /**
   * Get the current user from the permissions
   * @returns {Object|null} The current user object or null if not available
   */
  getCurrentUser() {
    const permissions = this.getPermissions();
    return permissions?.userData || null;
  }
  
  /**
   * Main validation method for determining if a user can access a resource
   * @param {Object} resource - The resource to check access for
   * @param {string} action - The action to perform on the resource
   * @returns {boolean} True if the user can access the resource, false otherwise
   */
  validateAccess(resource, action) {
    try {
      const permissions = this.getPermissions();
      
      // No permissions available
      if (!permissions || !permissions.isAuthenticated) {
        console.warn('PermissionManager: No authenticated user');
        return false;
      }
      
      const { permissions: permissionData } = permissions;
      
      // If resource is null, deny access
      if (!resource) {
        console.warn('PermissionManager: Invalid resource');
        return false;
      }
      
      // Log debug information
      console.debug(`PermissionManager: Validating ${action} on ${resource.type || 'unknown'}`);
      
      // 1. Primary Role Check (Highest Priority)
      if ([PRIMARY_ROLES.OWNER, PRIMARY_ROLES.SUB_OWNER].includes(permissionData.primaryRole)) {
        return true; // Grant all permissions to OW and sOW
      }
      
      // 2. Regional Manager Check
      if (permissionData.primaryRole === PRIMARY_ROLES.REGIONAL_MANAGER) {
        const regionResult = this.#validateByRegion(permissionData.regions, resource);
        if (!regionResult) return false;
        
        // For RM, we need to check specific permissions based on action
        return this.#validateActionForRole(PRIMARY_ROLES.REGIONAL_MANAGER, action, resource);
      }
      
      // 3. Service Provider Check
      if (permissionData.primaryRole === PRIMARY_ROLES.SERVICE_PROVIDER) {
        const vendorResult = this.#validateByVendorId(permissionData.vendorId, resource);
        if (!vendorResult) return false;
        
        // For SP, we need to check specific permissions based on action
        return this.#validateActionForRole(PRIMARY_ROLES.SERVICE_PROVIDER, action, resource);
      }
      
      // 4. N/A Role (Secondary Role Check)
      if (permissionData.primaryRole === PRIMARY_ROLES.UNDEFINED) {
        // Check if user is driver-only
        if (this.isDriverOnly(permissionData.secondaryRoles)) {
          return this.#validateDriverAccess(permissionData.userId, resource, action);
        }
        
        // Check vendor ID/Number
        const vendorMatch = this.#validateByVendorId(permissionData.vendorId, resource);
        if (!vendorMatch) return false;
        
        // Check region if assigned and has owner's vendor ID
        if (this.hasOwnerVendorId(permissionData.vendorId) && permissionData.regions?.length > 0) {
          const regionMatch = this.#validateByRegion(permissionData.regions, resource);
          if (!regionMatch) return false;
        }
        
        // Determine highest privileged role and validate accordingly
        return this.#validateBySecondaryRoles(permissionData.secondaryRoles, resource, action);
      }
      
      return false;
    } catch (error) {
      console.error('PermissionManager: Error validating access', error);
      return false; // Fail closed - deny access on errors
    }
  }
  
  /**
   * Validate if the current user can access a specific page
   * @param {string} pageName - The name of the page to check
   * @returns {boolean} True if the user can access the page, false otherwise
   */
  validatePageAccess(pageName) {
    // Special case for dashboard
    if (pageName.toLowerCase() === 'dashboard') {
      return true; // Everyone can access dashboard
    }
    
    try {
      const permissions = this.getPermissions();
      
      // No permissions available
      if (!permissions || !permissions.isAuthenticated) {
        console.warn('PermissionManager: No authenticated user for page access');
        return false;
      }
      
      const { permissions: permissionData } = permissions;
      
      // Log page access attempt
      console.debug(`PermissionManager: Validating access to page: ${pageName}`);
      
      // Check page access from permissionStore (this already includes primary role checks)
      return permissionStore.canAccessPage(pageName);
    } catch (error) {
      console.error(`PermissionManager: Error validating page access for ${pageName}`, error);
      return false; // Fail closed
    }
  }
  
  /**
   * Validate if the current user can perform an operation on a job
   * @param {Object} job - The job to check
   * @param {string} operation - The operation to perform (view, edit, delete, etc.)
   * @returns {boolean} True if the user can perform the operation, false otherwise
   */
  validateJobAccess(job, operation) {
    if (!job) {
      console.warn('PermissionManager: Invalid job');
      return false;
    }
    
    try {
      const permissions = this.getPermissions();
      
      // No permissions available
      if (!permissions || !permissions.isAuthenticated) {
        console.warn('PermissionManager: No authenticated user for job access');
        return false;
      }
      
      const { permissions: permissionData } = permissions;
      
      // Log job access attempt
      console.debug(`PermissionManager: Validating ${operation} on job: ${job.id || job._id}`);
      
      // Create resource object for job
      const resource = {
        type: 'job',
        id: job.id || job._id,
        status: job.status,
        vendorId: job.vendorId,
        regionId: job.region,
        driverId: job.driverId,
        driver: job.driver
      };
      
      return this.validateAccess(resource, operation);
    } catch (error) {
      console.error(`PermissionManager: Error validating job access for ${operation}`, error);
      return false; // Fail closed
    }
  }
  
  /**
   * Validate if the current user can perform an operation on another user
   * @param {Object} targetUser - The user to check
   * @param {string} operation - The operation to perform (view, edit, delete, etc.)
   * @returns {boolean} True if the user can perform the operation, false otherwise
   */
  validateUserManagement(targetUser, operation) {
    if (!targetUser) {
      console.warn('PermissionManager: Invalid target user');
      return false;
    }
    
    try {
      const permissions = this.getPermissions();
      
      // No permissions available
      if (!permissions || !permissions.isAuthenticated) {
        console.warn('PermissionManager: No authenticated user for user management');
        return false;
      }
      
      const { permissions: permissionData } = permissions;
      
      // Log user management attempt
      console.debug(`PermissionManager: Validating ${operation} on user: ${targetUser.id || targetUser._id}`);
      
      // Create resource object for target user
      const resource = {
        type: 'user',
        id: targetUser.id || targetUser._id,
        primaryRole: targetUser.primaryRole || targetUser.role,
        vendorId: targetUser.vendorId,
        regionId: Array.isArray(targetUser.regions) ? targetUser.regions[0] : targetUser.region
      };
      
      return this.validateAccess(resource, operation);
    } catch (error) {
      console.error(`PermissionManager: Error validating user management for ${operation}`, error);
      return false; // Fail closed
    }
  }
  
  /**
   * Check if a user has a specific permission
   * @param {string} permission - The permission to check
   * @returns {boolean} True if the user has the permission, false otherwise
   */
  hasPermission(permission) {
    return permissionStore.hasPermission(permission);
  }
  
  /**
   * Check if a user is a driver-only user
   * @param {Array|Object} secondaryRoles - The secondary roles to check
   * @returns {boolean} True if the user is a driver-only user, false otherwise
   */
  isDriverOnly(secondaryRoles) {
    // Handle array format
    if (Array.isArray(secondaryRoles)) {
      return secondaryRoles.length === 1 && secondaryRoles.includes(SECONDARY_ROLES.DRIVER);
    }
    
    // Handle object format
    if (typeof secondaryRoles === 'object') {
      const roles = Object.keys(secondaryRoles).filter(role => secondaryRoles[role] === true);
      return roles.length === 1 && roles.includes(SECONDARY_ROLES.DRIVER);
    }
    
    return false;
  }
  
  /**
   * Check if a vendor ID is the owner's vendor ID
   * @param {string} vendorId - The vendor ID to check
   * @returns {boolean} True if the vendor ID is the owner's, false otherwise
   */
  hasOwnerVendorId(vendorId) {
    // This is a simplification. In a real implementation, we would check against stored owner vendor IDs
    return vendorId === '1' || (vendorId && vendorId.startsWith('OW'));
  }
  
  /**
   * Validate access based on region
   * @param {Array} userRegions - The user's assigned regions
   * @param {Object} resource - The resource to check
   * @returns {boolean} True if the user has access based on region, false otherwise
   * @private
   */
  #validateByRegion(userRegions, resource) {
    // If user has no regions, deny access
    if (!userRegions || userRegions.length === 0) {
      return false;
    }
    
    // If resource has no region, allow access (assuming it's not region-specific)
    if (!resource.regionId) {
      return true;
    }
    
    // Check if user's regions include the resource's region
    return userRegions.includes(resource.regionId);
  }
  
  /**
   * Validate access based on vendor ID
   * @param {string} userVendorId - The user's vendor ID
   * @param {Object} resource - The resource to check
   * @returns {boolean} True if the user has access based on vendor ID, false otherwise
   * @private
   */
  #validateByVendorId(userVendorId, resource) {
    // If user has no vendor ID, deny access
    if (!userVendorId) {
      return false;
    }
    
    // If resource has no vendor ID, allow access (assuming it's not vendor-specific)
    if (!resource.vendorId) {
      return true;
    }
    
    // Check if user's vendor ID matches the resource's vendor ID
    return userVendorId === resource.vendorId;
  }
  
  /**
   * Validate access based on secondary roles
   * @param {Array|Object} secondaryRoles - The user's secondary roles
   * @param {Object} resource - The resource to check
   * @param {string} action - The action to perform
   * @returns {boolean} True if the user has access based on secondary roles, false otherwise
   * @private
   */
  #validateBySecondaryRoles(secondaryRoles, resource, action) {
    // Convert object format to array for consistent handling
    let roles = [];
    if (Array.isArray(secondaryRoles)) {
      roles = secondaryRoles;
    } else if (typeof secondaryRoles === 'object') {
      roles = Object.keys(secondaryRoles).filter(role => secondaryRoles[role] === true);
    }
    
    // Check for admin (highest privilege among secondary roles)
    if (roles.includes(SECONDARY_ROLES.ADMIN)) {
      return this.#validateActionForSecondaryRole(SECONDARY_ROLES.ADMIN, action, resource);
    }
    
    // Check for dispatcher
    if (roles.includes(SECONDARY_ROLES.DISPATCHER)) {
      return this.#validateActionForSecondaryRole(SECONDARY_ROLES.DISPATCHER, action, resource);
    }
    
    // Check for answering service
    if (roles.includes(SECONDARY_ROLES.ANSWERING_SERVICE)) {
      return this.#validateActionForSecondaryRole(SECONDARY_ROLES.ANSWERING_SERVICE, action, resource);
    }
    
    // Check for driver (lowest privilege)
    if (roles.includes(SECONDARY_ROLES.DRIVER)) {
      return this.#validateDriverAccess(null, resource, action);
    }
    
    return false;
  }
  
  /**
   * Validate driver-specific access rules
   * @param {string} userId - The user's ID
   * @param {Object} resource - The resource to check
   * @param {string} action - The action to perform
   * @returns {boolean} True if the driver has access, false otherwise
   * @private
   */
  #validateDriverAccess(userId, resource, action) {
    // Resource is not a job, deny access
    if (resource.type !== 'job') {
      return false;
    }
    
    // Check if driver is assigned to the job
    const isAssigned = (userId && resource.driverId === userId) || 
                        (resource.driver && resource.driver.includes(userId));
    
    // Drivers can only view their assigned jobs
    if (action === 'view') {
      return isAssigned;
    }
    
    // Drivers can update status of their assigned jobs (with limitations)
    if (action === 'updateStatus' && isAssigned) {
      // Additional checks could be performed here based on current job status
      return true;
    }
    
    return false;
  }
  
  /**
   * Validate if a primary role can perform an action on a resource
   * @param {string} role - The primary role
   * @param {string} action - The action to perform
   * @param {Object} resource - The resource to check
   * @returns {boolean} True if the role can perform the action, false otherwise
   * @private
   */
  #validateActionForRole(role, action, resource) {
    // Future enhancement: Implement action-specific permissions for primary roles
    switch (role) {
      case PRIMARY_ROLES.REGIONAL_MANAGER:
        // RM specific permissions
        // For example, RM can't delete system settings
        if (action === 'delete' && resource.type === 'systemSetting') {
          return false;
        }
        return true;
        
      case PRIMARY_ROLES.SERVICE_PROVIDER:
        // SP specific permissions
        // SP can't access regions
        if (resource.type === 'region') {
          return false;
        }
        // SP can't delete anything (except maybe their own records)
        if (action === 'delete' && resource.createdBy !== this.getCurrentUser()?.id) {
          return false;
        }
        return true;
        
      default:
        return false;
    }
  }
  
  /**
   * Validate if a secondary role can perform an action on a resource
   * @param {string} role - The secondary role
   * @param {string} action - The action to perform
   * @param {Object} resource - The resource to check
   * @returns {boolean} True if the role can perform the action, false otherwise
   * @private
   */
  #validateActionForSecondaryRole(role, action, resource) {
    // Future enhancement: Implement action-specific permissions for secondary roles
    switch (role) {
      case SECONDARY_ROLES.ADMIN:
        // Admin can do anything except system-level operations
        if (action.includes('system')) {
          return false;
        }
        return true;
        
      case SECONDARY_ROLES.DISPATCHER:
        // Dispatcher specific permissions
        // Dispatchers can't delete anything
        if (action === 'delete') {
          return false;
        }
        // Dispatchers can only work with jobs
        if (resource.type !== 'job') {
          return false;
        }
        return true;
        
      case SECONDARY_ROLES.ANSWERING_SERVICE:
        // Answering service specific permissions
        // Similar to dispatcher but more limited
        // They can view and create jobs but not edit existing ones
        if (action === 'view' || action === 'create') {
          return true;
        }
        return false;
        
      default:
        return false;
    }
  }
}

export default PermissionManager;
