// EtaUpdateDialog.js
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';

const EtaUpdateDialog = ({ open, onClose, onSave, loading, currentEta }) => {
  const [selectedEta, setSelectedEta] = useState('5'); // default to 5 minutes
  const [anotherTime, setAnotherTime] = useState(false);
  const [anotherTimeValue, setAnotherTimeValue] = useState(null);

  // Reset state when dialog is opened
  React.useEffect(() => {
    if (open) {
      setSelectedEta('5');
      setAnotherTime(false);
      setAnotherTimeValue(null);
    }
  }, [open]);

  // ETA selection change
  const handleEtaSelectChange = (event) => {
    const value = event.target.value;
    if (value === 'another') {
      setAnotherTime(true);
    } else {
      setSelectedEta(value);
      setAnotherTime(false);
    }
  };

  // Handle saving ETA
  const handleSave = () => {
    if (anotherTime && !anotherTimeValue) {
      alert('Please enter a valid time in minutes.');
      return;
    }
    
    // Use the eta value based on selection
    const etaValue = anotherTime ? anotherTimeValue : selectedEta;
    onSave(etaValue);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Update ETA</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          This will update the ETA for the job. The current ETA is {currentEta || 'unknown'} minutes.
        </DialogContentText>
        
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel id="eta-select-label">Additional Time</InputLabel>
          <Select
            labelId="eta-select-label"
            value={selectedEta}
            onChange={handleEtaSelectChange}
            label="Additional Time"
          >
            <MenuItem value="5">+5 minutes</MenuItem>
            <MenuItem value="10">+10 minutes</MenuItem>
            <MenuItem value="15">+15 minutes</MenuItem>
            <MenuItem value="20">+20 minutes</MenuItem>
            <MenuItem value="30">+30 minutes</MenuItem>
            <MenuItem value="45">+45 minutes</MenuItem>
            <MenuItem value="60">+1 hour</MenuItem>
            <MenuItem value="90">+1.5 hours</MenuItem>
            <MenuItem value="120">+2 hours</MenuItem>
            <MenuItem value="another">Another time...</MenuItem>
          </Select>
        </FormControl>
        
        {anotherTime && (
          <TextField
            label="Custom additional time (minutes)"
            type="number"
            fullWidth
            sx={{ mt: 2 }}
            value={anotherTimeValue}
            onChange={(e) => setAnotherTimeValue(e.target.value)}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          color="primary"
          disabled={loading}
        >
          Update ETA
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EtaUpdateDialog;
