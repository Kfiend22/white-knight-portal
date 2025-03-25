const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { 
  protect, 
  canManageUser, 
  ensureVendorIsolation, 
  ensureRegionIsolation 
} = require('../middleware/authMiddleware');

// Create a new user
router.post('/', protect, userController.createUser);

// Get all users (with vendor and region isolation)
router.get('/', protect, ensureVendorIsolation, ensureRegionIsolation, userController.getUsers);

// Get vendor IDs - must be before /:id to avoid treating 'vendor-ids' as an ID
router.get('/vendor-ids', userController.getUserVendorIds);

// Get companies associated with the current user - must be before /:id
router.get('/companies', protect, userController.getUserCompanies);

// User profile routes - must be before /:id to avoid treating 'profile' as an ID
const userProfileController = require('../controllers/userProfileController');
router.get('/profile', protect, userProfileController.getUserProfile);
router.put('/profile', protect, userProfileController.updateUserProfile);

// Get user by ID - must be after specific routes to avoid treating route names as IDs
router.get('/:id', protect, userController.getUserById);

// Update user
router.put('/:id', protect, canManageUser, userController.updateUser);

// Delete user (actually deactivates)
router.delete('/:id', protect, canManageUser, userController.deleteUser);

// Toggle user active status
router.put('/:id/toggle-active', protect, canManageUser, userController.toggleUserActive);

// Toggle driver on-duty status
router.put('/:id/toggle-on-duty', protect, userController.toggleDriverOnDuty);

module.exports = router;
