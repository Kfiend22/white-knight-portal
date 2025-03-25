// vehicleRoutes.js
const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const { protect } = require('../middleware/authMiddleware');

// Routes for /api/vehicles
router.get('/', protect, vehicleController.getVehicles);
router.get('/available', protect, vehicleController.getAvailableVehicles);
router.post('/', protect, vehicleController.createVehicle);
router.get('/:id', protect, vehicleController.getVehicleById);
router.put('/:id', protect, vehicleController.updateVehicle);
router.delete('/:id', protect, vehicleController.deleteVehicle);

module.exports = router;
