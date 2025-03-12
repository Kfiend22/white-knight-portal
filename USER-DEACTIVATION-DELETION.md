# User Deactivation and Deletion

This document describes the two-step user removal process implemented in the White Knight Portal.

## Overview

The system now implements a two-step process for removing users:

1. **Deactivation** - First step, making the user inactive but keeping their data
2. **Permanent Deletion** - Second step (OW/sOW only), completely removing the user from the database

## User Interface Changes

### Active Users
- All users see the trash icon for active users
- Clicking the trash icon for an active user shows a confirmation dialog for deactivation
- Upon confirmation, the user is deactivated and moved to the "Deactivated Users" section

### Deactivated Users
- Deactivated users are shown in a separate "Deactivated Users" section with a gray background
- Secondary role checkboxes and on-duty switches are disabled for deactivated users
- Only OW/sOW users see the trash icon (now red) for deactivated users
- Clicking the trash icon for a deactivated user shows a warning dialog for permanent deletion
- Upon confirmation, the user is completely removed from the database

## Backend Implementation

The backend now has enhanced logic in the `deleteUser` controller:

1. It first checks if the target user is already deactivated
2. If the user is deactivated AND the requesting user is OW/sOW, it performs actual deletion
3. Otherwise, it simply deactivates the user (sets `isActive` to false)

## Features

- **Visual Separation**: Deactivated users are visually separated from active users
- **Clear Feedback**: Different confirmation dialogs for deactivation vs. deletion
- **Role-Based Controls**: Only OW/sOW users can permanently delete users
- **Safety Measures**: Cannot deactivate/delete yourself or users with higher privilege
- **Two-Step Process**: Requires intentional, separate actions to completely remove a user

## User Experience

1. When a user is deactivated:
   - They are moved to the "Deactivated Users" section
   - They cannot log in to the system
   - Their data remains in the database
   - They can be reactivated by toggling the status checkbox back on

2. When a user is permanently deleted (OW/sOW only):
   - Their account is completely removed from the database
   - This action cannot be undone
   - All data associated with the user is permanently lost

## Security and Permissions

- Users cannot deactivate or delete themselves
- Users cannot deactivate or delete users with equal or higher privilege levels
- Only OW/sOW users can see the delete option for deactivated users
- Strong warning messages are shown before permanent deletion

## Technical Details

The implementation spans both frontend and backend:

1. Frontend (src/settings/Users.js):
   - Separates active and deactivated users in the UI
   - Shows different confirmation dialogs based on action
   - Only shows permanent deletion option to OW/sOW users

2. Backend (backend/controllers/userController.js):
   - Enhanced deleteUser controller with conditional logic
   - User.findByIdAndDelete for actual deletion
   - Detailed audit logging for both deactivation and deletion actions
