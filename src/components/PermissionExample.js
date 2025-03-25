/**
 * PermissionExample.js
 * 
 * Example component demonstrating how to use the Permission Context
 */

import React from 'react';
import { usePermissions, Protected } from '../context/PermissionContext';
import { Box, Typography, Button, Paper } from '@mui/material';

/**
 * Example component demonstrating how to use the permission context
 */
const PermissionExample = ({ resourceId }) => {
  // Use the permission context
  const {
    validateAccess,
    validateJobAccess,
    hasPermission,
    isOwner,
    isDriverOnly,
    getCurrentUser
  } = usePermissions();
  
  // Get current user
  const currentUser = getCurrentUser();
  
  // Example resource
  const resource = {
    type: 'job',
    id: resourceId || '123',
    status: 'Dispatched',
    vendorId: currentUser?.vendorId || '1'
  };
  
  return (
    <Paper sx={{ p: 3, mt: 2, mb: 2 }}>
      <Typography variant="h5" gutterBottom>
        Permission System Example
      </Typography>
      
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1">Current User:</Typography>
        {currentUser ? (
          <Box component="pre" sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            {JSON.stringify({
              id: currentUser.id || currentUser._id,
              username: currentUser.username,
              primaryRole: currentUser.primaryRole,
              secondaryRoles: currentUser.secondaryRoles
            }, null, 2)}
          </Box>
        ) : (
          <Typography color="error">No authenticated user</Typography>
        )}
      </Box>
      
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1">Role-Based Checks:</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
          <Typography>
            isOwner(): <strong>{isOwner() ? 'Yes' : 'No'}</strong>
          </Typography>
          <Typography>
            isDriverOnly(): <strong>{isDriverOnly() ? 'Yes' : 'No'}</strong>
          </Typography>
        </Box>
      </Box>
      
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1">Permission Checks:</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
          <Typography>
            hasPermission('createJobs'): <strong>{hasPermission('createJobs') ? 'Yes' : 'No'}</strong>
          </Typography>
          <Typography>
            hasPermission('updateJobEta'): <strong>{hasPermission('updateJobEta') ? 'Yes' : 'No'}</strong>
          </Typography>
          <Typography>
            hasPermission('deleteJobs'): <strong>{hasPermission('deleteJobs') ? 'Yes' : 'No'}</strong>
          </Typography>
        </Box>
      </Box>
      
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1">Resource Access Checks:</Typography>
        <Box sx={{ mt: 1 }}>
          <Typography gutterBottom>
            validateAccess(resource, 'view'): <strong>{validateAccess(resource, 'view') ? 'Allowed' : 'Denied'}</strong>
          </Typography>
          <Typography gutterBottom>
            validateAccess(resource, 'edit'): <strong>{validateAccess(resource, 'edit') ? 'Allowed' : 'Denied'}</strong>
          </Typography>
          <Typography>
            validateAccess(resource, 'delete'): <strong>{validateAccess(resource, 'delete') ? 'Allowed' : 'Denied'}</strong>
          </Typography>
        </Box>
      </Box>
      
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1">Protected Component Example:</Typography>
        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
          {/* Protected button that only renders for users with 'createJobs' permission */}
          <Protected permission="createJobs">
            <Button variant="contained" color="primary">
              Create Job (Requires 'createJobs' permission)
            </Button>
          </Protected>
          
          {/* Protected button that only renders for users with 'deleteJobs' permission */}
          <Protected permission="deleteJobs" fallback={
            <Button variant="outlined" color="error" disabled>
              Delete (Permission Denied)
            </Button>
          }>
            <Button variant="contained" color="error">
              Delete Job (Requires 'deleteJobs' permission)
            </Button>
          </Protected>
          
          {/* Protected button that requires access to a specific resource */}
          <Protected resource={resource} action="edit">
            <Button variant="contained" color="secondary">
              Edit Job (Requires edit access to this job)
            </Button>
          </Protected>
        </Box>
      </Box>
    </Paper>
  );
};

export default PermissionExample;
