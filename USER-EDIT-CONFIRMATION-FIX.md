# User Edit Confirmation Fix

This document describes the changes made to fix the issue with user profile editing in the Settings > Users page.

## Problem

When editing user information in the main table view (entering data into text fields or ticking checkboxes), the user profile was being updated immediately without waiting for a "Save Changes" button to be clicked and a confirmation dialog to be shown.

The expected behavior should be:
1. User makes changes to the form fields
2. User clicks "Save Changes" button
3. A confirmation dialog appears
4. User clicks "Submit/OK" on the confirmation dialog
5. Only then should the changes be saved to the database

## Root Causes

The issue was in the event handlers for the checkboxes and switches in the table view:

1. `handleRoleChange` - Called when a checkbox for a secondary role (Admin, Dispatcher, etc.) is clicked
2. `handleToggleActive` - Called when the Status checkbox is clicked
3. `handleToggleOnDuty` - Called when the On Duty switch is clicked

These functions were immediately sending API requests to update the user in the backend as soon as the user interacted with the UI elements, without waiting for a confirmation.

## Changes Made

### 1. Added State Variables for Pending Changes

```javascript
const [pendingChanges, setPendingChanges] = useState({});
const [hasPendingChanges, setHasPendingChanges] = useState(false);
const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
```

### 2. Added Effect to Track Pending Changes

```javascript
// Effect to check if there are pending changes
useEffect(() => {
  setHasPendingChanges(Object.keys(pendingChanges).length > 0);
}, [pendingChanges]);
```

### 3. Added Function to Track Pending Changes

```javascript
// Function to add a change to the pending changes
const addPendingChange = (userId, changeType, data) => {
  setPendingChanges(prev => {
    const userChanges = prev[userId] || {};
    return {
      ...prev,
      [userId]: {
        ...userChanges,
        [changeType]: data
      }
    };
  });
};
```

### 4. Modified Event Handlers to Store Changes Instead of Sending API Requests

For example, the `handleRoleChange` function was changed from:

```javascript
const handleRoleChange = async (userId, role) => {
  try {
    // Find the user
    const user = users.find(u => u.id === userId);
    if (!user) return;

    // Create updated user object
    const updatedUser = { ...user };
    
    // Initialize secondaryRoles if it doesn't exist
    if (!updatedUser.secondaryRoles) {
      updatedUser.secondaryRoles = {
        admin: false,
        dispatcher: false,
        answeringService: false,
        driver: false
      };
    }
    
    // Toggle the role
    updatedUser.secondaryRoles[role] = !updatedUser.secondaryRoles[role];
    
    // Update user in local state first for immediate UI feedback
    const updatedUsers = users.map((u) =>
      u.id === userId ? updatedUser : u
    );
    setUsers(updatedUsers);
    
    // Send update to backend
    await axios.put(`/api/v1/users/${userId}`, {
      secondaryRoles: updatedUser.secondaryRoles
    }, {
      headers: getAuthHeader()
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    setError('Failed to update user role. Please try again.');
  }
};
```

To:

```javascript
const handleRoleChange = (userId, role) => {
  // Find the user
  const user = users.find(u => u.id === userId);
  if (!user) return;

  // Create updated user object
  const updatedUser = { ...user };
  
  // Initialize secondaryRoles if it doesn't exist
  if (!updatedUser.secondaryRoles) {
    updatedUser.secondaryRoles = {
      admin: false,
      dispatcher: false,
      answeringService: false,
      driver: false
    };
  }
  
  // Toggle the role
  updatedUser.secondaryRoles[role] = !updatedUser.secondaryRoles[role];
  
  // Update user in local state for immediate UI feedback
  const updatedUsers = users.map((u) =>
    u.id === userId ? updatedUser : u
  );
  setUsers(updatedUsers);
  
  // Add to pending changes
  addPendingChange(userId, 'secondaryRoles', updatedUser.secondaryRoles);
};
```

Similar changes were made to `handleToggleActive` and `handleToggleOnDuty`.

### 5. Added Function to Save All Pending Changes

```javascript
// Function to save all pending changes
const savePendingChanges = async () => {
  try {
    setLoading(true);
    setError(null);
    
    // Process each user's changes
    for (const userId in pendingChanges) {
      const changes = pendingChanges[userId];
      
      // Process role changes
      if (changes.secondaryRoles) {
        await axios.put(`/api/v1/users/${userId}`, {
          secondaryRoles: changes.secondaryRoles
        }, {
          headers: getAuthHeader()
        });
      }
      
      // Process active status changes
      if (changes.isActive !== undefined) {
        await axios.put(`/api/v1/users/${userId}/toggle-active`, {}, {
          headers: getAuthHeader()
        });
      }
      
      // Process on-duty status changes
      if (changes.isOnDuty !== undefined) {
        await axios.put(`/api/v1/users/${userId}/toggle-on-duty`, {}, {
          headers: getAuthHeader()
        });
      }
    }
    
    // Clear pending changes
    setPendingChanges({});
    setOpenConfirmDialog(false);
    setLoading(false);
  } catch (error) {
    console.error('Error saving changes:', error);
    setError('Failed to save changes. Please try again.');
    setLoading(false);
  }
};
```

### 6. Added "Save Changes" Button to the UI

```jsx
<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
  <Box>
    <Button
      variant="contained"
      startIcon={<AddIcon />}
      onClick={() => setOpenCreateUserDialog(true)}
      sx={{ mr: 2 }}
    >
      Create User
    </Button>
    
    {hasPendingChanges && (
      <Button
        variant="contained"
        color="success"
        onClick={() => setOpenConfirmDialog(true)}
      >
        Save Changes
      </Button>
    )}
  </Box>
  
  {error && (
    <Typography color="error" variant="body2">
      {error}
    </Typography>
  )}
</Box>
```

### 7. Added Confirmation Dialog

```jsx
{/* Confirmation Dialog */}
<Dialog
  open={openConfirmDialog}
  onClose={() => setOpenConfirmDialog(false)}
>
  <DialogTitle>Confirm Changes</DialogTitle>
  <DialogContent>
    <Typography>
      Are you sure you want to save all changes? This will update the user profiles in the database.
    </Typography>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setOpenConfirmDialog(false)}>Cancel</Button>
    <Button onClick={savePendingChanges} color="primary" variant="contained">
      Save Changes
    </Button>
  </DialogActions>
</Dialog>
```

## Results

The changes ensure that:

1. When a user makes changes to user profiles in the table view, the changes are only applied to the local state for immediate UI feedback
2. The changes are tracked in a `pendingChanges` state variable
3. A "Save Changes" button appears when there are pending changes
4. When the "Save Changes" button is clicked, a confirmation dialog is shown
5. Only when the user confirms the changes are they saved to the database

This provides a better user experience and prevents accidental changes to user profiles.
