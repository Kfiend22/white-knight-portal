# Debugging Plan: Profile Update 500 Error

## Problem Statement

When using the Edit Profile dialog to edit a user's profile, clicking the Save button results in a 500 Internal Server Error. The error occurs even when no changes are made to the profile. Notably, there are no error messages in the server console, making it difficult to diagnose the issue.

## Diagnosis Approach

Since we're getting a 500 error with no server-side logs, the most likely scenario is that the error is occurring before the request reaches the `updateUserProfile` function. The route for updating the user profile is:

```javascript
router.put('/profile', protect, userProfileController.updateUserProfile);
```

This indicates that the `protect` middleware is used for authentication before the `updateUserProfile` controller function is called. The error is likely occurring within the `protect` middleware.

## Action Plan

### 1. Add Comprehensive Error Logging to `protect` Middleware

We will modify the `protect` middleware in `backend/middleware/authMiddleware.js` to add detailed logging at various points. This will help us pinpoint exactly where the error is occurring, even if it's not being caught by the existing `try...catch` block.

Here's the modified code:

```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

/**
 * Middleware to protect routes that require authentication
 * Verifies the JWT token and adds the user to the request object
 */
const protect = async (req, res, next) => {
  let token;

  // Log the entire request headers for debugging
  console.log('Request Headers:', req.headers);

  // Check if authorization header exists and starts with Bearer
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      console.log('Token:', token); // Log the extracted token

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'defaultsecret');
      console.log('Decoded Token:', decoded); // Log the decoded token

      // Get user from the token and exclude the password field
      // The user ID could be in decoded.id or decoded.user.id depending on how the token was created
      const userId = decoded.user ? decoded.user.id : decoded.id;
      console.log('User ID:', userId); // Log the extracted user ID

      // Get user with full details
      const user = await User.findById(userId).select('-password');
      console.log('User from DB:', user); // Log the fetched user object

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Add user to request
      req.user = user;

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

      // Check if user needs to change password on first login
      if (user.isFirstLogin &&
          !req.path.includes('/change-password') &&
          !req.originalUrl.includes('/change-password')) {
        return res.status(403).json({
          message: 'Password change required',
          requiresPasswordChange: true
        });
      }

      // Check if user is active
      if (user.isActive === false) {
        return res.status(403).json({
          message: 'Account is inactive. Please contact an administrator.'
        });
      }

      console.log('Middleware complete - calling next()'); // Log before calling next()
      next();
    } catch (error) {
      console.error('Error in protect middleware:', error); // Log any error

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired, please log in again' });
      }

      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};
```

### 2. Switch to Code Mode

After the user approves the plan, we will switch to Code mode to implement the changes.

### 3. Apply the Diff

In Code mode, we will use the `apply_diff` tool to modify `backend/middleware/authMiddleware.js` with the code above.

### 4. Instruct User to Reproduce

We will instruct the user to try saving the profile again (even without changes) and to provide the *complete* server console output.

### 5. Analyze Logs

Based on the new, detailed logs, we should be able to pinpoint the exact location and cause of the 500 error.

## Flow Diagram

```mermaid
graph LR
    A[Request to /api/v1/users/profile] --> B(protect middleware);
    B --> C{Token Present?};
    C -- Yes --> D(Verify Token);
    C -- No --> E[Return 401 - No Token];
    D --> F{Token Valid?};
    F -- Yes --> G(Get User from DB);
    F -- No --> H[Return 401 - Invalid Token];
    G --> I{User Found?};
    I -- Yes --> J(Check First Login);
    I -- No --> K[Return 401 - User Not Found];
    J --> L{First Login?};
    L -- Yes --> M{Request is /change-password?};
    M -- Yes --> N(Check User Active);
    M -- No --> O[Return 403 - Password Change Required];
    L -- No --> N;
    N --> P{User Active?};
    P -- Yes --> Q[Call next()];
    P -- No --> R[Return 403 - Account Inactive];
    style B fill:#f9f,stroke:#333,stroke-width:2px
```

This diagram illustrates the flow of the `protect` middleware. The added logging will help us determine which path is taken and where the error occurs.

## Expected Outcome

The added logging will help us identify the exact point of failure in the authentication process. Once we know where the error is occurring, we can implement a targeted fix to resolve the 500 error when updating user profiles.