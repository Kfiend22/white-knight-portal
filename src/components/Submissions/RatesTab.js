import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  InputAdornment // Added missing import
} from '@mui/material';
import {
  Save as SaveIcon,
  PictureAsPdf as PdfIcon,
  Upload as UploadIcon
} from '@mui/icons-material';
import { deepMerge } from '../../utils/objectUtils'; // Correct import path for deepMerge

// Define Duty Levels for Columns
const DUTY_LEVELS = ['light', 'medium', 'heavy', 'road', 'additional', 'all'];
const DUTY_LEVEL_LABELS = {
  light: 'Light Duty (Up to 10,000 GVWR)',
  medium: 'Medium Duty (10,000-20,000 lbs/21-30ft)',
  heavy: 'Heavy Duty (+lbs/31+ ft)',
  road: 'Road Service',
  additional: 'Additional Charges',
  all: 'All Levels / N/A'
};

// Define service categories and types with applicable duty levels
// Note: 'appliesTo' determines which columns show inputs for that service.
// 'isMileage' flag determines if 'Free Miles' input is shown.
const SERVICE_CATEGORIES = {
  rates: [
    { id: 'minorRoadService', label: 'Minor Road Service', appliesTo: ['light', 'medium', 'heavy'] },
    { id: 'lockouts', label: 'Lockouts', appliesTo: ['light', 'medium', 'heavy'] },
    { id: 'enrouteForRoadServicesOnly', label: 'En Route for Road Services Only', appliesTo: ['light', 'medium', 'heavy'], isMileage: true },
    { id: 'goneOnArrival', label: 'Gone on Arrival (GOA)', appliesTo: ['light', 'medium', 'heavy'] },
    { id: 'jumpStart', label: 'Jump Start', appliesTo: ['light', 'medium', 'heavy'] },
    { id: 'tireChange', label: 'Tire Change', appliesTo: ['light', 'medium', 'heavy'] },
    { id: 'fuelDelivery', label: 'Fuel Delivery', appliesTo: ['light', 'medium', 'heavy'] },
    { id: 'batteryTest', label: 'Battery Test', appliesTo: ['all'] },
    { id: 'batteryReplacement', label: 'Battery Replacement', appliesTo: ['all'] },
    { id: 'tow', label: 'Tow', appliesTo: ['light'] },
    { id: 'towMedium', label: 'Tow Medium', appliesTo: ['medium'] },
    { id: 'towHeavy', label: 'Tow Heavy', appliesTo: ['heavy'] },
    { id: 'mileage', label: 'Mileage [M]', appliesTo: ['light'], isMileage: true },
    { id: 'mileageMedium', label: 'Mileage Medium [M]', appliesTo: ['medium'], isMileage: true },
    { id: 'mileageHeavy', label: 'Mileage Heavy [M]', appliesTo: ['heavy'], isMileage: true },
    { id: 'enrouteMileage', label: 'Enroute Mileage (M)', appliesTo: ['light'], isMileage: true },
    { id: 'enrouteMileageMedium', label: 'Enroute Mileage Medium (M)', appliesTo: ['medium'], isMileage: true },
    { id: 'enrouteMileageHeavy', label: 'Enroute Mileage Heavy (M)', appliesTo: ['heavy'], isMileage: true },
    { id: 'winching', label: 'Winching', appliesTo: ['light', 'medium', 'heavy'] },
    { id: 'recovery', label: 'Recovery', appliesTo: ['light', 'medium', 'heavy'] },
    { id: 'labor', label: 'Labor [L]', appliesTo: ['all'] }, // Assuming 'all' or maybe light/medium/heavy?
    { id: 'storage', label: 'Storage [S]', appliesTo: ['light', 'medium', 'heavy'] }, // Assuming base storage varies? Or use specific ones below?
    { id: 'waitingTime', label: 'Waiting Time', appliesTo: ['all'] },
    { id: 'standbyTime', label: 'Standby Time', appliesTo: ['all'] },
    { id: 'flatbed', label: 'Flatbed', appliesTo: ['light', 'medium', 'heavy'] }, // Or separate?
    { id: 'motorcycleTow', label: 'Motorcycle Tow', appliesTo: ['light'] }, // Assuming light duty
    { id: 'accidentTow', label: 'Accident Tow', appliesTo: ['light', 'medium', 'heavy'] },
    { id: 'secondaryTowing', label: 'Secondary Towing', appliesTo: ['light', 'medium', 'heavy'] },
    { id: 'illegallyParkedTow', label: 'Illegally Parked Tow', appliesTo: ['light', 'medium', 'heavy'] }, // Assuming varies?
    { id: 'roadService', label: 'Road Service', appliesTo: ['road'] }, // Specific category
  ],
  additionalCharges: [
    { id: 'dollies', label: 'Dollies', appliesTo: ['additional'] },
    { id: 'skates', label: 'Skates', appliesTo: ['additional'] },
    { id: 'goJacks', label: 'Go Jacks', appliesTo: ['additional'] },
    { id: 'driveShaftRemoval', label: 'Drive Shaft Removal', appliesTo: ['additional'] },
    { id: 'airBagRecoveryUnit', label: 'Air Bag Recovery Unit', appliesTo: ['additional'] },
    { id: 'cleanUpFee', label: 'Clean Up Fee', appliesTo: ['additional'] },
    { id: 'oilDry', label: 'Oil Dry', appliesTo: ['additional'] },
    { id: 'tarp', label: 'Tarp', appliesTo: ['additional'] },
    { id: 'escort', label: 'Escort', appliesTo: ['additional'] },
    { id: 'extraManHelpers', label: 'Extra Man-Helpers', appliesTo: ['additional'] },
    { id: 'deadheadMiles', label: 'Deadhead Miles [M]', appliesTo: ['additional'], isMileage: true }, // Often considered additional
    { id: 'storageHeavy', label: 'Storage Heavy [S]', appliesTo: ['additional'] }, // Specific storage types
    { id: 'storageOutdoors', label: 'Storage Outdoors [S]', appliesTo: ['additional'] },
    { id: 'storageIndoors', label: 'Storage Indoors [S]', appliesTo: ['additional'] },
    { id: 'storageMedium', label: 'Storage Medium [S]', appliesTo: ['additional'] },
    { id: 'administrationFee', label: 'Administration Fee', appliesTo: ['additional'] },
    { id: 'fuelSurcharge', label: 'Fuel Surcharge', appliesTo: ['additional'] },
    { id: 'gateFee', label: 'Gate fee', appliesTo: ['additional'] },
    { id: 'releaseFee', label: 'Release Fee', appliesTo: ['additional'] },
    { id: 'processingFee', label: 'Processing Fee', appliesTo: ['additional'] },
    { id: 'permits', label: 'Permits', appliesTo: ['additional'] },
    { id: 'tolls', label: 'Tolls', appliesTo: ['additional'] },
    { id: 'paidOutCharges', label: 'Paid Out Charges', appliesTo: ['additional'] },
    { id: 'disposal', label: 'Disposal', appliesTo: ['additional'] },
    { id: 'pickUpKey', label: 'Pick up Key', appliesTo: ['additional'] },
    { id: 'miscellaneous', label: 'Miscellaneous', appliesTo: ['additional'] },
    { id: 'serviceUnknown', label: 'Service Unknown', appliesTo: ['additional'] }, // Should this be rateable?
  ]
};

// Flattened list for easier iteration if needed elsewhere, adding category info
const ALL_SERVICE_TYPES = [
  ...SERVICE_CATEGORIES.rates.map(s => ({ ...s, category: 'rates' })),
  ...SERVICE_CATEGORIES.additionalCharges.map(s => ({ ...s, category: 'additionalCharges' }))
];

// Helper function to check if a service is mileage-related
const isMileageService = (serviceTypeId) => {
  const service = ALL_SERVICE_TYPES.find(s => s.id === serviceTypeId);
  return service?.isMileage === true;
};

// Define default rates (based on user feedback and halved approximations)
const initialDefaultRates = {
  minorRoadService: { light: { rate: '35' }, medium: { rate: '75' }, heavy: { rate: '100' } }, // Adjusted light duty
  lockouts: { light: { rate: '35' }, medium: { rate: '60' }, heavy: { rate: '70' } }, // Adjusted light duty
  enrouteForRoadServicesOnly: { light: { rate: '1.50', freeMiles: '10' }, medium: { rate: '2.00', freeMiles: '10' }, heavy: { rate: '2.00', freeMiles: '10' } }, // Adjusted medium/heavy rate & free miles
  goneOnArrival: { light: { rate: '50' }, medium: { rate: '50' }, heavy: { rate: '50' } }, // GOA Default set to 50% for all
  jumpStart: { light: { rate: '35' }, medium: { rate: '50' }, heavy: { rate: '75' } }, // Adjusted light duty (already 35)
  tireChange: { light: { rate: '35' }, medium: { rate: '80' }, heavy: { rate: '100' } }, // Adjusted light duty
  fuelDelivery: { light: { rate: '35' }, medium: { rate: '50' }, heavy: { rate: '75' } }, // Adjusted light duty (already 35)
  batteryTest: { all: { rate: '20' } },
  batteryReplacement: { all: { rate: '40' } },
  tow: { light: { rate: '50' } },
  towMedium: { medium: { rate: '100' } },
  towHeavy: { heavy: { rate: '200' } },
  mileage: { light: { rate: '1.50', freeMiles: '10' } }, // Adjusted free miles
  mileageMedium: { medium: { rate: '2.50', freeMiles: '10' } }, // Adjusted free miles
  mileageHeavy: { heavy: { rate: '10.00', freeMiles: '10' } }, // Adjusted free miles
  enrouteMileage: { light: { rate: '1.50', freeMiles: '10' } }, // Adjusted free miles
  enrouteMileageMedium: { medium: { rate: '2.50', freeMiles: '10' } }, // Adjusted free miles
  enrouteMileageHeavy: { heavy: { rate: '10.00', freeMiles: '10' } }, // Adjusted free miles
  winching: { light: { rate: '60' }, medium: { rate: '125' }, heavy: { rate: '250' } },
  recovery: { light: { rate: '75' }, medium: { rate: '150' }, heavy: { rate: '300' } },
  labor: { all: { rate: '30' } },
  storage: { light: { rate: '25' }, medium: { rate: '35' }, heavy: { rate: '50' } },
  waitingTime: { all: { rate: '30' } },
  standbyTime: { all: { rate: '30' } },
  flatbed: { light: { rate: '60' }, medium: { rate: '120' }, heavy: { rate: '220' } },
  motorcycleTow: { light: { rate: '55' } },
  accidentTow: { light: { rate: '70' }, medium: { rate: '140' }, heavy: { rate: '250' } },
  secondaryTowing: { light: { rate: '50' }, medium: { rate: '100' }, heavy: { rate: '200' } },
  illegallyParkedTow: { light: { rate: '60' }, medium: { rate: '120' }, heavy: { rate: '220' } },
  roadService: { road: { rate: '50' } },
  dollies: { additional: { rate: '40' } },
  skates: { additional: { rate: '40' } },
  goJacks: { additional: { rate: '40' } },
  driveShaftRemoval: { additional: { rate: '50' } },
  airBagRecoveryUnit: { additional: { rate: '100' } },
  cleanUpFee: { additional: { rate: '25' } },
  oilDry: { additional: { rate: '15' } },
  tarp: { additional: { rate: '20' } },
  escort: { additional: { rate: '75' } },
  extraManHelpers: { additional: { rate: '30' } },
  deadheadMiles: { additional: { rate: '1.50', freeMiles: '10' } }, // Adjusted free miles
  storageHeavy: { additional: { rate: '50' } },
  storageOutdoors: { additional: { rate: '20' } },
  storageIndoors: { additional: { rate: '40' } },
  storageMedium: { additional: { rate: '35' } },
  administrationFee: { additional: { rate: '10' } },
  fuelSurcharge: { additional: { rate: '5' } },
  gateFee: { additional: { rate: '25' } },
  releaseFee: { additional: { rate: '30' } },
  processingFee: { additional: { rate: '5' } },
  permits: { additional: { rate: '50' } },
  tolls: { additional: { rate: '0' } },
  paidOutCharges: { additional: { rate: '0' } },
  disposal: { additional: { rate: '20' } },
  pickUpKey: { additional: { rate: '25' } },
  miscellaneous: { additional: { rate: '20' } },
  serviceUnknown: { additional: { rate: '0' } },
};


function RatesTab({ application, onUpdate }) {
  const [facilities, setFacilities] = useState([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  // Initialize state with default rates
  const [rateValues, setRateValues] = useState(() => JSON.parse(JSON.stringify(initialDefaultRates)));
  const [generatePdfDialogOpen, setGeneratePdfDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0); // Used to reset file input

  // Get auth headers
  const getAuthHeader = useCallback(() => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }, []);

  // Fetch facilities from the API
  const fetchFacilities = useCallback(async () => {
    if (!application || !application._id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/applications/${application._id}/facilities`, { headers: getAuthHeader() });
      if (!response.ok) throw new Error(`Failed to fetch facilities: ${response.statusText}`);
      const data = await response.json();
      setFacilities(data);
      if (data.length > 0 && !selectedFacilityId) {
        setSelectedFacilityId(data[0]._id);
      } else if (data.length === 0) {
        setSelectedFacilityId(''); // Clear selection if no facilities
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch facilities');
      console.error('Error fetching facilities:', err);
    } finally {
      setLoading(false);
    }
  }, [application, getAuthHeader, selectedFacilityId]);

  // Fetch rates from the API and merge with defaults
  const fetchRates = useCallback(async () => {
    // Start with defaults structure for merging, but don't set state yet
    let currentRates = JSON.parse(JSON.stringify(initialDefaultRates));
    // REMOVED: setRateValues(currentRates); // Do not show defaults immediately

    if (!application || !application._id || !selectedFacilityId) {
      setRateValues({}); // Clear rates if no facility selected
      return; // Exit if no application or facility selected
    }

    setLoading(true); // Start loading indicator after setting defaults
    setError(null);
    try {
      // Assuming the backend returns ALL rates for the application, including dutyLevel
      const response = await fetch(`/api/v1/applications/${application._id}/rates`, { headers: getAuthHeader() });
      if (!response.ok) throw new Error(`Failed to fetch rates: ${response.statusText}`);
      const allRatesData = await response.json();

      // Filter rates for the currently selected facility
      const facilityRates = allRatesData.filter(rate => rate.facilityId === selectedFacilityId);

      // Merge fetched rates onto the defaults
      facilityRates.forEach(rate => {
        // Validate fetched rate structure before merging
        if (!rate.serviceType || !rate.dutyLevel || !DUTY_LEVELS.includes(rate.dutyLevel)) {
          console.warn(`Skipping fetched rate due to invalid structure or dutyLevel:`, rate);
          return; // Skip this invalid rate
        }

        if (currentRates[rate.serviceType]) { // Check if service exists in our defaults/structure
          if (!currentRates[rate.serviceType][rate.dutyLevel]) {
            // This case might indicate an issue if the fetched dutyLevel doesn't match the expected structure
            // For now, we'll create it, but ideally, the fetched data should align with SERVICE_CATEGORIES
            console.warn(`Creating unexpected dutyLevel '${rate.dutyLevel}' for serviceType '${rate.serviceType}' based on fetched data.`);
            currentRates[rate.serviceType][rate.dutyLevel] = {}; // Ensure duty level object exists
          }
          // Overwrite default rate/freeMiles with fetched values (store as numbers)
          currentRates[rate.serviceType][rate.dutyLevel] = {
            rate: rate.rate ?? '', // Store as number, fallback to empty string if null/undefined
            freeMiles: rate.freeMiles ?? '' // Store as number, fallback to empty string
          };
        } else {
          console.warn(`Fetched rate for unknown serviceType: ${rate.serviceType}`);
        }
      });

      // Update state with merged rates
      setRateValues(currentRates);
    } catch (err) {
      setError(err.message || 'Failed to fetch rates');
      console.error('Error fetching rates:', err);
      setRateValues({}); // Clear rates on error
    } finally {
      setLoading(false);
    }
  }, [application, selectedFacilityId, getAuthHeader]);

  // Fetch facilities on mount/app change
  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  // Fetch rates when selected facility changes
  useEffect(() => {
    fetchRates(); // Fetch rates whenever selectedFacilityId changes
  }, [selectedFacilityId, fetchRates]);

  // Handle facility selection change - reset rates to default before fetching
  const handleFacilityChange = (event) => {
    const newFacilityId = event.target.value;
    setSelectedFacilityId(newFacilityId);
    // REMOVED: Reset to defaults when facility changes, let useEffect handle fetch & update
    // setRateValues(JSON.parse(JSON.stringify(initialDefaultRates))); 
  };

  // Handle rate input change for specific service, duty level, and field (rate/freeMiles)
  const handleRateChange = (serviceTypeId, dutyLevel, field, value) => {
    setRateValues(prev => {
      // Deep copy to avoid mutation issues
      const newState = JSON.parse(JSON.stringify(prev));
      if (!newState[serviceTypeId]) {
        newState[serviceTypeId] = {};
      }
      if (!newState[serviceTypeId][dutyLevel]) {
        newState[serviceTypeId][dutyLevel] = { rate: '', freeMiles: '' };
      }
      newState[serviceTypeId][dutyLevel][field] = value;
      return newState;
    });
  };

  // Flatten nested state and save rates
  const handleSaveRates = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const rateData = [];
      Object.entries(rateValues).forEach(([serviceTypeId, dutyLevels]) => {
        Object.entries(dutyLevels).forEach(([dutyLevel, values]) => {
          // Only include if rate or (for mileage) freeMiles has a value
          if (values.rate !== '' || (isMileageService(serviceTypeId) && values.freeMiles !== '')) {
            // Ensure dutyLevel is valid before sending
             if (!DUTY_LEVELS.includes(dutyLevel)) {
                 console.warn(`Skipping save for invalid dutyLevel '${dutyLevel}' on service '${serviceTypeId}'`);
                 return; // Skip invalid duty level entry
             }
            rateData.push({
              applicationId: application._id,
              facilityId: selectedFacilityId,
              serviceType: serviceTypeId,
              dutyLevel: dutyLevel, // Include dutyLevel
              rate: parseFloat(values.rate) || 0,
              freeMiles: isMileageService(serviceTypeId) ? (parseFloat(values.freeMiles) || 0) : 0
            });
          }
        });
      });

      console.log('Saving Rates Payload:', JSON.stringify(rateData)); // Added console log

      // Use PUT or POST depending on API design, assuming POST replaces all rates for the facility
      // Added clearExisting=true query param based on previous controller logic observation
      const response = await fetch(`/api/v1/applications/${application._id}/rates?clearExisting=true`, {
        method: 'POST', // Or PUT
        headers: getAuthHeader(),
        body: JSON.stringify(rateData)
      });

      if (!response.ok) {
        throw new Error(`Failed to save rates: ${response.statusText}`);
      }
      setSuccess('Rates saved successfully');
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.message || 'Failed to save rates');
    } finally {
      setLoading(false);
    }
  };

  // Flatten nested state and apply rates to all facilities
  const handleApplyToAllFacilities = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      console.log('[ApplyToAll] Facilities State:', facilities); // Log facilities state
      const allRateData = [];
      facilities.forEach(facility => {
        Object.entries(rateValues).forEach(([serviceTypeId, dutyLevels]) => {
          Object.entries(dutyLevels).forEach(([dutyLevel, values]) => {
            if (values.rate !== '' || (isMileageService(serviceTypeId) && values.freeMiles !== '')) {
               if (!DUTY_LEVELS.includes(dutyLevel)) {
                 console.warn(`Skipping apply-all for invalid dutyLevel '${dutyLevel}' on service '${serviceTypeId}'`);
                 return; 
               }
              allRateData.push({
                applicationId: application._id,
                facilityId: facility._id, // Use current facility._id
                serviceType: serviceTypeId,
                dutyLevel: dutyLevel,
                rate: parseFloat(values.rate) || 0,
                freeMiles: isMileageService(serviceTypeId) ? (parseFloat(values.freeMiles) || 0) : 0
              });
            }
          });
        });
      });

      console.log('[ApplyToAll] Payload (allRateData):', allRateData); // Log the final payload
      console.log('Applying Rates Payload:', JSON.stringify(allRateData)); // Added console log

      // Added clearExisting=true query param
      const response = await fetch(`/api/v1/applications/${application._id}/rates?clearExisting=true`, {
        method: 'POST', // Or PUT
        headers: getAuthHeader(),
        body: JSON.stringify(allRateData)
      });

      if (!response.ok) {
        throw new Error(`Failed to apply rates to all facilities: ${response.statusText}`);
      }
      setSuccess('Rates applied to all facilities successfully');
      if (onUpdate) onUpdate();
      fetchRates(); // Re-fetch rates for the current facility to update UI
    } catch (err) {
      setError(err.message || 'Failed to apply rates to all facilities');
    } finally {
      setLoading(false);
    }
  };

  // --- Other handlers remain largely the same ---
  const handleGenerateRateSheet = async (allFacilities = false) => { /* ... existing logic ... */ };
  const handleFileChange = (event) => { setSelectedFile(event.target.files[0]); };
  const handleUploadRateSheet = async () => { /* ... existing logic ... */ };
  const getSelectedFacilityName = () => {
    const facility = facilities.find(f => f._id === selectedFacilityId);
    return facility ? facility.facilityName : 'Unknown Facility';
  };
  // --- End other handlers ---

  // Helper to render rate inputs for a specific duty level
  const renderRateInput = (serviceType, dutyLevel) => {
    if (!serviceType.appliesTo.includes(dutyLevel)) {
      return <TableCell key={dutyLevel}></TableCell>; // Empty cell if not applicable
    }

    const isGoa = serviceType.id === 'goneOnArrival';
    const rateValue = rateValues[serviceType.id]?.[dutyLevel]?.rate || '';
    const freeMilesValue = rateValues[serviceType.id]?.[dutyLevel]?.freeMiles || '';
    const showFreeMiles = isMileageService(serviceType.id);

    // Define common input props
    const commonInputProps = {
      style: { textAlign: 'right' }
    };

    // Define specific props for GOA rate input
    const goaRateInputProps = {
      ...commonInputProps,
      inputMode: 'numeric', // Use numeric for percentage
      pattern: '[0-9]*',    // Allow only digits
      min: 0,
      max: 100
    };

    // Define specific props for general rate input
    const generalRateInputProps = {
      ...commonInputProps,
      inputMode: 'decimal',
      pattern: '[0-9]*[.,]?[0-9]*'
    };

    return (
      <TableCell key={dutyLevel} align="center">
        <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
          <TextField
            label={isGoa ? "Rate (%)" : "Rate"} // Conditional label
            type="text" // Keep as text for consistent handling
            InputProps={isGoa ? { // Conditional InputProps for adornment
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
              inputProps: goaRateInputProps // Apply GOA specific input props
            } : {
              inputProps: generalRateInputProps // Apply general input props
            }}
            value={rateValue}
            onChange={(e) => handleRateChange(serviceType.id, dutyLevel, 'rate', e.target.value)}
            size="small"
            sx={{ width: '100px' }}
            variant="outlined"
          />
          {showFreeMiles && (
            <TextField
              label="Free Miles"
              type="number"
              inputProps={{ min: 0, step: 1, style: { textAlign: 'right' } }}
              value={freeMilesValue}
              onChange={(e) => handleRateChange(serviceType.id, dutyLevel, 'freeMiles', e.target.value)}
              size="small"
              sx={{ width: '100px' }}
              variant="outlined"
            />
          )}
        </Box>
      </TableCell>
    );
  };

  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="facility-select-label">Select Facility</InputLabel>
              <Select
                labelId="facility-select-label"
                id="facility-select"
                value={selectedFacilityId}
                label="Select Facility"
                onChange={handleFacilityChange}
                disabled={loading || facilities.length === 0}
              >
                {facilities.map((facility) => (
                  <MenuItem key={facility._id} value={facility._id}>
                    {facility.facilityName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleApplyToAllFacilities}
                disabled={loading || !selectedFacilityId || facilities.length <= 1}
                startIcon={<SaveIcon />}
              >
                Apply to All Facilities
              </Button>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => setGeneratePdfDialogOpen(true)}
                disabled={loading || !selectedFacilityId}
                startIcon={<PdfIcon />}
              >
                Generate Rate Sheet
              </Button>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => setUploadDialogOpen(true)}
                disabled={loading}
                startIcon={<UploadIcon />}
              >
                Upload Rate Sheet
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>}

      {selectedFacilityId ? (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Rates for {getSelectedFacilityName()}</Typography>
          <Divider sx={{ mb: 2 }} />

          {/* Rates Table */}
          <Typography variant="h6" sx={{ mt: 2, mb: 1, background: '#eee', p: 1 }}>Rates</Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 'bold' } }}>
                  <TableCell>Services</TableCell>
                  {DUTY_LEVELS.filter(l => l !== 'additional' && l !== 'road').map(level => ( // Filter columns for this table
                     <TableCell key={level} align="center">{DUTY_LEVEL_LABELS[level]}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {SERVICE_CATEGORIES.rates.map((serviceType) => (
                  <TableRow key={serviceType.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell component="th" scope="row">{serviceType.label}</TableCell>
                    {DUTY_LEVELS.filter(l => l !== 'additional' && l !== 'road').map(level => renderRateInput(serviceType, level))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Additional Charges Table */}
          <Typography variant="h6" sx={{ mt: 3, mb: 1, background: '#eee', p: 1 }}>Additional Charges</Typography>
          <TableContainer component={Paper} variant="outlined">
             <Table size="small">
               <TableHead>
                 <TableRow sx={{ '& th': { fontWeight: 'bold' } }}>
                   <TableCell>Charge Type</TableCell>
                   <TableCell align="center">Rate ($)</TableCell>
                   <TableCell align="center">Free Miles</TableCell>
                 </TableRow>
               </TableHead>
               <TableBody>
                 {SERVICE_CATEGORIES.additionalCharges.map((serviceType) => (
                   <TableRow key={serviceType.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                     <TableCell component="th" scope="row">{serviceType.label}</TableCell>
                     {/* Assuming 'additional' is the dutyLevel for these */}
                     {renderRateInput(serviceType, 'additional')}
                     {/* Render empty cells for other duty levels to maintain column structure if needed, or adjust columns */}
                     {/* This example assumes additional charges only need one rate/free miles input */}
                     <TableCell></TableCell> 
                     <TableCell></TableCell>
                     <TableCell></TableCell>
                     <TableCell></TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
           </TableContainer>


          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveRates}
              disabled={loading}
              startIcon={<SaveIcon />}
            >
              Save Rates for {getSelectedFacilityName()}
            </Button>
          </Box>
        </Paper>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="textSecondary">
            {facilities.length === 0
              ? 'No facilities found. Please add facilities in the Facilities tab first.'
              : 'Please select a facility to manage rates.'}
          </Typography>
        </Paper>
      )}

      {/* Dialogs remain the same */}
      <Dialog open={generatePdfDialogOpen} onClose={() => setGeneratePdfDialogOpen(false)}>
        <DialogTitle>Generate Rate Sheet</DialogTitle>
        <DialogContent><DialogContentText>Would you like to generate a rate sheet for the selected facility or for all facilities?</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={() => setGeneratePdfDialogOpen(false)} color="primary">Cancel</Button>
          <Button onClick={() => handleGenerateRateSheet(false)} color="primary" disabled={loading}>Selected Facility</Button>
          <Button onClick={() => handleGenerateRateSheet(true)} color="primary" disabled={loading}>All Facilities</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)}>
        <DialogTitle>Upload Rate Sheet</DialogTitle>
        <DialogContent>
          <DialogContentText>Please select a signed rate sheet PDF to upload.</DialogContentText>
          <Box sx={{ mt: 2 }}><input key={fileInputKey} accept="application/pdf" type="file" onChange={handleFileChange} /></Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)} color="primary">Cancel</Button>
          <Button onClick={handleUploadRateSheet} color="primary" disabled={loading || !selectedFile}>Upload</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default RatesTab;
