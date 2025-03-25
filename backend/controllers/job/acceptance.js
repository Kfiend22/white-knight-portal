const Job = require('../../models/Job');

// Store active auto-rejection timeouts by job ID
const autoRejectionTimeouts = new Map();

// Debug helper to check field values
const debugJob = (job, prefix = '') => {
  console.log(`${prefix} Job Debug:`, {
    id: job._id,
    status: job.status,
    driverId: job.driverId,
    driver: job.driver,
    truck: job.truck,
    assignedAt: job.assignedAt,
    autoRejectAt: job.autoRejectAt,
    rejectedAt: job.rejectedAt
  });
};

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
    const User = require('../../models/userModel');
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

        // --- ADDED LOGGING ---
        console.log(`[AUTO-REJECTION] Timeout triggered for job ${jobId}`);
        // --- END ADDED LOGGING ---

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

        // --- ADDED LOGGING ---
        console.log(`[AUTO-REJECTION] Checking if job exists and is in Pending Acceptance: job=${job}, status=${job?.status}`);
        // --- END ADDED LOGGING ---
        
        // If job doesn't exist or is no longer in Pending Acceptance status, do nothing
        if (!job || job.status !== 'Pending Acceptance') {
          console.log(`Auto-rejection not needed for job ${jobId}: Job not found or status changed`);
          return;
        }

        // --- ADDED LOGGING ---
        console.log(`[AUTO-REJECTION] Checking if timer was reset: autoRejectTimerSetAt=${job.autoRejectTimerSetAt}, scheduledTime=${new Date(now.getTime() - autoRejectionTimeout).toISOString()}`);
        // --- END ADDED LOGGING ---
        
        // Enhanced check: Compare autoRejectTimerSetAt with the time the timeout was scheduled
        const scheduledTime = new Date(now.getTime() - autoRejectionTimeout); // Calculate when the timeout was scheduled
        
        // Skip this check if autoRejectTimerSetAt isn't set yet (for backward compatibility with existing jobs)
        if (job.autoRejectTimerSetAt && new Date(job.autoRejectTimerSetAt) > scheduledTime) {
          console.log(`Auto-rejection skipped for job ${jobId}: Timer was reset after this timeout was scheduled. autoRejectTimerSetAt: ${job.autoRejectTimerSetAt}, scheduledTime: ${scheduledTime.toISOString()}`);
          return;
        }

        // --- ADDED LOGGING ---
        console.log(`[AUTO-REJECTION] Checking if job was accepted: acceptedAt=${job.acceptedAt}`);
        // --- END ADDED LOGGING ---
        
        // Check if the job has been accepted (acceptedAt is set)
        if (job.acceptedAt) {
          console.log(`Auto-rejection not needed for job ${jobId}: Job already accepted`);
          return;
        }

        // --- ADDED LOGGING ---
        console.log(`[AUTO-REJECTION] Checking if job was redispatched: previousDrivers=${JSON.stringify(job.previousDrivers)}`);
        // --- END ADDED LOGGING ---
        
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
        const timeoutDuration = isSP ? '6 minutes' : '2 minutes';
        const currentTime = new Date();
        
        // Create standard rejection reason
        const autoRejectionReason = `Auto-expired: No response within ${timeoutDuration}`;

        // --- ADDED LOGGING ---
        console.log(`[AUTO-REJECTION] Updating job fields for job ${jobId}`);
        // --- END ADDED LOGGING ---
        
        // Update job status to Pending (not Rejected)
        job.status = 'Pending';
        job.rejectedAt = currentTime;
        job.rejectionReason = autoRejectionReason; // Also set the main rejection reason
        
        // Add to rejectedBy array to track the expired driver
        if (!job.rejectedBy) {
          job.rejectedBy = [];
        }
        
        // Add detailed entry to rejectedBy array with all needed information
        job.rejectedBy.push({
          driverId: expiredDriverId,
          driverName: expiredDriverName,
          reason: autoRejectionReason,
          timestamp: currentTime,
          type: 'auto-rejection',
          timeoutDuration: timeoutDuration
        });
        
        // Add status history entry
        if (!job.statusHistory) {
          job.statusHistory = [];
        }
        
        job.statusHistory.push({
          status: 'Pending',
          timestamp: currentTime,
          updatedBy: 'System',
          notes: `Acceptance expired: ${expiredDriverName} did not respond within ${timeoutDuration}`
        });
        
        // Clear driver assignment fields
        job.driverId = null;
        job.driver = null;
        job.truck = null;
        job.assignedAt = null;
    job.autoRejectAt = null;
    job.autoRejectTimerSetAt = null; // Clear the auto-rejection timer set timestamp
        // Keep firstAssignedAt for historical reference

        // --- ADDED LOGGING ---
        console.log(`[AUTO-REJECTION] Job fields updated for job ${jobId}`);
        // --- END ADDED LOGGING ---
        
        // Update job visibility now that the driver is unassigned
        const { updateJobVisibility } = require('./visibility');
        await updateJobVisibility(job);

        // --- ADDED LOGGING ---
        console.log(`[AUTO-REJECTION] Saving job ${jobId}`);
        // --- END ADDED LOGGING ---
        
        await job.save();
        console.log(`Job ${jobId} set back to Pending after acceptance expired`);

        // --- ADDED LOGGING ---
        console.log(`[AUTO-REJECTION] Job ${jobId} saved successfully`);
        // --- END ADDED LOGGING ---
        
        // Verify job state after modifications
        debugJob(job, 'AFTER MODIFYING JOB FOR AUTO-REJECTION:');

        // --- ADDED LOGGING ---
        console.log(`[AUTO-REJECTION] Sending socket notifications for job ${jobId}`);
        // --- END ADDED LOGGING ---
        
        // Send simplified notification to managing users using Socket.IO
        try {
          const { getIO, emitToUser } = require('../../socket');
          const io = getIO();
          
          // Create a clean job object for socket transmission
          const jobForSocket = job.toObject();
          
          // Emit job expiration notification to all users who can see this job
          if (job.visibleTo && job.visibleTo.length > 0) {
            let notificationCount = 0;
            job.visibleTo.forEach(userId => {
              // Don't emit to the driver who just got auto-rejected
              if (userId.toString() !== expiredDriverId.toString()) {
                // Emit simplified jobAutoRejected notification with just "expired" message
                io.to(`user_${userId}`).emit('jobAutoRejected', {
                  jobId: job._id,
                  message: "expired",
                  jobDetails: {
                    id: job._id,
                    service: job.service,
                    location: job.location,
                    status: job.status,
                    previousDriver: expiredDriverName
                  }
                });
                
                // Also send the updated job data 
                io.to(`user_${userId}`).emit('jobUpdated', jobForSocket);
                notificationCount++;
              }
            });
            console.log(`Job auto-rejection notifications sent to ${notificationCount} users (excluding auto-rejected driver)`);
          }
          
          // Also explicitly emit to the driver to ensure it's removed from their dashboard
          // Use the enhanced emitToUser function for better error handling and logging
          if (expiredDriverId) {
            const socketData = {
              ...jobForSocket,
              _previousState: {
                status: 'Pending Acceptance',
                driverId: expiredDriverId,
                driver: expiredDriverName
              },
              autoRejection: {
                reason: autoRejectionReason,
                timestamp: currentTime.toISOString(),
                timeoutDuration: timeoutDuration
              }
            };
            
            // Send multiple types of events to ensure the driver's frontend receives the update
            emitToUser(expiredDriverId, 'jobUpdated', socketData);
            io.to(`user_${expiredDriverId}`).emit('jobRemoved', {
              jobId: job._id,
              reason: 'expired'
            });
            console.log(`Job expiration update sent to driver ${expiredDriverName} to remove from dashboard`);
          }
        } catch (socketError) {
          console.error(`Error sending acceptance expiration notification:`, socketError);
        }

        // --- ADDED LOGGING ---
        console.log(`[AUTO-REJECTION] Socket notifications sent for job ${jobId}`);
        // --- END ADDED LOGGING ---
        
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
    
    // Only set acceptedAt if it's not already set
    if (!job.acceptedAt) {
      job.acceptedAt = new Date();
    }
    job.dispatchedAt = new Date(); // Record dispatch time
    
    // Clear the auto-rejection timeout and time since the job has been accepted
    if (autoRejectionTimeouts.has(job._id.toString())) {
      console.log(`Clearing auto-rejection timeout for job ${job._id} on acceptance`);
      clearTimeout(autoRejectionTimeouts.get(job._id.toString()));
      autoRejectionTimeouts.delete(job._id.toString());
    }
    job.autoRejectAt = null;
    job.autoRejectTimerSetAt = null; // Clear the auto-rejection timer set timestamp
    
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
      const { getIO } = require('../../socket');
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
  console.log('rejectJob function called with', {
    jobId: req.params.id,
    userId: req.user.id,
    body: req.body
  });
  
  const currentTime = new Date();
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
    
    debugJob(job, 'BEFORE REJECTION:');
    
    // Update job status with rejection information
    job.status = 'Pending'; // Change directly to Pending instead of Rejected
    job.rejectionReason = rejectionReason;
    job.rejectedAt = currentTime;
    
    // Clear the auto-rejection timeout and time since the job has been manually rejected
    if (autoRejectionTimeouts.has(job._id.toString())) {
      console.log(`Clearing auto-rejection timeout for job ${job._id} on rejection`);
      clearTimeout(autoRejectionTimeouts.get(job._id.toString()));
      autoRejectionTimeouts.delete(job._id.toString());
    }
    job.autoRejectAt = null;
    job.autoRejectTimerSetAt = null; // Clear the auto-rejection timer set timestamp
    
    // Store driver ID and name before clearing
    const rejectingDriverId = req.user.id;
    const rejectingDriverName = req.user.firstName + ' ' + req.user.lastName;
    
    // Track the rejection in the rejectedBy array
    if (!job.rejectedBy) {
      job.rejectedBy = [];
    }
    
    job.rejectedBy.push({
      driverId: rejectingDriverId,
      driverName: rejectingDriverName,
      reason: rejectionReason,
      timestamp: currentTime,
      type: 'manual-rejection'
    });
    
    // Add status change to history
    if (!job.statusHistory) {
      job.statusHistory = [];
    }
    
    job.statusHistory.push({
      status: 'Rejected',
      timestamp: currentTime,
      updatedBy: rejectingDriverName,
      notes: `Rejected by ${isSP ? 'SP' : 'driver'} with reason: ${rejectionReason}`
    });
    
    // Clear driver assignment fields
    job.driverId = null;
    job.driver = null;
    job.truck = null;
    job.assignedAt = null;
    
    // Update job visibility now that the driver is unassigned
    const { updateJobVisibility } = require('./visibility');
    await updateJobVisibility(job);
    
    // Save the updated job
    await job.save();
    
    // Verify job state after rejection
    debugJob(job, 'AFTER REJECTION:');
    
    // Send notification to the dispatcher using Socket.IO
    try {
      const { getIO, emitToUser } = require('../../socket');
      const io = getIO();
      
      // Create a clean job object for socket transmission
      const jobForSocket = job.toObject();
      
      // Emit to the job provider (dispatcher)
      if (job.provider) {
        io.to(`user_${job.provider}`).emit('jobRejected', {
          jobId: job._id,
          message: `Job rejected by ${rejectingDriverName} with reason: ${rejectionReason}`,
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
          io.to(`user_${userId}`).emit('jobUpdated', jobForSocket);
        });
        console.log(`Job rejection update event emitted to ${job.visibleTo.length} users`);
      }
      
      // Also explicitly emit to the rejecting driver to ensure it's removed from their dashboard
      // Use the enhanced emitToUser function for better error handling and logging
      const socketData = {
        ...jobForSocket,
        _previousState: {
          status: 'Pending Acceptance',
          driverId: rejectingDriverId,
          driver: rejectingDriverName
        },
        manualRejection: {
          reason: rejectionReason,
          timestamp: currentTime.toISOString()
        }
      };
      
      // Send multiple types of events to ensure the driver's frontend receives the update
      emitToUser(rejectingDriverId, 'jobUpdated', socketData);
      io.to(`user_${rejectingDriverId}`).emit('jobRemoved', {
        jobId: job._id,
        reason: 'rejected'
      });
      console.log(`Job rejection update sent to driver ${rejectingDriverName} to remove from dashboard`);
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
  autoRejectionTimeouts,
  scheduleAutoRejection,
  acceptJob,
  rejectJob
};
