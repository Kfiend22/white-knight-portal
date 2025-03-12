# User Schema Migration

This document describes the migration of the user schema to support a more flexible role system with primary and secondary roles, as well as other enhancements.

## Changes Made

### 1. User Model

- Added `primaryRole` field to replace the legacy `role` field
- Added `secondaryRoles` object to support multiple secondary roles
- Added `vendorNumber` field to replace the legacy `vendorId` field
- Added `firstName` and `lastName` fields to replace the legacy `ownerFirstName` and `ownerLastName` fields
- Added `address` object to consolidate address fields
- Added `regions` array to support multiple regions
- Added `auditLog` array to track changes to the user
- Added `isActive` field to support user deactivation
- Added `isOnDuty` field for drivers
- Added `twoFactorAuth` object to support 2FA

### 2. Role-Based Access Control

- Created `roleMiddleware.js` with middleware functions for role-based access control:
  - `hasPrimaryRole`: Check if user has a specific primary role
  - `hasSecondaryRole`: Check if user has a specific secondary role
  - `hasPageAccess`: Check if user has access to a specific page
  - `canCreateRole`: Check if user can create a specific role
  - `canManageUser`: Check if user can manage another user
  - `ensureVendorIsolation`: Ensure users can only access data from their own vendor
  - `ensureRegionIsolation`: Ensure RMs can only access data from their assigned regions

### 3. Authentication Controller

- Updated `generateToken` to include primary role, secondary roles, vendor number, and regions
- Updated `validateUserData` to validate new fields
- Updated `registerUser` to support new fields and add audit log entry
- Updated `updateUser` to check permissions and add audit log entry
- Updated `loginUser` to support 2FA and add audit log entry
- Added 2FA-related functions:
  - `verify2FA`: Verify 2FA code
  - `setup2FA`: Setup 2FA
  - `verifySetup2FA`: Verify and enable 2FA
  - `disable2FA`: Disable 2FA

### 4. User Controller

- Updated `createUser` to support new fields and add audit log entry
- Added `getUsers` function with vendor and region isolation
- Added `getUserById` function with permission checks
- Added `deleteUser` function that marks users as inactive
- Updated `getUserVendorIds` to include vendor numbers
- Updated `getUserCompanies` to use company name from user
- Added `toggleUserActive` function to toggle user active status
- Added `toggleDriverOnDuty` function to toggle driver on-duty status

### 5. Routes

- Updated auth routes to include new 2FA endpoints
- Updated user routes to use new controller functions and middleware

### 6. Frontend Components

- Updated `Users.js` component to support new schema:
  - Added primary role selection
  - Added secondary role checkboxes
  - Added user status toggle
  - Added driver on-duty toggle
  - Added 2FA management

### 7. Migration Scripts

- Created `migrate-users.js` to migrate existing users to the new schema:
  - Map legacy role to primary role
  - Set secondary roles based on legacy role
  - Map legacy name fields to new name fields
  - Map legacy vendor ID to vendor number
  - Map legacy address fields to new address object
  - Map legacy region to regions array
  - Initialize audit log
  - Set default values for new fields
- Created `update-owner-role.js` and `update-cline-role.js` to set admin secondary role for owner users

## Migration Results

The migration was successful. The following users were migrated:

- `owner`: Primary role OW, admin secondary role, 2 audit log entries
- `Cline`: Primary role OW, admin secondary role, 2 audit log entries

## Next Steps

1. Test the new role system with the frontend components
2. Update other parts of the application to use the new role system
3. Add more secondary roles as needed
4. Implement 2FA in the frontend
