const Job = require('../../models/Job');

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
      const User = require('../../models/userModel');
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
      
      // Check if the driver is actually changing
      if (newDriverId !== previousDriverId) {
        console.log(`Driver is changing from ${previousDriverId} to ${newDriverId}, resetting acceptance fields for job ${job._id}`);
        
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
        
        // Schedule auto-rejection if not accepted within the timeout period
        const { scheduleAutoRejection } = require('./acceptance');
        scheduleAutoRejection(job._id);
      } else {
        console.log(`Driver ID is the same (${newDriverId}), not resetting acceptance fields for job ${job._id}`);
        
        // Create a status history entry for the update
        const statusEntry = {
          status: job.status, // Keep the current status
          timestamp: new Date(),
          updatedBy: req.user.firstName + ' ' + req.user.lastName,
          notes: `Updated driver information without changing driver ID`
        };
        
        // Initialize statusHistory array if it doesn't exist
        if (!job.statusHistory) {
          job.statusHistory = [];
        }
        
        // Add the update entry to history
        job.statusHistory.push(statusEntry);
      }
      
      const updatedJob = await job.save();
      
      // Return the updated job with a specific message about reassignment
      return res.json({
        message: `Job reassigned to ${isSP ? 'SP' : 'driver'} successfully`,
        job: updatedJob
      });
    }
    
// Handle normal status update (non-reassignment)
    const newStatus = status || job.status;
    job.status = newStatus;
    
    // Log job state for debugging
    console.log('Job state before status update:', {
      id: job._id,
      status: previousStatus,
      newStatus: newStatus,
      driverId: job.driverId,
      driver: job.driver,
      truck: job.truck
    });
    
    // If setting status to Pending and the job was previously assigned to a driver,
    // clear the driver assignment fields (to handle rejections properly)
    if (newStatus === 'Pending' && job.driverId && (rejectionReason || previousStatus === 'Pending Acceptance')) {
      console.log(`Clearing driver assignment fields for job ${job._id} due to rejection/expiry`);
      
      // Store driver info before clearing
      const clearedDriverId = job.driverId;
      const clearedDriverName = job.driver;
      
      // Track the rejection/expiry in rejectedBy array
      if (!job.rejectedBy) {
        job.rejectedBy = [];
      }
      
      // Only add to rejectedBy if a reason is provided and it's not already recorded
      if (rejectionReason && !job.rejectedBy.some(r => 
          r.driverId?.toString() === clearedDriverId?.toString() && 
          r.reason === rejectionReason)) {
        job.rejectedBy.push({
          driverId: clearedDriverId,
          driverName: clearedDriverName,
          reason: rejectionReason || 'Auto-expired or unassigned',
          timestamp: new Date()
        });
      }
      
      // Clear driver assignment fields
      job.driverId = null;
      job.driver = null;
      job.truck = null;
      job.assignedAt = null;
      job.autoRejectAt = null;
      job.rejectedAt = new Date();
      
      // Update job visibility now that the driver is unassigned
      const { updateJobVisibility } = require('./visibility');
      await updateJobVisibility(job);
    }
    
    // Create a status history entry
    const statusEntry = {
      status: newStatus,
      timestamp: new Date(),
      updatedBy: req.user.firstName + ' ' + req.user.lastName
    };
    
    // Add notes if this is a rejection
    if (rejectionReason) {
      statusEntry.notes = `Rejection reason: ${rejectionReason}`;
    }
    
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
        
      case 'Waiting':
        // If the job has a driver assigned, unassign them
        if (job.driverId) {
          console.log(`Job ${job._id} status changed to Waiting, unassigning driver ${job.driverId}`);
          
          // Store driver info before clearing
          const clearedDriverId = job.driverId;
          const clearedDriverName = job.driver;
          
          // Clear driver assignment fields
          job.driverId = null;
          job.driver = null;
          job.truck = null;
          job.assignedAt = null;
          job.autoRejectAt = null;
          
          // Update job visibility now that the driver is unassigned
          const { updateJobVisibility } = require('./visibility');
          await updateJobVisibility(job);
        }
        break;
        
      case 'Awaiting Approval':
        // Check if the current status is 'On Site' before allowing GOA
        if (previousStatus !== 'On Site') {
          return res.status(400).json({ 
            message: 'Job can only be marked as GOA when its status is On Site' 
          });
        }
        
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
      const User = require('../../models/userModel');
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
      
      // Check if the driver is actually changing
      const isDriverChanging = !job.driverId || job.driverId.toString() !== newDriverId;
      
      job.driverId = newDriverId;
      job.driver = driver || `${newUser.firstName} ${newUser.lastName}`;
      
      if (truck) {
        job.truck = truck;
      }
      
      if (isDriverChanging) {
        console.log(`New driver assignment for job ${job._id}, setting to Pending Acceptance`);
        
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
        
        // Create a status history entry for the assignment
        const statusEntry = {
          status: 'Pending Acceptance',
          timestamp: new Date(),
          updatedBy: req.user.firstName + ' ' + req.user.lastName,
          notes: `Assigned to ${isSP ? 'SP' : 'driver'} ${job.driver}`
        };
        
        // Add the assignment entry to history
        job.statusHistory.push(statusEntry);
        
        // Schedule auto-rejection if not accepted within the timeout period
        const { scheduleAutoRejection } = require('./acceptance');
        scheduleAutoRejection(job._id);
      } else {
        console.log(`Driver ID is the same (${newDriverId}), not resetting acceptance fields for job ${job._id}`);
        
        // Create a status history entry for the update
        const statusEntry = {
          status: job.status, // Keep the current status
          timestamp: new Date(),
          updatedBy: req.user.firstName + ' ' + req.user.lastName,
          notes: `Updated driver information without changing driver ID`
        };
        
        // Add the update entry to history
        job.statusHistory.push(statusEntry);
      }
      
      // Update job visibility to include the assigned driver
      const { updateJobVisibility } = require('./visibility');
      await updateJobVisibility(job, newDriverId);
      
      return res.json({
        message: `Job assigned to ${isSP ? 'SP' : 'driver'} successfully`,
        job: job
      });
    }
    
    const updatedJob = await job.save();
    
    // Log job state after status update
    console.log('Job state after status update:', {
      id: updatedJob._id,
      status: updatedJob.status,
      driverId: updatedJob.driverId,
      driver: updatedJob.driver,
      truck: updatedJob.truck
    });
    
    // Emit socket event to all users who can see this job
    try {
      const { getIO, emitToUser } = require('../../socket');
      const io = getIO();
      
      // Create a job object suitable for socket transmission
      const jobForSocket = updatedJob.toObject();
      
      // If this was a driver unassignment (previous driver but no current driver),
      // we need to notify the removed driver
      if (previousDriverId && !updatedJob.driverId) {
        const clearedDriverId = previousDriverId;
        
        // Include previous state information for the frontend
        const socketData = {
          ...jobForSocket,
          _previousState: {
            status: previousStatus,
            driverId: clearedDriverId
          }
        };
        
        // Explicitly send update to the removed driver (to ensure it's removed from their dashboard)
        emitToUser(clearedDriverId, 'jobUpdated', socketData);
        
        // Also send a specific removal event
        io.to(`user_${clearedDriverId}`).emit('jobRemoved', {
          jobId: updatedJob._id,
          reason: 'unassigned'
        });
        
        console.log(`Job unassignment update sent to removed driver ${clearedDriverId}`);
      }
      
      // Send updates to all visible users
      if (updatedJob.visibleTo && updatedJob.visibleTo.length > 0) {
        updatedJob.visibleTo.forEach(userId => {
          io.to(`user_${userId}`).emit('jobUpdated', jobForSocket);
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

// Report job as unsuccessful (requires approval)
const reportJobUnsuccessful = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    const { unsuccessfulReason } = req.body;
    
    // Check if a reason was provided
    if (!unsuccessfulReason) {
      return res.status(400).json({ message: 'A reason is required to mark a job as unsuccessful' });
    }
    
    // Set approval status to pending (job remains in current status)
    job.approvalStatusUnsuccessful = 'pending';
    job.unsuccessfulReason = unsuccessfulReason;
    
    // Create a status history entry
    const statusEntry = {
      status: job.status, // Keep current status
      timestamp: new Date(),
      updatedBy: req.user.firstName + ' ' + req.user.lastName,
      notes: `Requested to mark as unsuccessful with reason: ${unsuccessfulReason} (awaiting approval)`
    };
    
    // Initialize statusHistory array if it doesn't exist
    if (!job.statusHistory) {
      job.statusHistory = [];
    }
    
    // Add the new status entry to history
    job.statusHistory.push(statusEntry);
    
    const updatedJob = await job.save();
    
    // Emit socket event to all users who can see this job
    try {
      const { getIO } = require('../../socket');
      const io = getIO();
      
      if (updatedJob.visibleTo && updatedJob.visibleTo.length > 0) {
        updatedJob.visibleTo.forEach(userId => {
          io.to(`user_${userId}`).emit('jobUpdated', updatedJob);
        });
        console.log(`Job unsuccessful request event emitted to ${updatedJob.visibleTo.length} users`);
      }
    } catch (socketError) {
      console.error('Error emitting job unsuccessful request event:', socketError);
    }
    
    res.json({
      message: 'Job unsuccessful request submitted successfully (awaiting approval)',
      job: updatedJob
    });
  } catch (error) {
    console.error('Error submitting unsuccessful request:', error);
    res.status(500).json({ message: error.message });
  }
};

// Approve unsuccessful request
const approveUnsuccessful = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Check if the job has a pending unsuccessful request
    if (job.approvalStatusUnsuccessful !== 'pending') {
      return res.status(400).json({ message: 'Job does not have a pending unsuccessful request' });
    }
    
    // Check if the user has the required role (OW, sOW, RM)
    const allowedPrimaryRoles = ['OW', 'sOW', 'RM'];
    const allowedSecondaryRoles = ['dispatcher', 'answeringService', 'admin'];
    
    const hasAllowedPrimaryRole = allowedPrimaryRoles.includes(req.user.primaryRole);
    
    // Check if user has any of the allowed secondary roles
    let hasAllowedSecondaryRole = false;
    if (req.user.secondaryRoles) {
      if (Array.isArray(req.user.secondaryRoles)) {
        // If secondaryRoles is an array, check if it includes any of the allowed roles
        hasAllowedSecondaryRole = allowedSecondaryRoles.some(role => req.user.secondaryRoles.includes(role));
      } else if (typeof req.user.secondaryRoles === 'object') {
        // If secondaryRoles is an object, check if any of the allowed roles is true
        hasAllowedSecondaryRole = allowedSecondaryRoles.some(role => req.user.secondaryRoles[role]);
      }
    }
    
    // Check if user has a vendor ID starting with "OWNER"
    const hasOwnerVendorId = req.user.vendorId && req.user.vendorId.startsWith('OWNER');
    
    // User must have either an allowed primary role OR (an allowed secondary role AND an owner vendor ID)
    if (!hasAllowedPrimaryRole && !(hasAllowedSecondaryRole && hasOwnerVendorId)) {
      return res.status(403).json({ 
        message: 'Only OW, sOW, RM users, or users with dispatcher/answeringService/admin roles and OWNER vendor ID can approve unsuccessful requests' 
      });
    }
    
    // Update job status to Unsuccessful and mark as approved
    job.status = 'Unsuccessful';
    job.approvalStatusUnsuccessful = 'approved';
    job.unsuccessfulApprovedBy = req.user.id;
    job.unsuccessfulApprovedAt = new Date();
    
    // Add status change to history
    if (!job.statusHistory) {
      job.statusHistory = [];
    }
    
    job.statusHistory.push({
      status: 'Unsuccessful',
      timestamp: new Date(),
      updatedBy: req.user.firstName + ' ' + req.user.lastName,
      notes: `Unsuccessful request approved by ${req.user.firstName} ${req.user.lastName}`
    });
    
    await job.save();
    
    // Send notification using Socket.IO
    try {
      const { getIO } = require('../../socket');
      const io = getIO();
      
      // Emit to all users who can see this job
      if (job.visibleTo && job.visibleTo.length > 0) {
        job.visibleTo.forEach(userId => {
          io.to(`user_${userId}`).emit('jobUpdated', job);
        });
        
        // Special notification to the driver
        if (job.driverId) {
          io.to(`user_${job.driverId}`).emit('unsuccessfulApproved', {
            jobId: job._id,
            message: `Your unsuccessful request for job ${job.po} has been approved`,
            jobDetails: {
              id: job._id,
              service: job.service,
              location: job.location,
              status: job.status
            }
          });
        }
        
        console.log(`Unsuccessful approval event emitted to ${job.visibleTo.length} users`);
      }
    } catch (socketError) {
      console.error(`Error sending unsuccessful approval notification:`, socketError);
    }
    
    res.json({
      message: 'Unsuccessful request approved successfully',
      job
    });
  } catch (error) {
    console.error('Error approving unsuccessful request:', error);
    res.status(500).json({ message: error.message });
  }
};

// Deny unsuccessful request
const denyUnsuccessful = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Check if the job has a pending unsuccessful request
    if (job.approvalStatusUnsuccessful !== 'pending') {
      return res.status(400).json({ message: 'Job does not have a pending unsuccessful request' });
    }
    
    // Check if the user has the required role (OW, sOW, RM)
    const allowedPrimaryRoles = ['OW', 'sOW', 'RM'];
    const allowedSecondaryRoles = ['dispatcher', 'answeringService', 'admin'];
    
    const hasAllowedPrimaryRole = allowedPrimaryRoles.includes(req.user.primaryRole);
    
    // Check if user has any of the allowed secondary roles
    let hasAllowedSecondaryRole = false;
    if (req.user.secondaryRoles) {
      if (Array.isArray(req.user.secondaryRoles)) {
        // If secondaryRoles is an array, check if it includes any of the allowed roles
        hasAllowedSecondaryRole = allowedSecondaryRoles.some(role => req.user.secondaryRoles.includes(role));
      } else if (typeof req.user.secondaryRoles === 'object') {
        // If secondaryRoles is an object, check if any of the allowed roles is true
        hasAllowedSecondaryRole = allowedSecondaryRoles.some(role => req.user.secondaryRoles[role]);
      }
    }
    
    // Check if user has a vendor ID starting with "OWNER"
    const hasOwnerVendorId = req.user.vendorId && req.user.vendorId.startsWith('OWNER');
    
    // User must have either an allowed primary role OR (an allowed secondary role AND an owner vendor ID)
    if (!hasAllowedPrimaryRole && !(hasAllowedSecondaryRole && hasOwnerVendorId)) {
      return res.status(403).json({ 
        message: 'Only OW, sOW, RM users, or users with dispatcher/answeringService/admin roles and OWNER vendor ID can deny unsuccessful requests' 
      });
    }
    
    // Mark as rejected and set status to Canceled
    job.approvalStatusUnsuccessful = 'rejected';
    job.unsuccessfulApprovedBy = req.user.id;
    job.unsuccessfulApprovedAt = new Date();
    job.status = 'Canceled';
    job.cancellationReason = 'Unsuccessful request denied';
    
    // Add status change to history
    if (!job.statusHistory) {
      job.statusHistory = [];
    }
    
    job.statusHistory.push({
      status: 'Canceled',
      timestamp: new Date(),
      updatedBy: req.user.firstName + ' ' + req.user.lastName,
      notes: `Unsuccessful request denied by ${req.user.firstName} ${req.user.lastName}. Job marked as canceled.`
    });
    
    await job.save();
    
    // Send notification using Socket.IO
    try {
      const { getIO } = require('../../socket');
      const io = getIO();
      
      // Emit to all users who can see this job
      if (job.visibleTo && job.visibleTo.length > 0) {
        job.visibleTo.forEach(userId => {
          io.to(`user_${userId}`).emit('jobUpdated', job);
        });
        
        // Special notification to the driver
        if (job.driverId) {
          io.to(`user_${job.driverId}`).emit('unsuccessfulDenied', {
            jobId: job._id,
            message: `Your unsuccessful request for job ${job.po} has been denied. The job has been canceled.`,
            jobDetails: {
              id: job._id,
              service: job.service,
              location: job.location,
              status: job.status
            }
          });
        }
        
        console.log(`Unsuccessful denial event emitted to ${job.visibleTo.length} users`);
      }
    } catch (socketError) {
      console.error(`Error sending unsuccessful denial notification:`, socketError);
    }
    
    res.json({
      message: 'Unsuccessful request denied successfully. Job marked as canceled.',
      job
    });
  } catch (error) {
    console.error('Error denying unsuccessful request:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  updateJobStatus,
  reportJobUnsuccessful,
  approveUnsuccessful,
  denyUnsuccessful
};
