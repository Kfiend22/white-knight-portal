// UploadBackgroundChecksDialog.js
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';

function UploadBackgroundChecksDialog({ open, onClose }) {
  const [file, setFile] = useState(null);

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (file) {
      // Handle file upload
      // Implement the fetch request or call a function passed via props
      // Then close the dialog
      onClose();
      setFile(null);
    } else {
      alert('Please select a file to upload.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Upload Background Checks</DialogTitle>
      <DialogContent>
        {/* Add file upload field */}
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

export default UploadBackgroundChecksDialog;
