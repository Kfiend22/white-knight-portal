const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/drivers
// @desc    Get all drivers
// @access  Private
router.get('/', protect, driverController.getDrivers);

// @route   GET /api/drivers/available
// @desc    Get all available (on-duty) drivers
// @access  Private
router.get('/available', protect, driverController.getAvailableDrivers);

// @route   GET /api/drivers/:id
// @desc    Get driver by ID
// @access  Private
router.get('/:id', protect, driverController.getDriverById);

// @route   PUT /api/drivers/:id/status
// @desc    Update driver status
// @access  Private
router.put('/:id/status', protect, driverController.updateDriverStatus);

// @route   PUT /api/drivers/:id/assign-truck
// @desc    Assign truck to driver
// @access  Private
router.put('/:id/assign-truck', protect, driverController.assignTruck);

module.exports = router;
