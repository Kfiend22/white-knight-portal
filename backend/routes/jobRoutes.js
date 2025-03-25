const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const jobController = require('../controllers/jobController');
const { protect } = require('../middleware/authMiddleware');
const { checkJobAccess } = require('../middleware/roleMiddleware');
const { canDeleteJobDocuments } = require('../middleware/documentMiddleware');

// @route   GET /api/jobs
// @desc    Get all jobs for the authenticated user
// @access  Private
router.get('/', protect, jobController.getJobs);

// @route   POST /api/jobs
// @desc    Create a new job
// @access  Private
router.post('/', protect, jobController.createJob);

// @route   PUT /api/jobs/:id
// @desc    Update job details
// @access  Private
router.put('/:id', protect, checkJobAccess(), jobController.updateJobDetails);

// @route   PUT /api/jobs/:id/payment
// @desc    Mark a job as payment submitted
// @access  Private
router.put('/:id/payment', protect, checkJobAccess(), jobController.markJobPaymentSubmitted);

// @route   GET /api/jobs/unsubmitted
// @desc    Get all completed jobs that haven't been submitted for payment
// @access  Private
router.get('/unsubmitted', protect, jobController.getUnsubmittedJobs);

// @route   PUT /api/jobs/:id/assign
// @desc    Assign a driver to a job
// @access  Private
router.put('/:id/assign', protect, checkJobAccess(), jobController.assignDriverToJob);

// @route   PUT /api/jobs/:id/accept
// @desc    Accept a job (for drivers)
// @access  Private
router.put('/:id/accept', protect, checkJobAccess(), jobController.acceptJob);

// @route   PUT /api/jobs/:id/reject
// @desc    Reject a job (for drivers)
// @access  Private
router.put('/:id/reject', protect, checkJobAccess(), jobController.rejectJob);

// @route   PUT /api/jobs/:id/status
// @desc    Update a job status
// @access  Private
router.put('/:id/status', protect, checkJobAccess(), jobController.updateJobStatus);

// @route   PUT /api/jobs/:id/eta
// @desc    Update only a job's ETA
// @access  Private
router.put('/:id/eta', protect, checkJobAccess(), jobController.updateJobETA);

// @route   PUT /api/jobs/:id/goa/approve
// @desc    Approve a GOA request
// @access  Private (only OW, sOW, RM users)
router.put('/:id/goa/approve', protect, checkJobAccess(), jobController.approveGOA);

// @route   PUT /api/jobs/:id/goa/deny
// @desc    Deny a GOA request
// @access  Private (only OW, sOW, RM users)
router.put('/:id/goa/deny', protect, checkJobAccess(), jobController.denyGOA);

// @route   PUT /api/jobs/:id/unsuccessful
// @desc    Mark a job as unsuccessful
// @access  Private
router.put('/:id/unsuccessful', protect, checkJobAccess(), jobController.reportJobUnsuccessful);

// @route   PUT /api/jobs/:id/unsuccessful/approve
// @desc    Approve an unsuccessful request
// @access  Private (only OW, sOW, RM users or users with specific secondary roles)
router.put('/:id/unsuccessful/approve', protect, checkJobAccess(), jobController.approveUnsuccessful);

// @route   PUT /api/jobs/:id/unsuccessful/deny
// @desc    Deny an unsuccessful request
// @access  Private (only OW, sOW, RM users or users with specific secondary roles)
router.put('/:id/unsuccessful/deny', protect, checkJobAccess(), jobController.denyUnsuccessful);

// @route   POST /api/jobs/:id/upload
// @desc    Upload documents for a job
// @access  Private
router.post('/:id/upload', protect, checkJobAccess(), jobController.uploadJobDocuments);

// @route   GET /api/jobs/:id/documents
// @desc    Get all documents for a job
// @access  Private
router.get('/:id/documents', protect, checkJobAccess(), jobController.getJobDocuments);

// @route   GET /api/jobs/:id/documents/:filename
// @desc    Download a specific document for a job
// @access  Private
router.get('/:id/documents/:filename', protect, checkJobAccess(), jobController.downloadJobDocument);

// @route   GET /api/jobs/:id/documents/:filename/view
// @desc    View a specific document for a job (for images in browser)
// @access  Private
router.get('/:id/documents/:filename/view', protect, checkJobAccess(), jobController.viewJobDocument);

// @route   DELETE /api/jobs/:id/documents/:filename
// @desc    Delete a specific document for a job
// @access  Private (only users with primary role other than N/A)
router.delete('/:id/documents/:filename', protect, checkJobAccess(), canDeleteJobDocuments, jobController.deleteJobDocument);

// @route   POST /api/jobs/:id/duplicate
// @desc    Duplicate a job
// @access  Private
router.post('/:id/duplicate', protect, checkJobAccess(), jobController.duplicateJob);

// @route   DELETE /api/jobs/:id
// @desc    Permanently delete a job
// @access  Private (only OW, sOW, RM users)
router.delete('/:id', protect, checkJobAccess(), jobController.deleteJob);

module.exports = router;
