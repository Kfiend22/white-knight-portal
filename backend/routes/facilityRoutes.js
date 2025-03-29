const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); // Assuming authentication is needed
const { updateStandaloneFacility } = require('../controllers/facilityController'); // We will create this controller next

// Route to update a standalone facility by its ID
// Matches the PUT request from FacilitiesTab.js: PUT /api/v1/facilities/:id
router.put('/:id', protect, updateStandaloneFacility);

// Add other facility-specific routes here if needed in the future (e.g., GET /:id, POST /, DELETE /:id)

module.exports = router;
