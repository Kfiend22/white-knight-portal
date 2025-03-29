import React, { useState, useEffect } from 'react'; // Import useEffect
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Link,
  Alert,
  Paper, // Added
  CircularProgress, // Added
  Divider, // Added
  IconButton // Added
} from '@mui/material';
import { Save as SaveIcon, Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material'; // Added Icons
import { Document, Page, pdfjs } from 'react-pdf'; // Revert import

// Configuration moved to src/index.js

function BackgroundCheckTab({ application, editingFields, handleFieldEdit, handleSaveChanges }) {

  // PDF Viewer State
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfError, setPdfError] = useState(false);
  const [scale, setScale] = useState(1.5); // Default scale at 150%
  const [isPdfViewerReady, setIsPdfViewerReady] = useState(false); // State for delayed rendering

  // Delay rendering to allow global config to apply
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPdfViewerReady(true);
    }, 150); // 150ms delay

    return () => clearTimeout(timer); // Cleanup timer on unmount
  }, []);

  // Safely access nested background check data, providing defaults
  const backgroundCheckData = editingFields[application._id]?.backgroundCheck ?? application.backgroundCheck ?? {};
  const path = backgroundCheckData.path || '';
  const status = backgroundCheckData.status || 'Not Started';
  const dateRequested = backgroundCheckData.dateRequested ? backgroundCheckData.dateRequested.split('T')[0] : ''; // Format for date input
  const dateCompleted = backgroundCheckData.dateCompleted ? backgroundCheckData.dateCompleted.split('T')[0] : ''; // Format for date input
  const provider = backgroundCheckData.provider || '';
  const notes = backgroundCheckData.notes || '';

  // PDF Viewer Handlers
  const handleZoomIn = () => setScale(prevScale => Math.min(prevScale + 0.2, 3.0));
  const handleZoomOut = () => setScale(prevScale => Math.max(prevScale - 0.2, 0.5));
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1); // Reset to first page on new load
    setPdfError(false);
  };
  const onDocumentLoadError = (error) => {
    console.error('Error loading Background Check PDF:', error);
    setPdfError(true);
  };

  // Use the correct path from backgroundCheck object
  const getDocumentUrl = (filePath) => {
    if (!filePath) return null;
    const baseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';
    // Files are served from /uploads/applications/
    // filePath might be just the filename (after migration) or the full relative path (for new uploads)
    const filename = filePath.includes('/') ? filePath.split('/').pop() : filePath;
    return `${baseUrl}/uploads/applications/${filename}`; 
  };

  const documentUrl = getDocumentUrl(path); // Get URL once

  return (
    <Box sx={{ p: 2 }}>
      {/* Moved Save Button to the Form side */}
      {/* Display potential save status messages passed from parent */}
      {/* {saveStatus?.success && <Alert severity="success" sx={{ mb: 2 }}>{saveStatus.success}</Alert>}
      {saveStatus?.error && <Alert severity="error" sx={{ mb: 2 }}>{saveStatus.error}</Alert>} */}

      <Grid container spacing={3}>
        {/* Left Panel - PDF Viewer */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%', minHeight: 400, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">Background Check Document</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ mr: 1 }}>Zoom:</Typography>
                <IconButton size="small" onClick={handleZoomOut} disabled={scale <= 0.5}><RemoveIcon fontSize="small" /></IconButton>
                <Typography variant="body2" sx={{ mx: 1 }}>{Math.round(scale * 100)}%</Typography>
                <IconButton size="small" onClick={handleZoomIn} disabled={scale >= 3.0}><AddIcon fontSize="small" /></IconButton>
              </Box>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {isPdfViewerReady ? ( // Start: Is viewer ready?
              documentUrl ? ( // Start: Is there a URL?
                pdfError ? ( // Start: Is there a PDF error?
                  // Error message Box
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography color="error">Error loading document. File may be missing or invalid.</Typography>
                  </Box>
                ) : ( // Else: No PDF error
                  // PDF viewer Box
                  <Box sx={{ flexGrow: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {/* Document, Page, Pagination, Link */}
                    <Document file={documentUrl} onLoadSuccess={onDocumentLoadSuccess} onLoadError={onDocumentLoadError} loading={<CircularProgress />}>
                      <Page pageNumber={pageNumber} scale={scale} renderTextLayer={false} renderAnnotationLayer={false} />
                    </Document>
                    {numPages && (
                      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button disabled={pageNumber <= 1} onClick={() => setPageNumber(pageNumber - 1)}>Previous</Button>
                        <Typography>Page {pageNumber} of {numPages}</Typography>
                        <Button disabled={pageNumber >= numPages} onClick={() => setPageNumber(pageNumber + 1)}>Next</Button>
                      </Box>
                    )}
                    <Box sx={{ mt: 2 }}>
                      <Link href={documentUrl} target="_blank" rel="noopener noreferrer">
                        Download Document ({path.split('/').pop()})
                      </Link>
                    </Box>
                  </Box> // End: PDF viewer Box
                ) // End: PDF error check
              ) : ( // Else: No document URL
                // No document message Box
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography color="textSecondary">No background check document uploaded.</Typography>
                </Box> // End: No document message Box
              ) // End: Document URL check
            ) : ( // Else: Viewer not ready
              // Loading spinner Box
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
                <CircularProgress />
              </Box> // End: Loading spinner Box
            )} // End: Viewer ready check
          </Paper>
        </Grid>

        {/* Right Panel - Form Fields */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => handleSaveChanges(application._id)} 
                startIcon={<SaveIcon />}
                // Disable save if no edits specifically for backgroundCheck exist
                disabled={!editingFields[application._id]?.backgroundCheck} 
              >
                Save Background Check Info
              </Button>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="background-check-status-label">Status</InputLabel>
                  <Select
                    labelId="background-check-status-label"
                    label="Status"
                    name="backgroundCheck.status" // Use dot notation for nested fields
                    value={status}
                    onChange={(e) => handleFieldEdit(application._id, 'backgroundCheck.status', e.target.value)}
                  >
                    {['Not Started', 'Requested', 'Pending', 'Approved', 'Denied', 'Error'].map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                 {/* Basic Date Input - Replace with DatePicker if available */}
                 <TextField
                   fullWidth
                   label="Date Requested"
                   name="backgroundCheck.dateRequested"
                   type="date"
                   value={dateRequested}
                   onChange={(e) => handleFieldEdit(application._id, 'backgroundCheck.dateRequested', e.target.value)}
                   InputLabelProps={{ shrink: true }} 
                 />
                 {/* Example using MUI X DatePicker (requires installation and setup) */}
                 {/* <DatePicker
                   label="Date Requested"
                   value={dateRequested ? new Date(dateRequested) : null}
                   onChange={(newValue) => {
                     handleFieldEdit(application._id, 'backgroundCheck.dateRequested', newValue ? newValue.toISOString() : null);
                   }}
                   renderInput={(params) => <TextField {...params} fullWidth />}
                 /> */}
              </Grid>

              <Grid item xs={12} sm={6}>
                 {/* Basic Date Input */}
                 <TextField
                   fullWidth
                   label="Date Completed"
                   name="backgroundCheck.dateCompleted"
                   type="date"
                   value={dateCompleted}
                   onChange={(e) => handleFieldEdit(application._id, 'backgroundCheck.dateCompleted', e.target.value)}
                   InputLabelProps={{ shrink: true }}
                 />
                 {/* Example using MUI X DatePicker */}
                 {/* <DatePicker
                   label="Date Completed"
                   value={dateCompleted ? new Date(dateCompleted) : null}
                   onChange={(newValue) => {
                     handleFieldEdit(application._id, 'backgroundCheck.dateCompleted', newValue ? newValue.toISOString() : null);
                   }}
                   renderInput={(params) => <TextField {...params} fullWidth />}
                 /> */}
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Provider"
                  name="backgroundCheck.provider"
                  value={provider}
                  onChange={(e) => handleFieldEdit(application._id, 'backgroundCheck.provider', e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  name="backgroundCheck.notes"
                  value={notes}
                  onChange={(e) => handleFieldEdit(application._id, 'backgroundCheck.notes', e.target.value)}
                  multiline
                  rows={4}
                />
              </Grid>
              {/* Removed the simple link display from here, it's now part of the viewer */}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default BackgroundCheckTab;
