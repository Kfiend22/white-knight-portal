const Job = require('../../models/Job');

// Approve a GOA request
const approveGOA = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Check if the job is in "Awaiting Approval" status
    if (job.status !== 'Awaiting Approval') {
      return res.status(400).json({ message: 'Job is not awaiting GOA approval' });
    }
    
    // Check if the user has permission to approve GOA
    // 1. Primary role is not N/A
    // 2. Not a driver-only user
    // 3. Has access to the job
    
    // Check primary role
    if (req.user.primaryRole === 'N/A') {
      return res.status(403).json({ message: 'Users with primary role N/A cannot approve GOA requests' });
    }
    
    // Check if user is a driver-only user
    let isDriverOnly = false;
    if (req.user.secondaryRoles) {
      if (Array.isArray(req.user.secondaryRoles)) {
        // If secondaryRoles is an array, check if it only contains 'driver'
        isDriverOnly = req.user.secondaryRoles.length === 1 && req.user.secondaryRoles.includes('driver');
      } else if (typeof req.user.secondaryRoles === 'object') {
        // If secondaryRoles is an object, check if only driver is true
        const roles = Object.keys(req.user.secondaryRoles).filter(role => req.user.secondaryRoles[role]);
        isDriverOnly = roles.length === 1 && roles[0] === 'driver';
      }
    }
    
    if (isDriverOnly) {
      return res.status(403).json({ message: 'Driver-only users cannot approve GOA requests' });
    }
    
    // Check if user has access to the job
    const hasJobAccess = job.visibleTo && 
                         Array.isArray(job.visibleTo) && 
                         job.visibleTo.some(id => id.toString() === req.user.id.toString());
    
    if (!hasJobAccess) {
      return res.status(403).json({ message: 'You do not have access to this job' });
    }
    
    // Update job status to GOA and mark as approved
    job.status = 'GOA';
    job.approvalStatus = 'approved';
    job.approvedBy = req.user.id;
    job.approvedAt = new Date();
    
    // Add status change to history
    if (!job.statusHistory) {
      job.statusHistory = [];
    }
    
    job.statusHistory.push({
      status: 'GOA',
      timestamp: new Date(),
      updatedBy: req.user.firstName + ' ' + req.user.lastName,
      notes: `GOA request approved by ${req.user.firstName} ${req.user.lastName}`
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
          io.to(`user_${job.driverId}`).emit('goaApproved', {
            jobId: job._id,
            message: `Your GOA request for job ${job.po} has been approved`,
            jobDetails: {
              id: job._id,
              service: job.service,
              location: job.location,
              status: job.status
            }
          });
        }
        
        console.log(`GOA approval event emitted to ${job.visibleTo.length} users`);
      }
    } catch (socketError) {
      console.error(`Error sending GOA approval notification:`, socketError);
    }
    
    res.json({
      message: 'GOA request approved successfully',
      job
    });
  } catch (error) {
    console.error('Error approving GOA request:', error);
    res.status(500).json({ message: error.message });
  }
};

// Deny a GOA request
const denyGOA = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Check if the job is in "Awaiting Approval" status
    if (job.status !== 'Awaiting Approval') {
      return res.status(400).json({ message: 'Job is not awaiting GOA approval' });
    }
    
    // Check if the user has permission to deny GOA
    // 1. Primary role is not N/A
    // 2. Not a driver-only user
    // 3. Has access to the job
    
    // Check primary role
    if (req.user.primaryRole === 'N/A') {
      return res.status(403).json({ message: 'Users with primary role N/A cannot deny GOA requests' });
    }
    
    // Check if user is a driver-only user
    let isDriverOnly = false;
    if (req.user.secondaryRoles) {
      if (Array.isArray(req.user.secondaryRoles)) {
        // If secondaryRoles is an array, check if it only contains 'driver'
        isDriverOnly = req.user.secondaryRoles.length === 1 && req.user.secondaryRoles.includes('driver');
      } else if (typeof req.user.secondaryRoles === 'object') {
        // If secondaryRoles is an object, check if only driver is true
        const roles = Object.keys(req.user.secondaryRoles).filter(role => req.user.secondaryRoles[role]);
        isDriverOnly = roles.length === 1 && roles[0] === 'driver';
      }
    }
    
    if (isDriverOnly) {
      return res.status(403).json({ message: 'Driver-only users cannot deny GOA requests' });
    }
    
    // Check if user has access to the job
    const hasJobAccess = job.visibleTo && 
                         Array.isArray(job.visibleTo) && 
                         job.visibleTo.some(id => id.toString() === req.user.id.toString());
    
    if (!hasJobAccess) {
      return res.status(403).json({ message: 'You do not have access to this job' });
    }
    
    // Update job status and mark as denied
    // Keep the job in "Awaiting Approval" status but set approvalStatus to "rejected"
    job.approvalStatus = 'rejected';
    job.approvedBy = req.user.id; // Using the same field for both approval and denial
    job.approvedAt = new Date();
    job.goaRejectionNotification = true; // Flag to show notification in the UI
    
    // Add status change to history
    if (!job.statusHistory) {
      job.statusHistory = [];
    }
    
    job.statusHistory.push({
      status: 'Awaiting Approval',
      timestamp: new Date(),
      updatedBy: req.user.firstName + ' ' + req.user.lastName,
      notes: `GOA request denied by ${req.user.firstName} ${req.user.lastName}`
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
          io.to(`user_${job.driverId}`).emit('goaDenied', {
            jobId: job._id,
            message: `Your GOA request for job ${job.po} has been denied`,
            jobDetails: {
              id: job._id,
              service: job.service,
              location: job.location,
              status: job.status,
              approvalStatus: job.approvalStatus
            }
          });
        }
        
        console.log(`GOA denial event emitted to ${job.visibleTo.length} users`);
      }
    } catch (socketError) {
      console.error(`Error sending GOA denial notification:`, socketError);
    }
    
    res.json({
      message: 'GOA request denied successfully',
      job
    });
  } catch (error) {
    console.error('Error denying GOA request:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  approveGOA,
  denyGOA
};
