# Authentication Flow Fix

This document describes the changes made to fix the authentication flow in the White Knight Portal application.

## Problem

When a user's token expires, the application shows an error message but still allows access to protected pages instead of redirecting to the login page.

## Solution

The following changes have been implemented to fix this issue:

1. **Added Axios Interceptors** - Created a global axios interceptor that catches 401 responses (including token expired errors), clears localStorage, and redirects to the login page.

2. **Enhanced ProtectedRoute Component** - Updated the ProtectedRoute component to verify token validity on route change and redirect to login immediately if the token is invalid or expired.

3. **Added Token Validation Utilities** - Created utility functions to check if a JWT token is expired based on its payload and to verify token validity with the server.

4. **Added Backend Token Verification Endpoint** - Added a lightweight endpoint to verify token validity on the server.

## Files Changed

1. `src/utils/axiosConfig.js` (new) - Axios interceptors for handling authentication errors
2. `src/utils/authUtils.js` (new) - Utility functions for token validation
3. `src/App.js` - Enhanced ProtectedRoute component
4. `src/index.js` - Initialize axios interceptors
5. `backend/routes/authRoutes.js` - Added token verification endpoint
6. `test-auth-flow.js` (new) - Test script for simulating expired tokens

## How to Test

### Method 1: Natural Expiration

1. Log in to the application
2. Wait for the token to expire naturally (depends on token expiration time set on the server)
3. Try to navigate to a protected page or refresh the current page
4. You should be automatically redirected to the login page

### Method 2: Using the Browser Test Script

1. Log in to the application
2. Open the browser console (F12 or right-click > Inspect > Console)
3. Copy and paste the contents of `browser-test-script.js` into the console and press Enter
   - This script is specifically designed for browser use and includes error checking
   - It will save your original token so you can restore it later if needed
4. Try to navigate to a protected page or refresh the current page
5. You should be automatically redirected to the login page
6. To restore your original token (if needed), run the command shown in the console

**IMPORTANT NOTE**: Do NOT run `test-auth-flow.js` with Node.js directly (e.g., `node test-auth-flow.js`). 
These test scripts use browser-specific APIs like localStorage that are not available in Node.js.

### Method 3: Manual Testing

1. Log in to the application
2. Open the browser's developer tools (F12)
3. Go to the Application tab > Storage > Local Storage
4. Delete the 'token' entry
5. Try to navigate to a protected page
6. You should be automatically redirected to the login page

## Expected Behavior

- When a token expires or is invalid, the user should be automatically redirected to the login page
- The user should see a message indicating that their session has expired
- After logging in again, the user should be able to access protected pages

## Troubleshooting

If you encounter any issues with the authentication flow:

1. Check the browser console for error messages
2. Verify that the token verification endpoint is working correctly
3. Make sure the axios interceptors are properly initialized
4. Clear your browser cache and local storage, then try again
