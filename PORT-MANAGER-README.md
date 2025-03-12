# Port Manager and User Interface Fixes

This document describes the fixes implemented to address two issues:

1. Port conflict when starting the backend server
2. ESLint warning about an unused function in the Users component

## Port Manager Script

A new script `port-manager.js` has been created to help manage port conflicts when starting the backend server. This script:

1. Checks if the default port (5000) is already in use
2. Provides options to either:
   - Kill the process using port 5000 and start the server on that port
   - Start the server on an alternative port

### Usage

```bash
node port-manager.js
```

The script will:
1. Check if port 5000 is available
2. If available, ask if you want to start the server on port 5000
3. If port 5000 is in use, provide options to kill the process or use a different port
4. Start the server on the selected port

### Benefits

- Avoids the "EADDRINUSE" error when starting the server
- Provides a user-friendly interface for resolving port conflicts
- Works cross-platform (Windows, macOS, Linux)
- Automatically detects the process ID using the port

## Users Component Fix

The ESLint warning in `src/settings/Users.js` about the unused `handleToggleOnDuty` function has been fixed by:

1. Adding an "On Duty" column to the users table
2. Adding a Switch component for users with the driver role to toggle their on-duty status
3. Connecting the Switch component to the `handleToggleOnDuty` function

### Changes Made

- Added a new column in the table header for "On Duty"
- Added a conditional rendering of a Switch component for users with the driver role
- Connected the Switch to the existing `handleToggleOnDuty` function

### Benefits

- Resolves the ESLint warning
- Improves the user interface by making the driver on-duty status visible and editable in the main table
- Maintains consistency with the edit dialog which already had this functionality

## How to Test

1. Start the frontend with `npm start`
2. If the backend is already running on port 5000, use `node port-manager.js` to start it on a different port
3. Log in and navigate to the Settings page
4. Check the Users section to see the new "On Duty" column
5. For users with the driver role, toggle their on-duty status
