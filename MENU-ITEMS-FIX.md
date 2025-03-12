# Menu Items Fix

This document describes the changes made to fix the issue with missing Submissions and Regions pages in the sidebar menu.

## Problem

The sidebar menu was not showing the Submissions and Regions pages for the System Owner account. The main issues were:

1. **Role Field Mismatch**: The SideMenu component was checking for the exact string 'OW' for the owner role, but the database might have had a different value or case.

2. **Missing Permissions**: The owner user might not have had the correct permissions set in the database.

## Changes Made

### 1. Created MongoDB Update Scripts

Created several scripts to update the owner user in the MongoDB database:

1. **fix-owner-role.js**: A Node.js script that uses Mongoose to update the owner user.
2. **fix-owner-mongodb.js**: A direct MongoDB update script that doesn't rely on the Mongoose model.
3. **fix-owner-shell.js**: A MongoDB shell script that can be run directly in the MongoDB shell.

All scripts make the following changes to the owner user:

```javascript
// Update the owner user
db.users.updateOne(
  { username: "owner" },
  {
    $set: {
      primaryRole: "OW",
      role: "OW",
      "secondaryRoles.admin": true,
      permissions: {
        pages: [
          "Dashboard",
          "Submissions",
          "Regions",
          "Settings",
          "Payments",
          "Users",
          "Performance"
        ],
        actions: [
          "create_user",
          "edit_user",
          "delete_user",
          "create_job",
          "edit_job",
          "delete_job",
          "assign_job",
          "view_reports",
          "manage_settings",
          "manage_regions"
        ]
      }
    }
  }
);
```

### 2. Created LocalStorage Update Script

Created a script to update the user data in localStorage for the current session:

```javascript
// fix-localstorage.js
function updateUserDataInLocalStorage() {
  try {
    // Get existing user data from localStorage
    const userJson = localStorage.getItem('user');
    
    // Parse user data
    const userData = JSON.parse(userJson);
    
    // Update user data
    const updatedUserData = {
      ...userData,
      primaryRole: 'OW',
      role: 'OW'
    };
    
    // Save updated user data to localStorage
    localStorage.setItem('user', JSON.stringify(updatedUserData));
    
    return true;
  } catch (error) {
    console.error('Error updating user data in localStorage:', error);
    return false;
  }
}
```

## How to Use the Fix

### For Database Update

1. **Using MongoDB Shell**:
   - Open a terminal
   - Connect to MongoDB shell: `mongo`
   - Switch to the database: `use white-knight-portal`
   - Load and run the script: `load("backend/fix-owner-shell.js")`

2. **Using Node.js**:
   - Run the script: `cd backend && node fix-owner-mongodb.js`

### For LocalStorage Update

1. **In the Browser Console**:
   - Open the browser console (F12 or right-click > Inspect > Console)
   - Copy and paste the contents of `fix-localstorage.js`
   - Press Enter to run the script
   - Refresh the page to apply the changes

## Results

The changes ensure that:
- The owner user has the correct role ('OW') in the database
- The owner user has the correct permissions in the database
- The localStorage data has the correct role information
- The sidebar menu shows all the pages that the owner user should have access to, including Submissions and Regions
