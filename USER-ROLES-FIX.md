# User Roles Dropdown Fix

This document describes the changes made to fix the issue with the Primary Role dropdown in the Edit User and Create User dialogs.

## Problem

The Primary Role dropdown in the Edit User and Create User dialogs was only showing 'SP' (Service Provider) as an option, even though it should also include 'OW' (Owner), 'sOW' (Sub Owner), and 'RM' (Regional Manager) options.

## Root Cause

The issue was in the `getAvailablePrimaryRoles` function in the `Users.js` file. This function determines which role options to display in the dropdown based on the current user's role. However, it had several issues:

1. **Missing Fallback**: If the current user's role couldn't be determined, it would only return ['SP'].
2. **Admin Role Not Considered**: The function didn't check if the user had the admin secondary role, which should grant access to all role options.
3. **Debugging Information**: There was no logging to help diagnose issues with role detection.

## Changes Made

Updated the `getAvailablePrimaryRoles` function in `src/settings/Users.js` to:

1. **Add Better Fallback**: If the current user is not available, return all roles with a warning log.
2. **Consider Admin Role**: Check if the user has the admin secondary role, and if so, return all roles.
3. **Add Logging**: Add console logs to help diagnose role detection issues.

```javascript
// Get available primary roles based on current user's role
const getAvailablePrimaryRoles = () => {
  if (!currentUser) {
    console.warn('Current user not available, returning all roles');
    return ['OW', 'sOW', 'RM', 'SP'];
  }
  
  const userRole = currentUser.primaryRole || currentUser.role;
  console.log('Current user role for role selection:', userRole);
  
  // Check if user has admin secondary role
  const isAdmin = currentUser.secondaryRoles?.admin || currentUser.isAdmin;
  console.log('User has admin role:', isAdmin);
  
  // If user is Owner or has admin role, return all roles
  if (userRole === 'OW' || isAdmin) {
    return ['OW', 'sOW', 'RM', 'SP'];
  }
  
  switch(userRole) {
    case 'sOW': return ['RM', 'SP'];
    case 'RM': return ['SP'];
    case 'SP': return ['SP'];
    default: return ['SP'];
  }
};
```

## Results

The changes ensure that:

1. If the current user is an Owner (OW), they can see all role options: OW, sOW, RM, and SP.
2. If the current user has the admin secondary role, they can also see all role options.
3. If the current user's role can't be determined, all role options are shown as a fallback.
4. Console logs provide debugging information to help diagnose any future issues.

## How to Test

1. Log in as an Owner (OW) user.
2. Go to the Settings page and click on the Users tab.
3. Click on the "Edit" button for a user or the "Create User" button.
4. Check that the Primary Role dropdown shows all the expected options: OW, sOW, RM, and SP.
5. Log in as a user with a different role but with the admin secondary role.
6. Verify that they can also see all role options.
