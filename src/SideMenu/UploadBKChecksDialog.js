// UploadBackgroundChecksDialog.js
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';

// Accept onUpload prop
function UploadBackgroundChecksDialog({ open, onClose, onUpload }) { 
  const [file, setFile] = useState(null);

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (file && onUpload) { // Check if file and onUpload exist
      onUpload(file); // Call the passed-in upload handler
      // No need to call onClose() here, the parent handler does it
      setFile(null); // Reset file state
    } else if (!file) {
      alert('Please select a file to upload.');
    } else {
      console.error('onUpload prop is missing from UploadBackgroundChecksDialog');
      alert('Upload configuration error.');
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
