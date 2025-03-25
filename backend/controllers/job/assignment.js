const Job = require('../../models/Job');
const User = require('../../models/userModel');
const Vehicle = require('../../models/Vehicle');

// Assign a driver or SP to a job (from dispatcher side)
const assignDriverToJob = async (req, res) => {
  try {
    const { driverId, truck, preserveAssignedAt, originalAssignedAt } = req.body;

    // Log the entire request body and types of driverId and truck
    console.log('assignDriverToJob called with params:', {
      jobId: req.params.id,
      reqBody: req.body, // Log the entire request body
      driverIdType: typeof driverId, // Log the type of driverId
      truckType: typeof truck,     // Log the type of truck
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
    
    // Store the original ETA before redispatching to preserve it
    const originalEta = job.eta;
    
    console.log('Job found:', {
      id: job._id,
      status: job.status,
      currentDriver: job.driverId,
      needsAcceptance: job.needsAcceptance,
      assignedAt: job.assignedAt,
      firstAssignedAt: job.firstAssignedAt,
      eta: originalEta // Log the ETA we're preserving
    });
    
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
    
    // --- Vehicle Availability Logic ---
    
    // Check if the driver already has a vehicle assigned
    let driverVehicle = await Vehicle.findOne({ driverId: driverId });
    
    // If truck parameter is provided, check if it's a valid vehicle name or ID
    let selectedVehicle = null;
    if (truck) {
      try {
        // Try to find the vehicle by name first
        selectedVehicle = await Vehicle.findOne({ name: truck });
        
        // If not found by name, try to find by ID
        if (!selectedVehicle) {
          try {
            selectedVehicle = await Vehicle.findById(truck);
          } catch (idError) {
            // Ignore the CastError if truck is not a valid ObjectId
            console.log(`Vehicle ID lookup failed: ${idError.message}`);
          }
        }
        
        if (!selectedVehicle) {
          console.log(`Vehicle ${truck} not found by name or ID`);
          return res.status(400).json({ message: 'Vehicle not found' });
        }
        
        // Check if the vehicle is already assigned to another driver
        if (selectedVehicle.driverId && 
            selectedVehicle.driverId.toString() !== driverId.toString()) {
          console.log(`Vehicle ${truck} is already assigned to another driver: ${selectedVehicle.driverId}`);
          return res.status(400).json({ message: 'Vehicle is already assigned to another driver' });
        }
        
        // Check if the vehicle is on duty
        if (selectedVehicle.status !== 'On Duty') {
          console.log(`Vehicle ${truck} is not on duty (status: ${selectedVehicle.status})`);
          return res.status(400).json({ message: 'Vehicle is not on duty' });
        }
      } catch (error) {
        console.error(`Error finding vehicle ${truck}:`, error);
        return res.status(400).json({ message: 'Invalid vehicle ID format' });
      }
    }
    
    // If driver already has a vehicle assigned, use that one
    if (driverVehicle) {
      console.log(`Driver ${driverId} already has vehicle ${driverVehicle.name} assigned`);
      
      // If a different vehicle was specified, unassign the current one and assign the new one
      if (selectedVehicle && selectedVehicle._id.toString() !== driverVehicle._id.toString()) {
        console.log(`Unassigning vehicle ${driverVehicle.name} from driver ${driverId}`);
        driverVehicle.driverId = null;
        driverVehicle.driverName = null;
        driverVehicle.isAvailable = true;
        await driverVehicle.save();
        
        // Assign the new vehicle
        selectedVehicle.driverId = driverId;
        selectedVehicle.driverName = `${user.firstName} ${user.lastName}`;
        selectedVehicle.isAvailable = false;
        await selectedVehicle.save();
        
        // Update the truck field in the job
        job.truck = selectedVehicle.name;
      } else {
        // Use the driver's current vehicle
        job.truck = driverVehicle.name;
      }
    } else if (selectedVehicle) {
      // Driver doesn't have a vehicle, but one was specified
      console.log(`Assigning vehicle ${selectedVehicle.name} to driver ${driverId}`);
      selectedVehicle.driverId = driverId;
      selectedVehicle.driverName = `${user.firstName} ${user.lastName}`;
      selectedVehicle.isAvailable = false;
      await selectedVehicle.save();
      
      // Update the truck field in the job
      job.truck = selectedVehicle.name;
    } else {
      // Driver doesn't have a vehicle and none was specified
      // Find an available vehicle
      const availableVehicles = await Vehicle.find({ 
        isAvailable: true, 
        status: 'On Duty',
        // Use the user's vendorId to filter vehicles
        vendorId: user.vendorId || user.vendorNumber
      });
      
      if (availableVehicles.length === 0) {
        console.log(`No available vehicles for driver ${driverId}`);
        return res.status(400).json({ message: 'No vehicles available for assignment' });
      }
      
      // Assign the first available vehicle
      const vehicleToAssign = availableVehicles[0];
      console.log(`Auto-assigning vehicle ${vehicleToAssign.name} to driver ${driverId}`);
      vehicleToAssign.driverId = driverId;
      vehicleToAssign.driverName = `${user.firstName} ${user.lastName}`;
      vehicleToAssign.isAvailable = false;
      await vehicleToAssign.save();
      
      // Update the truck field in the job
      job.truck = vehicleToAssign.name;
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
      }
      
      // Always store the first assignment time if this is the first redispatch
      if (!job.firstAssignedAt && job.assignedAt) {
        job.firstAssignedAt = job.assignedAt;
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
    const currentTime = new Date(); // To set autoRejectTimerSetAt
    if (isSP) {
      // 6 minutes for SP
      autoRejectTime.setMinutes(autoRejectTime.getMinutes() + 6);
    } else {
      // 2 minutes for driver
      autoRejectTime.setMinutes(autoRejectTime.getMinutes() + 2);
    }
    job.autoRejectAt = autoRejectTime;
    job.autoRejectTimerSetAt = currentTime; // Add this field to track when timer was set
    
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
    const { updateJobVisibility } = require('./visibility');
    await updateJobVisibility(job, driverId);
    
    // Make sure the original ETA is preserved during redispatch
    if (isRedispatch) {
      // Restore the original ETA to ensure it's not reset during redispatch
      job.eta = originalEta;
      console.log(`Preserved original ETA (${originalEta}) for job ${job._id} during redispatch`);
    }
    
    // Save the job before scheduling auto-rejection and sending notifications
    await job.save();
    console.log(`Job ${job._id} updated successfully with new driver assignment, ETA: ${job.eta}`);
    
    // Schedule auto-rejection if not accepted within the timeout period
    const { scheduleAutoRejection } = require('./acceptance');
    scheduleAutoRejection(job._id);
    
    // Send notification to the driver/SP using Socket.IO
    try {
      const { getIO, emitToUser } = require('../../socket');

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

module.exports = {
  assignDriverToJob
};
