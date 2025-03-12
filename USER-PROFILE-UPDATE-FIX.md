# User Profile Update Fix

This document describes the changes made to fix the issue with updating user profiles in the Settings > Users page.

## Problem

When trying to update a user profile in the Edit User dialog, the following errors were occurring:

1. **404 Error**: The API endpoint for updating a user was returning a 404 error.
2. **Current User Not Available**: The component was unable to fetch the current user's profile, resulting in the error message "Current user not available, returning all roles".
3. **API Path Mismatch**: The frontend was using `/api/users/...` while the backend was expecting `/api/v1/users/...`.

## Root Causes

1. **API Path Mismatch**: The frontend was using `/api/users/...` while the backend routes were registered under `/api/v1/users/...`.

2. **Profile Route Handling**: The `/api/v1/users/profile` route was being treated as a user ID, causing MongoDB to try to find a user with ID "profile".

3. **Duplicate Routes**: There were duplicate route definitions in the userRoutes.js file, causing confusion.

## Changes Made

### 1. Fixed User Routes in Backend

Updated the routes in `backend/routes/userRoutes.js` to properly handle the `/profile` route:

```javascript
// Get vendor IDs - must be before /:id to avoid treating 'vendor-ids' as an ID
router.get('/vendor-ids', userController.getUserVendorIds);

// Get companies associated with the current user - must be before /:id
router.get('/companies', protect, userController.getUserCompanies);

// Get current user profile - must be before /:id to avoid treating 'profile' as an ID
router.get('/profile', protect, async (req, res) => {
  try {
    // User is already loaded in req.user by the protect middleware
    // Just remove the password field
    const user = req.user.toObject();
    delete user.password;
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get user by ID - must be after specific routes to avoid treating route names as IDs
router.get('/:id', protect, userController.getUserById);
```

### 2. Updated API Paths in Frontend

Modified all API calls in `src/settings/Users.js` to use the correct `/api/v1/users/...` path:

```javascript
// Fetch current user profile
const response = await axios.get('/api/v1/users/profile', {
  headers: { Authorization: `Bearer ${token}` }
});

// Update user
const response = await axios.put(`/api/v1/users/${userId}`, userData, {
  headers: getAuthHeader()
});

// Toggle active status
await axios.put(`/api/v1/users/${userId}/toggle-active`, {}, {
  headers: getAuthHeader()
});

// Toggle on-duty status
await axios.put(`/api/v1/users/${userId}/toggle-on-duty`, {}, {
  headers: getAuthHeader()
});

// Delete user
await axios.delete(`/api/v1/users/${userId}`, {
  headers: getAuthHeader()
});

// Create user
const response = await axios.post('/api/v1/users', userData, {
  headers: getAuthHeader()
});
```

### 3. Improved User Profile Fetching

Enhanced the `fetchCurrentUser` function in `src/settings/Users.js` to:
- Add better error handling
- Try alternative API paths if the primary one fails
- Fall back to using localStorage data if API calls fail

```javascript
const fetchCurrentUser = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No token found, cannot fetch user profile');
      return;
    }

    console.log('Fetching current user profile...');
    const response = await axios.get('/api/v1/users/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('User profile fetched successfully:', response.data);
    setCurrentUser(response.data);
  } catch (error) {
    console.error('Error fetching current user:', error);
    
    // If the API path is wrong, try the alternative path
    if (error.response && error.response.status === 404) {
      try {
        console.log('Trying alternative API path...');
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('User profile fetched successfully from alternative path:', response.data);
        setCurrentUser(response.data);
      } catch (fallbackError) {
        console.error('Error fetching from alternative path:', fallbackError);
        
        // As a last resort, use the user data from localStorage
        try {
          const userJson = localStorage.getItem('user');
          if (userJson) {
            const userData = JSON.parse(userJson);
            console.log('Using user data from localStorage:', userData);
            setCurrentUser(userData);
          }
        } catch (localStorageError) {
          console.error('Error parsing user data from localStorage:', localStorageError);
        }
      }
    }
  }
};
```

### 4. Fixed Toggle Active Status Function

Fixed the `handleToggleActive` function in `src/settings/Users.js` to properly update the user's active status:

```javascript
const handleToggleActive = async (userId) => {
  try {
    // Find the user
    const user = users.find(u => u.id === userId);
    if (!user) return;

    // Create updated user object with toggled active status
    const updatedUser = { ...user, isActive: !user.isActive };
    
    // Toggle active status in local state first for immediate UI feedback
    const updatedUsers = users.map((u) =>
      u.id === userId ? updatedUser : u
    );
    setUsers(updatedUsers);
    
    // Send update to backend
    await axios.put(`/api/v1/users/${userId}/toggle-active`, {}, {
      headers: getAuthHeader()
    });
  } catch (error) {
    console.error('Error toggling user active status:', error);
    setError('Failed to update user status. Please try again.');
  }
};
```

## Results

The changes ensure that:
1. The backend routes are properly organized to handle special routes like `/profile` before the generic `/:id` route
2. The frontend uses the correct API paths (`/api/v1/users/...`) for all user-related operations
3. The frontend has improved error handling and fallback mechanisms for fetching the current user
4. User operations like updating, toggling active status, and deleting work correctly

These changes fix the issues with updating user profiles in the Settings > Users page and improve the overall reliability of user management operations.
