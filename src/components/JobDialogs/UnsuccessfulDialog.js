// UnsuccessfulDialog.js
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField
} from '@mui/material';

const UnsuccessfulDialog = ({ open, onClose, onSubmit, loading }) => {
  const [unsuccessfulReason, setUnsuccessfulReason] = useState('');

  // Reset state when dialog is opened
  useEffect(() => {
    if (open) {
      setUnsuccessfulReason('');
    }
  }, [open]);

  // Handle submission
  const handleSubmit = () => {
    if (!unsuccessfulReason) {
      alert('Please provide a reason for marking as unsuccessful.');
      return;
    }
    
    onSubmit(unsuccessfulReason);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Report Unsuccessful</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Reason for unsuccessful job"
          fullWidth
          multiline
          rows={4}
          value={unsuccessfulReason}
          onChange={(e) => setUnsuccessfulReason(e.target.value)}
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
          Mark Unsuccessful
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UnsuccessfulDialog;
