// App.js
import React, { useEffect, useState } from 'react';
import {
  Box,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Collapse,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Tooltip,
  Link,
  Stack
} from '@mui/material';
import {
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { Resizable } from 're-resizable';


function Apps({ step, searchQuery, advancedSearchCriteria, setIsLoading, setError }) {
  const [applications, setApplications] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    applicationId: null,
    action: null,
  });
  const [editingFields, setEditingFields] = useState({});
  const [vendorIds, setVendorIds] = useState({});

  // Helper function to get auth headers
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };
  
  const fetchApplications = async () => {
    // Notify parent component that loading has started
    if (setIsLoading) setIsLoading(true);
    if (setError) setError(null);
    
    try {
      let url = `/api/v1/applications?step=${step}`;
      
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
  
      // Add advanced search parameters to the URL
      if (advancedSearchCriteria && Object.keys(advancedSearchCriteria).length > 0) {
        // Convert the advancedSearchCriteria object into query parameters
        const params = new URLSearchParams();
  
        const addParams = (obj, prefix = '') => {
          Object.entries(obj).forEach(([key, value]) => {
            if (typeof value === 'object' && value !== null) {
              addParams(value, prefix ? `${prefix}.${key}` : key);
            } else if (
              value !== '' &&
              value !== false &&
              value !== null &&
              value !== undefined
            ) {
              params.append(prefix ? `${prefix}.${key}` : key, value);
            }
          });
        };
  
        addParams(advancedSearchCriteria);
        url += `&${params.toString()}`;
      }
      
      console.log('Fetching applications from URL:', url);
      console.log('Using auth headers:', getAuthHeader());
  
      const response = await fetch(url, {
        headers: getAuthHeader()
      });
      
      console.log('Applications API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch applications: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Applications data received:', data);
      
      setApplications(data.applications || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      if (setError) setError(error.message || 'Failed to load applications');
    } finally {
      // Notify parent component that loading has finished
      if (setIsLoading) setIsLoading(false);
    }
  };  

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, searchQuery, advancedSearchCriteria]);

  const handleExpandClick = (applicationId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [applicationId]: !prev[applicationId],
    }));
  };

  const handleActionClick = (applicationId, action) => {
    setConfirmDialog({
      open: true,
      applicationId,
      action,
    });
  };

  const handleConfirmClose = () => {
    setConfirmDialog({
      open: false,
      applicationId: null,
      action: null,
    });
  };

  const createUserFromApplication = (application) => {
    // Log the application data for debugging
    console.log('Creating user from application:', application);
  
    const newUser = {
      vendorId: application.vendorId,
      email: application.email,
      companyName: application.companyName || '',
      ownerFirstName: application.ownerFirstName,
      ownerLastName: application.ownerLastName,
      facilityCountry: application.facilityCountry,
      facilityAddress1: application.facilityAddress1,    // Adjusted field name
      facilityAddress2: application.facilityAddress2 || '', // Include if available
      facilityCity: application.facilityCity,
      facilityState: application.facilityState,
      facilityZip: application.facilityZip,
      territories: {                                     // Adjusted to match schema
        zipCodes: application.territories?.zipCodes || ''
      },
      superAdmin: 1,
      username: application.vendorId,                    // Set username as vendorId
      password: `${application.vendorId}123`             // Set default password
    };
  
    // Log the data being sent
    console.log('Data being sent to create user:', newUser);
  
    fetch('/api/v1/users', {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(newUser),
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(err => Promise.reject(err));
        }
        return response.json();
      })
      .then(data => {
        console.log('User created successfully:', data);
        fetchApplications();
      })
      .catch(error => {
        console.error('Error creating user:', error);
      });
  };

    const handleConfirmAction = () => {
    console.log('Starting handleConfirmAction');
    const { applicationId, action } = confirmDialog;
    console.log('Action:', action, 'ApplicationId:', applicationId);
  
    let newStep = null;

    if (action === 'delete') {
      fetch(`/api/v1/applications/${applicationId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      })
        .then(response => {
          if (!response.ok) throw new Error('Failed to delete');
          fetchApplications(); // Refresh the list
          handleConfirmClose();
        })
        .catch(error => {
          console.error('Error deleting application:', error);
          handleConfirmClose();
        });
      return;
  }

  if (action === 'approve') {
    const application = applications.find(app => app._id === applicationId);
    const currentStep = application ? application.step : 0;
    
    if (currentStep === 0) {
      newStep = 1;
      // Enhanced fetch call with error handling
      fetch('/api/v1/email/welcome', {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({
          email: application.email,
          vendorId: application.vendorId,
          username: application.vendorId,
          portalUrl: 'https://portal.whiteknightmotorclub.com'
        })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Welcome email sent successfully:', data);
      })
      .catch(error => {
        console.log('Email sending failed:', error);
        // Continue with the application process even if email fails
      });
    }
    else if (currentStep === 1) newStep = 2;
    else if (currentStep === 2) newStep = 4;
  }
  
    if (newStep !== null) {
      const application = applications.find(app => app._id === applicationId);
      const updatedApplication = {
        ...application,
        ...(editingFields[applicationId] || {}),
        step: newStep
      };
      
      console.log('Sending updated application:', updatedApplication);
  
      fetch(`/api/v1/applications/${applicationId}`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify(updatedApplication),
      })
        .then(response => response.json())
        .then(data => {
          console.log('Application update response:', data);
          if (newStep === 1 && updatedApplication.vendorId) {
            console.log('Creating user for vendorId:', updatedApplication.vendorId);
            createUserFromApplication(updatedApplication);
          }
          fetchApplications();
          handleConfirmClose();
        })
        .catch(error => {
          console.error('Error in update:', error);
          handleConfirmClose();
        });
    } else {
      handleConfirmClose();
    }
  };  

  // Function to format label names
  const formatLabelName = (key) => {
    const labelMap = {
      services: 'Services',
      territories: 'Covered Zips',
      insurance: 'Insurance Coverage',
      ownership: 'Ownership',
      vendorId: 'Vendor ID',
      businessInfo: 'Business Info',
      ownerFirstName: "Owner's First Name",
      ownerLastName: "Owner's Last Name",
      phoneNumber: 'Phone Number',
      facilityCountry: 'Facility Country',
      facilityAddress1: 'Facility Address1',
      facilityAddress2: 'Facility Address2',
      facilityCity: 'Facility City',
      facilityState: 'Facility State',
      facilityZip: 'Facility Zip',
      billingSame: 'Billing Same',
      w9Address: 'W9 Address',
      backupWithholding: 'Backup Withholding',
      employees: 'Employees',
      createdAt: 'Created At',
      phoneCountryCode: 'Phone Country Code',
    };
    return (
      labelMap[key] ||
      key
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .replace(/^\w/, (c) => c.toUpperCase())
    );
  };

  // Function to handle field editing
  const handleFieldEdit = (applicationId, field, value) => {
    setEditingFields((prev) => ({
      ...prev,
      [applicationId]: {
        ...prev[applicationId],
        [field]: value,
      },
    }));
  };

  // Function to generate Vendor ID
  const generateVendorId = async (application) => {
    const stateAbbr = application.facilityState
      ? application.facilityState.substring(0, 2).toUpperCase()
      : 'XX';
  
    try {
      // Fetch existing vendorIds from the users collection
      const userResponse = await fetch('/api/v1/users/vendorIds', {
        headers: getAuthHeader()
      });
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user vendorIds');
      }
      const userData = await userResponse.json();
      const existingUserVendorIds = userData.vendorIds || [];
  
      // Fetch the maximum vendorId number from applications
      const appResponse = await fetch('/api/v1/applications/maxVendorId', {
        headers: getAuthHeader()
      });
      if (!appResponse.ok) {
        throw new Error('Failed to fetch max vendorId from applications');
      }
      const appData = await appResponse.json();
      const maxIdNumber = appData.maxIdNumber || 0;
  
      let newIdNumber = maxIdNumber;
  
      // Increment the ID number until we find an unused one
      let vendorId;
      do {
        newIdNumber += 1;
        const paddedIdNumber = String(newIdNumber).padStart(8, '0');
        vendorId = `${stateAbbr}${paddedIdNumber}`;
      } while (existingUserVendorIds.includes(vendorId));
  
      // Update vendorIds state
      setVendorIds((prev) => ({
        ...prev,
        [application._id]: vendorId,
      }));
  
      // Update editing fields
      handleFieldEdit(application._id, 'vendorId', vendorId);
    } catch (error) {
      console.error('Error generating Vendor ID:', error);
    }
  };

  function DocumentViewer({ application }) {
    const [documentErrors, setDocumentErrors] = useState({});
    
    // Function to handle document load errors
    const handleDocumentError = (docType) => {
      setDocumentErrors(prev => ({
        ...prev,
        [docType]: true
      }));
    };
    
    // Function to create the full document URL
    const getDocumentUrl = (path) => {
      // Make sure the URL starts with a slash
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? '' 
        : 'http://localhost:5000';
      return `${baseUrl}/uploads/applications/${path}`;
    };
    
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6">Documents</Typography>
        
        {application.w9Path && (
          <Box display="flex" alignItems="center" mb={1}>
            <Typography variant="subtitle2" sx={{ mr: 2 }}>W9 Form:</Typography>
            {documentErrors.w9 ? (
              <Typography color="error">
                Error loading document. File may be missing or inaccessible.
              </Typography>
            ) : (
              <Link 
                href={getDocumentUrl(application.w9Path)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => console.log('Opening W9 document:', getDocumentUrl(application.w9Path))}
                onError={() => handleDocumentError('w9')}
              >
                View Document
              </Link>
            )}
          </Box>
        )}
  
        {application.backgroundCheckPath && (
          <Box display="flex" alignItems="center" mb={1}>
            <Typography variant="subtitle2" sx={{ mr: 2 }}>Background Check:</Typography>
            {documentErrors.backgroundCheck ? (
              <Typography color="error">
                Error loading document. File may be missing or inaccessible.
              </Typography>
            ) : (
              <Link 
                href={getDocumentUrl(application.backgroundCheckPath)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => console.log('Opening Background Check document:', getDocumentUrl(application.backgroundCheckPath))}
                onError={() => handleDocumentError('backgroundCheck')}
              >
                View Document
              </Link>
            )}
          </Box>
        )}
  
        {application.insurance?.coiPath && (
          <Box display="flex" alignItems="center" mb={1}>
            <Typography variant="subtitle2" sx={{ mr: 2 }}>Certificate of Insurance:</Typography>
            {documentErrors.coi ? (
              <Typography color="error">
                Error loading document. File may be missing or inaccessible.
              </Typography>
            ) : (
              <Link 
                href={getDocumentUrl(application.insurance.coiPath)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => console.log('Opening COI document:', getDocumentUrl(application.insurance.coiPath))}
                onError={() => handleDocumentError('coi')}
              >
                View Document
              </Link>
            )}
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box mt={2}>
      {applications.length > 0 ? (
        <Table style={{ tableLayout: 'fixed', width: '100%' }}>
          <TableHead>
            <TableRow>
              <TableCell style={{ width: '40px', border: '1px solid #ccc' }} />
              {[
                'Company Name',
                "Owner's First Name",
                "Owner's Last Name",
                'Phone',
                'Country',
                'Address',
                'City',
                'State',
                'Zip',
              ].map((header, index) => (
                <TableCell
                  key={index}
                  style={{
                    overflow: 'hidden',
                    border: '1px solid #ccc',
                    padding: 0,
                  }}
                >
                  <Resizable
                    enable={{
                      right: true,
                    }}
                    style={{
                      display: 'inline-block',
                      width: '100%',
                      borderRight: '1px solid #ccc',
                      boxSizing: 'border-box',
                    }}
                    handleStyles={{
                      right: {
                        width: '5px',
                        background: 'transparent',
                        cursor: 'col-resize',
                      },
                    }}
                    handleComponent={{
                      right: (
                        <div
                          style={{
                            width: '5px',
                            cursor: 'col-resize',
                            borderRight: '2px solid #000',
                          }}
                        />
                      ),
                    }}
                  >
                    <div
                      style={{
                        padding: '0 8px',
                        borderLeft: '1px solid #ccc',
                      }}
                    >
                      {header}
                    </div>
                  </Resizable>
                </TableCell>
              ))}
              <TableCell
                style={{ width: '120px', border: '1px solid #ccc' }}
                align="right"
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {applications.map((application) => (
              <React.Fragment key={application._id}>
                <TableRow>
                  <TableCell style={{ width: '40px', border: '1px solid #ccc' }}>
                    <IconButton
                      onClick={() => handleExpandClick(application._id)}
                      aria-label="expand row"
                      size="small"
                    >
                      {expandedRows[application._id] ? (
                        <KeyboardArrowUpIcon />
                      ) : (
                        <KeyboardArrowDownIcon />
                      )}
                    </IconButton>
                  </TableCell>
                  {[
                    application.companyName || 'N/A',
                    application.ownerFirstName,
                    application.ownerLastName,
                    application.phoneNumber,
                    application.facilityCountry,
                    application.facilityAddress1,
                    application.facilityCity,
                    application.facilityState,
                    application.facilityZip,
                  ].map((cellData, idx) => (
                    <TableCell
                      key={idx}
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        border: '1px solid #ccc',
                      }}
                    >
                      {cellData}
                    </TableCell>
                  ))}
                  <TableCell
                    style={{ width: '120px', border: '1px solid #ccc' }}
                    align="right"
                  >
                    {application.step !== 3 && application.step !== 4 && (
                      <>
                        <IconButton
                          aria-label="approve"
                          onClick={() =>
                            handleActionClick(application._id, 'approve')
                          }
                        >
                          <CheckIcon />
                        </IconButton>
                        <IconButton
                          aria-label="deny"
                          onClick={() =>
                            handleActionClick(application._id, 'deny')
                          }
                        >
                          <CloseIcon />
                        </IconButton>
                      </>
                    )}
                    <IconButton
                      aria-label="delete"
                      onClick={() => handleActionClick(application._id, 'delete')}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
                {/* Expanded Row */}
                <TableRow>
                  <TableCell
                    style={{
                      paddingBottom: 0,
                      paddingTop: 0,
                      border: 'none',
                    }}
                    colSpan={11}
                  >
                    <Collapse
                      in={expandedRows[application._id]}
                      timeout="auto"
                      unmountOnExit
                    >
                      <Box margin={1}>
                        {/* Vendor ID Section */}
                        <Box display="flex" alignItems="center" mb={2}>
                          <Typography
                            variant="body1"
                            style={{
                              fontWeight: 'bold',
                              marginRight: '8px',
                            }}
                          >
                            Vendor ID:
                          </Typography>
                          {application.step === 0 ? (
                            <>
                              <TextField
                                variant="outlined"
                                size="small"
                                value={
                                  editingFields[application._id]?.vendorId ||
                                  vendorIds[application._id] ||
                                  ''
                                }
                                disabled
                                style={{ marginRight: '8px' }}
                              />
                              <Tooltip title="Generate Vendor ID">
                                <IconButton
                                  size="small"
                                  onClick={() => generateVendorId(application)}
                                >
                                  <RefreshIcon />
                                </IconButton>
                              </Tooltip>
                            </>
                          ) : (
                            <Typography variant="body1">
                              {application.vendorId ||
                                editingFields[application._id]?.vendorId ||
                                'N/A'}
                            </Typography>
                          )}
                        </Box>
  
                        {/* Two Column Layout */}
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          {/* Left Column - Map */}
                          <Box sx={{ flex: 1 }}>
                            <Paper
                              style={{
                                height: '200px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Typography variant="subtitle1">
                                Map Placeholder
                              </Typography>
                            </Paper>
                          </Box>
  
                          {/* Right Column - Application Data */}
                          <Box sx={{ flex: 1 }}>
                            <Stack spacing={2}>
                              <ServicesField
                                application={application}
                                editingFields={editingFields}
                                handleFieldEdit={handleFieldEdit}
                              />
                              <CoveredZipsField
                                application={application}
                                editingFields={editingFields}
                                handleFieldEdit={handleFieldEdit}
                              />
                              <InsuranceCoverageField
                                application={application}
                                editingFields={editingFields}
                                handleFieldEdit={handleFieldEdit}
                              />
                              <BusinessInfoField
                                application={application}
                                editingFields={editingFields}
                                handleFieldEdit={handleFieldEdit}
                              />
                              <OwnershipField
                                application={application}
                                editingFields={editingFields}
                                handleFieldEdit={handleFieldEdit}
                              />
  
                              {/* Additional Fields */}
                              <Box>
                                {Object.entries(application).map(
                                  ([key, value]) => {
                                    // Exclude fields already displayed or not needed
                                    if (
                                      key === '_id' ||
                                      key === 'step' ||
                                      key === '__v' ||
                                      key === 'vendorId' ||
                                      key === 'services' ||
                                      key === 'coveredZips' ||
                                      key === 'insurance' ||
                                      key === 'businessInfo' ||
                                      key === 'ownership'
                                    ) {
                                      return null;
                                    }
  
                                    // Handle boolean values
                                    if (typeof value === 'boolean') {
                                      if (value) {
                                        // Display only the label
                                        return (
                                          <Typography key={key} variant="body2">
                                            {formatLabelName(key)}
                                          </Typography>
                                        );
                                      } else {
                                        // Do not display false values
                                        return null;
                                      }
                                    }
  
                                    // Handle object values
                                    if (
                                      typeof value === 'object' &&
                                      value !== null
                                    ) {
                                      return (
                                        <Box key={key}>
                                          <Typography
                                            variant="body2"
                                            color="textSecondary"
                                            fontWeight="bold"
                                          >
                                            {formatLabelName(key)}
                                          </Typography>
                                          {Object.entries(value).map(
                                            ([subKey, subValue]) => (
                                              <Box
                                                key={subKey}
                                                sx={{ display: 'flex', gap: 1 }}
                                              >
                                                <Typography
                                                  variant="body2"
                                                  color="textSecondary"
                                                  sx={{ flex: 1 }}
                                                >
                                                  {formatLabelName(subKey)}:
                                                </Typography>
                                                <Typography
                                                  variant="body2"
                                                  sx={{ flex: 1 }}
                                                >
                                                  {subValue}
                                                </Typography>
                                              </Box>
                                            )
                                          )}
                                        </Box>
                                      );
                                    }
  
                                    return (
                                      <Box
                                        key={key}
                                        sx={{ display: 'flex', gap: 1 }}
                                      >
                                        <Typography
                                          variant="body2"
                                          color="textSecondary"
                                          sx={{ flex: 1 }}
                                        >
                                          {formatLabelName(key)}:
                                        </Typography>
                                        <Typography
                                          variant="body2"
                                          sx={{ flex: 1 }}
                                        >
                                          {value}
                                        </Typography>
                                      </Box>
                                    );
                                  }
                                )}
                              </Box>
                            </Stack>
                          </Box>
                        </Box>
  
                        {/* Document Viewer */}
                        <Box mt={2}>
                          <DocumentViewer application={application} />
                        </Box>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      ) : (
        <Typography>No applications found in this section.</Typography>
      )}
      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={handleConfirmClose}>
        <DialogTitle>
          {confirmDialog.action === 'approve'
            ? 'Approve Application'
            : confirmDialog.action === 'deny'
            ? 'Deny Application'
            : 'Delete Application'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {confirmDialog.action === 'approve'
              ? 'Are you sure you want to move this application to the next step?'
              : confirmDialog.action === 'deny'
              ? 'Are you sure you want to deny this application?'
              : 'Are you sure you want to delete this application? This action cannot be undone.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmClose}>Cancel</Button>
          <Button onClick={handleConfirmAction} color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ServicesField Component
function ServicesField({ application, editingFields, handleFieldEdit }) {
  const servicesData =
    editingFields[application._id]?.services || application.services || {};
  const [isEditing, setIsEditing] = useState(false);

  const serviceOptions = {
    roadOnly: 'Road-Only Services',
    lightDuty: 'Light Duty Towing',
    mediumDuty: 'Medium Duty Towing',
    heavyDuty: 'Heavy Duty Towing',
    mobileMechanic: 'Mobile Mechanic Services',
    mediumHeavyTire: 'Medium & Heavy Duty Tire Services',
    accidentSceneTowing: 'Accident Scene Towing',
    secondaryTow: 'Secondary Towing',
    storageFacility: 'Storage Facility',
  };

  // Initialize services with correct boolean values
  const [services, setServices] = useState(() => {
    return Object.keys(serviceOptions).reduce((acc, key) => {
      const value = servicesData[key];
      acc[key] = value === true || value === 'true';
      return acc;
    }, {});
  });

  const handleServiceChange = (event) => {
    const { name, checked } = event.target;
    setServices((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleSave = () => {
    handleFieldEdit(application._id, 'services', services);
    setIsEditing(false);
  };

  const selectedServices = Object.keys(services).filter(
    (key) => services[key]
  );

  return (
    <>
      <Box display="flex" alignItems="center">
        <Typography variant="body2" style={{ fontWeight: 'bold' }}>
          Services
        </Typography>
        <IconButton size="small" onClick={handleEditToggle}>
          <EditIcon fontSize="small" />
        </IconButton>
      </Box>
      {isEditing ? (
        <>
          <FormGroup>
            {Object.entries(serviceOptions).map(([key, label]) => (
              <FormControlLabel
                key={key}
                control={
                  <Checkbox
                    checked={services[key]}
                    onChange={handleServiceChange}
                    name={key}
                  />
                }
                label={label}
              />
            ))}
          </FormGroup>
          <Button size="small" onClick={handleSave}>
            Save
          </Button>
        </>
      ) : (
        selectedServices.map((key) => (
          <Typography key={key} variant="body2">
            {serviceOptions[key]}
          </Typography>
        ))
      )}
    </>
  );
}

// OwnershipField Component
function OwnershipField({ application, editingFields, handleFieldEdit }) {
  const ownershipData =
    editingFields[application._id]?.ownership || application.ownership || {};

  const [isEditing, setIsEditing] = useState(false);
  const [ownership, setOwnership] = useState(ownershipData);

  const ownershipOptions = {
    familyOwned: 'Family Owned',
    womenOwned: 'Women Owned',
    minorityOwned: 'Minority Owned',
    veteranOwned: 'Veteran Owned',
    lgbtqOwned: 'LGBTQ Owned',
  };

  const handleOwnershipChange = (event) => {
    const { name, checked } = event.target;
    setOwnership((prev) => ({ ...prev, [name]: checked }));
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleSave = () => {
    handleFieldEdit(application._id, 'ownership', ownership);
    setIsEditing(false);
  };

  const selectedOwnership = Object.keys(ownership).filter(
    (key) => ownership[key]
  );

  return (
    <>
      <Box display="flex" alignItems="center">
        <Typography variant="body2" style={{ fontWeight: 'bold' }}>
          Ownership
        </Typography>
        <IconButton size="small" onClick={handleEditToggle}>
          <EditIcon fontSize="small" />
        </IconButton>
      </Box>
      {isEditing ? (
        <>
          <FormGroup>
            {Object.entries(ownershipOptions).map(([key, label]) => (
              <FormControlLabel
                key={key}
                control={
                  <Checkbox
                    checked={ownership[key] || false}
                    onChange={handleOwnershipChange}
                    name={key}
                  />
                }
                label={label}
              />
            ))}
          </FormGroup>
          <Button size="small" onClick={handleSave}>
            Save
          </Button>
        </>
      ) : (
        selectedOwnership.map((key) => (
          <Typography key={key} variant="body2">
            {ownershipOptions[key]}
          </Typography>
        ))
      )}
    </>
  );
}

// CoveredZipsField Component
function CoveredZipsField({ application, editingFields, handleFieldEdit }) {
  const coveredZipsData =
    editingFields[application._id]?.coveredZips?.zipCodes ||
    application.coveredZips?.zipCodes ||
    '';

  const [isEditing, setIsEditing] = useState(false);
  const [coveredZips, setCoveredZips] = useState(coveredZipsData);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleSave = () => {
    // Save the updated zipCodes inside the coveredZips object
    handleFieldEdit(application._id, 'coveredZips', { zipCodes: coveredZips });
    setIsEditing(false);
  };

  return (
    <>
      <Box display="flex" alignItems="center">
        <Typography variant="body2" style={{ fontWeight: 'bold' }}>
          Covered Zips
        </Typography>
        <IconButton size="small" onClick={handleEditToggle}>
          <EditIcon fontSize="small" />
        </IconButton>
      </Box>
      {isEditing ? (
        <>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            value={coveredZips}
            onChange={(e) => setCoveredZips(e.target.value)}
          />
          <Button size="small" onClick={handleSave}>
            Save
          </Button>
        </>
      ) : (
        <Typography variant="body2">{coveredZips}</Typography>
      )}
    </>
  );
}

// InsuranceCoverageField Component
function InsuranceCoverageField({
  application,
  editingFields,
  handleFieldEdit,
}) {
  const insuranceData =
    editingFields[application._id]?.insurance || application.insurance || {};

  const [isEditing, setIsEditing] = useState(false);
  const [insurance, setInsurance] = useState(insuranceData);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setInsurance((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleSave = () => {
    handleFieldEdit(application._id, 'insurance', insurance);
    setIsEditing(false);
  };

  return (
    <>
      <Box display="flex" alignItems="center">
        <Typography variant="body2" style={{ fontWeight: 'bold' }}>
          Insurance Coverage
        </Typography>
        <IconButton size="small" onClick={handleEditToggle}>
          <EditIcon fontSize="small" />
        </IconButton>
      </Box>
      {isEditing ? (
        <>
          <TextField
            label="Agency"
            name="agency"
            fullWidth
            variant="outlined"
            size="small"
            value={insurance.agency || ''}
            onChange={handleInputChange}
            style={{ marginBottom: '8px' }}
          />
          <TextField
            label="PO#"
            name="policyNumber"
            fullWidth
            variant="outlined"
            size="small"
            value={insurance.policyNumber || ''}
            onChange={handleInputChange}
            style={{ marginBottom: '8px' }}
          />
          <TextField
            label="Agent's Name"
            name="agentName"
            fullWidth
            variant="outlined"
            size="small"
            value={insurance.agentName || ''}
            onChange={handleInputChange}
            style={{ marginBottom: '8px' }}
          />
          <TextField
            label="Agent's Phone"
            name="agentPhone"
            fullWidth
            variant="outlined"
            size="small"
            value={insurance.agentPhone || ''}
            onChange={handleInputChange}
            style={{ marginBottom: '8px' }}
          />
          <TextField
            label="Agent's Fax"
            name="agentFax"
            fullWidth
            variant="outlined"
            size="small"
            value={insurance.agentFax || ''}
            onChange={handleInputChange}
            style={{ marginBottom: '8px' }}
          />
          <TextField
            label="Agent's Email"
            name="agentEmail"
            fullWidth
            variant="outlined"
            size="small"
            value={insurance.agentEmail || ''}
            onChange={handleInputChange}
            style={{ marginBottom: '8px' }}
          />
          <TextField
            label="Expiration Date"
            name="expirationDate"
            fullWidth
            variant="outlined"
            size="small"
            type="date"
            slotProps={{
              inputLabel: {
                shrink: true
              }
            }}
            value={insurance.expirationDate || ''}
            onChange={handleInputChange}
            style={{ marginBottom: '8px' }}
          />
          <Button size="small" onClick={handleSave}>
            Save
          </Button>
        </>
      ) : (
        <>
          <Typography variant="body2">
            Agency: {insurance.agency || 'N/A'}
          </Typography>
          <Typography variant="body2">
            PO#: {insurance.policyNumber || 'N/A'}
          </Typography>
          <Typography variant="body2">
            Agent's Name: {insurance.agentName || 'N/A'}
          </Typography>
          <Typography variant="body2">
            Agent's Phone: {insurance.agentPhone || 'N/A'}
          </Typography>
          <Typography variant="body2">
            Agent's Fax: {insurance.agentFax || 'N/A'}
          </Typography>
          <Typography variant="body2">
            Agent's Email: {insurance.agentEmail || 'N/A'}
          </Typography>
          <Typography variant="body2">
            Expiration Date: {insurance.expirationDate || 'N/A'}
          </Typography>
        </>
      )}
    </>
  );
}

// BusinessInfoField Component
function BusinessInfoField({ application, editingFields, handleFieldEdit }) {
  const businessInfoData =
    editingFields[application._id]?.businessInfo ||
    application.businessInfo ||
    {};

  const [isEditing, setIsEditing] = useState(false);
  const [businessInfo, setBusinessInfo] = useState(businessInfoData);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setBusinessInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    setBusinessInfo((prev) => ({ ...prev, [name]: checked }));
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleSave = () => {
    handleFieldEdit(application._id, 'businessInfo', businessInfo);
    setIsEditing(false);
  };

  return (
    <>
      <Box display="flex" alignItems="center">
        <Typography variant="body2" style={{ fontWeight: 'bold' }}>
          Business Info
        </Typography>
        <IconButton size="small" onClick={handleEditToggle}>
          <EditIcon fontSize="small" />
        </IconButton>
      </Box>
      {isEditing ? (
        <>
          <TextField
            label="Years In Business"
            name="yearsInBusiness"
            fullWidth
            variant="outlined"
            size="small"
            value={businessInfo.yearsInBusiness || ''}
            onChange={handleInputChange}
            style={{ marginBottom: '8px' }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={businessInfo.electricVehicleExperience || false}
                onChange={handleCheckboxChange}
                name="electricVehicleExperience"
              />
            }
            label="Electric Vehicle Experience"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={businessInfo.usesDigitalDispatch || false}
                onChange={handleCheckboxChange}
                name="usesDigitalDispatch"
              />
            }
            label="Uses Digital Dispatch"
          />
          {businessInfo.usesDigitalDispatch && (
            <>
              <TextField
                label="Software"
                name="software"
                fullWidth
                variant="outlined"
                size="small"
                slotProps={{
                   htmlInput: { maxLength: 16 }
                }}
                value={businessInfo.software || ''}
                onChange={handleInputChange}
                style={{ marginBottom: '8px' }}
              />
              <TextField
                label="Software ID or Email"
                name="softwareIdOrEmail"
                fullWidth
                variant="outlined"
                size="small"
                slotProps={{
                  htmlInput: { maxLength: 16 }
                }}
                value={businessInfo.softwareIdOrEmail || ''}
                onChange={handleInputChange}
                style={{ marginBottom: '8px' }}
              />
            </>
          )}
          <Button size="small" onClick={handleSave}>
            Save
          </Button>
        </>
      ) : (
        <>
          <Typography variant="body2">
            Years In Business: {businessInfo.yearsInBusiness || 'N/A'}
          </Typography>
          <Typography variant="body2">
            Electric Vehicle Experience:{' '}
            {businessInfo.electricVehicleExperience ? 'Yes' : 'No'}
          </Typography>
          <Typography variant="body2">
            Uses Digital Dispatch:{' '}
            {businessInfo.usesDigitalDispatch ? 'Yes' : 'No'}
          </Typography>
          {businessInfo.usesDigitalDispatch && (
            <>
              <Typography variant="body2">
                Software: {businessInfo.software || 'N/A'}
              </Typography>
              <Typography variant="body2">
                Software ID or Email: {businessInfo.softwareIdOrEmail || 'N/A'}
              </Typography>
            </>
          )}
        </>
      )}
    </>
  );
}

export default Apps;
