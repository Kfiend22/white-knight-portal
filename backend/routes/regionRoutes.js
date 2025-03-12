// File: backend/routes/regionRoutes.js
const express = require('express');
const router = express.Router();
const regionController = require('../controllers/regionController');
const { protect, owner, regionalManager } = require('../middleware/authMiddleware');

// Routes for regions
// All routes are protected and require authentication

// GET /api/regions/reference-data - Get countries and states reference data
router.get('/reference-data', protect, owner, regionController.getReferenceData);

// GET /api/regions - Get all regions
router.get('/', protect, regionalManager, regionController.getRegions);

// GET /api/regions/:id - Get region by ID
router.get('/:id', protect, regionalManager, regionController.getRegionById);

// POST /api/regions - Create a new region
router.post('/', protect, owner, regionController.createRegion);

// PUT /api/regions/:id - Update region
router.put('/:id', protect, owner, regionController.updateRegion);

// DELETE /api/regions/:id - Delete region
router.delete('/:id', protect, owner, regionController.deleteRegion);

module.exports = router;
