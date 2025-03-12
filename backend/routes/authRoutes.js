const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const { protect, canManageUser } = require('../middleware/authMiddleware');
const authController = require('../controllers/authController');

// Public routes

// Login endpoint
router.post('/login', authController.loginUser);

// Register endpoint
router.post('/register', authController.registerUser);

// Create Owner account endpoint
router.post('/create-owner', authController.createOwnerAccount);

// Verify 2FA code
router.post('/verify-2fa', authController.verify2FA);

// Verify token endpoint (lightweight check for token validity)
router.get('/verify', protect, (req, res) => {
  // If middleware passes, token is valid
  res.status(200).json({ valid: true });
});

// Validate Vendor ID endpoint
router.get('/validate-vendor-id/:vendorId', async (req, res) => {
  try {
    const { vendorId } = req.params;
    
    // Find user by vendorId or vendorNumber
    const user = await User.findOne({ 
      $or: [
        { vendorId },
        { vendorNumber: vendorId }
      ]
    });
    
    // Check if user exists and doesn't have a password set yet
    if (user && !user.username) {
      return res.status(200).json({ valid: true });
    }
    
    // Either user doesn't exist or is already registered
    return res.status(200).json({ valid: false });
  } catch (error) {
    console.error('Vendor ID validation error:', error);
    res.status(500).json({ message: 'Server error during validation', valid: false });
  }
});

// Protected routes (require authentication)

// Change password endpoint
router.post('/change-password', protect, authController.changePassword);

// Update user endpoint
router.put('/users/:id', protect, canManageUser, authController.updateUser);

// 2FA routes
router.post('/setup-2fa', protect, authController.setup2FA);
router.post('/verify-setup-2fa', protect, authController.verifySetup2FA);
router.post('/disable-2fa', protect, authController.disable2FA);

module.exports = router;
