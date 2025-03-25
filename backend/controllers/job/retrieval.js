const Job = require('../../models/Job');

const getJobs = async (req, res) => {
  try {
    const { category } = req.query;
    const { canViewJob } = require('../../middleware/roleMiddleware');
    
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
      
      // For most categories, we can filter by status directly
      if (category === 'scheduled') {
        // For scheduled category, we need to check both status and ETA
        visibleJobs = visibleJobs.filter(job => {
          // Check if the job has a scheduled ETA
          const hasScheduledEta = job.eta && job.eta.includes('Scheduled for');
          
          // And has one of these statuses (excluding 'Waiting' to ensure it appears in pending)
          const hasScheduledStatus = ['Scheduled', 'Dispatched'].includes(job.status);
          
          return hasScheduledEta && hasScheduledStatus;
        });
      } else {
        // For other categories, filter by status
        switch (category) {
          case 'pending':
            statusValues = ['Pending', 'Pending Acceptance', 'Waiting'];
            break;
          case 'inProgress':
            statusValues = ['In-Progress', 'Dispatched', 'En Route', 'On Site', 'Awaiting Approval', 'Rejected', 'Accepted'];
            break;
          case 'completed':
            statusValues = ['Completed', 'GOA', 'Unsuccessful'];
            break;
          case 'canceled':
            statusValues = ['Canceled'];
            break;
          case 'awaitingApproval':
            statusValues = ['Awaiting Approval'];
            break;
        }
        
        // Filter jobs by status, but exclude scheduled jobs from inProgress
        if (statusValues && statusValues.length > 0) {
          visibleJobs = visibleJobs.filter(job => {
            // Check if this is a scheduled job that should be in the Scheduled tab
            const isScheduledJob = job.eta && job.eta.includes('Scheduled for') && 
                                  ['Scheduled', 'Dispatched'].includes(job.status);
            
            // If this is inProgress category and the job is scheduled, exclude it
            if (category === 'inProgress' && isScheduledJob) {
              return false;
            }
            
            // Otherwise, include jobs with matching status
            return statusValues.includes(job.status);
          });
        }
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

module.exports = {
  getJobs
};
