/**
 * PermissionContext.js
 * 
 * React Context provider for the PermissionManager to make it easily accessible
 * throughout the application's component tree without prop drilling.
 */

import React, { createContext, useContext, useMemo, useEffect, useState } from 'react';
import PermissionManager from '../utils/PermissionManager';

// Create the Permission context
const PermissionContext = createContext(null);

/**
 * Permission Provider component
 * Provides the PermissionManager instance to all child components
 */
export function PermissionProvider({ children }) {
  // Get a memoized instance of the PermissionManager
  const permissionManager = useMemo(() => PermissionManager.getInstance(), []);
  
  // Track whether permissions have been initialized
  const [initialized, setInitialized] = useState(false);
  
  // Initialize permissions when the component mounts
  useEffect(() => {
    console.log('PermissionProvider: Initializing permissions');
    
    // Initialize permissions and update initialized state
    const init = async () => {
      try {
        // Initialize permissions
        const permissions = permissionManager.initializePermissions();
        
        // Mark as initialized
        setInitialized(Boolean(permissions));
        
        console.log('PermissionProvider: Permissions initialized:', initialized);
      } catch (error) {
        console.error('PermissionProvider: Error initializing permissions', error);
        setInitialized(false);
      }
    };
    
    init();
    
    // Clear permissions when component unmounts
    return () => {
      console.log('PermissionProvider: Cleaning up permissions');
    };
  }, [permissionManager]);
  
  // Create memoized helper functions that wrap the permission manager
  const contextValue = useMemo(() => ({
    // Core permission manager instance
    permissionManager,
    
    // Permission state
    initialized,
    
    // Helper methods
    validateAccess: (resource, action) => permissionManager.validateAccess(resource, action),
    validatePageAccess: (pageName) => permissionManager.validatePageAccess(pageName),
    validateJobAccess: (job, operation) => permissionManager.validateJobAccess(job, operation),
    validateUserManagement: (targetUser, operation) => permissionManager.validateUserManagement(targetUser, operation),
    hasPermission: (permission) => permissionManager.hasPermission(permission),
    getCurrentUser: () => permissionManager.getCurrentUser(),
    clearCache: () => permissionManager.clearCache(),
    
    // Additional helpers for common operations
    isOwner: () => {
      const user = permissionManager.getCurrentUser();
      return user && (user.primaryRole === 'OW' || user.primaryRole === 'sOW');
    },
    isRegionalManager: () => {
      const user = permissionManager.getCurrentUser();
      return user && user.primaryRole === 'RM';
    },
    isServiceProvider: () => {
      const user = permissionManager.getCurrentUser();
      return user && user.primaryRole === 'SP';
    },
    isDriverOnly: () => {
      const perms = permissionManager.getPermissions();
      return perms?.permissions?.isDriverOnly === true;
    },
    getUserId: () => {
      const user = permissionManager.getCurrentUser();
      return user ? (user.id || user._id) : null;
    },
    getUsername: () => {
      const user = permissionManager.getCurrentUser();
      return user ? user.username : null;
    }
  }), [permissionManager, initialized]);
  
  return (
    <PermissionContext.Provider value={contextValue}>
      {children}
    </PermissionContext.Provider>
  );
}

/**
 * Custom hook to use the permission context
 * @returns {Object} Permission context object with permission manager and helper methods
 */
export function usePermissions() {
  const context = useContext(PermissionContext);
  
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  
  return context;
}

/**
 * Protected component that only renders if the user has the required permission
 * @param {Object} props - Component props
 * @param {string} props.permission - The permission required to render the component
 * @param {Object} props.resource - The resource to check access for (optional)
 * @param {string} props.action - The action to perform on the resource (optional)
 * @param {React.ReactNode} props.children - The components to render if the user has permission
 * @param {React.ReactNode} props.fallback - Component to render if the user doesn't have permission (optional)
 * @returns {React.ReactNode} The children if the user has permission, fallback otherwise
 */
export function Protected({ permission, resource, action, children, fallback = null }) {
  const { hasPermission, validateAccess } = usePermissions();
  
  // Check permission or resource access
  const hasAccess = resource && action
    ? validateAccess(resource, action)
    : hasPermission(permission);
  
  // Render children if the user has access, fallback otherwise
  return hasAccess ? children : fallback;
}

/**
 * Protected route component that only renders if the user can access the specified page
 * @param {Object} props - Component props
 * @param {string} props.pageName - The name of the page to check access for
 * @param {React.ReactNode} props.children - The components to render if the user has access
 * @param {React.ReactNode} props.fallback - Component to render if the user doesn't have access (optional)
 * @returns {React.ReactNode} The children if the user has access, fallback otherwise
 */
export function ProtectedPage({ pageName, children, fallback = null }) {
  const { validatePageAccess } = usePermissions();
  
  // Check page access
  const hasAccess = validatePageAccess(pageName);
  
  // Render children if the user has access, fallback otherwise
  return hasAccess ? children : fallback;
}

// Export the context itself for advanced use cases
export default PermissionContext;
