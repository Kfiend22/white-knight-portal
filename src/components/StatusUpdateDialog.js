// StatusUpdateDialog.js
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Box
} from '@mui/material';
import { getStatusPriority } from '../utils/jobUtils';

/**
 * Dialog for updating job status with radio button options
 * 
 * @param {Object} props Component props
 * @param {boolean} props.open Whether the dialog is open
 * @param {Function} props.onClose Callback when dialog is closed
 * @param {string} props.currentStatus Current job status
 * @param {Array} props.allowedStatuses Array of allowed status options
 * @param {Function} props.onUpdateStatus Callback when status is updated
 * @returns {JSX.Element} The StatusUpdateDialog component
 */
const StatusUpdateDialog = ({ 
  open, 
  onClose, 
  currentStatus, 
  allowedStatuses, 
  onUpdateStatus 
}) => {
  // Local state for selected status
  const [selectedStatus, setSelectedStatus] = useState('');
  // Error state if user tries to select a previous status
  const [error, setError] = useState('');

  // Reset selected status when dialog opens
  useEffect(() => {
    if (open) {
      // By default, select the first valid option
      // This solves the "empty dropdown" issue
      const validNextStatuses = getValidNextStatuses(currentStatus, allowedStatuses);
      setSelectedStatus(validNextStatuses.length > 0 ? validNextStatuses[0] : '');
      setError('');
    }
  }, [open, currentStatus, allowedStatuses]);

  // Get valid next statuses based on current status
  const getValidNextStatuses = (current, allowed) => {
    const currentPriority = getStatusPriority(current);
    
    // Filter to only include statuses with higher priority (later in workflow)
    return allowed.filter(status => {
      const statusPriority = getStatusPriority(status);
      return statusPriority >= currentPriority;
    });
  };

  // Handle radio selection change
  const handleStatusChange = (event) => {
    const newStatus = event.target.value;
    
    // Check if the selected status is valid (not going backwards)
    const currentPriority = getStatusPriority(currentStatus);
    const newPriority = getStatusPriority(newStatus);
    
    if (newPriority < currentPriority) {
      setError(`Cannot select ${newStatus} as it comes before ${currentStatus} in the workflow.`);
    } else {
      setError('');
    }
    
    setSelectedStatus(newStatus);
  };

  // Handle update button click
  const handleUpdate = () => {
    // Only proceed if no error and a status is selected
    if (!error && selectedStatus) {
      onUpdateStatus(selectedStatus);
      onClose();
    }
  };

  // Only include statuses appropriate for driver workflow
  const validNextStatuses = getValidNextStatuses(currentStatus, allowedStatuses);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Update Job Status</DialogTitle>
      <DialogContent>
        <Box sx={{ my: 2 }}>
          <Typography gutterBottom>
            Current Status: <strong>{currentStatus}</strong>
          </Typography>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Select the new status for this job:
          </Typography>
          
          <RadioGroup
            value={selectedStatus}
            onChange={handleStatusChange}
          >
            {validNextStatuses.map(status => (
              <FormControlLabel 
                key={status} 
                value={status} 
                control={<Radio />} 
                label={status} 
              />
            ))}
          </RadioGroup>
          
          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleUpdate} 
          color="primary" 
          variant="contained"
          disabled={!!error || !selectedStatus}
        >
          Update Status
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StatusUpdateDialog;
