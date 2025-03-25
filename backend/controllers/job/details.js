const Job = require('../../models/Job');
const User = require('../../models/userModel');

/**
 * Update job details (non-status fields)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Updated job
 */
const updateJobDetails = async (req, res) => {
  try {
    console.log('=== JOB UPDATE DEBUG ===');
    console.log('Job ID:', req.params.id);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // Find the job by ID
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    console.log('Original job notes:');
    console.log('- internalNotes:', job.internalNotes);
    console.log('- dispatcherNotes:', job.dispatcherNotes);
    console.log('- invoiceNotes:', job.invoiceNotes);

    // Extract fields from request body
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
      // Driver assignment fields
      driverId,
      driver,
      status,
      needsAcceptance,
      truck
    } = req.body;

    // Update basic fields
    if (account) job.account = account;
    if (customerName) job.customerName = customerName;
    if (customerPhone) job.customerPhone = customerPhone;
    if (customerEmail) job.customerEmail = customerEmail;
    if (callerName !== undefined) job.callerName = callerName;
    if (callerPhone !== undefined) job.callerPhone = callerPhone;
    if (service) {
      job.service = service;
      job.title = `${service} for ${job.customerName}`;
    }
    if (paymentType) job.paymentType = paymentType;
    console.log('Notes from request:');
    console.log('- internalNotes:', internalNotes);
    console.log('- dispatcherNotes:', dispatcherNotes);
    console.log('- invoiceNotes:', invoiceNotes);
    
    if (internalNotes !== undefined) job.internalNotes = internalNotes;
    if (dispatcherNotes !== undefined) job.dispatcherNotes = dispatcherNotes;
    if (invoiceNotes !== undefined) job.invoiceNotes = invoiceNotes;
    
    console.log('Job notes after update (before save):');
    console.log('- internalNotes:', job.internalNotes);
    console.log('- dispatcherNotes:', job.dispatcherNotes);
    console.log('- invoiceNotes:', job.invoiceNotes);
    if (eta) job.eta = eta;
    if (classType) job.classType = classType;
    if (serviceLocationType !== undefined) job.serviceLocationType = serviceLocationType;
    if (dropoffLocationType !== undefined) job.dropoffLocationType = dropoffLocationType;

    // Update service location if provided
    if (serviceLocation) {
      job.serviceLocation = serviceLocation;
      
      // Update location string for backward compatibility
      job.location = `${serviceLocation.street}, ${serviceLocation.city}, ${serviceLocation.state} ${serviceLocation.zip}`;
    }

    // Update dropoff location if provided
    if (dropoffLocation) {
      job.dropoffLocation = dropoffLocation;
    }

    // Update vehicle information if provided
    if (year || make || model || color || license || vin || odometer) {
      if (!job.vehicle) {
        job.vehicle = {};
      }
      
      if (year) job.vehicle.year = year;
      if (make) job.vehicle.make = make;
      if (model) job.vehicle.model = model;
      if (color) job.vehicle.color = color;
      if (license) job.vehicle.license = license;
      if (vin) job.vehicle.vin = vin;
      if (odometer) job.vehicle.odometer = odometer;
    }

    // Update pickup contact if provided
    if (pickupContact && (pickupContact.name || pickupContact.number)) {
      job.pickupContact = pickupContact;
    }

    // Update dropoff contact if provided
    if (dropoffContact && (dropoffContact.name || dropoffContact.number)) {
      job.dropoffContact = dropoffContact;
    }

    // Handle driver assignment
    if (driverId) {
      // Check if this is a new driver assignment or a reassignment
      const isNewAssignment = !job.driverId;
      const isReassignment = job.driverId && job.driverId.toString() !== driverId;
      
      console.log(`Driver assignment in updateJobDetails: isNewAssignment=${isNewAssignment}, isReassignment=${isReassignment}`);
      
      // Fetch the driver/SP information
      const driverUser = await User.findById(driverId);
      
      if (!driverUser) {
        return res.status(404).json({ message: 'Driver/SP not found' });
      }
      
      // Check if the user is on duty
      if (!driverUser.isOnDuty) {
        return res.status(400).json({ message: 'Driver/SP is not on duty' });
      }
      
      // Determine if this is an SP or a driver
      const isSP = driverUser.primaryRole === 'SP';
      
      // Update driver information
      job.driverId = driverId;
      job.driver = driver || `${driverUser.firstName} ${driverUser.lastName}`;
      
      // Update truck if provided
      if (truck) {
        job.truck = truck;
      }
      
      // Check if the driver is actually changing
      if (isNewAssignment || isReassignment) {
        // Only reset acceptance-related fields if the driver is changing
        console.log(`Driver is changing, resetting acceptance fields for job ${job._id}`);
        
        // Set job status to Pending Acceptance
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
        
        // If this is a reassignment, store the previous driver information
        if (isReassignment) {
          if (!job.previousDrivers) {
            job.previousDrivers = [];
          }
          
          job.previousDrivers.push({
            driverId: job.driverId,
            driverName: job.driver,
            reassignedAt: new Date(),
            reassignedBy: req.user.firstName + ' ' + req.user.lastName
          });
        }
        
        // Reset acceptance-related fields
        job.acceptedAt = null;
        
        // Schedule auto-rejection if not accepted within the timeout period
        const { scheduleAutoRejection } = require('./acceptance');
        scheduleAutoRejection(job._id);
      } else {
        console.log(`Driver is not changing for job ${job._id}, keeping existing acceptance status`);
      }
      
      // Update job visibility to include the assigned driver
      const { updateJobVisibility } = require('./visibility');
      await updateJobVisibility(job, driverId);
    } else if (job.driverId && !driverId) {
      // If driver was previously assigned but now removed, clear driver fields
      job.driverId = null;
      job.driver = null;
      job.truck = null;
      job.status = 'Pending'; // Reset to pending status
      job.needsAcceptance = false;
      job.assignedAt = null;
      job.autoRejectAt = null;
      
      // Update job visibility now that the driver is unassigned
      const { updateJobVisibility } = require('./visibility');
      await updateJobVisibility(job);
    }

    // Add an entry to status history for the update
    if (!job.statusHistory) {
      job.statusHistory = [];
    }

    job.statusHistory.push({
      status: job.status, // Use the current status (which may have been updated)
      timestamp: new Date(),
      updatedBy: req.user.firstName + ' ' + req.user.lastName,
      notes: driverId ? 'Job updated and driver assigned' : 'Job details updated'
    });

    // Update job visibility
    const { updateJobVisibility } = require('./visibility');
    await updateJobVisibility(job);

    // Save the updated job
    console.log('Saving job with notes:');
    console.log('- internalNotes:', job.internalNotes);
    console.log('- dispatcherNotes:', job.dispatcherNotes);
    console.log('- invoiceNotes:', job.invoiceNotes);
    
    const updatedJob = await job.save();
    
    console.log('Job after save:');
    console.log('- internalNotes:', updatedJob.internalNotes);
    console.log('- dispatcherNotes:', updatedJob.dispatcherNotes);
    console.log('- invoiceNotes:', updatedJob.invoiceNotes);

    // Emit socket event to all users who can see this job
    try {
      const { getIO } = require('../../socket');
      const io = getIO();
      
      if (updatedJob.visibleTo && updatedJob.visibleTo.length > 0) {
        updatedJob.visibleTo.forEach(userId => {
          io.to(`user_${userId}`).emit('jobUpdated', updatedJob);
        });
        console.log(`Job details update event emitted to ${updatedJob.visibleTo.length} users`);
      }
    } catch (socketError) {
      console.error('Error emitting job details update event:', socketError);
    }

    res.json({
      message: 'Job details updated successfully',
      job: updatedJob
    });
  } catch (error) {
    console.error('Error updating job details:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update job ETA only
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Updated job
 */
const updateJobETA = async (req, res) => {
  try {
    // Find the job by ID
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Extract ETA from request body
    const { eta } = req.body;
    
    if (eta === undefined) {
      return res.status(400).json({ message: 'ETA is required' });
    }

    // Update only the ETA field
    job.eta = eta;
    
    // Add an entry to status history for the ETA update
    if (!job.statusHistory) {
      job.statusHistory = [];
    }

    job.statusHistory.push({
      status: job.status, // Keep the current status
      timestamp: new Date(),
      updatedBy: req.user.firstName + ' ' + req.user.lastName,
      notes: `ETA updated to ${eta} minutes`
    });

    // Save the updated job
    const updatedJob = await job.save();

    // Emit socket event to all users who can see this job
    try {
      const { getIO } = require('../../socket');
      const io = getIO();
      
      if (updatedJob.visibleTo && updatedJob.visibleTo.length > 0) {
        updatedJob.visibleTo.forEach(userId => {
          io.to(`user_${userId}`).emit('jobUpdated', updatedJob);
        });
        console.log(`Job ETA update event emitted to ${updatedJob.visibleTo.length} users`);
      }
    } catch (socketError) {
      console.error('Error emitting job ETA update event:', socketError);
    }

    res.json({
      message: 'Job ETA updated successfully',
      job: updatedJob
    });
  } catch (error) {
    console.error('Error updating job ETA:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  updateJobDetails,
  updateJobETA
};
