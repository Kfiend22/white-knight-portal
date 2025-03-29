import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Paper,
  Grid,
  Link,
  CircularProgress,
  Alert,
  Divider,
  IconButton
} from '@mui/material';
import { Document, Page, pdfjs } from 'react-pdf'; // Revert import
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

// Configuration moved to src/index.js

function W9Tab({ application, onUpdate }) {
  // Add state for delayed rendering
  const [isPdfViewerReady, setIsPdfViewerReady] = useState(false); 
  const [w9Data, setW9Data] = useState({
    nameOnW9: '',
    businessName: '',
    tin: '',
    taxClassification: '',
    federalTaxClassification: {
      individualSoleProprietor: false,
      cCorporation: false,
      sCorporation: false,
      partnership: false,
      trustEstate: false,
      llc: false,
      llcTaxClassification: '',
      other: false,
      otherDetails: ''
    },
    exemptPayeeCode: '',
    exemptFATCACode: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    accountNumbers: '',
    certification: false,
    signatureDate: null,
    dateSubmitted: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfError, setPdfError] = useState(false);
  const [scale, setScale] = useState(1.5); // Default scale at 150%

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

  // Initialize form with existing W9 data if available
  useEffect(() => {
    if (application && application.w9) {
      setW9Data({
        nameOnW9: application.w9.nameOnW9 || '',
        businessName: application.w9.businessName || '',
        tin: application.w9.tin || '',
        taxClassification: application.w9.taxClassification || '',
        federalTaxClassification: {
          individualSoleProprietor: application.w9.federalTaxClassification?.individualSoleProprietor || false,
          cCorporation: application.w9.federalTaxClassification?.cCorporation || false,
          sCorporation: application.w9.federalTaxClassification?.sCorporation || false,
          partnership: application.w9.federalTaxClassification?.partnership || false,
          trustEstate: application.w9.federalTaxClassification?.trustEstate || false,
          llc: application.w9.federalTaxClassification?.llc || false,
          llcTaxClassification: application.w9.federalTaxClassification?.llcTaxClassification || '',
          other: application.w9.federalTaxClassification?.other || false,
          otherDetails: application.w9.federalTaxClassification?.otherDetails || ''
        },
        exemptPayeeCode: application.w9.exemptPayeeCode || '',
        exemptFATCACode: application.w9.exemptFATCACode || '',
        address: application.w9.address || '',
        city: application.w9.city || '',
        state: application.w9.state || '',
        zipCode: application.w9.zipCode || '',
        accountNumbers: application.w9.accountNumbers || '',
        certification: application.w9.certification || false,
        signatureDate: application.w9.signatureDate || null,
        dateSubmitted: application.w9.dateSubmitted || null
      });
    }
  }, [application]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setW9Data({
      ...w9Data,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/v1/applications/${application._id}/w9`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify({
          ...w9Data,
          dateSubmitted: new Date()
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update W9 information: ${response.statusText}`);
      }

      const updatedApplication = await response.json();
      setSuccess('W9 information updated successfully');
      
      // Call the onUpdate callback to refresh the parent component
      if (onUpdate) {
        onUpdate(updatedApplication);
      }
    } catch (err) {
      setError(err.message || 'Failed to update W9 information');
    } finally {
      setLoading(false);
    }
  };

  // Handle requesting a new W9
  const handleRequestW9 = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/v1/applications/${application._id}/request-w9`, {
        method: 'POST',
        headers: getAuthHeader()
      });

      if (!response.ok) {
        throw new Error(`Failed to request new W9: ${response.statusText}`);
      }

      setSuccess('W9 request sent successfully');
    } catch (err) {
      setError(err.message || 'Failed to request new W9');
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
                W9 Document
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
              application && application.w9Path ? (
                pdfError ? (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography color="error">
                    Error loading W9 document. The file may be missing or inaccessible.
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    sx={{ mt: 2 }}
                    onClick={handleRequestW9}
                  >
                    Request New W9
                  </Button>
                </Box>
              ) : (
                <Box sx={{ flexGrow: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Document
                    file={getDocumentUrl(application.w9Path)}
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
                      href={getDocumentUrl(application.w9Path)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      Download W9
                    </Link>
                  </Box>
                </Box> // End: PDF viewer Box
              ) // End: pdfError check
            ) : ( // Else: No application.w9Path
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography>
                  No W9 document has been uploaded yet.
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  sx={{ mt: 2 }}
                  onClick={handleRequestW9}
                >
                  Request W9
                </Button>
              </Box> // End: No W9 message Box
            ) // End: application.w9Path check
          ) : ( // Else: Viewer not ready
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
              <CircularProgress />
            </Box> // End: Loading spinner Box
          )} // End: Viewer ready check
          </Paper>
        </Grid>
        
        {/* Right Panel - W9 Form */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              W9 Information
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
              {/* Part 1: Name and TIN */}
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, fontWeight: 'bold' }}>
                Part I: Identification
              </Typography>
              
              <TextField
                fullWidth
                label="Name (as shown on your income tax return)"
                name="nameOnW9"
                value={w9Data.nameOnW9}
                onChange={handleInputChange}
                margin="normal"
                variant="outlined"
              />
              
              <TextField
                fullWidth
                label="Business Name / Disregarded Entity Name"
                name="businessName"
                value={w9Data.businessName}
                onChange={handleInputChange}
                margin="normal"
                variant="outlined"
                helperText="If different from above"
              />
              
              {/* Federal Tax Classification */}
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Federal Tax Classification:
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={w9Data.federalTaxClassification.individualSoleProprietor}
                        onChange={(e) => {
                          const { checked } = e.target;
                          setW9Data({
                            ...w9Data,
                            federalTaxClassification: {
                              ...w9Data.federalTaxClassification,
                              individualSoleProprietor: checked
                            }
                          });
                        }}
                      />
                    }
                    label="Individual/sole proprietor or single-member LLC"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={w9Data.federalTaxClassification.cCorporation}
                        onChange={(e) => {
                          const { checked } = e.target;
                          setW9Data({
                            ...w9Data,
                            federalTaxClassification: {
                              ...w9Data.federalTaxClassification,
                              cCorporation: checked
                            }
                          });
                        }}
                      />
                    }
                    label="C Corporation"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={w9Data.federalTaxClassification.sCorporation}
                        onChange={(e) => {
                          const { checked } = e.target;
                          setW9Data({
                            ...w9Data,
                            federalTaxClassification: {
                              ...w9Data.federalTaxClassification,
                              sCorporation: checked
                            }
                          });
                        }}
                      />
                    }
                    label="S Corporation"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={w9Data.federalTaxClassification.partnership}
                        onChange={(e) => {
                          const { checked } = e.target;
                          setW9Data({
                            ...w9Data,
                            federalTaxClassification: {
                              ...w9Data.federalTaxClassification,
                              partnership: checked
                            }
                          });
                        }}
                      />
                    }
                    label="Partnership"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={w9Data.federalTaxClassification.trustEstate}
                        onChange={(e) => {
                          const { checked } = e.target;
                          setW9Data({
                            ...w9Data,
                            federalTaxClassification: {
                              ...w9Data.federalTaxClassification,
                              trustEstate: checked
                            }
                          });
                        }}
                      />
                    }
                    label="Trust/estate"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={w9Data.federalTaxClassification.llc}
                          onChange={(e) => {
                            const { checked } = e.target;
                            setW9Data({
                              ...w9Data,
                              federalTaxClassification: {
                                ...w9Data.federalTaxClassification,
                                llc: checked
                              }
                            });
                          }}
                        />
                      }
                      label="Limited liability company"
                    />
                    
                    {w9Data.federalTaxClassification.llc && (
                      <TextField
                        label="Tax classification (C, S, P)"
                        name="llcTaxClassification"
                        value={w9Data.federalTaxClassification.llcTaxClassification}
                        onChange={(e) => {
                          const { value } = e.target;
                          setW9Data({
                            ...w9Data,
                            federalTaxClassification: {
                              ...w9Data.federalTaxClassification,
                              llcTaxClassification: value
                            }
                          });
                        }}
                        size="small"
                        sx={{ ml: 2, width: '100px' }}
                      />
                    )}
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={w9Data.federalTaxClassification.other}
                          onChange={(e) => {
                            const { checked } = e.target;
                            setW9Data({
                              ...w9Data,
                              federalTaxClassification: {
                                ...w9Data.federalTaxClassification,
                                other: checked
                              }
                            });
                          }}
                        />
                      }
                      label="Other"
                    />
                    
                    {w9Data.federalTaxClassification.other && (
                      <TextField
                        label="Specify"
                        name="otherDetails"
                        value={w9Data.federalTaxClassification.otherDetails}
                        onChange={(e) => {
                          const { value } = e.target;
                          setW9Data({
                            ...w9Data,
                            federalTaxClassification: {
                              ...w9Data.federalTaxClassification,
                              otherDetails: value
                            }
                          });
                        }}
                        size="small"
                        sx={{ ml: 2, width: '200px' }}
                      />
                    )}
                  </Box>
                </Grid>
              </Grid>
              
              {/* Exemption codes */}
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Exempt payee code (if any)"
                    name="exemptPayeeCode"
                    value={w9Data.exemptPayeeCode}
                    onChange={handleInputChange}
                    margin="normal"
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Exemption from FATCA reporting code (if any)"
                    name="exemptFATCACode"
                    value={w9Data.exemptFATCACode}
                    onChange={handleInputChange}
                    margin="normal"
                    variant="outlined"
                    size="small"
                  />
                </Grid>
              </Grid>
              
              {/* Address */}
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Address:
              </Typography>
              
              <TextField
                fullWidth
                label="Street Address (number, street, apt or suite no.)"
                name="address"
                value={w9Data.address}
                onChange={handleInputChange}
                margin="normal"
                variant="outlined"
              />
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="City"
                    name="city"
                    value={w9Data.city}
                    onChange={handleInputChange}
                    margin="normal"
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    label="State"
                    name="state"
                    value={w9Data.state}
                    onChange={handleInputChange}
                    margin="normal"
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    label="ZIP Code"
                    name="zipCode"
                    value={w9Data.zipCode}
                    onChange={handleInputChange}
                    margin="normal"
                    variant="outlined"
                  />
                </Grid>
              </Grid>
              
              <TextField
                fullWidth
                label="List account number(s) here (optional)"
                name="accountNumbers"
                value={w9Data.accountNumbers}
                onChange={handleInputChange}
                margin="normal"
                variant="outlined"
              />
              
              {/* Part II: TIN */}
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, fontWeight: 'bold' }}>
                Part II: Taxpayer Identification Number (TIN)
              </Typography>
              
              <TextField
                fullWidth
                label="Social Security Number or Employer Identification Number"
                name="tin"
                value={w9Data.tin}
                onChange={handleInputChange}
                margin="normal"
                variant="outlined"
                helperText="Enter your TIN which matches the name given on line 1"
              />
              
              {/* Part III: Certification */}
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, fontWeight: 'bold' }}>
                Part III: Certification
              </Typography>
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={w9Data.certification}
                    onChange={handleInputChange}
                    name="certification"
                  />
                }
                label="Under penalties of perjury, I certify that the information provided is accurate and complete"
                sx={{ mt: 1, display: 'block' }}
              />
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleRequestW9}
                  disabled={loading}
                >
                  Request New W9
                </Button>
                
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Save W9 Information'}
                </Button>
              </Box>
            </form>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default W9Tab;
