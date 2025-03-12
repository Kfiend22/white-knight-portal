// Users.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Typography,
  Box,
  Paper,
  Divider,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Checkbox,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormHelperText,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';

function Users({ users, setUsers, updateSettings }) {
  const [openCreateUserDialog, setOpenCreateUserDialog] = useState(false);
  const [openEditUserDialog, setOpenEditUserDialog] = useState(false);
  const [open2FADialog, setOpen2FADialog] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [openRoleConfirmDialog, setOpenRoleConfirmDialog] = useState(false);
  const [openStatusConfirmDialog, setOpenStatusConfirmDialog] = useState(false);
  const [openOnDutyConfirmDialog, setOpenOnDutyConfirmDialog] = useState(false);
  const [openDeleteConfirmDialog, setOpenDeleteConfirmDialog] = useState(false);
  const [pendingRoleChange, setPendingRoleChange] = useState(null);
  const [pendingStatusChange, setPendingStatusChange] = useState(null);
  const [pendingOnDutyChange, setPendingOnDutyChange] = useState(null);
  const [pendingDeleteUser, setPendingDeleteUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUser, setNewUser] = useState({
    primaryRole: 'RM', // Default to RM instead of SP
    secondaryRoles: {
      admin: false,
      dispatcher: false,
      answeringService: false,
      driver: false
    },
    isActive: true,
    address: {
      street1: '',
      street2: '',
      city: '',
      state: '',
      zip: '',
      country: 'US'
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  /**
   * Determines if the current user is allowed to change the password for the selected user.
   * @param {any} selected The user whose password is being changed.
   * @param {any} current The current logged in user.
   * @returns {boolean} True if password change is allowed, false otherwise.
   */
  const canChangePassword = (selected, current) => {
    if (!selected || !current) {
      console.log('canChangePassword: Missing selected or current user');
      return false;
    }
    
    // Debug information
    console.log('canChangePassword check:');
    console.log('- Selected user:', selected.firstName, selected.lastName);
    console.log('- Selected ID:', selected.id);
    console.log('- Selected _ID:', selected._id);
    console.log('- Current user:', current.firstName, current.lastName);
    console.log('- Current ID:', current.id);
    console.log('- Current _ID:', current._id);
    
    // Check if this is the same user (self) - more comprehensive check
    const isSameUser = (
      // Check all ID combinations
      (selected.id && current.id && selected.id === current.id) ||
      (selected._id && current._id && selected._id === current._id) ||
      (selected.id && current._id && selected.id === current._id) ||
      (selected._id && current.id && selected._id === current.id) ||
      // Check by username if IDs don't match
      (selected.username && current.username && selected.username === current.username) ||
      // Check by email as a fallback
      (selected.email && current.email && selected.email === current.email)
    );
    
    if (isSameUser) {
      console.log('canChangePassword: Self password change allowed');
      return true;
    }
    
    // Role-based permission check
    const roleHierarchy = { 'N/A': 0, 'SP': 1, 'RM': 2, 'SOW': 3, 'OW': 4 };
    const currentRole = roleHierarchy[(current.primaryRole || current.role || 'N/A').toUpperCase()] || 0;
    const selectedRole = roleHierarchy[(selected.primaryRole || selected.role || 'N/A').toUpperCase()] || 0;
    
    console.log('- Current user role:', current.primaryRole || current.role, '(Level:', currentRole, ')');
    console.log('- Selected user role:', selected.primaryRole || selected.role, '(Level:', selectedRole, ')');
    
    const canChange = currentRole > selectedRole;
    console.log('canChangePassword result:', canChange ? 'Allowed' : 'Not allowed');
    return canChange;
  };
  const [pendingChanges, setPendingChanges] = useState({});
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [regions, setRegions] = useState([]);

  // Constant to determine if facility address can be edited
  const canEditFacility = currentUser && (currentUser.primaryRole === 'OW' || currentUser.primaryRole === 'sOW' || currentUser.role === 'OW' || currentUser.role === 'sOW');

  // Fetch regions from the backend
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('No token found, cannot fetch regions');
          return;
        }

        console.log('Fetching regions...');
        try {
          // Try primary API path first
          const response = await axios.get('/api/v1/regions', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log('Regions fetched successfully:', response.data);
          setRegions(response.data);
        } catch (primaryError) {
          console.error('Error fetching regions with primary API path:', primaryError);
          
          // Try alternative API path
          const response = await axios.get('/api/regions', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log('Regions fetched successfully from alternative path:', response.data);
          setRegions(response.data);
        }
      } catch (error) {
        console.error('Error fetching regions:', error);
        setError('Failed to fetch regions. Some features may be limited.');
      }
    };

    fetchRegions();
  }, []);

  // Fetch current user on component mount
  useEffect(() => {
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

    fetchCurrentUser();
  }, []);

  // Helper function to get auth headers
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  // Effect to check if there are pending changes
  useEffect(() => {
    setHasPendingChanges(Object.keys(pendingChanges).length > 0);
  }, [pendingChanges]);

  // Function to add a change to the pending changes
  const addPendingChange = (userId, changeType, data) => {
    console.log(`Adding pending change for user ${userId}, type: ${changeType}`, data);
    
    // Ensure we have a valid userId
    if (!userId) {
      console.error('Cannot add pending change: userId is undefined or null');
      return;
    }
    
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

  // Function to save all pending changes
  const savePendingChanges = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Saving pending changes:', pendingChanges);
      
      // Process each user's changes
      for (const userId in pendingChanges) {
        const changes = pendingChanges[userId];
        console.log(`Processing changes for user ${userId}:`, changes);
        
        // Process role changes
        if (changes.secondaryRoles) {
          console.log(`Updating secondary roles for user ${userId}:`, changes.secondaryRoles);
          
          try {
            // Try primary API path first
            console.log(`Sending PUT request to /api/v1/users/${userId}`);
            const response = await axios.put(`/api/v1/users/${userId}`, {
              secondaryRoles: changes.secondaryRoles
            }, {
              headers: getAuthHeader()
            });
            
            console.log('Secondary roles update successful:', response.data);
          } catch (roleError) {
            console.error('Error updating secondary roles with primary API path:', roleError);
            
            // Try alternative API path
            try {
              console.log(`Trying alternative API path: /api/users/${userId}`);
              const response = await axios.put(`/api/users/${userId}`, {
                secondaryRoles: changes.secondaryRoles
              }, {
                headers: getAuthHeader()
              });
              
              console.log('Secondary roles update successful with alternative path:', response.data);
            } catch (altRoleError) {
              console.error('Error updating secondary roles with alternative API path:', altRoleError);
              throw altRoleError; // Re-throw to be caught by the outer catch
            }
          }
        }
        
        // Process active status changes
        if (changes.isActive !== undefined) {
          console.log(`Toggling active status for user ${userId} to ${changes.isActive}`);
          
          try {
            // Try primary API path first
            console.log(`Sending PUT request to /api/v1/users/${userId}/toggle-active`);
            const response = await axios.put(`/api/v1/users/${userId}/toggle-active`, {}, {
              headers: getAuthHeader()
            });
            
            console.log('Active status update successful:', response.data);
          } catch (activeError) {
            console.error('Error updating active status with primary API path:', activeError);
            
            // Try alternative API path
            try {
              console.log(`Trying alternative API path: /api/users/${userId}/toggle-active`);
              const response = await axios.put(`/api/users/${userId}/toggle-active`, {}, {
                headers: getAuthHeader()
              });
              
              console.log('Active status update successful with alternative path:', response.data);
            } catch (altActiveError) {
              console.error('Error updating active status with alternative API path:', altActiveError);
              throw altActiveError; // Re-throw to be caught by the outer catch
            }
          }
        }
        
        // Process on-duty status changes
        if (changes.isOnDuty !== undefined) {
          console.log(`Toggling on-duty status for user ${userId} to ${changes.isOnDuty}`);
          
          try {
            // Try primary API path first
            console.log(`Sending PUT request to /api/v1/users/${userId}/toggle-on-duty`);
            const response = await axios.put(`/api/v1/users/${userId}/toggle-on-duty`, {}, {
              headers: getAuthHeader()
            });
            
            console.log('On-duty status update successful:', response.data);
          } catch (onDutyError) {
            console.error('Error updating on-duty status with primary API path:', onDutyError);
            
            // Try alternative API path
            try {
              console.log(`Trying alternative API path: /api/users/${userId}/toggle-on-duty`);
              const response = await axios.put(`/api/users/${userId}/toggle-on-duty`, {}, {
                headers: getAuthHeader()
              });
              
              console.log('On-duty status update successful with alternative path:', response.data);
            } catch (altOnDutyError) {
              console.error('Error updating on-duty status with alternative API path:', altOnDutyError);
              throw altOnDutyError; // Re-throw to be caught by the outer catch
            }
          }
        }
      }
      
      // Clear pending changes
      console.log('All changes saved successfully, clearing pending changes');
      setPendingChanges({});
      setOpenConfirmDialog(false);
      setLoading(false);
      
      // Show success message
      setError({ message: 'Changes saved successfully', severity: 'success' });
      setTimeout(() => setError(null), 3000); // Clear success message after 3 seconds
    } catch (error) {
      console.error('Error saving changes:', error);
      
      let errorMessage = 'Failed to save changes. Please try again.';
      
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 404) {
          errorMessage = 'API endpoint not found. Please check server configuration.';
        } else if (error.response.status === 403) {
          errorMessage = 'You do not have permission to update these users.';
        }
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  // Users Section Handler Functions
  const handleRoleChange = (userId, role) => {
    console.log(`Preparing to change role ${role} for user with ID ${userId}`);
    
    // Find the user by either id or _id
    const user = users.find(u => u.id === userId || u._id === userId);
    if (!user) {
      console.error(`User with ID ${userId} not found`);
      return;
    }

    console.log(`Found user:`, user);

    // Check if this is the current user
    const isCurrentUser = currentUser && (
      (currentUser.id && (currentUser.id === userId || currentUser.id === user._id)) ||
      (currentUser._id && (currentUser._id === userId || currentUser._id === user.id))
    );
    
    if (isCurrentUser) {
      setError('You cannot change your own permissions');
      return;
    }

    // Store the pending role change and show confirmation dialog
    setPendingRoleChange({
      userId,
      role,
      user,
      newValue: !(user.secondaryRoles?.[role] || (role === 'admin' && user.isAdmin) || 
                 (role === 'dispatcher' && user.isDispatcher) || 
                 (role === 'driver' && user.isDriver) || 
                 (role === 'answeringService' && user.isAnsweringService) || false)
    });
    setOpenRoleConfirmDialog(true);
  };

  // Function to confirm and apply role change
  const confirmRoleChange = () => {
    if (!pendingRoleChange) return;
    
    const { userId, role, user, newValue } = pendingRoleChange;
    
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
    
    // Set the role to the new value
    updatedUser.secondaryRoles[role] = newValue;
    
    console.log(`Updated secondaryRoles:`, updatedUser.secondaryRoles);
    
    // Update user in local state for immediate UI feedback
    const updatedUsers = users.map((u) =>
      (u.id === userId || u._id === userId) ? updatedUser : u
    );
    setUsers(updatedUsers);
    
    // Use _id if available, otherwise use id
    const effectiveUserId = user._id || userId;
    console.log(`Using effective user ID for pending changes: ${effectiveUserId}`);
    
    // Add to pending changes
    addPendingChange(effectiveUserId, 'secondaryRoles', updatedUser.secondaryRoles);
    
    // Close the dialog
    setOpenRoleConfirmDialog(false);
    setPendingRoleChange(null);
  };

  // Function to cancel role change
  const cancelRoleChange = () => {
    setOpenRoleConfirmDialog(false);
    setPendingRoleChange(null);
  };

  const handleToggleActive = (userId) => {
    console.log(`Preparing to toggle active status for user with ID ${userId}`);
    
    // Find the user by either id or _id
    const user = users.find(u => u.id === userId || u._id === userId);
    if (!user) {
      console.error(`User with ID ${userId} not found`);
      return;
    }

    console.log(`Found user:`, user);

    // Check if this is the current user
    const isCurrentUser = currentUser && (
      (currentUser.id && (currentUser.id === userId || currentUser.id === user._id)) ||
      (currentUser._id && (currentUser._id === userId || currentUser._id === user.id))
    );
    
    if (isCurrentUser && user.isActive !== false) {
      setError('You cannot deactivate your own account');
      return;
    }

    // Store the pending status change and show confirmation dialog
    setPendingStatusChange({
      userId,
      user,
      newValue: !(user.isActive !== false)
    });
    setOpenStatusConfirmDialog(true);
  };

  // Function to confirm and apply status change
  const confirmStatusChange = () => {
    if (!pendingStatusChange) return;
    
    const { userId, user, newValue } = pendingStatusChange;
    
    // Create updated user object with new active status
    const updatedUser = { ...user, isActive: newValue };
    
    console.log(`Updated isActive:`, updatedUser.isActive);
    
    // Update user in local state for immediate UI feedback
    const updatedUsers = users.map((u) =>
      (u.id === userId || u._id === userId) ? updatedUser : u
    );
    setUsers(updatedUsers);
    
    // Use _id if available, otherwise use id
    const effectiveUserId = user._id || userId;
    console.log(`Using effective user ID for pending changes: ${effectiveUserId}`);
    
    // Add to pending changes
    addPendingChange(effectiveUserId, 'isActive', updatedUser.isActive);
    
    // Close the dialog
    setOpenStatusConfirmDialog(false);
    setPendingStatusChange(null);
  };

  // Function to cancel status change
  const cancelStatusChange = () => {
    setOpenStatusConfirmDialog(false);
    setPendingStatusChange(null);
  };

  const handleToggleOnDuty = (userId) => {
    console.log(`Preparing to toggle on-duty status for user with ID ${userId}`);
    
    // Find the user by either id or _id
    const user = users.find(u => u.id === userId || u._id === userId);
    if (!user) {
      console.error(`User with ID ${userId} not found`);
      return;
    }

    console.log(`Found user:`, user);

    // Store the pending on-duty change and show confirmation dialog
    setPendingOnDutyChange({
      userId,
      user,
      newValue: !user.isOnDuty
    });
    setOpenOnDutyConfirmDialog(true);
  };

  // Function to confirm and apply on-duty change
  const confirmOnDutyChange = () => {
    if (!pendingOnDutyChange) return;
    
    const { userId, user, newValue } = pendingOnDutyChange;
    
    // Create updated user object with new on-duty status
    const updatedUser = { ...user, isOnDuty: newValue };
    
    console.log(`Updated isOnDuty:`, updatedUser.isOnDuty);
    
    // Update user in local state for immediate UI feedback
    const updatedUsers = users.map((u) =>
      (u.id === userId || u._id === userId) ? updatedUser : u
    );
    setUsers(updatedUsers);
    
    // Use _id if available, otherwise use id
    const effectiveUserId = user._id || userId;
    console.log(`Using effective user ID for pending changes: ${effectiveUserId}`);
    
    // Add to pending changes
    addPendingChange(effectiveUserId, 'isOnDuty', updatedUser.isOnDuty);
    
    // Close the dialog
    setOpenOnDutyConfirmDialog(false);
    setPendingOnDutyChange(null);
  };

  // Function to cancel on-duty change
  const cancelOnDutyChange = () => {
    setOpenOnDutyConfirmDialog(false);
    setPendingOnDutyChange(null);
  };

  const handleEditUser = (user) => {
    setSelectedUser({ ...user });
    setOpenEditUserDialog(true);
  };

  const handleManage2FA = (user) => {
    setSelectedUser({ ...user });
    setOpen2FADialog(true);
  };

  const handleDeleteUser = (userId) => {
    console.log(`Preparing to deactivate user with ID ${userId}`);
    
    // Find the user by either id or _id
    const user = users.find(u => u.id === userId || u._id === userId);
    if (!user) {
      console.error(`User with ID ${userId} not found`);
      return;
    }

    console.log(`Found user:`, user);

    // Check if this is the current user
    const isCurrentUser = currentUser && (
      (currentUser.id && (currentUser.id === userId || currentUser.id === user._id)) ||
      (currentUser._id && (currentUser._id === userId || currentUser._id === user.id))
    );
    
    if (isCurrentUser) {
      setError('You cannot deactivate your own account');
      return;
    }

    // Check if the current user can manage this user (has higher privilege)
    const currentUserRole = currentUser?.primaryRole || currentUser?.role;
    const targetUserRole = user?.primaryRole || user?.role;
    
    // Define role hierarchy (higher index = higher privilege)
    const roleHierarchy = ['N/A', 'SP', 'RM', 'sOW', 'OW'];
    
    const currentUserRoleIndex = roleHierarchy.indexOf(currentUserRole);
    const targetUserRoleIndex = roleHierarchy.indexOf(targetUserRole);
    
    // If target user has equal or higher privilege
    if (targetUserRoleIndex >= currentUserRoleIndex) {
      setError('You cannot deactivate a user with equal or higher privilege level');
      return;
    }

    // Store the pending delete user and show confirmation dialog
    setPendingDeleteUser(user);
    setOpenDeleteConfirmDialog(true);
  };

  // Function to confirm and apply user deletion
  const confirmDeleteUser = async () => {
    if (!pendingDeleteUser) return;
    
    const userId = pendingDeleteUser.id || pendingDeleteUser._id;
    
    // Use _id if available, otherwise use id
    const effectiveUserId = pendingDeleteUser._id || userId;
    console.log(`Using effective user ID for deletion: ${effectiveUserId}`);
    
    try {
      setLoading(true);
      
      let response;
      try {
        // Try primary API path first
        console.log(`Sending DELETE request to /api/v1/users/${effectiveUserId}`);
        response = await axios.delete(`/api/v1/users/${effectiveUserId}`, {
          headers: getAuthHeader()
        });
        
        console.log('Server response:', response.data);
      } catch (primaryError) {
        console.error('Error deleting user with primary API path:', primaryError);
        
        // Try alternative API path
        console.log(`Trying alternative API path: /api/users/${effectiveUserId}`);
        response = await axios.delete(`/api/users/${effectiveUserId}`, {
          headers: getAuthHeader()
        });
        
        console.log('Server response from alternative path:', response.data);
      }
      
      // Check if this was a permanent deletion or just deactivation
      const isPermanentDeletion = pendingDeleteUser.isActive === false;
      
      if (isPermanentDeletion && response?.data?.permanent) {
        // For permanent deletion, remove the user from the list
        setUsers((prevUsers) => prevUsers.filter((u) => 
          u.id !== userId && u._id !== userId
        ));
        setError({ message: 'User permanently deleted', severity: 'success' });
      } else {
        // For deactivation, just update the isActive status
        setUsers((prevUsers) => prevUsers.map((u) => 
          (u.id === userId || u._id === userId) ? { ...u, isActive: false } : u
        ));
        setError({ message: 'User deactivated successfully', severity: 'success' });
      }
      
      setTimeout(() => setError(null), 3000); // Clear success message after 3 seconds
      
      // Close the dialog
      setOpenDeleteConfirmDialog(false);
      setPendingDeleteUser(null);
      setLoading(false);
    } catch (error) {
      console.error('Error deleting user:', error);
      
      let errorMessage = 'Failed to delete user. Please try again.';
      
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 404) {
          errorMessage = 'User not found or API endpoint incorrect.';
        } else if (error.response.status === 403) {
          errorMessage = 'You do not have permission to delete this user.';
        }
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  // Function to cancel user deletion
  const cancelDeleteUser = () => {
    setOpenDeleteConfirmDialog(false);
    setPendingDeleteUser(null);
  };

  const handleSaveUser = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepare user data for update
      const userData = { ...selectedUser };
      
      // If password field is empty, remove it to avoid changing the password
      if (!userData.newPassword) {
        delete userData.newPassword;
      } else {
        userData.password = userData.newPassword;
        delete userData.newPassword;
      }
      
      // Make sure we have an ID
      if (!selectedUser.id && selectedUser._id) {
        console.log('Using _id instead of id:', selectedUser._id);
        userData.id = selectedUser._id;
      }
      
      const userId = userData.id || selectedUser._id;
      if (!userId) {
        throw new Error('User ID is missing');
      }
      
      // Ensure OW users keep their role when saving
      // This is needed because OW is not in the available roles list
      if (selectedUser.primaryRole === 'OW' || selectedUser.role === 'OW') {
        userData.primaryRole = 'OW';
        // Also set role for backward compatibility
        userData.role = 'OW';
      }
      
      console.log(`Updating user ${userId} with data:`, userData);
      
      let response;
      
      try {
        // Try primary API path first
        console.log(`Sending PUT request to /api/v1/users/${userId}`);
        response = await axios.put(`/api/v1/users/${userId}`, userData, {
          headers: getAuthHeader()
        });
        
        console.log('User updated successfully:', response.data);
      } catch (primaryError) {
        console.error('Error updating user with primary API path:', primaryError);
        
        // Try alternative API path
        console.log(`Trying alternative API path: /api/users/${userId}`);
        response = await axios.put(`/api/users/${userId}`, userData, {
          headers: getAuthHeader()
        });
        
        console.log('User updated successfully with alternative path:', response.data);
      }
      
      // Update local state
      setUsers((prevUsers) => prevUsers.map((user) => 
        (user.id === userId || user._id === userId) ? { ...user, ...userData } : user
      ));
      
      // Show success message
      setError({ message: 'User updated successfully', severity: 'success' });
      setTimeout(() => setError(null), 3000); // Clear success message after 3 seconds
      
      setOpenEditUserDialog(false);
      setSelectedUser(null);
      setLoading(false);
    } catch (error) {
      console.error('Error updating user:', error);
      
      let errorMessage = 'Failed to update user. Please try again.';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 404) {
          errorMessage = 'User not found or API endpoint incorrect.';
        } else if (error.response.status === 403) {
          errorMessage = 'You do not have permission to update this user.';
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error request:', error.request);
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleSaveNewUser = async () => {
    // Validate required fields
    if (
      !newUser.firstName ||
      !newUser.lastName ||
      !newUser.username ||
      !newUser.password ||
      !newUser.email ||
      !newUser.primaryRole
    ) {
      setError('Please fill in all required fields');
      return;
    }
    
    // Validate that primaryRole is not SP
    if (newUser.primaryRole === 'SP') {
      setError('Service Provider accounts should be created through the Submissions page');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Prepare user data
      const userData = { ...newUser };
      
      // Always set vendor number from current user
      if (currentUser) {
        userData.vendorNumber = currentUser.vendorNumber || currentUser.vendorId;
        // Also set vendorId for backward compatibility
        userData.vendorId = currentUser.vendorNumber || currentUser.vendorId;
        
        // Inherit facility address from current user if not explicitly set
        if (!userData.facilityAddress || !Object.keys(userData.facilityAddress || {}).some(key => userData.facilityAddress[key])) {
          // Check if current user has facility address in modern format
          if (currentUser.facilityAddress) {
            userData.facilityAddress = { ...currentUser.facilityAddress };
            
            // Also set legacy fields for backward compatibility
            userData.facilityAddress1 = currentUser.facilityAddress.street1 || '';
            userData.facilityAddress2 = currentUser.facilityAddress.street2 || '';
            userData.facilityCity = currentUser.facilityAddress.city || '';
            userData.facilityState = currentUser.facilityAddress.state || '';
            userData.facilityZip = currentUser.facilityAddress.zip || '';
            userData.facilityCountry = currentUser.facilityAddress.country || 'US';
          } 
          // Check if current user has facility address in legacy format
          else if (currentUser.facilityAddress1 || currentUser.facilityCity || currentUser.facilityState) {
            userData.facilityAddress = {
              street1: currentUser.facilityAddress1 || '',
              street2: currentUser.facilityAddress2 || '',
              city: currentUser.facilityCity || '',
              state: currentUser.facilityState || '',
              zip: currentUser.facilityZip || '',
              country: currentUser.facilityCountry || 'US'
            };
            
            // Also set legacy fields
            userData.facilityAddress1 = currentUser.facilityAddress1 || '';
            userData.facilityAddress2 = currentUser.facilityAddress2 || '';
            userData.facilityCity = currentUser.facilityCity || '';
            userData.facilityState = currentUser.facilityState || '';
            userData.facilityZip = currentUser.facilityZip || '';
            userData.facilityCountry = currentUser.facilityCountry || 'US';
          }
        }
      } else {
        setError('Cannot create user: Current user information is missing');
        setLoading(false);
        return;
      }
      
      console.log('Creating new user with data:', userData);
      
      // Log all required fields to help diagnose issues
      console.log('Required fields check:');
      console.log('- firstName:', userData.firstName);
      console.log('- lastName:', userData.lastName);
      console.log('- username:', userData.username);
      console.log('- email:', userData.email);
      console.log('- primaryRole:', userData.primaryRole);
      console.log('- vendorNumber:', userData.vendorNumber);
      console.log('- vendorId:', userData.vendorId);
      
      let response;
      
      try {
        // Try primary API path first
        console.log('Sending POST request to /api/v1/users');
        response = await axios.post('/api/v1/users', userData, {
          headers: getAuthHeader()
        });
        
        console.log('User created successfully:', response.data);
      } catch (primaryError) {
        console.error('Error creating user with primary API path:', primaryError);
        
        if (primaryError.response) {
          console.error('Primary API error response data:', primaryError.response.data);
          console.error('Primary API error response status:', primaryError.response.status);
          
          // If we got a 400 error, it's likely a validation issue - throw to be caught by outer catch
          if (primaryError.response.status === 400) {
            throw primaryError;
          }
        }
        
        // Try alternative API path
        console.log('Trying alternative API path: /api/user');
        response = await axios.post('/api/user', userData, {
          headers: getAuthHeader()
        });
        
        console.log('User created successfully with alternative path:', response.data);
      }
      
      // Update local state with the new user from the API
      setUsers((prevUsers) => [...prevUsers, response.data]);
      
      // Show success message
      setError({ message: 'User created successfully', severity: 'success' });
      setTimeout(() => setError(null), 3000); // Clear success message after 3 seconds
      
      setOpenCreateUserDialog(false);
      setNewUser({
        primaryRole: 'RM', // Reset to RM instead of SP
        secondaryRoles: {
          admin: false,
          dispatcher: false,
          answeringService: false,
          driver: false
        },
        isActive: true
      });
      setLoading(false);
    } catch (error) {
      console.error('Error creating user:', error);
      
      let errorMessage = 'Failed to create user. Please try again.';
      
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
          
          // Check for validation errors
          if (error.response.data.errors && error.response.data.errors.length > 0) {
            // Create a formatted list of validation errors
            const validationErrors = error.response.data.errors;
            
            // Set detailed error information
            setError({
              message: 'Please complete all required fields',
              type: 'validation',
              fields: validationErrors,
              details: validationErrors.join(', ')
            });
            
            // Scroll to the top of the dialog to show the error
            const dialogContent = document.querySelector('.MuiDialogContent-root');
            if (dialogContent) {
              dialogContent.scrollTop = 0;
            }
            
            setLoading(false);
            return; // Early return to use the custom error format
          }
        } else if (error.response.data && error.response.data.errors) {
          // Handle validation errors array
          const validationErrors = error.response.data.errors;
          
          setError({
            message: 'Please complete all required fields',
            type: 'validation',
            fields: validationErrors,
            details: validationErrors.join(', ')
          });
          
          setLoading(false);
          return;
        } else if (error.response.status === 404) {
          errorMessage = 'API endpoint not found. Please check server configuration.';
        } else if (error.response.status === 403) {
          errorMessage = 'You do not have permission to create users.';
        } else if (error.response.status === 400) {
          errorMessage = 'Invalid user data. Please check all required fields and try again.';
          
          // Check for common 400 errors
          if (error.response.data && error.response.data.message) {
            if (error.response.data.message.includes('already exists')) {
              errorMessage = error.response.data.message;
            }
          }
        }
      }
      
      setError({message: errorMessage});
      setLoading(false);
    }
  };

  // Get available primary roles based on current user's role
  const getAvailablePrimaryRoles = () => {
    if (!currentUser) {
      console.warn('Current user not available, returning available roles except SP and OW');
      return ['sOW', 'RM', 'N/A']; // Exclude SP and OW
    }
    
    const userRole = currentUser.primaryRole || currentUser.role;
    console.log('Current user role for role selection:', userRole);
    
    // Check if user has admin secondary role
    const isAdmin = currentUser.secondaryRoles?.admin || currentUser.isAdmin;
    console.log('User has admin role:', isAdmin);
    
    // If user is Owner or has admin role, return all roles except SP and OW
    // OW is excluded because there should only be one OW profile
    if (userRole === 'OW' || isAdmin) {
      return ['sOW', 'RM', 'N/A']; // Exclude SP and OW
    }
    
    switch(userRole) {
      case 'sOW': return ['RM', 'N/A']; // Exclude SP and OW
      case 'RM': return ['N/A']; // Only N/A
      case 'SP': return ['N/A']; // Only N/A
      default: return ['N/A'];
    }
  };

  // Setup 2FA for a user
  const handle2FASetup = async (method) => {
    try {
      setLoading(true);
      
      // Call API to setup 2FA
      const response = await axios.post('/api/auth/setup-2fa', {
        method
      }, {
        headers: getAuthHeader()
      });
      
      // Update selected user with 2FA info
      setSelectedUser({
        ...selectedUser,
        twoFactorAuth: {
          ...selectedUser.twoFactorAuth,
          method,
          secret: response.data.secret,
          qrCode: response.data.qrCode
        }
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      setError('Failed to setup 2FA. Please try again.');
      setLoading(false);
    }
  };

  // Verify 2FA setup
  const handleVerify2FA = async (code) => {
    try {
      setLoading(true);
      
      // Call API to verify 2FA setup
      await axios.post('/api/auth/verify-setup-2fa', {
        code
      }, {
        headers: getAuthHeader()
      });
      
      // Update selected user with 2FA enabled
      setSelectedUser({
        ...selectedUser,
        twoFactorAuth: {
          ...selectedUser.twoFactorAuth,
          enabled: true,
          verified: true
        }
      });
      
      // Update users list
      setUsers((prevUsers) => prevUsers.map((user) => 
        (user.id === selectedUser.id || user._id === selectedUser._id) ? {
          ...user,
          twoFactorAuth: {
            ...user.twoFactorAuth,
            enabled: true,
            verified: true
          }
        } : user
      ));
      
      setLoading(false);
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      setError('Failed to verify 2FA. Please try again.');
      setLoading(false);
    }
  };

  // Disable 2FA
  const handleDisable2FA = async () => {
    try {
      setLoading(true);
      
      // Call API to disable 2FA
      await axios.post('/api/auth/disable-2fa', {}, {
        headers: getAuthHeader()
      });
      
      // Update selected user with 2FA disabled
      setSelectedUser({
        ...selectedUser,
        twoFactorAuth: {
          ...selectedUser.twoFactorAuth,
          enabled: false,
          verified: false
        }
      });
      
      // Update users list
      setUsers((prevUsers) => prevUsers.map((user) => 
        (user.id === selectedUser.id || user._id === selectedUser._id) ? {
          ...user,
          twoFactorAuth: {
            ...user.twoFactorAuth,
            enabled: false,
            verified: false
          }
        } : user
      ));
      
      setLoading(false);
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      setError('Failed to disable 2FA. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Box mt={2}>
      <Paper elevation={3} sx={{ padding: 2 }}>
        <Typography variant="h6">Users</Typography>
        <Divider sx={{ my: 2 }} />

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
            <Typography 
              color={error.severity === 'success' ? 'success' : 'error'} 
              variant="body2"
            >
              {typeof error === 'string' ? error : error.message}
            </Typography>
          )}
        </Box>

        {/* User Table Display */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <Typography>Loading...</Typography>
          </Box>
        ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>First Name</TableCell>
                <TableCell>Last Name</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Primary Role</TableCell>
                <TableCell>Admin</TableCell>
                <TableCell>Dispatcher</TableCell>
                <TableCell>Driver</TableCell>
                <TableCell>Answering Service</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>On Duty</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
          {/* Active Users Section */}
          {users && users
            .filter(user => user.isActive !== false)
            .map((user) => (
              <TableRow key={user.id || user._id}>
                <TableCell>{user.firstName || user.ownerFirstName}</TableCell>
                <TableCell>{user.lastName || user.ownerLastName}</TableCell>
                <TableCell>{user.phone}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.primaryRole || user.role}</TableCell>
                <TableCell>
                  <Checkbox
                    checked={user.secondaryRoles?.admin || user.isAdmin || false}
                    onChange={() => handleRoleChange(user.id || user._id, 'admin')}
                  />
                </TableCell>
                <TableCell>
                  <Checkbox
                    checked={user.secondaryRoles?.dispatcher || user.isDispatcher || false}
                    onChange={() =>
                      handleRoleChange(user.id || user._id, 'dispatcher')
                    }
                  />
                </TableCell>
                <TableCell>
                  <Checkbox
                    checked={user.secondaryRoles?.driver || user.isDriver || false}
                    onChange={() => handleRoleChange(user.id || user._id, 'driver')}
                  />
                </TableCell>
                <TableCell>
                  <Checkbox
                    checked={user.secondaryRoles?.answeringService || user.isAnsweringService || false}
                    onChange={() =>
                      handleRoleChange(user.id || user._id, 'answeringService')
                    }
                  />
                </TableCell>
                <TableCell>
                  <Checkbox
                    checked={user.isActive !== false}
                    onChange={() => handleToggleActive(user.id || user._id)}
                  />
                </TableCell>
                <TableCell>
                  {(user.secondaryRoles?.driver || user.isDriver) && (
                    <Switch
                      checked={user.isOnDuty || false}
                      onChange={() => handleToggleOnDuty(user.id || user._id)}
                      disabled={currentUser && currentUser.primaryRole === 'RM' && ((user.primaryRole === 'OW' || user.primaryRole === 'sOW') || (user.role === 'OW' || user.role === 'sOW'))}
                    />
                  )}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    edge="end"
                    aria-label="edit"
                    onClick={() => handleEditUser(user)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="2fa"
                    onClick={() => handleManage2FA(user)}
                  >
                    <SecurityIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleDeleteUser(user.id || user._id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            
          {/* Separator for Deactivated Users */}
          {users && users.some(user => user.isActive === false) && (
            <TableRow>
              <TableCell colSpan={13} sx={{ py: 3 }}>
                <Typography variant="h6" color="textSecondary" align="center">
                  Deactivated Users
                </Typography>
              </TableCell>
            </TableRow>
          )}
            
          {/* Deactivated Users Section */}
          {users && users
            .filter(user => user.isActive === false)
            .map((user) => (
              <TableRow 
                key={user.id || user._id}
                sx={{ backgroundColor: '#f5f5f5' }}
              >
                <TableCell>{user.firstName || user.ownerFirstName}</TableCell>
                <TableCell>{user.lastName || user.ownerLastName}</TableCell>
                <TableCell>{user.phone}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.primaryRole || user.role}</TableCell>
                <TableCell>
                  <Checkbox
                    checked={user.secondaryRoles?.admin || user.isAdmin || false}
                    disabled
                  />
                </TableCell>
                <TableCell>
                  <Checkbox
                    checked={user.secondaryRoles?.dispatcher || user.isDispatcher || false}
                    disabled
                  />
                </TableCell>
                <TableCell>
                  <Checkbox
                    checked={user.secondaryRoles?.driver || user.isDriver || false}
                    disabled
                  />
                </TableCell>
                <TableCell>
                  <Checkbox
                    checked={user.secondaryRoles?.answeringService || user.isAnsweringService || false}
                    disabled
                  />
                </TableCell>
                <TableCell>
                  <Checkbox
                    checked={user.isActive !== false}
                    onChange={() => handleToggleActive(user.id || user._id)}
                  />
                </TableCell>
                <TableCell>
                  {(user.secondaryRoles?.driver || user.isDriver) && (
                    <Switch
                      checked={user.isOnDuty || false}
                      onChange={() => handleToggleOnDuty(user.id || user._id)}
                      disabled
                    />
                  )}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    edge="end"
                    aria-label="edit"
                    onClick={() => handleEditUser(user)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="2fa"
                    onClick={() => handleManage2FA(user)}
                  >
                    <SecurityIcon />
                  </IconButton>
                  {/* Only show delete icon to OW/sOW users for deactivated users */}
                  {currentUser && (currentUser.primaryRole === 'OW' || currentUser.primaryRole === 'sOW' || currentUser.role === 'OW') && (
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDeleteUser(user.id || user._id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
            </TableBody>
          </Table>
        </TableContainer>
        )}
      </Paper>

      {/* Edit User Dialog */}
      <Dialog
        open={openEditUserDialog}
        onClose={() => setOpenEditUserDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <>
              <TextField
                margin="dense"
                label="First Name"
                fullWidth
                value={selectedUser.firstName || selectedUser.ownerFirstName || ''}
                onChange={(e) =>
                  setSelectedUser({
                    ...selectedUser,
                    firstName: e.target.value,
                  })
                }
              />
              <TextField
                margin="dense"
                label="Last Name"
                fullWidth
                value={selectedUser.lastName || selectedUser.ownerLastName || ''}
                onChange={(e) =>
                  setSelectedUser({
                    ...selectedUser,
                    lastName: e.target.value,
                  })
                }
              />
              <TextField
                margin="dense"
                label="Email"
                fullWidth
                value={selectedUser.email || ''}
                onChange={(e) =>
                  setSelectedUser({
                    ...selectedUser,
                    email: e.target.value,
                  })
                }
              />
              <TextField
                margin="dense"
                label="Phone"
                fullWidth
                value={selectedUser.phone || ''}
                onChange={(e) =>
                  setSelectedUser({
                    ...selectedUser,
                    phone: e.target.value,
                  })
                }
              />
              <TextField
                margin="dense"
                label="New Password"
                fullWidth
                type="password"
                value={selectedUser.newPassword || ''}
                onChange={(e) =>
                  setSelectedUser({
                    ...selectedUser,
                    newPassword: e.target.value,
                  })
                }
                disabled={!canChangePassword(selectedUser, currentUser)}
              />
              <TextField
                margin="dense"
                label="Confirm Password"
                fullWidth
                type="password"
                value={selectedUser.confirmPassword || ''}
                onChange={(e) =>
                  setSelectedUser({
                    ...selectedUser,
                    confirmPassword: e.target.value,
                  })
                }
                disabled={!canChangePassword(selectedUser, currentUser)}
              />
              {/* If user is OW, show read-only field instead of dropdown */}
              {(selectedUser.primaryRole === 'OW' || selectedUser.role === 'OW') ? (
                <TextField
                  margin="dense"
                  label="Primary Role"
                  fullWidth
                  value="OW"
                  disabled
                  helperText="Owner role cannot be changed"
                />
              ) : (
                <FormControl fullWidth margin="dense">
                  <InputLabel>Primary Role</InputLabel>
                  <Select
                    value={selectedUser.primaryRole || selectedUser.role || ''}
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        primaryRole: e.target.value,
                      })
                    }
                  >
                    {getAvailablePrimaryRoles().map((role) => (
                      <MenuItem key={role} value={role}>
                        {role}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              <Typography variant="subtitle1" sx={{ mt: 2 }}>
                Secondary Roles
              </Typography>
              {/* Check if secondary roles can be modified */}
              {currentUser && (
                ((currentUser.id && (currentUser.id === selectedUser.id || currentUser.id === selectedUser._id)) ||
                (currentUser._id && (currentUser._id === selectedUser.id || currentUser._id === selectedUser._id)) ||
                (currentUser.primaryRole !== 'OW' && currentUser.primaryRole !== 'sOW')
                ) ? (
                  <>
                    <Typography color="error" variant="body2" sx={{ mb: 1 }}>
                      {(currentUser.id && (currentUser.id === selectedUser.id || currentUser.id === selectedUser._id)) ||
                      (currentUser._id && (currentUser._id === selectedUser.id || currentUser._id === selectedUser._id))
                        ? "You cannot change your own permissions"
                        : "You do not have permission to change the secondary roles of other users"}
                    </Typography>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedUser.secondaryRoles?.admin || selectedUser.isAdmin || false}
                          disabled={true}
                        />
                      }
                      label="Admin"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedUser.secondaryRoles?.dispatcher || selectedUser.isDispatcher || false}
                          disabled={true}
                        />
                      }
                      label="Dispatcher"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedUser.secondaryRoles?.driver || selectedUser.isDriver || false}
                          disabled={true}
                        />
                      }
                      label="Driver"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedUser.secondaryRoles?.answeringService || selectedUser.isAnsweringService || false}
                          disabled={true}
                        />
                      }
                      label="Answering Service"
                    />
                  </>
                ) : (
                  <>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedUser.secondaryRoles?.admin || selectedUser.isAdmin || false}
                          onChange={(e) =>
                            setSelectedUser({
                              ...selectedUser,
                              secondaryRoles: {
                                ...selectedUser.secondaryRoles,
                                admin: e.target.checked,
                              },
                            })
                          }
                        />
                      }
                      label="Admin"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedUser.secondaryRoles?.dispatcher || selectedUser.isDispatcher || false}
                          onChange={(e) =>
                            setSelectedUser({
                              ...selectedUser,
                              secondaryRoles: {
                                ...selectedUser.secondaryRoles,
                                dispatcher: e.target.checked,
                              },
                            })
                          }
                        />
                      }
                      label="Dispatcher"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedUser.secondaryRoles?.driver || selectedUser.isDriver || false}
                          onChange={(e) =>
                            setSelectedUser({
                              ...selectedUser,
                              secondaryRoles: {
                                ...selectedUser.secondaryRoles,
                                driver: e.target.checked,
                              },
                            })
                          }
                        />
                      }
                      label="Driver"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedUser.secondaryRoles?.answeringService || selectedUser.isAnsweringService || false}
                          onChange={(e) =>
                            setSelectedUser({
                              ...selectedUser,
                              secondaryRoles: {
                                ...selectedUser.secondaryRoles,
                                answeringService: e.target.checked,
                              },
                            })
                          }
                        />
                      }
                      label="Answering Service"
                    />
                  </>
                )
              )}
              {(selectedUser.secondaryRoles?.driver || selectedUser.isDriver) && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedUser.isOnDuty || false}
                      onChange={(e) =>
                        setSelectedUser({
                          ...selectedUser,
                          isOnDuty: e.target.checked,
                        })
                      }
                      disabled={currentUser && currentUser.primaryRole === 'RM' &&
                        ((selectedUser.primaryRole === 'OW' || selectedUser.primaryRole === 'sOW') ||
                        (selectedUser.role === 'OW' || selectedUser.role === 'sOW'))}
                    />
                  }
                  label="On Duty"
                />
              )}
              <Typography variant="subtitle1" sx={{ mt: 2 }}>
                Status
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={selectedUser.isActive !== false}
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        isActive: e.target.checked,
                      })
                    }
                  />
                }
                label="Active"
              />
              <Typography variant="subtitle1" sx={{ mt: 2 }}>
                Notifications
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedUser.notifyNewJobAssigned || false}
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        notifyNewJobAssigned: e.target.checked,
                      })
                    }
                  />
                }
                label="New Job Assigned"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedUser.notifyJobDispatched || false}
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        notifyJobDispatched: e.target.checked,
                      })
                    }
                  />
                }
                label="Job Dispatched To"
              />
              
              {/* Address Section */}
              {/* Personal Address Section - Visible to all users */}
              <Typography variant="subtitle1" sx={{ mt: 2 }}>
                Personal Address
              </Typography>
              <TextField
                margin="dense"
                label="Street 1"
                fullWidth
                value={selectedUser.address?.street1 || ''}
                onChange={(e) =>
                  setSelectedUser({
                    ...selectedUser,
                    address: {
                      ...selectedUser.address || {},
                      street1: e.target.value,
                    },
                  })
                }
              />
              <TextField
                margin="dense"
                label="Street 2"
                fullWidth
                value={selectedUser.address?.street2 || ''}
                onChange={(e) =>
                  setSelectedUser({
                    ...selectedUser,
                    address: {
                      ...selectedUser.address || {},
                      street2: e.target.value,
                    },
                  })
                }
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  margin="dense"
                  label="City"
                  fullWidth
                  value={selectedUser.address?.city || ''}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      address: {
                        ...selectedUser.address || {},
                        city: e.target.value,
                      },
                    })
                  }
                />
                <TextField
                  margin="dense"
                  label="State"
                  fullWidth
                  value={selectedUser.address?.state || ''}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      address: {
                        ...selectedUser.address || {},
                        state: e.target.value,
                      },
                    })
                  }
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  margin="dense"
                  label="ZIP"
                  fullWidth
                  value={selectedUser.address?.zip || ''}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      address: {
                        ...selectedUser.address || {},
                        zip: e.target.value,
                      },
                    })
                  }
                />
                <FormControl fullWidth margin="dense">
                  <InputLabel>Country</InputLabel>
                  <Select
                    value={selectedUser.address?.country || 'US'}
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        address: {
                          ...selectedUser.address || {},
                          country: e.target.value,
                        },
                      })
                    }
                  >
                    <MenuItem value="US">United States</MenuItem>
                    <MenuItem value="CA">Canada</MenuItem>
                    <MenuItem value="MX">Mexico</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Facility Address Section - Only editable by OW or sOW users */}
              {currentUser && (currentUser.primaryRole === 'OW' || currentUser.primaryRole === 'sOW' || currentUser.role === 'OW' || currentUser.role === 'sOW') && (
                <>
                  <Typography variant="subtitle1" sx={{ mt: 2 }}>
                    Facility Address
                  </Typography>
                  <TextField
                    margin="dense"
                    label="Street 1"
                    fullWidth
                    value={selectedUser.facilityAddress?.street1 || selectedUser.facilityAddress1 || ''}
                    onChange={(e) => canEditFacility && setSelectedUser({
                      ...selectedUser,
                      facilityAddress: {
                        ...selectedUser.facilityAddress || {},
                        street1: e.target.value,
                      },
                      facilityAddress1: e.target.value
                    })}
                    disabled={!canEditFacility}
                  />
                  <TextField
                    margin="dense"
                    label="Street 2"
                    fullWidth
                    value={selectedUser.facilityAddress?.street2 || selectedUser.facilityAddress2 || ''}
                    onChange={(e) => canEditFacility && setSelectedUser({
                      ...selectedUser,
                      facilityAddress: {
                        ...selectedUser.facilityAddress || {},
                        street2: e.target.value,
                      },
                      facilityAddress2: e.target.value
                    })}
                    disabled={!canEditFacility}
                  />
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      margin="dense"
                      label="City"
                      fullWidth
                      value={selectedUser.facilityAddress?.city || selectedUser.facilityCity || ''}
                      onChange={(e) => canEditFacility && setSelectedUser({
                        ...selectedUser,
                        facilityAddress: {
                          ...selectedUser.facilityAddress || {},
                          city: e.target.value,
                        },
                        facilityCity: e.target.value
                      })}
                      disabled={!canEditFacility}
                    />
                    <TextField
                      margin="dense"
                      label="State"
                      fullWidth
                      value={selectedUser.facilityAddress?.state || selectedUser.facilityState || ''}
                      onChange={(e) => canEditFacility && setSelectedUser({
                        ...selectedUser,
                        facilityAddress: {
                          ...selectedUser.facilityAddress || {},
                          state: e.target.value,
                        },
                        facilityState: e.target.value
                      })}
                      disabled={!canEditFacility}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      margin="dense"
                      label="ZIP"
                      fullWidth
                      value={selectedUser.facilityAddress?.zip || selectedUser.facilityZip || ''}
                      onChange={(e) => canEditFacility && setSelectedUser({
                        ...selectedUser,
                        facilityAddress: {
                          ...selectedUser.facilityAddress || {},
                          zip: e.target.value,
                        },
                        facilityZip: e.target.value
                      })}
                      disabled={!canEditFacility}
                    />
                    <FormControl fullWidth margin="dense" disabled={!canEditFacility}>
                      <InputLabel>Country</InputLabel>
                      <Select
                        value={selectedUser.facilityAddress?.country || selectedUser.facilityCountry || 'US'}
                        onChange={(e) => canEditFacility && setSelectedUser({
                          ...selectedUser,
                          facilityAddress: {
                            ...selectedUser.facilityAddress || {},
                            country: e.target.value,
                          },
                          facilityCountry: e.target.value
                        })}
                      >
                        <MenuItem value="US">United States</MenuItem>
                        <MenuItem value="CA">Canada</MenuItem>
                        <MenuItem value="MX">Mexico</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditUserDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveUser} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog
        open={openCreateUserDialog}
        onClose={() => setOpenCreateUserDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create User</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Note: Service Provider (SP) accounts should be created through the Submissions page once applications are approved.
          </Typography>
          
          <Typography variant="body2" color="primary" sx={{ mb: 2 }}>
            Fields marked with * are required.
          </Typography>
          
          {currentUser && (
            <TextField
              margin="dense"
              label="Vendor ID (inherited from your account)"
              fullWidth
              value={currentUser.vendorNumber || currentUser.vendorId || ''}
              disabled
              sx={{ mb: 2 }}
            />
          )}
          <TextField
            margin="dense"
            label="First Name *"
            fullWidth
            required
            value={newUser.firstName || ''}
            onChange={(e) =>
              setNewUser({ ...newUser, firstName: e.target.value })
            }
            error={error && error.type === 'validation' && error.fields?.includes('firstName')}
            helperText={error && error.type === 'validation' && error.fields?.includes('firstName') ? 'First name is required' : ''}
          />
          <TextField
            margin="dense"
            label="Last Name *"
            fullWidth
            required
            value={newUser.lastName || ''}
            onChange={(e) =>
              setNewUser({ ...newUser, lastName: e.target.value })
            }
            error={error && error.type === 'validation' && error.fields?.includes('lastName')}
            helperText={error && error.type === 'validation' && error.fields?.includes('lastName') ? 'Last name is required' : ''}
          />
          <TextField
            margin="dense"
            label="Phone *"
            fullWidth
            required
            value={newUser.phone || ''}
            onChange={(e) =>
              setNewUser({ ...newUser, phone: e.target.value })
            }
            error={error && error.type === 'validation' && error.fields?.includes('phone')}
            helperText={error && error.type === 'validation' && error.fields?.includes('phone') ? 'Phone number is required' : ''}
          />
          <TextField
            margin="dense"
            label="Email *"
            fullWidth
            required
            value={newUser.email || ''}
            onChange={(e) =>
              setNewUser({ ...newUser, email: e.target.value })
            }
            error={error && error.type === 'validation' && error.fields?.includes('email')}
            helperText={error && error.type === 'validation' && error.fields?.includes('email') ? 'Valid email is required' : ''}
          />
          <TextField
            margin="dense"
            label="Username *"
            fullWidth
            required
            value={newUser.username || ''}
            onChange={(e) =>
              setNewUser({ ...newUser, username: e.target.value })
            }
            error={error && error.type === 'validation' && error.fields?.includes('username')}
            helperText={error && error.type === 'validation' && error.fields?.includes('username') ? 'Username is required' : ''}
          />
          <TextField
            margin="dense"
            label="Password *"
            fullWidth
            required
            type="password"
            value={newUser.password || ''}
            onChange={(e) =>
              setNewUser({ ...newUser, password: e.target.value })
            }
            error={error && error.type === 'validation' && error.fields?.includes('password')}
            helperText={error && error.type === 'validation' && error.fields?.includes('password') ? 'Password is required' : ''}
          />
          <TextField
            margin="dense"
            label="Confirm Password *"
            fullWidth
            required
            type="password"
            value={newUser.confirmPassword || ''}
            onChange={(e) =>
              setNewUser({ ...newUser, confirmPassword: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Company Name *"
            fullWidth
            required
            value={newUser.companyName || ''}
            onChange={(e) =>
              setNewUser({ ...newUser, companyName: e.target.value })
            }
            error={error && error.type === 'validation' && error.fields?.includes('companyName')}
            helperText={error && error.type === 'validation' && error.fields?.includes('companyName') ? 'Company name is required' : ''}
          />
          <FormControl fullWidth margin="dense" required error={error && error.type === 'validation' && error.fields?.includes('primaryRole')}>
            <InputLabel>Primary Role *</InputLabel>
            <Select
              value={newUser.primaryRole || ''}
              onChange={(e) =>
                setNewUser({ ...newUser, primaryRole: e.target.value })
              }
            >
              {getAvailablePrimaryRoles().map((role) => (
                <MenuItem key={role} value={role}>
                  {role}
                </MenuItem>
              ))}
            </Select>
            {error && error.type === 'validation' && error.fields?.includes('primaryRole') && (
              <FormHelperText>Primary role is required</FormHelperText>
            )}
          </FormControl>
          <Typography variant="subtitle1" sx={{ mt: 2 }}>
            Secondary Roles
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={newUser.secondaryRoles?.admin || false}
                onChange={(e) =>
                  setNewUser({
                    ...newUser,
                    secondaryRoles: {
                      ...newUser.secondaryRoles,
                      admin: e.target.checked,
                    },
                  })
                }
              />
            }
            label="Admin"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={newUser.secondaryRoles?.dispatcher || false}
                onChange={(e) =>
                  setNewUser({
                    ...newUser,
                    secondaryRoles: {
                      ...newUser.secondaryRoles,
                      dispatcher: e.target.checked,
                    },
                  })
                }
              />
            }
            label="Dispatcher"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={newUser.secondaryRoles?.driver || false}
                onChange={(e) =>
                  setNewUser({
                    ...newUser,
                    secondaryRoles: {
                      ...newUser.secondaryRoles,
                      driver: e.target.checked,
                    },
                  })
                }
              />
            }
            label="Driver"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={newUser.secondaryRoles?.answeringService || false}
                onChange={(e) =>
                  setNewUser({
                    ...newUser,
                    secondaryRoles: {
                      ...newUser.secondaryRoles,
                      answeringService: e.target.checked,
                    },
                  })
                }
              />
            }
            label="Answering Service"
          />
          
          {/* Region Selection for RM users */}
          {newUser.primaryRole === 'RM' && (
            <>
              <Typography variant="subtitle1" sx={{ mt: 2 }}>
                Region Assignment
              </Typography>
              <FormControl fullWidth margin="dense">
                <InputLabel>Assigned Region</InputLabel>
                <Select
                  multiple
                  value={newUser.regions || []}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      regions: e.target.value,
                    })
                  }
                  renderValue={(selected) => {
                    const selectedRegions = regions.filter(r => 
                      selected.includes(r._id) || selected.includes(r.id)
                    );
                    return selectedRegions.map(r => r.name).join(', ');
                  }}
                >
                  {regions.map((region) => (
                    <MenuItem key={region._id || region.id} value={region._id || region.id}>
                      {region.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}
          
          {/* Personal Address Section */}
          <Typography variant="subtitle1" sx={{ mt: 2 }}>
            Personal Address *
          </Typography>
          <TextField
            margin="dense"
            label="Street 1 *"
            fullWidth
            required
            value={newUser.address?.street1 || ''}
            onChange={(e) =>
              setNewUser({
                ...newUser,
                address: {
                  ...newUser.address,
                  street1: e.target.value,
                },
              })
            }
            error={error && error.type === 'validation' && error.fields?.includes('address.street1')}
            helperText={error && error.type === 'validation' && error.fields?.includes('address.street1') ? 'Street address is required' : ''}
          />
          <TextField
            margin="dense"
            label="Street 2"
            fullWidth
            value={newUser.address?.street2 || ''}
            onChange={(e) =>
              setNewUser({
                ...newUser,
                address: {
                  ...newUser.address,
                  street2: e.target.value,
                },
              })
            }
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              margin="dense"
              label="City *"
              fullWidth
              required
              value={newUser.address?.city || ''}
              onChange={(e) =>
                setNewUser({
                  ...newUser,
                  address: {
                    ...newUser.address,
                    city: e.target.value,
                  },
                })
              }
              error={error && error.type === 'validation' && error.fields?.includes('address.city')}
              helperText={error && error.type === 'validation' && error.fields?.includes('address.city') ? 'City is required' : ''}
            />
            <TextField
              margin="dense"
              label="State *"
              fullWidth
              required
              value={newUser.address?.state || ''}
              onChange={(e) =>
                setNewUser({
                  ...newUser,
                  address: {
                    ...newUser.address,
                    state: e.target.value,
                  },
                })
              }
              error={error && error.type === 'validation' && error.fields?.includes('address.state')}
              helperText={error && error.type === 'validation' && error.fields?.includes('address.state') ? 'State is required' : ''}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              margin="dense"
              label="ZIP *"
              fullWidth
              required
              value={newUser.address?.zip || ''}
              onChange={(e) =>
                setNewUser({
                  ...newUser,
                  address: {
                    ...newUser.address,
                    zip: e.target.value,
                  },
                })
              }
              error={error && error.type === 'validation' && error.fields?.includes('address.zip')}
              helperText={error && error.type === 'validation' && error.fields?.includes('address.zip') ? 'ZIP code is required' : ''}
            />
            <FormControl 
              fullWidth 
              margin="dense" 
              required
              error={error && error.type === 'validation' && error.fields?.includes('address.country')}
            >
              <InputLabel>Country *</InputLabel>
              <Select
                value={newUser.address?.country || 'US'}
                onChange={(e) =>
                  setNewUser({
                    ...newUser,
                    address: {
                      ...newUser.address,
                      country: e.target.value,
                    },
                  })
                }
              >
                <MenuItem value="US">United States</MenuItem>
                <MenuItem value="CA">Canada</MenuItem>
                <MenuItem value="MX">Mexico</MenuItem>
              </Select>
              {error && error.type === 'validation' && error.fields?.includes('address.country') && (
                <FormHelperText>Country is required</FormHelperText>
              )}
            </FormControl>
          </Box>
          
          {/* Facility Address Section - Only editable by OW or sOW users */}
          {currentUser && (currentUser.primaryRole === 'OW' || currentUser.primaryRole === 'sOW' || currentUser.role === 'OW' || currentUser.role === 'sOW') && (
            <>
              <Typography variant="subtitle1" sx={{ mt: 2 }}>
                Facility Address
              </Typography>
              <TextField
                margin="dense"
                label="Street 1"
                fullWidth
                value={newUser.facilityAddress?.street1 || ''}
                onChange={(e) => canEditFacility && setNewUser({
                      ...newUser,
                      facilityAddress: {
                        ...newUser.facilityAddress || {},
                        street1: e.target.value,
                      },
                      facilityAddress1: e.target.value
                    })}
                disabled={!canEditFacility}
              />
              <TextField
                margin="dense"
                label="Street 2"
                fullWidth
                value={newUser.facilityAddress?.street2 || ''}
                onChange={(e) => canEditFacility && setNewUser({
                      ...newUser,
                      facilityAddress: {
                        ...newUser.facilityAddress || {},
                        street2: e.target.value,
                      },
                      facilityAddress2: e.target.value
                    })}
                disabled={!canEditFacility}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  margin="dense"
                  label="City"
                  fullWidth
                  value={newUser.facilityAddress?.city || ''}
                  onChange={(e) => canEditFacility && setNewUser({
                      ...newUser,
                      facilityAddress: {
                        ...newUser.facilityAddress || {},
                        city: e.target.value,
                      },
                    })}
                  disabled={!canEditFacility}
                />
                <TextField
                  margin="dense"
                  label="State"
                  fullWidth
                  value={newUser.facilityAddress?.state || ''}
                  onChange={(e) => canEditFacility && setNewUser({
                      ...newUser,
                      facilityAddress: {
                        ...newUser.facilityAddress || {},
                        state: e.target.value,
                      },
                    })}
                  disabled={!canEditFacility}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  margin="dense"
                  label="ZIP"
                  fullWidth
                  value={newUser.facilityAddress?.zip || ''}
                  onChange={(e) => canEditFacility && setNewUser({
                      ...newUser,
                      facilityAddress: {
                        ...newUser.facilityAddress || {},
                        zip: e.target.value,
                      },
                    })}
                  disabled={!canEditFacility}
                />
                <FormControl fullWidth margin="dense" disabled={!canEditFacility}>
                  <InputLabel>Country</InputLabel>
                  <Select
                    value={newUser.facilityAddress?.country || 'US'}
                    onChange={(e) => canEditFacility && setNewUser({
                      ...newUser,
                      facilityAddress: {
                        ...newUser.facilityAddress || {},
                        country: e.target.value,
                      },
                    })}
                  >
                    <MenuItem value="US">United States</MenuItem>
                    <MenuItem value="CA">Canada</MenuItem>
                    <MenuItem value="MX">Mexico</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateUserDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveNewUser} color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>

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

      {/* Role Confirmation Dialog */}
      <Dialog
        open={openRoleConfirmDialog}
        onClose={cancelRoleChange}
      >
        <DialogTitle>Confirm Role Change</DialogTitle>
        <DialogContent>
          {pendingRoleChange && (
            <Typography>
              Are you sure you want to {pendingRoleChange.newValue ? 'add' : 'remove'} the {pendingRoleChange.role} role 
              for {pendingRoleChange.user.firstName || pendingRoleChange.user.ownerFirstName} {pendingRoleChange.user.lastName || pendingRoleChange.user.ownerLastName}?
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelRoleChange}>Cancel</Button>
          <Button onClick={confirmRoleChange} color="primary" variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Confirmation Dialog */}
      <Dialog
        open={openStatusConfirmDialog}
        onClose={cancelStatusChange}
      >
        <DialogTitle>Confirm Status Change</DialogTitle>
        <DialogContent>
          {pendingStatusChange && (
            <Typography>
              Are you sure you want to {pendingStatusChange.newValue ? 'activate' : 'deactivate'} the account for 
              {' '}{pendingStatusChange.user.firstName || pendingStatusChange.user.ownerFirstName} {pendingStatusChange.user.lastName || pendingStatusChange.user.ownerLastName}?
              {!pendingStatusChange.newValue && (
                <Typography color="error" sx={{ mt: 1 }}>
                  Warning: Deactivating a user will prevent them from logging in to the system.
                </Typography>
              )}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelStatusChange}>Cancel</Button>
          <Button onClick={confirmStatusChange} color={pendingStatusChange?.newValue ? 'primary' : 'error'} variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* On-Duty Confirmation Dialog */}
      <Dialog
        open={openOnDutyConfirmDialog}
        onClose={cancelOnDutyChange}
      >
        <DialogTitle>Confirm On-Duty Status Change</DialogTitle>
        <DialogContent>
          {pendingOnDutyChange && (
            <Typography>
              Are you sure you want to set {pendingOnDutyChange.user.firstName || pendingOnDutyChange.user.ownerFirstName} {pendingOnDutyChange.user.lastName || pendingOnDutyChange.user.ownerLastName} 
              as {pendingOnDutyChange.newValue ? 'On-Duty' : 'Off-Duty'}?
              {pendingOnDutyChange.newValue && (
                <Typography sx={{ mt: 1 }}>
                  This user will now be available for job assignments.
                </Typography>
              )}
              {!pendingOnDutyChange.newValue && (
                <Typography sx={{ mt: 1 }}>
                  This user will no longer be available for job assignments.
                </Typography>
              )}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelOnDutyChange}>Cancel</Button>
          <Button onClick={confirmOnDutyChange} color="primary" variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog
        open={openDeleteConfirmDialog}
        onClose={cancelDeleteUser}
      >
        <DialogTitle>
          {pendingDeleteUser && pendingDeleteUser.isActive === false 
            ? "Confirm Permanent Deletion" 
            : "Confirm User Deactivation"}
        </DialogTitle>
        <DialogContent>
          {pendingDeleteUser && (
            <>
              {pendingDeleteUser.isActive === false ? (
                <>
                  <Typography>
                    Are you sure you want to <strong>permanently delete</strong> the account for 
                    {' '}{pendingDeleteUser.firstName || pendingDeleteUser.ownerFirstName} {pendingDeleteUser.lastName || pendingDeleteUser.ownerLastName}?
                  </Typography>
                  <Typography color="error" sx={{ mt: 1, fontWeight: 'bold' }}>
                    WARNING: This action cannot be undone. The user and all associated data will be permanently removed from the system.
                  </Typography>
                </>
              ) : (
                <>
                  <Typography>
                    Are you sure you want to deactivate the account for 
                    {' '}{pendingDeleteUser.firstName || pendingDeleteUser.ownerFirstName} {pendingDeleteUser.lastName || pendingDeleteUser.ownerLastName}?
                  </Typography>
                  <Typography color="error" sx={{ mt: 1 }}>
                    Warning: This action will prevent the user from logging in to the system.
                  </Typography>
                  <Typography sx={{ mt: 1 }}>
                    Deactivated users will be moved to the "Deactivated Users" section and can be reactivated later.
                  </Typography>
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDeleteUser}>Cancel</Button>
          <Button 
            onClick={confirmDeleteUser} 
            color="error" 
            variant="contained"
          >
            {pendingDeleteUser && pendingDeleteUser.isActive === false 
              ? "Permanently Delete" 
              : "Deactivate User"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 2FA Dialog */}
      <Dialog
        open={open2FADialog}
        onClose={() => setOpen2FADialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Two-Factor Authentication</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <>
              {selectedUser.twoFactorAuth?.enabled ? (
                <>
                  <Typography variant="body1">
                    2FA is currently enabled using {selectedUser.twoFactorAuth.method}.
                  </Typography>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleDisable2FA}
                    sx={{ mt: 2 }}
                  >
                    Disable 2FA
                  </Button>
                </>
              ) : selectedUser.twoFactorAuth?.method ? (
                <>
                  <Typography variant="body1">
                    2FA setup initiated using {selectedUser.twoFactorAuth.method}.
                  </Typography>
                  {selectedUser.twoFactorAuth.method === 'app' && selectedUser.twoFactorAuth.qrCode && (
                    <>
                      <Typography variant="body2" sx={{ mt: 2 }}>
                        Scan this QR code with your authenticator app:
                      </Typography>
                      <Box sx={{ mt: 1, textAlign: 'center' }}>
                        <img
                          src={`https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=${encodeURIComponent(selectedUser.twoFactorAuth.qrCode)}`}
                          alt="QR Code"
                        />
                      </Box>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Or enter this code manually: {selectedUser.twoFactorAuth.secret}
                      </Typography>
                    </>
                  )}
                  {(selectedUser.twoFactorAuth.method === 'email' || selectedUser.twoFactorAuth.method === 'sms') && (
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      A verification code has been sent to your {selectedUser.twoFactorAuth.method === 'email' ? 'email' : 'phone'}.
                    </Typography>
                  )}
                  <TextField
                    margin="dense"
                    label="Verification Code"
                    fullWidth
                    value={selectedUser.verificationCode || ''}
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        verificationCode: e.target.value,
                      })
                    }
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleVerify2FA(selectedUser.verificationCode)}
                    sx={{ mt: 2 }}
                  >
                    Verify
                  </Button>
                </>
              ) : (
                <>
                  <Typography variant="body1">
                    Choose a 2FA method:
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => handle2FASetup('app')}
                    sx={{ mt: 2, mr: 1 }}
                  >
                    Authenticator App
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => handle2FASetup('email')}
                    sx={{ mt: 2, mr: 1 }}
                  >
                    Email
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => handle2FASetup('sms')}
                    sx={{ mt: 2 }}
                  >
                    SMS
                  </Button>
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen2FADialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Users;
