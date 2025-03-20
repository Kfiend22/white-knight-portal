// GoaDialog.js
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField
} from '@mui/material';

const GoaDialog = ({ open, onClose, onSubmit, loading }) => {
  const [goaReason, setGoaReason] = useState('');

  // Reset state when dialog is opened
  useEffect(() => {
    if (open) {
      setGoaReason('');
    }
  }, [open]);

  // Handle submission
  const handleSubmit = () => {
    if (!goaReason) {
      alert('Please provide a reason for marking as GOA.');
      return;
    }
    
    onSubmit(goaReason);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Mark as GOA</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Reason for GOA"
          fullWidth
          multiline
          rows={4}
          value={goaReason}
          onChange={(e) => setGoaReason(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Back</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="warning"
          disabled={loading}
        >
          Submit GOA
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GoaDialog;
