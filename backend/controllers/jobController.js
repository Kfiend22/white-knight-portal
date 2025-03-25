// Import functions from the new modular files
const { generateNextPONumber, createJob } = require('./job/creation');
const { updateJobStatus, reportJobUnsuccessful, approveUnsuccessful, denyUnsuccessful } = require('./job/statusUpdates');
const { updateJobDetails, updateJobETA } = require('./job/details');
const { markJobPaymentSubmitted, getUnsubmittedJobs } = require('./job/payment');
const { assignDriverToJob } = require('./job/assignment');
const { acceptJob, rejectJob, autoRejectionTimeouts, scheduleAutoRejection } = require('./job/acceptance');
const { approveGOA, denyGOA } = require('./job/goa');
const { deleteJob } = require('./job/deletion');
const { duplicateJob } = require('./job/duplication');
const { 
  upload, 
  uploadJobDocuments, 
  getJobDocuments, 
  downloadJobDocument, 
  viewJobDocument, 
  deleteJobDocument 
} = require('./job/documents');
const { getJobs } = require('./job/retrieval');
const { 
  isStateInRegion, 
  getJobState, 
  updateJobVisibility 
} = require('./job/visibility');

// Re-export all functions for backward compatibility
module.exports = { 
  // Job retrieval
  getJobs,
  
  // Job creation
  generateNextPONumber,
  createJob,
  
  // Job status updates
  updateJobStatus,
  reportJobUnsuccessful,
  approveUnsuccessful,
  denyUnsuccessful,
  
  // Job details
  updateJobDetails,
  updateJobETA,
  
  // Payment
  markJobPaymentSubmitted,
  getUnsubmittedJobs,
  
  // Assignment
  assignDriverToJob,
  
  // Acceptance/Rejection
  acceptJob,
  rejectJob,
  autoRejectionTimeouts,
  scheduleAutoRejection,
  
  // GOA
  approveGOA,
  denyGOA,
  
  // Documents
  upload,
  uploadJobDocuments,
  getJobDocuments,
  downloadJobDocument,
  viewJobDocument,
  deleteJobDocument,
  
  // Visibility
  isStateInRegion,
  getJobState,
  updateJobVisibility,
  
  // Duplication
  duplicateJob,
  
  // Deletion
  deleteJob
};
