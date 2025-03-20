// CancelDialog.js
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField
} from '@mui/material';

const CancelDialog = ({ open, onClose, onSubmit, loading }) => {
  const [cancellationReason, setCancellationReason] = useState('');

  // Reset state when dialog is opened
  useEffect(() => {
    if (open) {
      setCancellationReason('');
    }
  }, [open]);

  // Handle submission
  const handleSubmit = () => {
    if (!cancellationReason) {
      alert('Please provide a reason for cancellation.');
      return;
    }
    
    onSubmit(cancellationReason);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Cancel Job</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Reason for cancellation"
          fullWidth
          multiline
          rows={4}
          value={cancellationReason}
          onChange={(e) => setCancellationReason(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Back</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="error"
          disabled={loading}
        >
          Cancel Job
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CancelDialog;
