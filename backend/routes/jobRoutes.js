const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { protect } = require('../middleware/authMiddleware');
const { checkJobAccess } = require('../middleware/roleMiddleware');

// @route   GET /api/jobs
// @desc    Get all jobs for the authenticated user
// @access  Private
router.get('/', protect, jobController.getJobs);

// @route   POST /api/jobs
// @desc    Create a new job
// @access  Private
router.post('/', protect, jobController.createJob);

// @route   PUT /api/jobs/:id
// @desc    Update a job status
// @access  Private
router.put('/:id', protect, checkJobAccess(), jobController.updateJobStatus);

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

module.exports = router;
