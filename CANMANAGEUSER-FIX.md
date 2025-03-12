# canManageUser Middleware Fix

This document describes the changes made to fix the error in the canManageUser middleware.

## Problem

When trying to update or manage users, the following error was occurring:

```
Error in canManageUser middleware: TypeError: Cannot read properties of undefined (reading 'equals')
    at userSchema.methods.canManageUser (C:\Users\jbcaf\white-knight-portal\backend\models\userModel.js:257:54)
    at canManageUser (C:\Users\jbcaf\white-knight-portal\backend\middleware\authMiddleware.js:220:18)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
```

## Root Cause

The error was occurring in the `canManageUser` method in the userModel.js file. The method was trying to access the `equals` method on `user.createdBy`, but `user.createdBy` was undefined in some cases.

Additionally, there were other potential issues with the method:

1. It was assuming that `user.regions` and `this.regions` were always defined arrays
2. It was not handling legacy vendor ID fields properly
3. It was not checking if `user.secondaryRoles` existed before trying to access its values

## Changes Made

### 1. Added Null Checks for createdBy

```javascript
// OW can manage everyone except other OWs they didn't create
if (this.primaryRole === 'OW') {
  if (user.primaryRole === 'OW' && user.createdBy && !user.createdBy.equals(this._id)) {
    return false;
  }
  return true;
}

// sOW can manage everyone under them except OW or other sOWs
if (this.primaryRole === 'sOW') {
  if (user.primaryRole === 'OW' || 
      (user.primaryRole === 'sOW' && user.createdBy && !user.createdBy.equals(this._id))) {
    return false;
  }
  return true;
}
```

### 2. Added Null Checks for regions

```javascript
// RM can only manage users in their region(s) except OW or sOW
if (this.primaryRole === 'RM') {
  if (user.primaryRole === 'OW' || user.primaryRole === 'sOW') {
    return false;
  }
  
  // Check if user is in RM's region
  const userRegions = user.regions ? user.regions.map(r => r.toString()) : [];
  const rmRegions = this.regions ? this.regions.map(r => r.toString()) : [];
  
  // If either user has no regions or RM has no regions, they can't manage
  if (userRegions.length === 0 || rmRegions.length === 0) {
    return false;
  }
  
  return userRegions.some(r => rmRegions.includes(r));
}
```

### 3. Improved Vendor Number Comparison and Secondary Roles Check

```javascript
// SP can only manage its own vendor's users with secondary roles
if (this.primaryRole === 'SP') {
  // Check if user has the same vendor number
  const sameVendor = (user.vendorNumber === this.vendorNumber) || 
                     (user.vendorId === this.vendorNumber) || 
                     (user.vendorNumber === this.vendorId);
  
  // Check if user has secondary roles
  const hasSecondaryRoles = user.secondaryRoles && 
                           Object.values(user.secondaryRoles).some(v => v === true);
  
  return sameVendor && user.primaryRole === 'SP' && hasSecondaryRoles;
}
```

## Results

These changes ensure that:

1. The code properly checks if `user.createdBy` exists before trying to call the `equals` method on it
2. The code handles cases where `user.regions` or `this.regions` might be undefined
3. The code properly compares vendor numbers, taking into account legacy fields
4. The code checks if `user.secondaryRoles` exists before trying to access its values

These changes should prevent the "Cannot read properties of undefined (reading 'equals')" error and make the canManageUser method more robust.
