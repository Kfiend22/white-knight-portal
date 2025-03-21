const Job = require('../models/Job');

// Store active auto-rejection timeouts by job ID
const autoRejectionTimeouts = new Map();

// Helper function to schedule auto-rejection of jobs that are not accepted within the timeframe
const scheduleAutoRejection = async (jobId) => {
  try {
    // Clear any existing timeout for this job
    if (autoRejectionTimeouts.has(jobId)) {
      clearTimeout(autoRejectionTimeouts.get(jobId));
      autoRejectionTimeouts.delete(jobId);
      console.log(`Cleared existing auto-rejection timeout for job ${jobId}`);
    }

    // Find the job to determine if it's assigned to an SP or driver
    const job = await Job.findById(jobId);
    if (!job) {
      console.error(`Cannot schedule auto-rejection: Job ${jobId} not found`);
      return;
    }
    
    // Get the user to determine if they are an SP or driver
    const User = require('../models/userModel');
    const assignedUser = await User.findById(job.driverId);
    
    if (!assignedUser) {
      console.error(`Cannot schedule auto-rejection: Assigned user not found for job ${jobId}`);
      return;
    }
    
    // Determine timeout based on user role (6 minutes for SP, 2 minutes for driver)
    const isSP = assignedUser.primaryRole === 'SP';
    const autoRejectionTimeout = isSP ? 360000 : 120000; // 6 minutes for SP, 2 minutes for driver
    
    console.log(`Auto-rejection scheduled for job ${jobId} (will expire in ${isSP ? '6' : '2'} minutes)`);
    
    // Store the timeout ID so we can clear it if needed
    const timeoutId = setTimeout(async () => {
      try {
        // Remove the timeout from the map since it's now executing
        autoRejectionTimeouts.delete(jobId);
        
        // Find the job by ID (refetch to get latest state)
        const job = await Job.findById(jobId);
        
        // Enhanced logging to debug the job state at timeout execution
        const now = new Date();
        console.log(`Auto-rejection timeout executing for job ${jobId}:`, {
          currentTime: now.toISOString(),
          jobStatus: job?.status,
          acceptedAt: job?.acceptedAt ? new Date(job.acceptedAt).toISOString() : null,
          updatedAt: job?.updatedAt ? new Date(job.updatedAt).toISOString() : null,
          timeoutScheduledAt: new Date(now.getTime() - autoRejectionTimeout).toISOString()
        });
        
        // If job doesn't exist or is no longer in Pending Acceptance status, do nothing
        if (!job || job.status !== 'Pending Acceptance') {
          console.log(`Auto-rejection not needed for job ${jobId}: Job not found or status changed`);
          return;
        }
        
        // Enhanced check: Compare updatedAt with the time the timeout was scheduled
        const scheduledTime = new Date(now.getTime() - autoRejectionTimeout); // Calculate when the timeout was scheduled
        if (job.updatedAt && new Date(job.updatedAt) > scheduledTime) {
          console.log(`Auto-rejection skipped for job ${jobId}: Job updated after timeout was scheduled. updatedAt: ${job.updatedAt}, scheduledTime: ${scheduledTime.toISOString()}`);
          return;
        }
        
        // Check if the job has been accepted (acceptedAt is set)
        if (job.acceptedAt) {
          console.log(`Auto-rejection not needed for job ${jobId}: Job already accepted`);
          return;
        }
        
        // Check if the job has been redispatched (by checking if the current driver is different from when the timeout was set)
        if (job.previousDrivers && job.previousDrivers.length > 0) {
          const lastRedispatch = job.previousDrivers[job.previousDrivers.length - 1];
          // If the job was redispatched after this timeout was set, don't auto-reject
          if (lastRedispatch.reassignedAt > new Date(Date.now() - autoRejectionTimeout)) {
            console.log(`Auto-rejection not needed for job ${jobId}: Job has been redispatched`);
            return;
          }
        }
        
        // If the job is still pending acceptance after the timeout, set it back to Pending
        console.log(`Job ${jobId} acceptance expired after timeout`);
        
        // Store the driver information before clearing it
        const expiredDriverId = job.driverId;
        const expiredDriverName = job.driver;
        
        // Update job status to Pending (not Rejected)
        job.status = 'Pending';
        job.rejectedAt = new Date();
        
        // Add to rejectedBy array to track the expired driver
        if (!job.rejectedBy) {
          job.rejectedBy = [];
        }
        
        job.rejectedBy.push({
          driverId: expiredDriverId,
          driverName: expiredDriverName,
          reason: 'Auto-expired: No response within timeframe',
          timestamp: new Date()
        });
        
        // Add status history entry
        if (!job.statusHistory) {
          job.statusHistory = [];
        }
        
        job.statusHistory.push({
          status: 'Pending',
          timestamp: new Date(),
          updatedBy: 'System',
          notes: `Acceptance expired: ${expiredDriverName} did not respond within the required timeframe`
        });
        
        // Clear driver assignment fields
        job.driverId = null;
        job.driver = null;
        job.truck = null;
        job.assignedAt = null;
        job.autoRejectAt = null;
        // Keep firstAssignedAt for historical reference
        
        // Update job visibility now that the driver is unassigned
        await updateJobVisibility(job);
        
        await job.save();
        console.log(`Job ${jobId} set back to Pending after acceptance expired`);
        
        // Send notification to the dispatcher using Socket.IO
        try {
          const { getIO } = require('../socket');
          const io = getIO();
          
          // Emit to the job provider (dispatcher)
          if (job.provider) {
            io.to(`user_${job.provider}`).emit('jobAutoRejected', {
              jobId: job._id,
              message: `Job acceptance expired: ${expiredDriverName} did not respond within the required timeframe`,
              jobDetails: {
                id: job._id,
                service: job.service,
                location: job.location,
                status: job.status,
                previousDriver: expiredDriverName
              }
            });
            console.log(`Acceptance expiration notification sent to provider ${job.provider}`);
          }
          
          // Emit general job update to all users who can see this job
          if (job.visibleTo && job.visibleTo.length > 0) {
            job.visibleTo.forEach(userId => {
              io.to(`user_${userId}`).emit('jobUpdated', job);
            });
            console.log(`Job auto-rejection update event emitted to ${job.visibleTo.length} users`);
          }
        } catch (socketError) {
          console.error(`Error sending acceptance expiration notification:`, socketError);
        }
        
      } catch (error) {
        console.error(`Error auto-rejecting job ${jobId}:`, error);
      }
    }, autoRejectionTimeout);
    
    // Store the timeout ID in the map for future reference
    autoRejectionTimeouts.set(jobId.toString(), timeoutId);
    console.log(`Stored auto-rejection timeout ID for job ${jobId}`);
  } catch (error) {
    console.error(`Error scheduling auto-rejection for job ${jobId}:`, error);
  }
};

// Helper function to check if a state is in a region
const isStateInRegion = async (state, regionIds) => {
  try {
    if (!state || !regionIds || regionIds.length === 0) {
      return false;
    }
    
    // Normalize the state (remove extra spaces, convert to lowercase)
    const normalizedState = state.trim().toLowerCase();
    
    // Get the Region model
    const Region = require('../models/Region');
    
    // Find all regions that match the provided IDs
    const regions = await Region.find({ _id: { $in: regionIds } });
    
    // Check if any region contains the state
    return regions.some(region => {
      return region.states.some(regionState => {
        // Normalize the region state (remove extra spaces, convert to lowercase)
        const normalizedRegionState = regionState.state.trim().toLowerCase();
        return normalizedRegionState === normalizedState;
      });
    });
  } catch (error) {
    console.error('Error checking if state is in region:', error);
    return false;
  }
};

// Helper function to update the visibleTo array for a job
const updateJobVisibility = async (job, driverId = null) => {
  try {
    const User = require('../models/userModel');
    const Region = require('../models/Region');
    
    // Initialize visibleTo array if it doesn't exist
    if (!job.visibleTo) {
      job.visibleTo = [];
    }
    
    // Clear the visibleTo array to start fresh
    job.visibleTo = [];
    
    // Add the job creator to visibleTo
    if (job.provider) {
      job.visibleTo.push(job.provider);
    }
    
    // Add the driver to visibleTo if provided
    if (driverId) {
      job.visibleTo.push(driverId);
    }
    
    // Get all users with primary roles OW or sOW
    const owners = await User.find({
      primaryRole: { $in: ['OW', 'sOW'] },
      isActive: true
    });
    
    // Add all owners to visibleTo
    for (const owner of owners) {
      if (!job.visibleTo.includes(owner._id.toString())) {
        job.visibleTo.push(owner._id);
      }
    }
    
    // Get state from job location
    const jobState = getJobState(job);
    
    if (jobState) {
      // Find all regions that include this state
      const regions = await Region.find({
        'states.state': { $regex: new RegExp(`^${jobState}$`, 'i') }
      });
      
      // Get region IDs
      const regionIds = regions.map(region => region._id);
      
      // Find all RMs assigned to these regions
      const rms = await User.find({
        primaryRole: 'RM',
        regions: { $in: regionIds },
        isActive: true
      });
      
      // Add all RMs to visibleTo
      for (const rm of rms) {
        if (!job.visibleTo.includes(rm._id.toString())) {
          job.visibleTo.push(rm._id);
        }
      }
    }
    
    // Get the job creator's vendor ID
    const creator = await User.findById(job.provider);
    
    if (creator) {
      const creatorVendorId = creator.vendorId || creator.vendorNumber;
      
      // Find all dispatchers with the same vendor ID as the creator
      const dispatchers = await User.find({
        'secondaryRoles.dispatcher': true,
        $or: [
          { vendorId: creatorVendorId },
          { vendorNumber: creatorVendorId }
        ],
        isActive: true
      });
      
      // Add dispatchers with the same vendor ID as the creator to visibleTo
      for (const dispatcher of dispatchers) {
        if (!job.visibleTo.includes(dispatcher._id.toString())) {
          job.visibleTo.push(dispatcher._id);
        }
      }
      
      // Find all OW, sOW, and RM users
      const ownerUsers = await User.find({
        primaryRole: { $in: ['OW', 'sOW', 'RM'] },
        isActive: true
      });
      
      // Find dispatchers with the same vendor ID as any OW, sOW, or RM
      for (const owner of ownerUsers) {
        const ownerVendorId = owner.vendorId || owner.vendorNumber;
        
        if (ownerVendorId) {
          const matchingDispatchers = await User.find({
            'secondaryRoles.dispatcher': true,
            $or: [
              { vendorId: ownerVendorId },
              { vendorNumber: ownerVendorId }
            ],
            isActive: true
          });
          
          // Add these dispatchers to visibleTo
          for (const dispatcher of matchingDispatchers) {
            if (!job.visibleTo.includes(dispatcher._id.toString())) {
              job.visibleTo.push(dispatcher._id);
            }
          }
        }
      }
    }
    
    // Save the job with updated visibleTo array
    await job.save();
    
    console.log(`Job ${job._id} visibility updated with ${job.visibleTo.length} users`);
    return job;
  } catch (error) {
    console.error('Error updating job visibility:', error);
    return job;
  }
};

// Helper function to get state from a job's serviceLocation
const getJobState = (job) => {
  if (!job || !job.serviceLocation || !job.serviceLocation.state) {
    return null;
  }
  
  return job.serviceLocation.state;
};

const getJobs = async (req, res) => {
  try {
    const { category } = req.query;
    const { canViewJob } = require('../middleware/roleMiddleware');
    
    // Get all jobs
    const allJobs = await Job.find({});
    
    // Filter jobs based on visibility
    let visibleJobs = [];
    
    for (const job of allJobs) {
      // Check if the user can view this job
      const canView = await canViewJob(req.user.id, job);
      
      if (canView) {
        visibleJobs.push(job);
      }
    }
    
    // Add driver filtering ONLY if the user's primary role is driver
    // This ensures OW users with driver secondary role still see all jobs
    if (req.user.primaryRole === 'driver') {
      const driverName = `${req.user.firstName} ${req.user.lastName}`;
      
      // Filter jobs to only show those assigned to this driver
      // AND exclude expired 'Pending Acceptance' jobs
      visibleJobs = visibleJobs.filter(job => {
        // Check if job is assigned to this driver
        const isAssignedToDriver = job.driver === driverName;
        
        // Check if job is expired (Pending Acceptance + past autoRejectAt time)
        const isExpired = job.status === 'Pending Acceptance' && 
                         job.autoRejectAt && 
                         new Date() > new Date(job.autoRejectAt);
        
        // Include job only if it's assigned to this driver AND not expired
        return isAssignedToDriver && !isExpired;
      });
      
      console.log(`After driver and expiration filtering: ${visibleJobs.length} jobs`);
    }
    
    // Add category filtering if provided
    if (category) {
      // Map category to corresponding status values
      let statusValues;
      
      switch (category) {
        case 'pending':
          statusValues = ['Pending', 'Pending Acceptance'];
          break;
        case 'inProgress':
          statusValues = ['In-Progress', 'Dispatched', 'En Route', 'On Site', 'Awaiting Approval', 'Rejected', 'Accepted'];
          break;
        case 'scheduled':
          statusValues = ['Scheduled'];
          break;
        case 'completed':
          statusValues = ['Completed'];
          break;
        case 'canceled':
          statusValues = ['Canceled'];
          break;
        case 'awaitingApproval':
          statusValues = ['Awaiting Approval'];
          break;
      }
      
      // Filter jobs by status
      if (statusValues && statusValues.length > 0) {
        visibleJobs = visibleJobs.filter(job => statusValues.includes(job.status));
      }
    }
    
    console.log(`Found ${visibleJobs.length} jobs matching visibility and category filters`);
    
    // Transform MongoDB _id to id for frontend compatibility
    const transformedJobs = visibleJobs.map(job => {
      const jobObj = job.toObject();
      jobObj.id = jobObj._id.toString();
      return jobObj;
    });
    
    res.json(transformedJobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ message: error.message });
  }
};

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
      service,
      serviceLocation,
      dropoffLocation,
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
      notes,
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
      service,
      serviceLocation: processedServiceLocation,
      dropoffLocation: processedDropoffLocation,
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
    if (notes) jobData.notes = notes;
    if (paymentType) jobData.paymentType = paymentType;
    
    console.log('Creating new job with data:', jobData);
    
    // Create the job with the generated PO number
    const job = await Job.create(jobData);
    
    // Now update the visibleTo array with users who should be able to see this job
    await updateJobVisibility(job);
    
    // Emit socket event to all users who can see this job
    try {
      const { getIO } = require('../socket');
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

const updateJobStatus = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    const { 
      status, 
      cancellationReason, 
      goaReason, 
      rejectionReason,
      driverId,
      driver,
      truck
    } = req.body;
    
    const previousStatus = job.status;
    const previousDriverId = job.driverId ? job.driverId.toString() : null;
    const newDriverId = driverId;
    
    // Check if this is a driver reassignment
    const isDriverReassignment = newDriverId && previousDriverId && (newDriverId !== previousDriverId);
    
    // If this is a driver reassignment, handle it specially
    if (isDriverReassignment) {
      console.log(`Job ${job._id} is being reassigned from driver ${previousDriverId} to ${newDriverId}`);
      
      // Fetch the new driver/SP information
      const User = require('../models/userModel');
      const newUser = await User.findById(newDriverId);
      
      if (!newUser) {
        return res.status(404).json({ message: 'New driver/SP not found' });
      }
      
      // Check if the user is on duty
      if (!newUser.isOnDuty) {
        return res.status(400).json({ message: 'New driver/SP is not on duty' });
      }
      
      // Determine if this is an SP or a driver
      const isSP = newUser.primaryRole === 'SP';
      
      // Store the previous driver information for reference
      if (!job.previousDrivers) {
        job.previousDrivers = [];
      }
      
      job.previousDrivers.push({
        driverId: previousDriverId,
        driverName: job.driver,
        reassignedAt: new Date(),
        reassignedBy: req.user.firstName + ' ' + req.user.lastName
      });
      
      // Update driver information
      job.driverId = newDriverId;
      job.driver = driver || `${newUser.firstName} ${newUser.lastName}`;
      
      // Update truck if provided
      if (truck) {
        job.truck = truck;
      }
      
      // Set job status to Pending Acceptance for the new driver/SP
      job.status = 'Pending Acceptance';
      job.needsAcceptance = true;
      job.assignedAt = new Date();
      
      // Set auto-rejection time (6 minutes for SP, 2 minutes for driver)
      const autoRejectTime = new Date();
      if (isSP) {
        // 6 minutes for SP
        autoRejectTime.setMinutes(autoRejectTime.getMinutes() + 6);
      } else {
        // 2 minutes for driver
        autoRejectTime.setMinutes(autoRejectTime.getMinutes() + 2);
      }
      job.autoRejectAt = autoRejectTime;
      
      // Create a status history entry for the reassignment
      const statusEntry = {
        status: 'Pending Acceptance',
        timestamp: new Date(),
        updatedBy: req.user.firstName + ' ' + req.user.lastName,
        notes: `Reassigned from previous ${isSP ? 'SP' : 'driver'} to ${job.driver}`
      };
      
      // Initialize statusHistory array if it doesn't exist
      if (!job.statusHistory) {
        job.statusHistory = [];
      }
      
      // Add the reassignment entry to history
      job.statusHistory.push(statusEntry);
      
      // Reset any acceptance-related fields
      job.acceptedAt = null;
      
      const updatedJob = await job.save();
      
      // Schedule auto-rejection if not accepted within the timeout period
      scheduleAutoRejection(job._id);
      
      // Return the updated job with a specific message about reassignment
      return res.json({
        message: `Job reassigned to ${isSP ? 'SP' : 'driver'} successfully`,
        job: updatedJob
      });
    }
    
    // Handle normal status update (non-reassignment)
    const newStatus = status || job.status;
    job.status = newStatus;
    
    // Create a status history entry
    const statusEntry = {
      status: newStatus,
      timestamp: new Date(),
      updatedBy: req.user.firstName + ' ' + req.user.lastName
    };
    
    // Initialize statusHistory array if it doesn't exist
    if (!job.statusHistory) {
      job.statusHistory = [];
    }
    
    // Add the new status entry to history
    job.statusHistory.push(statusEntry);
    
    // Handle different status changes
    switch (newStatus) {
      case 'Dispatched':
        // Record dispatch time
        job.dispatchedAt = new Date();
        console.log(`Job ${job._id} dispatched at ${job.dispatchedAt}`);
        break;
        
      case 'En Route':
        // Record en route time
        job.enRouteAt = new Date();
        console.log(`Job ${job._id} driver en route at ${job.enRouteAt}`);
        break;
        
      case 'On Site':
        // Record on site time
        job.onSiteAt = new Date();
        console.log(`Job ${job._id} driver on site at ${job.onSiteAt}`);
        break;
        
      case 'Completed':
        // Record completion time
        job.completedAt = new Date();
        console.log(`Job ${job._id} marked as completed at ${job.completedAt}`);
        break;
        
      case 'Canceled':
        // Record cancellation reason
        if (cancellationReason) {
          job.cancellationReason = cancellationReason;
          console.log(`Job ${job._id} canceled with reason: ${cancellationReason}`);
        }
        break;
        
      case 'Awaiting Approval':
        // Record GOA reason
        if (goaReason) {
          job.goaReason = goaReason;
          job.approvalStatus = 'pending';
          console.log(`Job ${job._id} marked as GOA with reason: ${goaReason}`);
        }
        break;
        
      case 'Rejected':
        // Record rejection reason
        if (rejectionReason) {
          job.rejectionReason = rejectionReason;
          job.approvalStatus = 'rejected';
          console.log(`Job ${job._id} rejected with reason: ${rejectionReason}`);
        }
        break;
    }
    
    // If this is a new driver assignment (not reassignment)
    if (newDriverId && !previousDriverId) {
      // Fetch the new driver/SP information
      const User = require('../models/userModel');
      const newUser = await User.findById(newDriverId);
      
      if (!newUser) {
        return res.status(404).json({ message: 'New driver/SP not found' });
      }
      
      // Check if the user is on duty
      if (!newUser.isOnDuty) {
        return res.status(400).json({ message: 'New driver/SP is not on duty' });
      }
      
      // Determine if this is an SP or a driver
      const isSP = newUser.primaryRole === 'SP';
      
      job.driverId = newDriverId;
      job.driver = driver || `${newUser.firstName} ${newUser.lastName}`;
      job.status = 'Pending Acceptance';
      job.needsAcceptance = true;
      job.assignedAt = new Date();
      
      // Set auto-rejection time (6 minutes for SP, 2 minutes for driver)
      const autoRejectTime = new Date();
      if (isSP) {
        // 6 minutes for SP
        autoRejectTime.setMinutes(autoRejectTime.getMinutes() + 6);
      } else {
        // 2 minutes for driver
        autoRejectTime.setMinutes(autoRejectTime.getMinutes() + 2);
      }
      job.autoRejectAt = autoRejectTime;
      
      if (truck) {
        job.truck = truck;
      }
      
      // Create a status history entry for the assignment
      const statusEntry = {
        status: 'Pending Acceptance',
        timestamp: new Date(),
        updatedBy: req.user.firstName + ' ' + req.user.lastName,
        notes: `Assigned to ${isSP ? 'SP' : 'driver'} ${job.driver}`
      };
      
      // Add the assignment entry to history
      job.statusHistory.push(statusEntry);
      
      // Update job visibility to include the assigned driver
      await updateJobVisibility(job, newDriverId);
      
      // Schedule auto-rejection if not accepted within the timeout period
      scheduleAutoRejection(job._id);
      
      return res.json({
        message: `Job assigned to ${isSP ? 'SP' : 'driver'} successfully`,
        job: job
      });
    }
    
    const updatedJob = await job.save();
    
    // Emit socket event to all users who can see this job
    try {
      const { getIO } = require('../socket');
      const io = getIO();
      
      if (updatedJob.visibleTo && updatedJob.visibleTo.length > 0) {
        updatedJob.visibleTo.forEach(userId => {
          io.to(`user_${userId}`).emit('jobUpdated', updatedJob);
        });
        console.log(`Job status update event emitted to ${updatedJob.visibleTo.length} users`);
      }
    } catch (socketError) {
      console.error('Error emitting job status update event:', socketError);
    }
    
    res.json(updatedJob);
  } catch (error) {
    console.error('Error updating job status:', error);
    res.status(500).json({ message: error.message });
  }
};

// Mark a job as submitted for payment
const markJobPaymentSubmitted = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    job.paymentSubmitted = true;
    const updatedJob = await job.save();
    
    // Emit socket event to all users who can see this job
    try {
      const { getIO } = require('../socket');
      const io = getIO();
      
      if (updatedJob.visibleTo && updatedJob.visibleTo.length > 0) {
        updatedJob.visibleTo.forEach(userId => {
          io.to(`user_${userId}`).emit('jobUpdated', updatedJob);
        });
        console.log(`Job payment status update event emitted to ${updatedJob.visibleTo.length} users`);
      }
    } catch (socketError) {
      console.error('Error emitting job payment status update event:', socketError);
    }
    
    res.json(updatedJob);
  } catch (error) {
    console.error('Error marking job payment as submitted:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get jobs that are completed but not submitted for payment
const getUnsubmittedJobs = async (req, res) => {
  try {
    const query = { 
      provider: req.user.id,
      status: 'Completed',
      paymentSubmitted: false
    };
    
    const jobs = await Job.find(query);
    
    // Transform MongoDB _id to id for frontend compatibility
    const transformedJobs = jobs.map(job => {
      const jobObj = job.toObject();
      jobObj.id = jobObj._id.toString();
      return jobObj;
    });
    
    res.json(transformedJobs);
  } catch (error) {
    console.error('Error fetching unsubmitted jobs:', error);
    res.status(500).json({ message: error.message });
  }
};

// Assign a driver or SP to a job (from dispatcher side)
const assignDriverToJob = async (req, res) => {
  try {
    const { driverId, truck, preserveAssignedAt, originalAssignedAt } = req.body;
    
    console.log('assignDriverToJob called with params:', {
      jobId: req.params.id,
      driverId,
      truck,
      preserveAssignedAt,
      originalAssignedAt,
      requestUser: req.user.id
    });
    
    if (!driverId) {
      console.log('Driver/SP ID is missing in request');
      return res.status(400).json({ message: 'Driver/SP ID is required' });
    }
    
    const job = await Job.findById(req.params.id);
    if (!job) {
      console.log(`Job ${req.params.id} not found`);
      return res.status(404).json({ message: 'Job not found' });
    }
    
    console.log('Job found:', {
      id: job._id,
      status: job.status,
      currentDriver: job.driverId,
      needsAcceptance: job.needsAcceptance,
      assignedAt: job.assignedAt,
      firstAssignedAt: job.firstAssignedAt
    });
    
    // Fetch driver/SP information
    const User = require('../models/userModel');
    
    // Check if the user is a driver or an SP
    const user = await User.findById(driverId);
    
    if (!user) {
      console.log(`User ${driverId} not found`);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('User found:', {
      id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      primaryRole: user.primaryRole,
      secondaryRoles: user.secondaryRoles,
      isOnDuty: user.isOnDuty
    });
    
    // Check if the user is on duty
    if (!user.isOnDuty) {
      console.log(`User ${driverId} is not on duty`);
      return res.status(400).json({ message: 'User is not on duty' });
    }
    
    // Determine if this is an SP or a driver
    const isSP = user.primaryRole === 'SP';
    const isDriver = user.secondaryRoles && user.secondaryRoles.driver;
    
    if (!isSP && !isDriver) {
      console.log(`User ${driverId} is neither an SP nor has a driver secondary role`);
      return res.status(400).json({ message: 'User must be either an SP or have a driver secondary role' });
    }
    
    // Check if this is a redispatch (job already has a driver)
    const isRedispatch = job.driverId && job.driverId.toString() !== driverId;
    
    // Update job with driver/SP information
    job.driverId = driverId;
    job.driver = `${user.firstName} ${user.lastName}`;
    job.status = 'Pending Acceptance'; // Change status to pending acceptance
    job.needsAcceptance = true; // Explicitly set needsAcceptance flag
    
    // Handle assignedAt field based on whether this is a redispatch
    if (isRedispatch) {
      // If this is a redispatch and we want to preserve the original assignment time
      if (preserveAssignedAt && originalAssignedAt) {
        console.log(`Preserving original assignment time for redispatched job: ${originalAssignedAt}`);
        
        // If this is the first redispatch, store the original assignedAt in firstAssignedAt
        if (!job.firstAssignedAt) {
          job.firstAssignedAt = originalAssignedAt;
        }
        
        // Keep the original assignedAt value
        // Note: We don't modify job.assignedAt here, as we want to keep the original value
      } else {
        // If this is the first redispatch, store the current assignedAt in firstAssignedAt
        if (!job.firstAssignedAt && job.assignedAt) {
          job.firstAssignedAt = job.assignedAt;
        }
        
        // Update assignedAt to current time
        job.assignedAt = new Date();
      }
      
      // Reset acceptance-related fields when redispatching, regardless of previous acceptance
      job.acceptedAt = null; // Clear the acceptedAt timestamp
      
      // If the job was previously accepted, add a note to the status history
      const wasAccepted = job.status === 'Dispatched' || job.status === 'En Route' || 
                          job.status === 'On Site' || job.status === 'Accepted';
      
      if (wasAccepted) {
        console.log(`Job ${job._id} was previously accepted, resetting acceptance state for new driver`);
      }
    } else {
      // First-time assignment
      job.assignedAt = new Date();
      job.acceptedAt = null; // Ensure acceptedAt is null for new assignments
    }
    
    // Set auto-rejection time (6 minutes from now for SP, 2 minutes for driver)
    const autoRejectTime = new Date();
    if (isSP) {
      // 6 minutes for SP
      autoRejectTime.setMinutes(autoRejectTime.getMinutes() + 6);
    } else {
      // 2 minutes for driver
      autoRejectTime.setMinutes(autoRejectTime.getMinutes() + 2);
    }
    job.autoRejectAt = autoRejectTime;
    
    if (truck) {
      job.truck = truck;
    }
    
    console.log('Updating job with new values:', {
      driverId: job.driverId,
      driver: job.driver,
      status: job.status,
      needsAcceptance: job.needsAcceptance,
      assignedAt: job.assignedAt,
      firstAssignedAt: job.firstAssignedAt,
      autoRejectAt: job.autoRejectAt,
      acceptedAt: job.acceptedAt, // Log the reset acceptedAt field
      truck: job.truck,
      isRedispatch
    });
    
    // Create a status history entry for the assignment
    const statusEntry = {
      status: 'Pending Acceptance',
      timestamp: new Date(),
      updatedBy: req.user.firstName + ' ' + req.user.lastName,
      notes: isRedispatch 
        ? `Reassigned to ${isSP ? 'SP' : 'driver'} ${user.firstName} ${user.lastName}` 
        : `Assigned to ${isSP ? 'SP' : 'driver'} ${user.firstName} ${user.lastName}`
    };
    
    // Initialize statusHistory array if it doesn't exist
    if (!job.statusHistory) {
      job.statusHistory = [];
    }
    
    // Add the assignment entry to history
    job.statusHistory.push(statusEntry);
    
    // Update job visibility to include the assigned driver
    await updateJobVisibility(job, driverId);
    
    // Save the job before scheduling auto-rejection and sending notifications
    await job.save();
    console.log(`Job ${job._id} updated successfully with new driver assignment`);
    
    // Schedule auto-rejection if not accepted within the timeout period
    scheduleAutoRejection(job._id);
    
    // Send notification to the driver/SP using Socket.IO
    try {
      const { getIO, emitToUser } = require('../socket');

      // --- ADDED LOGGING ---
      console.log('assignDriverToJob: Called');
      console.log('assignDriverToJob: driverId =', driverId);
      // --- END ADDED LOGGING ---

      // Prepare the notification data
      const socketEvent = 'jobAssigned';
      const socketData = {
        jobId: job._id,
        message: `New job assigned: ${job.service} at ${job.location}`,
        jobDetails: {
          id: job._id,
          service: job.service,
          location: job.location,
          status: job.status,
          autoRejectAt: job.autoRejectAt,
          needsAcceptance: job.needsAcceptance
        }
      };
      
      console.log(`Preparing to emit ${socketEvent} to driver/SP ${driverId}:`, {
        jobId: job._id,
        service: job.service,
        location: job.location
      });
      
      // Use the enhanced emitToUser function for better error handling and logging
      const emitSuccess = emitToUser(driverId, socketEvent, socketData);

      // --- ADDED LOGGING ---
      console.log('assignDriverToJob: emitToUser result =', emitSuccess);
      // --- END ADDED LOGGING ---
      
      if (emitSuccess) {
        console.log(`Job assignment notification successfully sent to ${isSP ? 'SP' : 'driver'} ${driverId}`);
      } else {
        console.warn(`Job assignment notification may not have reached ${isSP ? 'SP' : 'driver'} ${driverId}`);
      }

      // Emit general job update to all users who can see this job
      if (job.visibleTo && job.visibleTo.length > 0) {
        const io = getIO();
        let updateCount = 0;

        job.visibleTo.forEach(userId => {
          try {
            // Skip the driver/SP who already received the jobAssigned event
            if (userId.toString() !== driverId.toString()) {
              io.to(`user_${userId}`).emit('jobUpdated', job);
              updateCount++;
            }
          } catch (userEmitError) {
            console.error(`Error emitting jobUpdated to user ${userId}:`, userEmitError);
          }
        });

        console.log(`Job assignment update event emitted to ${updateCount} users`);
      }
    } catch (socketError) {
      console.error(`Error sending job assignment notification:`, socketError);

      // Log detailed error information for debugging
      console.error('Error details:', {
        errorName: socketError.name,
        errorMessage: socketError.message,
        errorStack: socketError.stack,
        jobId: job._id,
        driverId: driverId
      });
    }

    res.json({
      message: `Job ${isRedispatch ? 'reassigned' : 'assigned'} to ${isSP ? 'SP' : 'driver'} successfully`,
      job
    });
  } catch (error) {
    console.error('Error assigning job:', error);
    res.status(500).json({ message: error.message });
  }
};

// Accept a job (from driver or SP side)
const acceptJob = async (req, res) => {
  try {
    const { eta } = req.body;
    
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Check if the job is assigned to the requesting user
    if (job.driverId && job.driverId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Job is assigned to a different user' });
    }
    
    // Determine if this is an SP or a driver
    const isSP = req.user.primaryRole === 'SP';
    
    // For SPs, ETA is required
    if (isSP && (!eta || eta === '')) {
      return res.status(400).json({ message: 'ETA is required for Service Providers' });
    }
    
    // Update job status
    job.status = 'Dispatched';
    
    // Update ETA if provided or if it's an SP (required for SPs)
    if (eta) {
      job.eta = eta;
    }
    
    job.acceptedAt = new Date();
    job.dispatchedAt = new Date(); // Record dispatch time
    
    // Clear the auto-rejection timeout and time since the job has been accepted
    if (autoRejectionTimeouts.has(job._id.toString())) {
      console.log(`Clearing auto-rejection timeout for job ${job._id} on acceptance`);
      clearTimeout(autoRejectionTimeouts.get(job._id.toString()));
      autoRejectionTimeouts.delete(job._id.toString());
    }
    job.autoRejectAt = null;
    
    // Initialize statusHistory array if it doesn't exist
    if (!job.statusHistory) {
      job.statusHistory = [];
    }
    
    // Add status change to history
    job.statusHistory.push({
      status: 'Dispatched',
      timestamp: new Date(),
      updatedBy: req.user.firstName + ' ' + req.user.lastName,
      notes: isSP ? `Accepted by SP with ETA: ${eta} minutes` : 'Accepted by driver'
    });
    
    await job.save();
    
    // Send notification to the dispatcher using Socket.IO
    try {
      const { getIO } = require('../socket');
      const io = getIO();
      
      // Emit to the job provider (dispatcher)
      if (job.provider) {
        io.to(`user_${job.provider}`).emit('jobAccepted', {
          jobId: job._id,
          message: `Job accepted by ${job.driver}${eta ? ` with ETA: ${eta} minutes` : ''}`,
          jobDetails: {
            id: job._id,
            service: job.service,
            location: job.location,
            status: job.status,
            eta: job.eta
          }
        });
        console.log(`Job acceptance notification sent to provider ${job.provider}`);
      }
      
      // Emit general job update to all users who can see this job
      if (job.visibleTo && job.visibleTo.length > 0) {
        job.visibleTo.forEach(userId => {
          io.to(`user_${userId}`).emit('jobUpdated', job);
        });
        console.log(`Job acceptance update event emitted to ${job.visibleTo.length} users`);
      }
    } catch (socketError) {
      console.error(`Error sending job acceptance notification:`, socketError);
    }
    
    res.json({
      message: 'Job accepted successfully',
      job
    });
  } catch (error) {
    console.error('Error accepting job:', error);
    res.status(500).json({ message: error.message });
  }
};

// Reject a job (from driver or SP side)
const rejectJob = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    
    if (!rejectionReason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }
    
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Check if the job is assigned to the requesting user
    if (job.driverId && job.driverId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Job is assigned to a different user' });
    }
    
    // Determine if this is an SP or a driver
    const isSP = req.user.primaryRole === 'SP';
    
    // Update job status with rejection information
    job.status = 'Rejected';
    job.rejectionReason = rejectionReason;
    job.rejectedAt = new Date();
    
    // Clear the auto-rejection timeout and time since the job has been manually rejected
    if (autoRejectionTimeouts.has(job._id.toString())) {
      console.log(`Clearing auto-rejection timeout for job ${job._id} on rejection`);
      clearTimeout(autoRejectionTimeouts.get(job._id.toString()));
      autoRejectionTimeouts.delete(job._id.toString());
    }
    job.autoRejectAt = null;
    
    // Track the rejection in the rejectedBy array
    if (!job.rejectedBy) {
      job.rejectedBy = [];
    }
    
    job.rejectedBy.push({
      driverId: req.user.id,
      driverName: req.user.firstName + ' ' + req.user.lastName,
      reason: rejectionReason,
      timestamp: new Date()
    });
    
    // Add status change to history
    if (!job.statusHistory) {
      job.statusHistory = [];
    }
    
    job.statusHistory.push({
      status: 'Rejected',
      timestamp: new Date(),
      updatedBy: req.user.firstName + ' ' + req.user.lastName,
      notes: `Rejected by ${isSP ? 'SP' : 'driver'} with reason: ${rejectionReason}`
    });
    
    await job.save();
    
    // Send notification to the dispatcher using Socket.IO
    try {
      const { getIO } = require('../socket');
      const io = getIO();
      
      // Emit to the job provider (dispatcher)
      if (job.provider) {
        io.to(`user_${job.provider}`).emit('jobRejected', {
          jobId: job._id,
          message: `Job rejected by ${job.driver} with reason: ${rejectionReason}`,
          jobDetails: {
            id: job._id,
            service: job.service,
            location: job.location,
            status: job.status,
            rejectionReason: job.rejectionReason
          }
        });
        console.log(`Job rejection notification sent to provider ${job.provider}`);
      }
      
      // Emit general job update to all users who can see this job
      if (job.visibleTo && job.visibleTo.length > 0) {
        job.visibleTo.forEach(userId => {
          io.to(`user_${userId}`).emit('jobUpdated', job);
        });
        console.log(`Job rejection update event emitted to ${job.visibleTo.length} users`);
      }
    } catch (socketError) {
      console.error(`Error sending job rejection notification:`, socketError);
    }
    
    res.json({
      message: 'Job rejected successfully',
      job
    });
  } catch (error) {
    console.error('Error rejecting job:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  getJobs, 
  createJob, 
  updateJobStatus,
  markJobPaymentSubmitted,
  getUnsubmittedJobs,
  assignDriverToJob,
  acceptJob,
  rejectJob
};
