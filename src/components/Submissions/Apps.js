// App.js
import React, { useEffect, useState, useCallback } from 'react'; // Add useCallback
import {
  Box, Table, TableHead, TableBody, TableRow, TableCell, IconButton, Collapse, Typography, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Checkbox, FormControlLabel,
  FormGroup, Tooltip, Link, Stack, Tabs, Tab, Alert, Grid, MenuItem // Removed InputLabel, Select, FormHelperText
} from '@mui/material';
import {
  KeyboardArrowDown as KeyboardArrowDownIcon, KeyboardArrowUp as KeyboardArrowUpIcon, Check as CheckIcon,
  Close as CloseIcon, Delete as DeleteIcon, Refresh as RefreshIcon, Description as DescriptionIcon, // Removed EditIcon
  Business as BusinessIcon, AttachMoney as AttachMoneyIcon, Assignment as AssignmentIcon
} from '@mui/icons-material';
import W9Tab from './W9Tab';
import FacilitiesTab from './FacilitiesTab';
import RatesTab from './RatesTab';
import InsuranceTab from './InsuranceTab';
import BackgroundCheckTab from './BackgroundCheckTab'; // Import the new tab component
import { Resizable } from 're-resizable';
// Removed unused imports: ServicesField, CoveredZipsField, InsuranceCoverageField, BusinessInfoField, OwnershipField
import Step0Display from './Step0Display'; // Import the new component
import ScheduleInput from '../ScheduleInput'; // Import ScheduleInput
import { useLoading } from '../../context/LoadingContext'; // Correct the import path
import { deepMerge } from '../../utils/objectUtils'; // Import deepMerge from utility file
// Removed unused imports: correctScheduleHandler, generateScheduleInput (handled differently now)

// Helper to ensure boolean values (fixes the prop type error for Checkbox)
const ensureBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return Boolean(value);
};

// Remove setIsLoading from props as it's handled globally now
function Apps({ step, searchQuery, advancedSearchCriteria, setError }) {
  const [applications, setApplications] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});
  const [confirmDialog, setConfirmDialog] = useState({ open: false, applicationId: null, action: null });
  const [editingFields, setEditingFields] = useState({});
  const [vendorIds, setVendorIds] = useState({});
  const [activeTabs, setActiveTabs] = useState({}); // Track active tab for each application
  const [saveStatus, setSaveStatus] = useState({}); // Track save status for each application
  const { startLoading } = useLoading(); // Get startLoading

  // --- Deep Merge Utility removed, now imported ---

  // Define dispatch software options (same as in appformcomp.js)
  const dispatchSoftwareOptions = [
    'TRAXERO Dispatch Anywhere', 'Towbook', 'Bosch Towing Management', 'OctopusPro',
    'Roadside Protect Navigator', 'Agero Swoop', 'TowSoft', 'Omadi Core',
    'InTow Software', 'TOPS (Beacon)', 'VTS Cloud', 'Ranger SST', 'Other',
  ];

  // Define the list of boolean service keys based on the schema
  const serviceKeys = [
    'roadOnly', 'lightDuty', 'mediumDuty', 'heavyDuty', 'mobileMechanic',
    'mediumHeavyTire', 'accidentSceneTowing', 'secondaryTow', 'storageFacility'
  ];

  // Define all possible ownership keys based on the schema
  const ownershipKeys = [
    'familyOwned', 'womenOwned', 'minorityOwned', 'veteranOwned', 
    'lgbtqOwned', 'smallBusiness', 'disadvantagedBusiness'
  ];

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  };

  const fetchApplications = useCallback(async () => {
    const stopLoading = startLoading();
    if (setError) setError(null);
    try {
      let url = `/api/v1/applications?step=${step}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (advancedSearchCriteria && Object.keys(advancedSearchCriteria).length > 0) {
        const params = new URLSearchParams();
        const addParams = (obj, prefix = '') => {
          Object.entries(obj).forEach(([key, value]) => {
            if (typeof value === 'object' && value !== null) addParams(value, prefix ? `${prefix}.${key}` : key);
            else if (value !== '' && value !== false && value !== null && value !== undefined) params.append(prefix ? `${prefix}.${key}` : key, value);
          });
        };
        addParams(advancedSearchCriteria);
        url += `&${params.toString()}`;
      }
      const response = await fetch(url, { headers: getAuthHeader() });
      if (!response.ok) throw new Error(`Failed to fetch applications: ${response.statusText}`);
      const data = await response.json();
      setApplications(data.applications || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      if (setError) setError(error.message || 'Failed to load applications');
    } finally {
      stopLoading();
    }
  }, [startLoading, setError, step, searchQuery, advancedSearchCriteria]); // Added dependencies

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, searchQuery, advancedSearchCriteria, fetchApplications]); // Added fetchApplications

  // Updated handleSaveApplicationChanges
  const handleSaveApplicationChanges = async (applicationId) => {
    const stopLoading = startLoading();
    const application = applications.find(app => app._id === applicationId);
    if (!application) { stopLoading(); return; }
    const editsToApply = editingFields[applicationId] || {};
    let updatedApplication = deepMerge(application, editsToApply);

    // --- START: Add logic to process 'sameTimeSelectedDays' ---
    if (updatedApplication.services?.schedule?.sameTimeSelectedDays) {
      const schedule = updatedApplication.services.schedule;
      const openTime = schedule.selectedDaysOpen || '';
      const closeTime = schedule.selectedDaysClose || '';
      const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

      daysOfWeek.forEach(day => {
        if (schedule.days?.[day]?.isOpen) {
          // Only apply if the day is marked as open
          if (!schedule.days[day]) schedule.days[day] = {}; // Ensure day object exists
          schedule.days[day].open = openTime;
          schedule.days[day].close = closeTime;
        }
      });
      // Optional: Clear selectedDaysOpen/Close after applying, if desired
      // schedule.selectedDaysOpen = ''; 
      // schedule.selectedDaysClose = '';
    }
    // --- END: Add logic ---

    console.log('Data being sent to backend (after schedule processing):', JSON.stringify(updatedApplication, null, 2)); // Log final payload

    try {
      const response = await fetch(`/api/v1/applications/${applicationId}`, {
        method: 'PUT', headers: getAuthHeader(), body: JSON.stringify(updatedApplication),
      });
      if (!response.ok) {
        let errorDetails = response.statusText;
        try { const errorData = await response.json(); errorDetails = errorData.message || errorDetails; } catch (parseError) {}
        throw new Error(`Failed to update application: ${errorDetails}`);
      }
      await response.json(); // Process the response body but don't assign to unused 'data'
      setSaveStatus(prev => ({ ...prev, [applicationId]: { success: 'Application changes saved successfully', error: null } }));
      await fetchApplications();
      setEditingFields((prev) => {
        const newState = { ...prev };
        delete newState[applicationId];
        return newState;
      });
    } catch (error) {
      console.error('Error updating application:', error);
      setSaveStatus(prev => ({ ...prev, [applicationId]: { success: null, error: error.message || 'Failed to save application changes' } }));
    } finally {
      stopLoading();
    }
  };

  const clearSaveStatus = (applicationId) => {
    setSaveStatus(prev => ({ ...prev, [applicationId]: null }));
  };

  const handleExpandClick = (applicationId) => {
    setExpandedRows((prev) => ({ ...prev, [applicationId]: !prev[applicationId] }));
    if (!activeTabs[applicationId]) setActiveTabs((prev) => ({ ...prev, [applicationId]: 0 }));
  };

  const handleTabChange = (applicationId, newValue) => {
    setActiveTabs((prev) => ({ ...prev, [applicationId]: newValue }));
  };

  const handleActionClick = (applicationId, action) => {
    setConfirmDialog({ open: true, applicationId, action });
  };

  const handleConfirmClose = () => {
    setConfirmDialog({ open: false, applicationId: null, action: null });
  };

  const createUserFromApplication = (application) => {
    console.log('Creating user from application:', application);
    const newUser = {
      vendorId: application.vendorId, email: application.email, companyName: application.companyName || '',
      ownerFirstName: application.ownerFirstName, ownerLastName: application.ownerLastName,
      facilityCountry: application.facilityCountry, facilityAddress1: application.facilityAddress1,
      facilityAddress2: application.facilityAddress2 || '', facilityCity: application.facilityCity,
      facilityState: application.facilityState, facilityZip: application.facilityZip,
      territories: { zipCodes: application.territories?.zipCodes || '' }, superAdmin: 1,
      username: application.vendorId, password: `${application.vendorId}123`
    };
    fetch('/api/v1/users', { method: 'POST', headers: getAuthHeader(), body: JSON.stringify(newUser) })
      .then(response => { if (!response.ok) return response.json().then(err => Promise.reject(err)); return response.json(); })
      .then(data => { console.log('User created successfully:', data); fetchApplications(); })
      .catch(error => { console.error('Error creating user:', error); });
  };

  const handleConfirmAction = async () => {
    const { applicationId, action } = confirmDialog;
    let newStep = null;
    const stopLoading = startLoading();
    try {
      if (action === 'delete') {
        const response = await fetch(`/api/v1/applications/${applicationId}`, { method: 'DELETE', headers: getAuthHeader() });
        if (!response.ok) throw new Error('Failed to delete');
        await fetchApplications(); handleConfirmClose(); stopLoading(); return;
      }
      const application = applications.find(app => app._id === applicationId);
      const currentStep = application ? application.step : -1;
      if (action === 'approve') {
        if (currentStep === 0) {
          newStep = 1;
          fetch('/api/v1/email/welcome', { method: 'POST', headers: getAuthHeader(), body: JSON.stringify({ email: application.email, vendorId: application.vendorId, username: application.vendorId, portalUrl: 'https://portal.whiteknightmotorclub.com' }) })
            .catch(error => console.log('Welcome email sending failed:', error));
        } else if (currentStep === 1) newStep = 2;
        else if (currentStep === 2) newStep = 4;
      } else if (action === 'deny') { newStep = 3; }

      if (newStep !== null && application) {
        const updatedApplication = { ...application, ...(editingFields[applicationId] || {}), step: newStep };
        const response = await fetch(`/api/v1/applications/${applicationId}`, { method: 'PUT', headers: getAuthHeader(), body: JSON.stringify(updatedApplication) });
        const data = await response.json();
        if (!response.ok) { throw new Error(data.message || 'Failed to update application step'); }
        if (newStep === 1 && updatedApplication.vendorId) { createUserFromApplication(updatedApplication); }
        await fetchApplications(); handleConfirmClose();
      } else { handleConfirmClose(); }
    } catch (error) {
      console.error('Error in confirm action:', error);
      if (setError) setError(error.message || 'Action failed');
      handleConfirmClose();
    } finally { stopLoading(); }
  };

  const formatLabelName = (key) => {
    const labelMap = {
      services: 'Services', territories: 'Covered Zips', insurance: 'Insurance Coverage', ownership: 'Ownership',
      vendorId: 'Vendor ID', businessInfo: 'Business Info', ownerFirstName: "Owner's First Name", ownerLastName: "Owner's Last Name",
      phoneNumber: 'Phone Number', facilityCountry: 'Facility Country', facilityAddress1: 'Facility Address1',
      facilityAddress2: 'Facility Address2', facilityCity: 'Facility City', facilityState: 'Facility State',
      facilityZip: 'Facility Zip', billingSame: 'Billing Same', w9Address: 'W9 Address', backupWithholding: 'Backup Withholding',
      employees: 'Employees', createdAt: 'Created At', phoneCountryCode: 'Phone Country Code', roadOnly: 'Road-Only Services',
      lightDuty: 'Light Duty Towing', mediumDuty: 'Medium Duty Towing', heavyDuty: 'Heavy Duty Towing', mobileMechanic: 'Mobile Mechanic',
      mediumHeavyTire: 'Medium/Heavy Tire', accidentSceneTowing: 'Accident Scene Towing', secondaryTow: 'Secondary Tow',
      storageFacility: 'Storage Facility', familyOwned: 'Family-Owned', womenOwned: 'Women-Owned', minorityOwned: 'Minority-Owned',
      veteranOwned: 'Veteran-Owned', lgbtqOwned: 'LGBTQ+-Owned', smallBusiness: 'Small Business', disadvantagedBusiness: 'Disadvantaged Business',
    };
    return labelMap[key] || key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
  };

  const handleFieldEdit = (applicationId, fieldPath, value) => {
    setEditingFields((prev) => {
      let fieldUpdate = {}; const keys = fieldPath.split('.'); let currentLevel = fieldUpdate;
      for (let i = 0; i < keys.length - 1; i++) { currentLevel[keys[i]] = {}; currentLevel = currentLevel[keys[i]]; }
      currentLevel[keys[keys.length - 1]] = value;
      const prevAppFields = prev[applicationId] || {};
      const updatedAppFields = deepMerge(prevAppFields, fieldUpdate);
      const newState = { ...prev, [applicationId]: updatedAppFields };
      return newState;
    });
  };

  const generateVendorId = async (application) => {
    const stateAbbr = application.facilityState ? application.facilityState.substring(0, 2).toUpperCase() : 'XX';
    try {
      const userResponse = await fetch('/api/v1/users/vendorIds', { headers: getAuthHeader() });
      if (!userResponse.ok) throw new Error('Failed to fetch user vendorIds');
      const userData = await userResponse.json(); const existingUserVendorIds = userData.vendorIds || [];
      const appResponse = await fetch('/api/v1/applications/maxVendorId', { headers: getAuthHeader() });
      if (!appResponse.ok) throw new Error('Failed to fetch max vendorId from applications');
      const appData = await appResponse.json(); let newIdNumber = appData.maxIdNumber || 0;
      let vendorId;
      do { newIdNumber += 1; vendorId = `${stateAbbr}${String(newIdNumber).padStart(8, '0')}`; } while (existingUserVendorIds.includes(vendorId));
      setVendorIds((prev) => ({ ...prev, [application._id]: vendorId }));
      handleFieldEdit(application._id, 'vendorId', vendorId);
    } catch (error) { console.error('Error generating Vendor ID:', error); }
  };

  // Updated DocumentViewer to include Background Check link
  function DocumentViewer({ application }) {
    const [documentErrors, setDocumentErrors] = useState({});
    const handleDocumentError = (docType) => setDocumentErrors(prev => ({ ...prev, [docType]: true }));
    const getDocumentUrl = (filename) => {
      if (!filename) return '#';
      const baseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';
      const finalFilename = filename.includes('/') ? filename.split('/').pop() : filename;
      // Assuming all docs are in the same folder for now
      return `${baseUrl}/uploads/applications/${finalFilename}`; 
    };
    return (
      <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #eee' }}>
        <Typography variant="h6" gutterBottom>Documents</Typography>
        {application.w9Path && (<Box display="flex" alignItems="center" mb={1}><Typography variant="subtitle2" sx={{ mr: 2, minWidth: '150px' }}>W9 Form:</Typography>{documentErrors.w9 ? <Typography color="error">Error loading.</Typography> : (<Link href={getDocumentUrl(application.w9Path)} target="_blank" rel="noopener noreferrer" onError={() => handleDocumentError('w9')}>View Document</Link>)}</Box>)}
        {/* Check the new nested backgroundCheck object and path */}
        {application.backgroundCheck?.path && ( 
          <Box display="flex" alignItems="center" mb={1}>
            <Typography variant="subtitle2" sx={{ mr: 2, minWidth: '150px' }}>Background Check:</Typography>
            {documentErrors.backgroundCheck ? <Typography color="error">Error loading.</Typography> : (
              <Link href={getDocumentUrl(application.backgroundCheck.path)} target="_blank" rel="noopener noreferrer" onError={() => handleDocumentError('backgroundCheck')}>View Document</Link>
            )}
          </Box>
        )}
        {application.insurance?.coiPath && (<Box display="flex" alignItems="center" mb={1}><Typography variant="subtitle2" sx={{ mr: 2, minWidth: '150px' }}>Cert. of Insurance:</Typography>{documentErrors.coi ? <Typography color="error">Error loading.</Typography> : (<Link href={getDocumentUrl(application.insurance.coiPath)} target="_blank" rel="noopener noreferrer" onError={() => handleDocumentError('coi')}>View Document</Link>)}</Box>)}
        {application.territories?.zipCodeFile && (<Box display="flex" alignItems="center" mt={1}><Typography variant="subtitle2" sx={{ mr: 2, minWidth: '150px' }}>Uploaded Zip File:</Typography>{documentErrors.zipFile ? <Typography color="error">Error loading.</Typography> : (<Link href={getDocumentUrl(application.territories.zipCodeFile)} target="_blank" rel="noopener noreferrer" onError={() => handleDocumentError('zipFile')}>View File ({application.territories.zipCodeFile})</Link>)}</Box>)}
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
              {[ 'Company Name', "Owner's First Name", "Owner's Last Name", 'Phone', 'Country', 'Address', 'City', 'State', 'Zip' ].map((header, index) => (
                <TableCell key={index} style={{ overflow: 'hidden', border: '1px solid #ccc', padding: 0 }}>
                  <Resizable enable={{ right: true }} style={{ display: 'inline-block', width: '100%', borderRight: '1px solid #ccc', boxSizing: 'border-box' }} handleStyles={{ right: { width: '5px', background: 'transparent', cursor: 'col-resize' } }} handleComponent={{ right: (<div style={{ width: '5px', cursor: 'col-resize', borderRight: '2px solid #000' }} />) }}>
                    <div style={{ padding: '0 8px', borderLeft: '1px solid #ccc' }}>{header}</div>
                  </Resizable>
                </TableCell>
              ))}
              <TableCell style={{ width: '120px', border: '1px solid #ccc' }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {applications.map((application) => (
              <React.Fragment key={application._id}>
                <TableRow>
                  <TableCell style={{ width: '40px', border: '1px solid #ccc' }}>
                    <IconButton onClick={() => handleExpandClick(application._id)} aria-label="expand row" size="small">
                      {expandedRows[application._id] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                  </TableCell>
                  {[ application.companyName || 'N/A', application.ownerFirstName, application.ownerLastName, application.phoneNumber, application.facilityCountry, application.facilityAddress1, application.facilityCity, application.facilityState, application.facilityZip ].map((cellData, idx) => (
                    <TableCell key={idx} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', border: '1px solid #ccc' }}>{cellData}</TableCell>
                  ))}
                  <TableCell style={{ width: '120px', border: '1px solid #ccc' }} align="right">
                    {application.step !== 3 && application.step !== 4 && (
                      <>
                        <IconButton aria-label="approve" onClick={() => handleActionClick(application._id, 'approve')}><CheckIcon /></IconButton>
                        <IconButton aria-label="deny" onClick={() => handleActionClick(application._id, 'deny')}><CloseIcon /></IconButton>
                      </>
                    )}
                    <IconButton aria-label="delete" onClick={() => handleActionClick(application._id, 'delete')}><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell style={{ paddingBottom: 0, paddingTop: 0, border: 'none' }} colSpan={11}>
                    <Collapse in={expandedRows[application._id]} timeout="auto" unmountOnExit>
                      <Box margin={1}>
                        <Box display="flex" alignItems="center" mb={2}>
                          <Typography variant="body1" style={{ fontWeight: 'bold', marginRight: '8px' }}>Vendor ID:</Typography>
                          {application.step === 0 ? (
                            <>
                              <TextField variant="outlined" size="small" value={ editingFields[application._id]?.vendorId || vendorIds[application._id] || '' } disabled style={{ marginRight: '8px' }}/>
                              <Tooltip title="Generate Vendor ID"><IconButton size="small" onClick={() => generateVendorId(application)}><RefreshIcon /></IconButton></Tooltip>
                            </>
                          ) : ( <Typography variant="body1">{application.vendorId || editingFields[application._id]?.vendorId || 'N/A'}</Typography> )}
                        </Box>
                        <Box sx={{ width: '100%' }}>
                          {(application.step === 1 || application.step === 2) ? (
                            <>
                              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                <Tabs value={activeTabs[application._id] || 0} onChange={(e, newValue) => handleTabChange(application._id, newValue)} aria-label="application tabs">
                                  <Tab icon={<AssignmentIcon />} iconPosition="start" label="Application" />
                                  <Tab icon={<DescriptionIcon />} iconPosition="start" label="W9" />
                                  <Tab icon={<BusinessIcon />} iconPosition="start" label="Facilities" />
                                  <Tab icon={<AttachMoneyIcon />} iconPosition="start" label="Rates" />
                                  <Tab icon={<DescriptionIcon />} iconPosition="start" label="Insurance" />
                                  <Tab icon={<AssignmentIcon />} iconPosition="start" label="Background Check" /> {/* Add new tab */}
                                </Tabs>
                              </Box>
                              {activeTabs[application._id] === 0 && (
                                <Box sx={{ p: 2 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                                    <Button variant="contained" color="primary" onClick={() => handleSaveApplicationChanges(application._id)} disabled={!editingFields[application._id] || Object.keys(editingFields[application._id] || {}).length === 0}>Save Application Changes</Button>
                                  </Box>
                                  {saveStatus[application._id]?.success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => clearSaveStatus(application._id)}>{saveStatus[application._id].success}</Alert>}
                                  {saveStatus[application._id]?.error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => clearSaveStatus(application._id)}>{saveStatus[application._id].error}</Alert>}
                                  <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Box sx={{ flex: 1 }}><Paper style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography variant="subtitle1">Map Placeholder</Typography></Paper></Box>
                                    <Box sx={{ flex: 1 }}>
                                      <Stack spacing={1}>
                                        <Typography variant="h6" gutterBottom>Contact Information</Typography>
                                        <TextField fullWidth label="Company Name" value={(editingFields[application._id]?.companyName ?? application.companyName) || ''} onChange={(e) => handleFieldEdit(application._id, 'companyName', e.target.value)} margin="dense" size="small"/>
                                        <TextField fullWidth label="Owner's First Name" value={(editingFields[application._id]?.ownerFirstName ?? application.ownerFirstName) || ''} onChange={(e) => handleFieldEdit(application._id, 'ownerFirstName', e.target.value)} margin="dense" size="small"/>
                                        <TextField fullWidth label="Owner's Last Name" value={(editingFields[application._id]?.ownerLastName ?? application.ownerLastName) || ''} onChange={(e) => handleFieldEdit(application._id, 'ownerLastName', e.target.value)} margin="dense" size="small"/>
                                        <TextField fullWidth label="Email" type="email" value={(editingFields[application._id]?.email ?? application.email) || ''} onChange={(e) => handleFieldEdit(application._id, 'email', e.target.value)} margin="dense" size="small"/>
                                        <Grid container spacing={1}>
                                          <Grid item xs={12} sm={4}><TextField fullWidth label="Phone Country" value={(editingFields[application._id]?.phoneCountry ?? application.phoneCountry) || 'United States'} onChange={(e) => handleFieldEdit(application._id, 'phoneCountry', e.target.value)} margin="dense" size="small"/></Grid>
                                          <Grid item xs={12} sm={2}><TextField fullWidth label="Code" value={(editingFields[application._id]?.phoneCountryCode ?? application.phoneCountryCode) || '+1'} onChange={(e) => handleFieldEdit(application._id, 'phoneCountryCode', e.target.value)} margin="dense" size="small"/></Grid>
                                          <Grid item xs={12} sm={6}><TextField fullWidth label="Phone Number" type="tel" value={(editingFields[application._id]?.phoneNumber ?? application.phoneNumber) || ''} onChange={(e) => handleFieldEdit(application._id, 'phoneNumber', e.target.value)} margin="dense" size="small"/></Grid>
                                        </Grid>
                                        <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>Facility Address</Typography>
                                        <TextField fullWidth label="Facility Country" value={(editingFields[application._id]?.facilityCountry ?? application.facilityCountry) || 'United States'} onChange={(e) => handleFieldEdit(application._id, 'facilityCountry', e.target.value)} margin="dense" size="small"/>
                                        <TextField fullWidth label="Facility Address Line 1" value={(editingFields[application._id]?.facilityAddress1 ?? application.facilityAddress1) || ''} onChange={(e) => handleFieldEdit(application._id, 'facilityAddress1', e.target.value)} margin="dense" size="small"/>
                                        <TextField fullWidth label="Facility Address Line 2" value={(editingFields[application._id]?.facilityAddress2 ?? application.facilityAddress2) || ''} onChange={(e) => handleFieldEdit(application._id, 'facilityAddress2', e.target.value)} margin="dense" size="small"/>
                                        <TextField fullWidth label="City" value={(editingFields[application._id]?.facilityCity ?? application.facilityCity) || ''} onChange={(e) => handleFieldEdit(application._id, 'facilityCity', e.target.value)} margin="dense" size="small"/>
                                        <TextField fullWidth label="State/Province" value={(editingFields[application._id]?.facilityState ?? application.facilityState) || ''} onChange={(e) => handleFieldEdit(application._id, 'facilityState', e.target.value)} margin="dense" size="small"/>
                                        <TextField fullWidth label="Zip/Postal Code" value={(editingFields[application._id]?.facilityZip ?? application.facilityZip) || ''} onChange={(e) => handleFieldEdit(application._id, 'facilityZip', e.target.value)} margin="dense" size="small"/>
                                        <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>Billing Information</Typography>
                                        {/* FIX #2: Use ensureBoolean for billingSame checkbox */}
                                        <FormControlLabel
                                          control={
                                            <Checkbox
                                              checked={ensureBoolean(editingFields[application._id]?.billingSame ?? application.billingSame)}
                                              onChange={(e) => handleFieldEdit(application._id, 'billingSame', e.target.checked)}
                                              size="small"
                                            />
                                          }
                                          label="Billing Same as Facility?"
                                          sx={{height: '30px'}}
                                        />
                                        {/* FIX #3: Use ensureBoolean for billingSame conditional */}
                                        {!ensureBoolean(editingFields[application._id]?.billingSame ?? application.billingSame) && (
                                          <Box sx={{ pl: 2, borderLeft: '2px solid #eee', mt: 1 }}>
                                            <Typography variant="subtitle2" gutterBottom>Billing Address</Typography>
                                            <TextField fullWidth label="Billing Address Line 1" value={(editingFields[application._id]?.billingAddress?.address1 ?? application.billingAddress?.address1) || ''} onChange={(e) => handleFieldEdit(application._id, 'billingAddress.address1', e.target.value)} margin="dense" size="small"/>
                                            <TextField fullWidth label="Billing City" value={(editingFields[application._id]?.billingAddress?.city ?? application.billingAddress?.city) || ''} onChange={(e) => handleFieldEdit(application._id, 'billingAddress.city', e.target.value)} margin="dense" size="small"/>
                                            <TextField fullWidth label="Billing State" value={(editingFields[application._id]?.billingAddress?.state ?? application.billingAddress?.state) || ''} onChange={(e) => handleFieldEdit(application._id, 'billingAddress.state', e.target.value)} margin="dense" size="small"/>
                                            <TextField fullWidth label="Billing Zip" value={(editingFields[application._id]?.billingAddress?.zip ?? application.billingAddress?.zip) || ''} onChange={(e) => handleFieldEdit(application._id, 'billingAddress.zip', e.target.value)} margin="dense" size="small"/>
                                          </Box>
                                        )}
                                        <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>Services</Typography>
                                        <FormGroup>
                                          {serviceKeys.map((key) => (
                                            <FormControlLabel
                                              key={key}
                                              control={
                                                /* FIX #6: Use ensureBoolean for service checkboxes */
                                                <Checkbox
                                                  checked={ensureBoolean(editingFields[application._id]?.services?.[key] ?? application.services?.[key] ?? false)}
                                                  onChange={(e) => handleFieldEdit(application._id, `services.${key}`, e.target.checked)}
                                                  name={key}
                                                  size="small"
                                                />
                                              }
                                              label={formatLabelName(key)}
                                              sx={{ height: '30px' }}
                                            />
                                          ))}
                                        </FormGroup>
                                        {(() => {
                                          const mergedSchedule = deepMerge(application.services?.schedule ?? {}, editingFields[application._id]?.services?.schedule ?? {});
                                          const currentOpen247 = editingFields[application._id]?.services?.open247 ?? application.services?.open247 ?? false;
                                          const scheduleDataPropValue = { ...mergedSchedule, open247: currentOpen247 };
                                          const handleScheduleInputChange = (fieldPath, value) => {
                                            const fullPath = fieldPath === 'open247' ? `services.open247` : `services.${fieldPath}`;
                                            handleFieldEdit(application._id, fullPath, value);
                                          };
                                          return (
                                            <ScheduleInput
                                              key={JSON.stringify(scheduleDataPropValue)}
                                              scheduleData={scheduleDataPropValue}
                                              onChange={handleScheduleInputChange}
                                            />
                                          );
                                        })()}
                                        <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>Territories</Typography>
                                        <TextField fullWidth multiline label="Covered Zip Codes (Manual Entry)" value={(editingFields[application._id]?.territories?.zipCodes ?? application.territories?.zipCodes) || ''} onChange={(e) => handleFieldEdit(application._id, 'territories.zipCodes', e.target.value)} margin="dense" size="small"/>
                                        <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>Business Ownership</Typography>
                                        <FormGroup>
                                          {/* Iterate over all defined ownership keys */}
                                          {ownershipKeys.map((key) => {
                                            // Safely access current and edited values, defaulting to false if undefined
                                            const currentVal = application.ownership?.[key] ?? false;
                                            const editedVal = editingFields[application._id]?.ownership?.[key];
                                            // Prioritize edited value if it exists, otherwise use current value
                                            const valueToCheck = editedVal !== undefined ? editedVal : currentVal;
                                            return (
                                              <FormControlLabel
                                                key={key}
                                                control={
                                                  <Checkbox
                                                    checked={ensureBoolean(valueToCheck)}
                                                    onChange={(e) => handleFieldEdit(application._id, `ownership.${key}`, e.target.checked)}
                                                    size="small"
                                                  />
                                                }
                                                label={formatLabelName(key)}
                                                sx={{height: '30px'}}
                                              />
                                            );
                                          })}
                                        </FormGroup>
                                        <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>Signature</Typography>
                                        <TextField fullWidth label="Electronic Signature" value={(editingFields[application._id]?.signature ?? application.signature) || ''} onChange={(e) => handleFieldEdit(application._id, 'signature', e.target.value)} margin="dense" size="small"/>
                                        <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>Employees</Typography>
                                        <TextField fullWidth label="Number of Employees" type="number" value={(editingFields[application._id]?.employees ?? application.employees) || ''} onChange={(e) => handleFieldEdit(application._id, 'employees', e.target.value)} margin="dense" size="small"/>
                                        <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>Business Info</Typography>
                                        <TextField select fullWidth label="Years in Business" value={(editingFields[application._id]?.businessInfo?.yearsInBusiness ?? application.businessInfo?.yearsInBusiness) || ''} onChange={(e) => handleFieldEdit(application._id, 'businessInfo.yearsInBusiness', e.target.value)} margin="dense" size="small">
                                            {['Less than a year', '1-5 years', '5-10 years', 'More than 10 years'].map((option) => (<MenuItem key={option} value={option}>{option}</MenuItem>))}
                                        </TextField>
                                        <TextField select fullWidth label="EV Experience" value={(editingFields[application._id]?.businessInfo?.electricVehicleExp ?? application.businessInfo?.electricVehicleExp) || ''} onChange={(e) => handleFieldEdit(application._id, 'businessInfo.electricVehicleExp', e.target.value)} margin="dense" size="small">
                                            <MenuItem value="yes">Yes</MenuItem><MenuItem value="no">No</MenuItem>
                                        </TextField>
                                         <TextField select fullWidth label="Digital Dispatch" value={(editingFields[application._id]?.businessInfo?.digitalDispatch ?? application.businessInfo?.digitalDispatch) || ''} onChange={(e) => handleFieldEdit(application._id, 'businessInfo.digitalDispatch', e.target.value)} margin="dense" size="small">
                                            <MenuItem value="yes">Yes</MenuItem><MenuItem value="no">No</MenuItem>
                                        </TextField>
                                        {/* Conditionally render Dispatch Software dropdown */}
                                        { (editingFields[application._id]?.businessInfo?.digitalDispatch ?? application.businessInfo?.digitalDispatch) === 'yes' && (
                                          <TextField
                                            select
                                            fullWidth
                                            label="Dispatch Software Used"
                                            value={(editingFields[application._id]?.businessInfo?.dispatchSoftware ?? application.businessInfo?.dispatchSoftware) || ''}
                                            onChange={(e) => handleFieldEdit(application._id, 'businessInfo.dispatchSoftware', e.target.value)}
                                            margin="dense"
                                            size="small"
                                          >
                                            {dispatchSoftwareOptions.map((software) => (
                                              <MenuItem key={software} value={software}>
                                                {software}
                                              </MenuItem>
                                            ))}
                                          </TextField>
                                        )}
                                        {/* Add Other Motorclub Services fields */}
                                        <TextField
                                          select
                                          fullWidth
                                          label="Other Motorclub Services?"
                                          value={(editingFields[application._id]?.businessInfo?.otherMotorclubServices ?? application.businessInfo?.otherMotorclubServices) || ''}
                                          onChange={(e) => handleFieldEdit(application._id, 'businessInfo.otherMotorclubServices', e.target.value)}
                                          margin="dense"
                                          size="small"
                                        >
                                          <MenuItem value="yes">Yes</MenuItem>
                                          <MenuItem value="no">No</MenuItem>
                                        </TextField>
                                        { (editingFields[application._id]?.businessInfo?.otherMotorclubServices ?? application.businessInfo?.otherMotorclubServices) === 'yes' && (
                                          <TextField
                                            fullWidth
                                            label="List Other Motorclubs"
                                            value={(editingFields[application._id]?.businessInfo?.otherMotorclubsList ?? application.businessInfo?.otherMotorclubsList) || ''}
                                            onChange={(e) => handleFieldEdit(application._id, 'businessInfo.otherMotorclubsList', e.target.value)}
                                            margin="dense"
                                            size="small"
                                            multiline
                                            rows={2} // Adjust rows as needed
                                          />
                                        )}
                                        <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>Agreements</Typography>
                                        {/* FIX #5: Use ensureBoolean for agreement checkboxes */}
                                        <FormControlLabel
                                          control={ <Checkbox checked={ensureBoolean(application.termsAgreement)} disabled size="small"/> }
                                          label="Terms Agreement Signed" sx={{height: '30px'}}
                                        />
                                        <FormControlLabel
                                          control={ <Checkbox checked={ensureBoolean(application.codeOfConductAgreement)} disabled size="small"/> }
                                          label="Code of Conduct Signed" sx={{height: '30px'}}
                                        />
                                        <Box mt={2}>
                                          <Typography variant="subtitle2" gutterBottom>Other Information</Typography>
                                          {Object.entries(application).map(([key, value]) => {
                                            if (['_id', 'step', '__v', 'vendorId', 'companyName', 'ownerFirstName', 'ownerLastName', 'email', 'phoneCountry', 'phoneCountryCode', 'phoneNumber', 'facilityCountry', 'facilityAddress1', 'facilityAddress2', 'facilityCity', 'facilityState', 'facilityZip', 'billingSame', 'billingAddress', 'services', 'territories', 'ownership', 'w9Path', 'backgroundCheckPath', 'insurance', 'businessInfo', 'termsAgreement', 'codeOfConductAgreement', 'createdAt', 'updatedAt', 'w9', 'facilities', 'status', 'approvalDate', 'approvedBy', 'w9RequestDate', 'coiRequestDate', 'rateSheetPath', 'rateSheetSentDate', 'signature', 'employees'].includes(key)) return null;
                                            if (typeof value === 'boolean') return value ? <Typography key={key} variant="body2">{formatLabelName(key)}</Typography> : null;
                                            if (typeof value === 'object' && value !== null) return (<Box key={key} mb={1}><Typography variant="body2" color="textSecondary" fontWeight="bold">{formatLabelName(key)}:</Typography><pre style={{ margin: 0, fontSize: '0.875rem' }}>{JSON.stringify(value, null, 2)}</pre></Box>);
                                            return (<Box key={key} mb={1}><Typography variant="body2" color="textSecondary" fontWeight="bold">{formatLabelName(key)}:</Typography><Typography variant="body2">{String(value)}</Typography></Box>);
                                          })}
                                        </Box>
                                      </Stack>
                                    </Box>
                                  </Box>
                                  <DocumentViewer application={application} />
                                </Box>
                              )}
                              {activeTabs[application._id] === 1 && <Box sx={{ p: 2 }}><W9Tab application={application} editingFields={editingFields} handleFieldEdit={handleFieldEdit} handleSaveChanges={() => handleSaveApplicationChanges(application._id)} /></Box>}
                              {activeTabs[application._id] === 2 && <Box sx={{ p: 2 }}><FacilitiesTab application={application} editingFields={editingFields} handleFieldEdit={handleFieldEdit} handleSaveChanges={() => handleSaveApplicationChanges(application._id)} /></Box>}
                              {activeTabs[application._id] === 3 && <Box sx={{ p: 2 }}><RatesTab application={application} editingFields={editingFields} handleFieldEdit={handleFieldEdit} handleSaveChanges={() => handleSaveApplicationChanges(application._id)} /></Box>}
                              {activeTabs[application._id] === 4 && <Box sx={{ p: 2 }}><InsuranceTab application={application} editingFields={editingFields} handleFieldEdit={handleFieldEdit} handleSaveChanges={() => handleSaveApplicationChanges(application._id)} /></Box>}
                              {/* Add rendering for the new tab */}
                              {activeTabs[application._id] === 5 && <Box sx={{ p: 2 }}><BackgroundCheckTab application={application} editingFields={editingFields} handleFieldEdit={handleFieldEdit} handleSaveChanges={() => handleSaveApplicationChanges(application._id)} /></Box>}
                            </>
                          ) : application.step === 0 ? (
                             <Step0Display application={application} />
                          ) : (
                            <DocumentViewer application={application} />
                          )}
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
        <Typography variant="body1" align="center">No applications found.</Typography>
      )}
      <Dialog open={confirmDialog.open} onClose={handleConfirmClose} aria-labelledby="confirm-dialog-title">
        <DialogTitle id="confirm-dialog-title">{confirmDialog.action === 'approve' ? 'Approve Application' : confirmDialog.action === 'deny' ? 'Deny Application' : 'Delete Application'}</DialogTitle>
        <DialogContent>{confirmDialog.action === 'approve' ? 'Are you sure you want to approve this application?' : confirmDialog.action === 'deny' ? 'Are you sure you want to deny this application?' : 'Are you sure you want to delete this application? This action cannot be undone.'}</DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmClose} color="primary">Cancel</Button>
          <Button onClick={handleConfirmAction} color="primary" autoFocus>Confirm</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Apps;
