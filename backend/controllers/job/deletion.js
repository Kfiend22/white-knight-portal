const Job = require('../../models/Job');
const asyncHandler = require('express-async-handler');
const fs = require('fs');
const path = require('path');

/**
 * @desc    Permanently delete a job
 * @route   DELETE /api/jobs/:id
 * @access  Private (only OW, sOW, RM users)
 */
const deleteJob = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log(`Attempting to delete job with ID: ${id}`);
  console.log(`User: ${JSON.stringify(req.user)}`);
  
  try {
    // Check if user has permission to delete jobs
    const allowedRoles = ['OW', 'sOW', 'RM'];
    if (!allowedRoles.includes(req.user.primaryRole)) {
      console.log(`Permission denied: User role ${req.user.primaryRole} not in allowed roles`);
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete jobs'
      });
    }
    
    // Use the job from req.job if available (set by checkJobAccess middleware)
    // Otherwise, find the job directly
    let job = req.job;
    if (!job) {
      console.log(`Finding job with ID: ${id}`);
      job = await Job.findById(id);
      
      if (!job) {
        console.log(`Job not found with ID: ${id}`);
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }
    }
    
    console.log(`Job found: ${job.id}, status: ${job.status}`);
    
    // Only allow deletion of cancelled jobs
    if (job.status !== 'Canceled') {
      console.log(`Cannot delete job with status: ${job.status}`);
      return res.status(400).json({
        success: false,
        message: 'Only cancelled jobs can be permanently deleted'
      });
    }
    
    // Delete associated documents if they exist
    if (job.documents && job.documents.length > 0) {
      console.log(`Found ${job.documents.length} documents to delete`);
      
      // Process each document
      for (const document of job.documents) {
        try {
          // Construct the full path to the document
          const fullPath = path.join(__dirname, '../../uploads/jobs', document.path);
          console.log(`Attempting to delete document: ${fullPath}`);
          
          // Delete the file
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(`Successfully deleted document: ${fullPath}`);
          } else {
            console.log(`Document not found on filesystem: ${fullPath}`);
          }
        } catch (fileError) {
          // Log error but continue with other documents
          console.error(`Error deleting document ${document.path}: ${fileError.message}`);
        }
      }
    } else {
      console.log('No documents found for this job');
    }
    
    // Delete the job from the database using deleteOne
    console.log(`Deleting job from database: ${job.id}`);
    const result = await Job.deleteOne({ _id: job._id });
    
    console.log(`Delete result:`, result);
    
    if (result.deletedCount === 1) {
      console.log(`Job deleted successfully: ${job.id}`);
      return res.status(200).json({
        success: true,
        message: 'Job deleted successfully'
      });
    } else {
      console.log(`Failed to delete job: ${job.id}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete job'
      });
    }
  } catch (error) {
    console.error(`Error in deleteJob function: ${error.message}`);
    console.error(error.stack);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to delete job',
      error: error.message
    });
  }
});

module.exports = { deleteJob };
