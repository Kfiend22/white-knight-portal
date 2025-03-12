// UploadCOIDialog.js
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';

function UploadCOIDialog({ open, onClose }) {
  const [file, setFile] = useState(null);
  const dialogTitleId = 'coi-dialog-title';

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (file) {
      onClose();
      setFile(null);
    } else {
      alert('Please select a file to upload.');
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      keepMounted
      aria-labelledby={dialogTitleId}
    >
      <DialogTitle id={dialogTitleId}>Upload Certificate of Insurance (COI)</DialogTitle>
      <DialogContent>
        <Button variant="contained" component="label">
          Upload File
          <input type="file" hidden onChange={handleFileChange} />
        </Button>
        {file && <div>{file.name}</div>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleUpload} color="primary">
          Upload
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default UploadCOIDialog;
