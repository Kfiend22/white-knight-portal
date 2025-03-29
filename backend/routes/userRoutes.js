const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Import fs for directory creation
const userController = require('../controllers/userController');
const { 
  protect, 
  canManageUser, 
  ensureVendorIsolation, 
  ensureRegionIsolation
} = require('../middleware/authMiddleware');

// --- Multer Configuration for Background Check Upload ---
const uploadDir = path.join(__dirname, '../uploads/applications');

// Ensure the upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Save to backend/uploads/applications
  },
  filename: function (req, file, cb) {
    // Create a unique filename: userId-timestamp-originalName
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const userId = req.user ? req.user.id : 'unknown'; // Get user ID if available
    cb(null, `${userId}-backgroundCheck-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accept only PDF files for background checks
    if (path.extname(file.originalname).toLowerCase() !== '.pdf') {
      return cb(new Error('Only PDF files are allowed for background checks!'), false);
    }
    cb(null, true);
  } 
});
// --- End Multer Configuration ---

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

// Upload background check document (associated with the logged-in user's profile/application)
// Using PUT as we are updating the user's profile/application record with the document path
router.put(
  '/profile/upload-background-check', 
  protect, // Ensure user is logged in
  upload.single('backgroundCheckFile'), // Middleware to handle single file upload named 'backgroundCheckFile'
  userProfileController.uploadBackgroundCheck // Controller function to handle the logic
);

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
