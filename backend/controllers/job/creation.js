const Job = require('../../models/Job');

// Helper function to generate the next PO number (8-digit numeric format)
const generateNextPONumber = async () => {
  try {
    // Find the job with the highest PO number
    const highestPOJob = await Job.findOne({})
      .sort({ po: -1 }) // Sort in descending order
      .limit(1);
    
    if (!highestPOJob || !highestPOJob.po) {
      // If no jobs with PO exist, start with 10000001
      return '10000001';
    }
    
    // Extract the number part from the PO string
    let currentPONumber;
    
    // Handle both old format (PO-XXXXX) and new format (8-digit number)
    if (highestPOJob.po.includes('-')) {
      currentPONumber = parseInt(highestPOJob.po.split('-')[1]);
    } else {
      currentPONumber = parseInt(highestPOJob.po);
    }
    
    // Generate the next PO number
    const nextPONumber = currentPONumber + 1;
    
    // Ensure it's 8 digits
    return nextPONumber.toString().padStart(8, '0');
  } catch (error) {
    console.error('Error generating PO number:', error);
    // Fallback to a timestamp-based PO if there's an error
    const timestamp = Date.now().toString().slice(-8);
    return timestamp.padStart(8, '0');
  }
};

const createJob = async (req, res) => {
  try {
    // Generate the next PO number
    const poNumber = await generateNextPONumber();
    
    // Extract required fields from request body
    const {
      account,
      customerName,
      customerPhone,
      customerEmail,
      callerName,
      callerPhone,
      service,
      serviceLocation,
      serviceLocationType,
      dropoffLocation,
      dropoffLocationType,
      year,
      make,
      model,
      color,
      license,
      vin,
      odometer,
      classType,
      eta,
      pickupContact,
      dropoffContact,
      internalNotes,
      dispatcherNotes,
      invoiceNotes,
      paymentType,
      createdBy, // Optional field to track job origin
      needsAcceptance, // Optional field to indicate if job needs acceptance
      driverAssigned // Optional field for assigning driver directly
    } = req.body;
    
    // Determine the appropriate status based on the ETA
    let status = 'Pending'; // Default status
    if (eta && eta.toLowerCase().includes('scheduled')) {
      status = 'Scheduled';
    }
    
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const currentDate = new Date(); // Get the current date and time for the createdAt field
    
    // Process service location
    let processedServiceLocation;
    if (typeof serviceLocation === 'string') {
      // Handle legacy format (string)
      const addressParts = serviceLocation.split(',');
      processedServiceLocation = {
        street: addressParts[0] || '',
        city: addressParts.length > 1 ? addressParts[1].trim() : '',
        state: addressParts.length > 2 ? addressParts[2].trim().substring(0, 2) : '',
        zip: addressParts.length > 2 ? addressParts[2].trim().substring(3).trim() : '',
        country: 'USA'
      };
    } else {
      // Handle new format (object)
      processedServiceLocation = serviceLocation;
    }
    
    // Process dropoff location if provided
    let processedDropoffLocation;
    if (dropoffLocation) {
      if (typeof dropoffLocation === 'string') {
        // Handle legacy format (string)
        const addressParts = dropoffLocation.split(',');
        processedDropoffLocation = {
          street: addressParts[0] || '',
          city: addressParts.length > 1 ? addressParts[1].trim() : '',
          state: addressParts.length > 2 ? addressParts[2].trim().substring(0, 2) : '',
          zip: addressParts.length > 2 ? addressParts[2].trim().substring(3).trim() : '',
          country: 'USA'
        };
      } else {
        // Handle new format (object)
        processedDropoffLocation = dropoffLocation;
      }
    }
    
    // Create a formatted string representation for backward compatibility
    const serviceLocationString = `${processedServiceLocation.street}, ${processedServiceLocation.city}, ${processedServiceLocation.state} ${processedServiceLocation.zip}`;
    const dropoffLocationString = processedDropoffLocation ? 
      `${processedDropoffLocation.street}, ${processedDropoffLocation.city}, ${processedDropoffLocation.state} ${processedDropoffLocation.zip}` : '';
    
    // Create a new job object with only the necessary fields
    const jobData = {
      title: `${service} for ${customerName}`,
      account,
      customerName,
      customerPhone,
      customerEmail,
      callerName,
      callerPhone,
      service,
      serviceLocation: processedServiceLocation,
      serviceLocationType,
      dropoffLocation: processedDropoffLocation,
      dropoffLocationType,
      vehicle: {
        year,
        make,
        model,
        color,
        license,
        vin,
        odometer
      },
      classType,
      eta,
      pickupContact,
      status: status, // Use the determined status
      provider: req.user.id,
      po: poNumber,
      created: currentTime, // Add created time
      createdAt: currentDate, // Explicitly set createdAt
      location: serviceLocationString, // Set location field for UI compatibility
      createdBy: createdBy || 'user', // Default to 'user' if not specified
      needsAcceptance: needsAcceptance || false, // Default to false for user-created jobs
      paymentSubmitted: false, // New jobs always start with payment not submitted
      visibleTo: [] // Initialize empty visibleTo array
    };

    // Only add dropoffContact if it has values
    if (dropoffContact && (dropoffContact.name || dropoffContact.number)) {
      jobData.dropoffContact = dropoffContact;
    }

    // Add optional fields if they exist
    if (internalNotes) jobData.internalNotes = internalNotes;
    if (dispatcherNotes) jobData.dispatcherNotes = dispatcherNotes;
    if (invoiceNotes) jobData.invoiceNotes = invoiceNotes;
    if (paymentType) jobData.paymentType = paymentType;
    
    console.log('Creating new job with data:', jobData);
    
    // Create the job with the generated PO number
    const job = await Job.create(jobData);
    
    // Now update the visibleTo array with users who should be able to see this job
    const { updateJobVisibility } = require('./visibility');
    await updateJobVisibility(job);
    
    // Emit socket event to all users who can see this job
    try {
      const { getIO } = require('../../socket');
      const io = getIO();
      
      if (job.visibleTo && job.visibleTo.length > 0) {
        job.visibleTo.forEach(userId => {
          io.to(`user_${userId}`).emit('jobUpdated', job);
        });
        console.log(`Job creation event emitted to ${job.visibleTo.length} users`);
      }
    } catch (socketError) {
      console.error('Error emitting job creation event:', socketError);
    }
    
    console.log('Job created successfully:', job._id);
    res.status(201).json(job);
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  generateNextPONumber,
  createJob
};
