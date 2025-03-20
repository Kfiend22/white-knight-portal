// RejectionDialog.js
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField
} from '@mui/material';

const RejectionDialog = ({ open, onClose, onSubmit, loading }) => {
  const [rejectionReason, setRejectionReason] = useState('');

  // Reset state when dialog is opened
  useEffect(() => {
    if (open) {
      setRejectionReason('');
    }
  }, [open]);

  // Handle submission
  const handleSubmit = () => {
    if (!rejectionReason) {
      alert('Please provide a reason for rejecting this job.');
      return;
    }
    
    onSubmit(rejectionReason);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Reject Job</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Reason for rejection"
          fullWidth
          multiline
          rows={4}
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="error"
          disabled={loading}
        >
          Reject Job
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RejectionDialog;
