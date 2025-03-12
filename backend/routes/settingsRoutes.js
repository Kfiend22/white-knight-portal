// backend/routes/settingsRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getSettings,
  updateSettings,
  createUser,
  deleteUser
} = require('../controllers/settingsController');

// Get all settings
router.get('/', protect, getSettings);

// Update settings
router.put('/', protect, updateSettings);

// Create a new user
router.post('/users', protect, createUser);

// Delete a user
router.delete('/users/:id', protect, deleteUser);

module.exports = router;
