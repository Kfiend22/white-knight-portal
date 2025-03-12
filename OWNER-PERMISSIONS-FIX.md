# Owner Permissions Fix

This document describes the changes made to fix the permissions issue for the System Owner account.

## Problem

The System Owner account was not getting the expected permissions, despite having the correct primary role (OW) and secondary role (admin). This was causing the user to not have access to various parts of the application.

## Root Causes

1. **Token Data Issue**: The JWT token was not including all necessary role and permission data.
2. **Virtual Properties Not Being Used**: The `accessiblePages` virtual property defined in the user model was not being properly included in the token or checked by middleware.
3. **Empty Permissions Arrays**: The legacy `permissions.pages` array was empty, which was causing issues with parts of the code that still rely on this.

## Changes Made

### 1. Updated Token Generation

Modified the `generateToken` function in `authController.js` to include:
- The `accessiblePages` virtual property from the user model
- The legacy permissions object for backward compatibility

```javascript
const generateToken = (user, rememberMe = false) => {
  // Get accessible pages from virtual property
  const accessiblePages = user.accessiblePages || [];
  
  // Get legacy permissions
  const legacyPermissions = user.permissions || { pages: [], actions: [] };
  
  return jwt.sign(
    { 
      user: {
        id: user._id,
        primaryRole: user.primaryRole || user.role,
        secondaryRoles: user.secondaryRoles || {},
        vendorNumber: user.vendorNumber || user.vendorId,
        regions: user.regions || (user.region ? [user.region] : []),
        accessiblePages: accessiblePages, // Include accessible pages
        permissions: legacyPermissions // Include legacy permissions
      }
    }, 
    process.env.JWT_SECRET || 'defaultsecret', 
    { 
      expiresIn: rememberMe ? '30d' : '24h' 
    }
  );
};
```

### 2. Updated Authentication Middleware

Modified the `protect` middleware in `authMiddleware.js` to:
- Extract and apply the token data, including accessible pages
- Merge token permissions with the user object for backward compatibility
- Add accessible pages to the legacy permissions.pages array

```javascript
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
```

### 3. Created Script to Update Owner Permissions

Created a script (`update-owner-permissions.js`) to:
- Find the owner user in the database
- Update the legacy permissions object with all available pages and actions
- Add an audit log entry for the change
- Also update the Cline user if it exists

```javascript
// Define all available pages
const allPages = [
  'Dashboard',
  'Submissions',
  'Regions',
  'Settings',
  'Payments',
  'Users',
  'Performance'
];

// Define all available actions
const allActions = [
  'create_user',
  'edit_user',
  'delete_user',
  'create_job',
  'edit_job',
  'delete_job',
  'assign_job',
  'view_reports',
  'manage_settings',
  'manage_regions'
];

// Update permissions
if (!owner.permissions) {
  owner.permissions = {};
}

// Owner should have access to all pages and actions
owner.permissions.pages = allPages;
owner.permissions.actions = allActions;
```

## Results

The changes have been successfully applied:
- The owner user now has the correct permissions in the database
- The JWT token now includes all necessary role and permission data
- The authentication middleware now properly applies the permissions from the token

The System Owner account should now have access to all parts of the application as expected.

## How to Test

1. Log out of the application
2. Log in as the System Owner account
3. Verify that you can access all parts of the application:
   - Dashboard
   - Submissions
   - Regions
   - Settings
   - Payments
   - Users
   - Performance
