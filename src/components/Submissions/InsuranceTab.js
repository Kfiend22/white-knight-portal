import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Link,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  FormControl,
  Input,
  FormHelperText
} from '@mui/material';
import { Document, Page, pdfjs } from 'react-pdf'; // Revert import
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

// Configuration moved to src/index.js

function InsuranceTab({ application, onUpdate }) {
  // Add state for delayed rendering
  const [isPdfViewerReady, setIsPdfViewerReady] = useState(false); 
  const [insuranceData, setInsuranceData] = useState({
    agency: '',
    policyNumber: '',
    agentName: '',
    agentPhone: '',
    agentFax: '',
    agentEmail: '',
    policyExpiration: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfError, setPdfError] = useState(false);
  const [scale, setScale] = useState(1.5); // Default scale at 150%
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Delay rendering
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPdfViewerReady(true);
    }, 150); // 150ms delay
    return () => clearTimeout(timer);
  }, []);

  // Handle zoom in/out
  const handleZoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.2, 3.0)); // Max zoom: 300%
  };

  const handleZoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.2, 0.5)); // Min zoom: 50%
  };

  // Get auth headers
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  // Initialize form with existing insurance data if available
  useEffect(() => {
    if (application && application.insurance) {
      setInsuranceData({
        agency: application.insurance.agency || '',
        policyNumber: application.insurance.policyNumber || '',
        agentName: application.insurance.agentName || '',
        agentPhone: application.insurance.agentPhone || '',
        agentFax: application.insurance.agentFax || '',
        agentEmail: application.insurance.agentEmail || '',
        policyExpiration: application.insurance.policyExpiration 
          ? new Date(application.insurance.policyExpiration).toISOString().split('T')[0] 
          : ''
      });
    }
  }, [application]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInsuranceData({
      ...insuranceData,
      [name]: value
    });
  };

  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/v1/applications/${application._id}/insurance`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify(insuranceData)
      });

      if (!response.ok) {
        throw new Error(`Failed to update insurance information: ${response.statusText}`);
      }

      const updatedApplication = await response.json();
      setSuccess('Insurance information updated successfully');
      
      // Call the onUpdate callback to refresh the parent component
      if (onUpdate) {
        onUpdate(updatedApplication);
      }
    } catch (err) {
      setError(err.message || 'Failed to update insurance information');
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!uploadFile) {
      setError('Please select a file to upload');
      return;
    }

    setUploadLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('coi', uploadFile);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/applications/${application._id}/upload-coi`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Failed to upload COI: ${response.statusText}`);
      }

      const updatedApplication = await response.json();
      setSuccess('Certificate of Insurance uploaded successfully');
      setUploadFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('coi-upload');
      if (fileInput) {
        fileInput.value = '';
      }
      
      // Call the onUpdate callback to refresh the parent component
      if (onUpdate) {
        onUpdate(updatedApplication);
      }
    } catch (err) {
      setError(err.message || 'Failed to upload Certificate of Insurance');
    } finally {
      setUploadLoading(false);
    }
  };

  // Handle requesting a new COI
  const handleRequestCOI = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/v1/applications/${application._id}/request-coi`, {
        method: 'POST',
        headers: getAuthHeader()
      });

      if (!response.ok) {
        throw new Error(`Failed to request new COI: ${response.statusText}`);
      }

      setSuccess('COI request sent successfully');
    } catch (err) {
      setError(err.message || 'Failed to request new COI');
    } finally {
      setLoading(false);
    }
  };

  // Handle PDF document loading
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPdfError(false);
  };

  // Handle PDF document loading error
  const onDocumentLoadError = (error) => {
    console.error('Error loading PDF:', error);
    setPdfError(true);
  };

  // Function to create the full document URL
  const getDocumentUrl = (path) => {
    if (!path) return null;
    
    // Make sure the URL starts with a slash
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? '' 
      : 'http://localhost:5000';
    return `${baseUrl}/uploads/applications/${path}`;
  };

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={3}>
        {/* Left Panel - PDF Viewer */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%', minHeight: 400, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">
                Certificate of Insurance
              </Typography>
              
              {/* Zoom Controls */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ mr: 1 }}>
                  Zoom:
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={handleZoomOut}
                  disabled={scale <= 0.5}
                >
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <Typography variant="body2" sx={{ mx: 1 }}>
                  {Math.round(scale * 100)}%
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={handleZoomIn}
                  disabled={scale >= 3.0}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            {isPdfViewerReady ? ( // Conditionally render
              application && application.insurance && application.insurance.coiPath ? (
                pdfError ? (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography color="error">
                    Error loading Certificate of Insurance. The file may be missing or inaccessible.
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    sx={{ mt: 2 }}
                    onClick={handleRequestCOI}
                  >
                    Request New COI
                  </Button>
                </Box>
              ) : (
                <Box sx={{ flexGrow: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Document
                    file={getDocumentUrl(application.insurance.coiPath)}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={<CircularProgress />}
                  >
                    <Page 
                      pageNumber={pageNumber}
                      scale={scale}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  </Document>
                  
                  {numPages && (
                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Button 
                        disabled={pageNumber <= 1} 
                        onClick={() => setPageNumber(pageNumber - 1)}
                      >
                        Previous
                      </Button>
                      <Typography>
                        Page {pageNumber} of {numPages}
                      </Typography>
                      <Button 
                        disabled={pageNumber >= numPages} 
                        onClick={() => setPageNumber(pageNumber + 1)}
                      >
                        Next
                      </Button>
                    </Box>
                  )}
                  
                  <Box sx={{ mt: 2 }}>
                    <Link 
                      href={getDocumentUrl(application.insurance.coiPath)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      Download Certificate of Insurance
                    </Link>
                  </Box>
                </Box> // End: PDF viewer Box
              ) // End: pdfError check
            ) : ( // Else: No application.insurance.coiPath
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography>
                  No Certificate of Insurance has been uploaded yet.
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  sx={{ mt: 2 }}
                  onClick={handleRequestCOI}
                >
                  Request COI
                </Button>
              </Box> // End: No COI message Box
            ) // End: application.insurance.coiPath check
          ) : ( // Else: Viewer not ready
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
              <CircularProgress />
            </Box> // End: Loading spinner Box
          )} // End: Viewer ready check
            
            {/* Upload Section */}
            <Box sx={{ mt: 3, p: 2, border: '1px dashed #ccc', borderRadius: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                Upload Certificate of Insurance
              </Typography>
              
              <FormControl fullWidth error={!!error} sx={{ mb: 2 }}>
                <Input
                  id="coi-upload"
                  type="file"
                  onChange={handleFileChange}
                  inputProps={{ accept: 'application/pdf' }}
                />
                <FormHelperText>Select a PDF file</FormHelperText>
              </FormControl>
              
              <Button
                variant="contained"
                color="primary"
                startIcon={<CloudUploadIcon />}
                onClick={handleUpload}
                disabled={!uploadFile || uploadLoading}
                fullWidth
              >
                {uploadLoading ? <CircularProgress size={24} /> : 'Upload COI'}
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* Right Panel - Insurance Form */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Insurance Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}
            
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Insurance Agency"
                name="agency"
                value={insuranceData.agency}
                onChange={handleInputChange}
                margin="normal"
                variant="outlined"
              />
              
              <TextField
                fullWidth
                label="Policy Number"
                name="policyNumber"
                value={insuranceData.policyNumber}
                onChange={handleInputChange}
                margin="normal"
                variant="outlined"
              />
              
              <TextField
                fullWidth
                label="Policy Expiration Date"
                name="policyExpiration"
                type="date"
                value={insuranceData.policyExpiration}
                onChange={handleInputChange}
                margin="normal"
                variant="outlined"
                InputLabelProps={{
                  shrink: true,
                }}
              />
              
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
                Agent Information
              </Typography>
              
              <TextField
                fullWidth
                label="Agent Name"
                name="agentName"
                value={insuranceData.agentName}
                onChange={handleInputChange}
                margin="normal"
                variant="outlined"
              />
              
              <TextField
                fullWidth
                label="Agent Phone"
                name="agentPhone"
                value={insuranceData.agentPhone}
                onChange={handleInputChange}
                margin="normal"
                variant="outlined"
              />
              
              <TextField
                fullWidth
                label="Agent Fax"
                name="agentFax"
                value={insuranceData.agentFax}
                onChange={handleInputChange}
                margin="normal"
                variant="outlined"
              />
              
              <TextField
                fullWidth
                label="Agent Email"
                name="agentEmail"
                value={insuranceData.agentEmail}
                onChange={handleInputChange}
                margin="normal"
                variant="outlined"
              />
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleRequestCOI}
                  disabled={loading}
                >
                  Request New COI
                </Button>
                
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Save Insurance Information'}
                </Button>
              </Box>
            </form>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default InsuranceTab;
