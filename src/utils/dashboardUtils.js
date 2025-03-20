// dashboardUtils.js
// Utility functions for the dashboard

/**
 * Generate a random job ID
 * @returns {string} Random job ID
 */
export const generateJobId = () => {
  return '#' + Math.floor(Math.random() * 90000000 + 10000000);
};

/**
 * Handle input change for a field
 * @param {Object} prevData Previous data
 * @param {string} field Field to update
 * @param {any} value New value
 * @returns {Object} Updated data
 */
export const handleInputChange = (prevData, field, value) => {
  return {
    ...prevData,
    [field]: value
  };
};

/**
 * Handle nested input change for a field
 * @param {Object} prevData Previous data
 * @param {string} parent Parent object
 * @param {string} field Field to update
 * @param {any} value New value
 * @returns {Object} Updated data
 */
export const handleNestedInputChange = (prevData, parent, field, value) => {
  return {
    ...prevData,
    [parent]: {
      ...prevData[parent],
      [field]: value
    }
  };
};

/**
 * Copy customer info to pickup contact
 * @param {Object} prevData Previous data
 * @returns {Object} Updated data
 */
export const copyCustomerToPickup = (prevData) => {
  return {
    ...prevData,
    pickupContact: {
      name: prevData.customerName,
      number: prevData.customerPhone
    }
  };
};

/**
 * Validate job data
 * @param {Object} jobData Job data to validate
 * @returns {Object} Validation result
 */
export const validateJobData = (jobData) => {
  // Define mandatory fields
  const mandatoryFields = [
    { field: 'year', label: 'Year' },
    { field: 'make', label: 'Make' },
    { field: 'model', label: 'Model' },
    { field: 'customerName', label: 'Customer Name' },
    { field: 'customerPhone', label: 'Customer Phone' },
    { field: 'serviceLocationType', label: 'Service Location Type' },
    { field: 'serviceLocation.street', label: 'Service Location Street' },
    { field: 'serviceLocation.city', label: 'Service Location City' },
    { field: 'serviceLocation.state', label: 'Service Location State' },
    { field: 'serviceLocation.zip', label: 'Service Location ZIP' },
    { field: 'pickupContact.name', label: 'Pickup Name' },
    { field: 'pickupContact.number', label: 'Pickup Number' },
    { field: 'service', label: 'Service' },
    { field: 'classType', label: 'Class Type' }
  ];
  
  // Check if ETA is required based on service time
  if (jobData.serviceTime === 'ASAP') {
    mandatoryFields.push({ field: 'eta', label: 'ETA' });
  } else {
    mandatoryFields.push({ field: 'scheduledDate', label: 'Scheduled Date' });
    mandatoryFields.push({ field: 'scheduledTime', label: 'Scheduled Time' });
  }
  
  // Check each mandatory field
  const missingFields = mandatoryFields.filter(item => {
    if (item.field.includes('.')) {
      // Handle nested fields like pickupContact.name or serviceLocation.street
      const [parent, child] = item.field.split('.');
      return !jobData[parent] || !jobData[parent][child];
    }
    return !jobData[item.field];
  });
  
  return {
    isValid: missingFields.length === 0,
    missingFields: missingFields.map(f => f.label)
  };
};

/**
 * Format job data for submission
 * @param {Object} jobData Job data to format
 * @param {Array} availableDrivers Available drivers
 * @returns {Object} Formatted job data
 */
export const formatJobDataForSubmission = (jobData, availableDrivers) => {
  // Format the ETA based on service time
  const etaFormatted = jobData.serviceTime === 'Scheduled' ? 
    `Scheduled for ${jobData.scheduledDate} ${jobData.scheduledTime}` : jobData.eta;
  
  // Prepare data for submission
  const jobDataToSubmit = {
    ...jobData,
    // Set formatted fields
    eta: etaFormatted,
    // Extract vehicle fields for backward compatibility
    year: jobData.year,
    make: jobData.make,
    model: jobData.model,
    color: jobData.color,
    license: jobData.license,
    vin: jobData.vin,
    odometer: jobData.odometer
  };
  
  // If a driver is assigned, set appropriate fields
  if (jobData.driverAssigned) {
    // Find the driver information from availableDrivers
    const selectedDriver = availableDrivers.find(driver => driver.id === jobData.driverAssigned);
    
    if (selectedDriver) {
      jobDataToSubmit.driverId = selectedDriver.id;
      jobDataToSubmit.driver = selectedDriver.name;
      jobDataToSubmit.status = 'Pending Acceptance';
      jobDataToSubmit.assignedAt = new Date().toISOString();
      jobDataToSubmit.needsAcceptance = true;
    }
  }
  
  // Only include dropoffContact if both name and number are provided
  if (!jobData.dropoffContact.name && !jobData.dropoffContact.number) {
    delete jobDataToSubmit.dropoffContact;
  }
  
  return jobDataToSubmit;
};

/**
 * Format job data for update
 * @param {Object} jobData Job data to format
 * @param {Object} selectedJob Selected job
 * @param {Array} availableDrivers Available drivers
 * @returns {Object} Formatted job data
 */
export const formatJobDataForUpdate = (jobData, selectedJob, availableDrivers) => {
  // Format the ETA based on service time
  const etaFormatted = jobData.serviceTime === 'Scheduled' ? 
    `Scheduled for ${jobData.scheduledDate} ${jobData.scheduledTime}` : jobData.eta;
  
  // Prepare data for submission
  const jobDataToSubmit = {
    ...jobData,
    // Set formatted fields
    eta: etaFormatted,
    // Extract vehicle fields for backward compatibility
    year: jobData.year,
    make: jobData.make,
    model: jobData.model,
    color: jobData.color,
    license: jobData.license,
    vin: jobData.vin,
    odometer: jobData.odometer
  };
  
  // Handle driver assignment
  if (jobData.driverAssigned) {
    // Find the driver information from availableDrivers
    const selectedDriver = availableDrivers.find(driver => driver.id === jobData.driverAssigned);
    
    if (selectedDriver) {
      // Check if this is a driver reassignment
      const isDriverReassignment = selectedJob.driverId && 
                                  selectedJob.driverId !== jobData.driverAssigned;
      
      // Add driver information to the submission data
      jobDataToSubmit.driverId = selectedDriver.id;
      jobDataToSubmit.driver = selectedDriver.name;
      
      // If this is a reassignment, we'll let the backend handle the status change
      // Otherwise, set the status explicitly
      if (!isDriverReassignment) {
        jobDataToSubmit.status = 'Pending Acceptance';
        jobDataToSubmit.needsAcceptance = true;
      }
    }
  } else if (selectedJob.driverId && !jobData.driverAssigned) {
    // If driver was previously assigned but now removed, clear driver fields
    jobDataToSubmit.driverId = null;
    jobDataToSubmit.driver = null;
    jobDataToSubmit.status = 'Pending'; // Reset to pending status
    jobDataToSubmit.needsAcceptance = false;
  }
  
  // Only include dropoffContact if both name and number are provided
  if (!jobData.dropoffContact.name && !jobData.dropoffContact.number) {
    delete jobDataToSubmit.dropoffContact;
  }
  
  return jobDataToSubmit;
};

/**
 * Parse job data for editing
 * @param {Object} job Job data to parse
 * @returns {Object} Parsed job data
 */
export const parseJobForEditing = (job) => {
  // Parse locations
  let serviceLocationType = '';
  let serviceLocation = {
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'USA'
  };
  
  // Handle service location
  if (job.serviceLocation) {
    // Check if serviceLocation is an object with the new structure
    if (typeof job.serviceLocation === 'object' && job.serviceLocation !== null) {
      serviceLocation = {
        street: job.serviceLocation.street || '',
        city: job.serviceLocation.city || '',
        state: job.serviceLocation.state || '',
        zip: job.serviceLocation.zip || '',
        country: job.serviceLocation.country || 'USA'
      };
    } else if (typeof job.serviceLocation === 'string') {
      // Handle legacy string format
      const match = job.serviceLocation.match(/^([^:]+):\s*(.+)$/);
      if (match) {
        serviceLocationType = match[1];
        // Try to parse the address into components
        const addressParts = match[2].split(',');
        if (addressParts.length >= 2) {
          serviceLocation.street = addressParts[0].trim();
          
          // Parse city, state, zip
          if (addressParts.length >= 2) {
            serviceLocation.city = addressParts[1].trim();
          }
          
          if (addressParts.length >= 3) {
            // Try to extract state and zip from the last part
            const stateZipMatch = addressParts[2].trim().match(/^([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
            if (stateZipMatch) {
              serviceLocation.state = stateZipMatch[1];
              serviceLocation.zip = stateZipMatch[2];
            } else {
              serviceLocation.state = addressParts[2].trim();
            }
          }
        } else {
          // If we can't parse it properly, just put everything in street
          serviceLocation.street = match[2];
        }
      } else if (job.serviceLocation) {
        // No type prefix, just an address
        serviceLocation.street = job.serviceLocation;
      }
    }
  } else if (job.location) {
    // Fall back to location field if serviceLocation is not available
    const match = job.location.match(/^([^:]+):\s*(.+)$/);
    if (match) {
      serviceLocationType = match[1];
      serviceLocation.street = match[2];
    } else if (job.location) {
      serviceLocation.street = job.location;
    }
  }
  
  // Handle dropoff location
  let dropoffLocationType = '';
  let dropoffLocation = {
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'USA'
  };
  
  if (job.dropoffLocation) {
    // Check if dropoffLocation is an object with the new structure
    if (typeof job.dropoffLocation === 'object' && job.dropoffLocation !== null) {
      dropoffLocation = {
        street: job.dropoffLocation.street || '',
        city: job.dropoffLocation.city || '',
        state: job.dropoffLocation.state || '',
        zip: job.dropoffLocation.zip || '',
        country: job.dropoffLocation.country || 'USA'
      };
    } else if (typeof job.dropoffLocation === 'string') {
      // Handle legacy string format
      const match = job.dropoffLocation.match(/^([^:]+):\s*(.+)$/);
      if (match) {
        dropoffLocationType = match[1];
        // Try to parse the address into components
        const addressParts = match[2].split(',');
        if (addressParts.length >= 2) {
          dropoffLocation.street = addressParts[0].trim();
          
          // Parse city, state, zip
          if (addressParts.length >= 2) {
            dropoffLocation.city = addressParts[1].trim();
          }
          
          if (addressParts.length >= 3) {
            // Try to extract state and zip from the last part
            const stateZipMatch = addressParts[2].trim().match(/^([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
            if (stateZipMatch) {
              dropoffLocation.state = stateZipMatch[1];
              dropoffLocation.zip = stateZipMatch[2];
            } else {
              dropoffLocation.state = addressParts[2].trim();
            }
          }
        } else {
          // If we can't parse it properly, just put everything in street
          dropoffLocation.street = match[2];
        }
      } else if (job.dropoffLocation) {
        // No type prefix, just an address
        dropoffLocation.street = job.dropoffLocation;
      }
    }
  }
  
  // Extract vehicle information
  const vehicleInfo = job.vehicle || {};
  
  // Parse ETA
  let serviceTime = 'ASAP';
  let eta = job.eta || '';
  let scheduledDate = '';
  let scheduledTime = '';
  
  if (typeof eta === 'string' && eta.includes('Scheduled for')) {
    serviceTime = 'Scheduled';
    const dateTimeStr = eta.replace('Scheduled for ', '');
    // Try to parse the date and time
    try {
      const dateObj = new Date(dateTimeStr);
      scheduledDate = dateObj.toLocaleDateString();
      scheduledTime = 'Custom Date/Time';
    } catch (e) {
      // If parsing fails, just keep the string as is
      scheduledDate = dateTimeStr;
      scheduledTime = 'Custom Date/Time';
    }
  }
  
  // Return the parsed job data
  return {
    // Customer section
    account: job.account || '',
    paymentType: job.paymentType || '',
    po: job.po || '',
    callerName: job.callerName || '',
    callerPhone: job.callerPhone || '',
    customerName: job.customerName || '',
    customerPhone: job.customerPhone || '',
    customerEmail: job.customerEmail || '',
    
    // Vehicle section
    vin: vehicleInfo.vin || '',
    make: vehicleInfo.make || '',
    model: vehicleInfo.model || '',
    year: vehicleInfo.year || '',
    color: vehicleInfo.color || '',
    license: vehicleInfo.license || '',
    odometer: vehicleInfo.odometer || '',
    
    // Service section
    serviceTime: serviceTime,
    eta: serviceTime === 'ASAP' ? eta : '',
    scheduledDate: scheduledDate,
    scheduledTime: scheduledTime,
    service: job.service || '',
    classType: job.classType || '',
    driverAssigned: job.driverId || '',
    truckAssigned: job.truck || '',
    
    // Location section
    serviceLocationType: serviceLocationType,
    serviceLocation: serviceLocation,
    dropoffLocationType: dropoffLocationType,
    dropoffLocation: dropoffLocation,
    
    // Notes
    notes: job.notes || '',
    
    // Contacts
    pickupContact: job.pickupContact || { name: '', number: '' },
    dropoffContact: job.dropoffContact || { name: '', number: '' }
  };
};
