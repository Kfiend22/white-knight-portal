const asyncHandler = require('express-async-handler');
const Job = require('../../models/Job');
const { generateNextPONumber } = require('./creation');

/**
 * Duplicate a job
 * @route   POST /api/jobs/:id/duplicate
 * @access  Private
 */
const duplicateJob = asyncHandler(async (req, res) => {
  const jobId = req.params.id;

  // Find the job to duplicate
  const existingJob = await Job.findById(jobId);

  if (!existingJob) {
    res.status(404);
    throw new Error('Job not found');
  }

  // Convert to plain object and prepare for duplication
  const jobData = existingJob.toObject();

  // Remove fields that should not be duplicated
  delete jobData._id; // Let MongoDB generate a new ID
  delete jobData.id;
  delete jobData.driver;
  delete jobData.driverId;
  delete jobData.vehicle;
  delete jobData.assignedDriver;
  delete jobData.assignedVehicle;
  delete jobData.assignedAt;
  delete jobData.firstAssignedAt;
  delete jobData.acceptedAt;
  delete jobData.rejectedBy;
  delete jobData.eta;
  delete jobData.createdAt;
  delete jobData.updatedAt;
  delete jobData.__v;

  // Set status to Pending
  jobData.status = 'Pending';

  // Add audit log entry for duplication
  if (!jobData.auditLog) {
    jobData.auditLog = [];
  }
  
  jobData.auditLog.push({
    action: 'duplicate',
    performedBy: req.user.id,
    timestamp: new Date(),
    details: { originalJobId: jobId }
  });

  try {
    // Generate a new PO number for the duplicated job
    const newPONumber = await generateNextPONumber();
    jobData.po = newPONumber;

    // Create the new job
    const newJob = await Job.create(jobData);

    // Update job visibility to ensure it's visible to the appropriate users
    const { updateJobVisibility } = require('./visibility');
    await updateJobVisibility(newJob);

    // Emit socket event to all users who can see this job
    try {
      const { getIO } = require('../../socket');
      const io = getIO();
      
      if (newJob.visibleTo && newJob.visibleTo.length > 0) {
        newJob.visibleTo.forEach(userId => {
          io.to(`user_${userId}`).emit('jobUpdated', newJob);
        });
        console.log(`Job duplication event emitted to ${newJob.visibleTo.length} users`);
      }
    } catch (socketError) {
      console.error('Error emitting job duplication event:', socketError);
    }

    // Return the new job
    res.status(201).json(newJob);
  } catch (error) {
    console.error('Error duplicating job:', error);
    res.status(500);
    throw new Error(`Failed to duplicate job: ${error.message}`);
  }
});

module.exports = {
  duplicateJob
};
