# White Knight Portal Troubleshooting Guide

## Authentication Loop Issues

If you encounter a "login page flashing" or authentication loop issue where the app keeps redirecting between pages, follow these troubleshooting steps:

### Symptoms
- Login page continuously flashes or refreshes
- Browser console shows repeated 401 Unauthorized errors for `/api/auth/verify`
- ProtectedRoute logs show token verification failures

### Root Cause
This issue typically happens when:
1. There's an invalid or expired token in localStorage
2. The backend auth server is running on the wrong port
3. The frontend proxy is misconfigured
4. Authentication flow has a loop in the verification logic

### Quick Fix Steps

#### 1. Clear localStorage
The quickest fix is to clear your browser's localStorage:

**Method A: Use the clear-tokens webpage (Easiest)**
1. Navigate to: `/clear-tokens.html` in your browser
2. Click the "Clear Authentication Tokens" button
3. You'll be redirected to the login page automatically

**Method B: Use the clear-storage.js script**
1. Open your browser's developer console (F12)
2. Copy and paste the contents of `clear-storage.js` into the console
3. Press Enter to run the script
4. The page will automatically redirect to the login page

**Method C: Manual clearing**
1. Open your browser's developer tools (F12)
2. Go to Application → Storage → Local Storage
3. Delete the 'token' and 'user' entries
4. Refresh the page

#### 2. Verify Backend Server Port
Make sure the backend server is running on port 5000:
1. The backend should be started with `node start-backend.js`
2. Verify that the console shows "Server is running on port 5000"
3. Ensure that the proxy in package.json points to `"http://localhost:5000"`

#### 3. Restart Servers
If clearing localStorage doesn't work, try restarting both servers:
1. Stop the frontend and backend servers
2. Start the backend server: `node start-backend.js`
3. Wait for it to fully initialize
4. Start the frontend server: `npm start`

### Prevention
To prevent this issue in the future, we've implemented these fixes:
1. Enhanced token validation in the Login component
2. Proper error handling in Axios interceptors
3. Added a client-side token expiration check

### Advanced Testing
For testing the authentication flow, you can use:
- `browser-test-script.js`: Simulates an expired token
- `test-auth-flow.js`: Tests various auth scenarios

Run these scripts in the browser console, not with Node.js directly, as they use browser-specific APIs like localStorage.
