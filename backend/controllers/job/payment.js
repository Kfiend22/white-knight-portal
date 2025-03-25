const Job = require('../../models/Job');

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
      const { getIO } = require('../../socket');
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

module.exports = {
  markJobPaymentSubmitted,
  getUnsubmittedJobs
};
