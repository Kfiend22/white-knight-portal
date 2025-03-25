// userProfileController.js
// Controller for user profile-related endpoints

const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { mkdirp } = require('mkdirp');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    // Get user info from request
    const user = req.user;
    const vendorId = user.vendorId || user.vendorNumber || 'unknown';
    const username = user.username || 'user';
    
    // Create directory path
    const uploadDir = path.join(__dirname, '..', 'uploads', 'profile', vendorId, username);
    
    // Create directory if it doesn't exist
    try {
      await mkdirp(uploadDir);
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    // Use 'icon' as the filename, preserving the original extension
    const ext = path.extname(file.originalname);
    cb(null, 'icon' + ext);
  }
});

// Create multer upload instance
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
}).single('profilePicture');

// Promisify multer upload
const uploadMiddleware = (req, res) => {
  return new Promise((resolve, reject) => {
    upload(req, res, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

/**
 * Get current user profile
 * @route GET /api/v1/users/profile
 * @access Private
 */
const getUserProfile = async (req, res) => {
  try {
    // Get user ID from auth middleware
    const userId = req.user.id;
    
    // Find user by ID
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Ensure secondaryRoles is always an array
    let secondaryRolesArray = [];
    
    // If secondaryRoles is an object with role names as keys (e.g. {driver: true})
    if (user.secondaryRoles && typeof user.secondaryRoles === 'object' && !Array.isArray(user.secondaryRoles)) {
      secondaryRolesArray = Object.keys(user.secondaryRoles).filter(role => user.secondaryRoles[role]);
    } 
    // If it's already an array, use it directly
    else if (Array.isArray(user.secondaryRoles)) {
      secondaryRolesArray = user.secondaryRoles;
    }
    
    // Create a user profile object with secondaryRoles as an array
    const userProfile = {
      ...user.toObject(),
      secondaryRoles: secondaryRolesArray
    };
    
    // Log the profile for debugging
    console.log('User profile requested:', {
      id: userProfile._id,
      primaryRole: userProfile.primaryRole,
      secondaryRoles: userProfile.secondaryRoles,
      isArray: Array.isArray(userProfile.secondaryRoles)
    });
    
    res.json(userProfile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update current user profile
 * @route PUT /api/v1/users/profile
 * @access Private
 */
const updateUserProfile = async (req, res) => {
  console.log('=== PROFILE UPDATE START ===');
  console.log('Entering updateUserProfile with headers:', JSON.stringify(req.headers, null, 2));
  try {
    // Process file upload if present
    console.log('Processing file upload if present');
    try {
      await uploadMiddleware(req, res);
      console.log('Upload middleware completed successfully');
    } catch (uploadError) {
      console.error('Error uploading file:', uploadError);
      console.error('Upload error stack:', uploadError.stack);
      return res.status(400).json({ message: 'Error uploading profile picture', error: uploadError.message });
    }

    // Get user ID from auth middleware
    console.log('Auth user object:', JSON.stringify(req.user, null, 2));
    const userId = req.user.id;
    console.log('User ID in updateUserProfile:', userId);
    
    // Find user by ID
    console.log('Finding user by ID:', userId);
    const user = await User.findById(userId);
    
    if (!user) {
      console.error('User not found with ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('Original user data (full):', JSON.stringify(user.toObject(), null, 2));
    console.log('Original user data (summary):', {
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      phone: user.phone,
      address: user.address,
      companyName: user.companyName,
      primaryRole: user.primaryRole
    });
    
    console.log('Request body (full):', JSON.stringify(req.body, null, 2));
    
    // Update basic user information
    if (req.body.firstName) user.firstName = req.body.firstName;
    if (req.body.lastName) user.lastName = req.body.lastName;
    if (req.body.username) user.username = req.body.username;
    if (req.body.phoneNumber) {
      user.phoneNumber = req.body.phoneNumber;
      // Also update the legacy phone field to maintain compatibility
      user.phone = req.body.phoneNumber;
    }
    
    
    // Update password if provided
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
    }
    
    // Update notification preferences
    user.receiveEmailNotifications = req.body.receiveEmailNotifications === 'true';
    user.receiveTextNotifications = req.body.receiveTextNotifications === 'true';
    user.notifyOnNewJob = req.body.notifyOnNewJob === 'true';
    user.notifyOnJobCanceled = req.body.notifyOnJobCanceled === 'true';
    user.notifyOnJobOnScene = req.body.notifyOnJobOnScene === 'true';
    user.notifyOnJobReassigned = req.body.notifyOnJobReassigned === 'true';
    user.notifyOnJobMarkedAsGOA = req.body.notifyOnJobMarkedAsGOA === 'true';
    
    // Update SP-specific fields if user is an SP
    if (user.primaryRole === 'SP') {
      if (req.body.companyName) user.companyName = req.body.companyName;
      if (req.body.position) user.position = req.body.position;
      // Ensure address object exists before updating its fields
      if (!user.address) {
        user.address = {
          street1: '',
          street2: '',
          city: '',
          state: '',
          zip: '',
          country: 'US'
        };
      }
      
      if (req.body.companyAddress) {
        user.companyAddress = req.body.companyAddress;
        user.address.street1 = req.body.companyAddress;
      }
      if (req.body.companyAddress2) {
        user.companyAddress2 = req.body.companyAddress2;
        user.address.street2 = req.body.companyAddress2;
      }
      if (req.body.city) {
        user.city = req.body.city;
        user.address.city = req.body.city;
      }
      if (req.body.state) {
        user.state = req.body.state;
        user.address.state = req.body.state;
      }
      if (req.body.zip) {
        user.zip = req.body.zip;
        user.address.zip = req.body.zip;
      }
      if (req.body.mainLinePhoneNumber) user.mainLinePhoneNumber = req.body.mainLinePhoneNumber;
      if (req.body.dispatchPhoneNumber) user.dispatchPhoneNumber = req.body.dispatchPhoneNumber;
      if (req.body.answeringServicePhoneNumber) user.answeringServicePhoneNumber = req.body.answeringServicePhoneNumber;
      if (req.body.towingLicenseNumber) user.towingLicenseNumber = req.body.towingLicenseNumber;
      if (req.body.dotNumber) user.dotNumber = req.body.dotNumber;
    }
    
    
    // Update profile picture path if a file was uploaded
    if (req.file) {
      const vendorId = user.vendorId || user.vendorNumber || 'unknown';
      const username = user.username || 'user';
      
      // Set the relative path to the profile picture
      const relativePath = path.join('uploads', 'profile', vendorId, username, req.file.filename);
      user.profilePicture = '/' + relativePath.replace(/\\/g, '/'); // Convert backslashes to forward slashes for URLs
    }
    
    console.log('Modified user data before save:', {
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      phone: user.phone,
      address: user.address,
      companyName: user.companyName
    });
    
    // Save the updated user with enhanced error handling
    try {
      console.log('Attempting to save user...');
      console.log('Modified user data (full) before save:', JSON.stringify(user.toObject(), null, 2));
      await user.save();
      console.log('User saved successfully');
    } catch (saveError) {
      console.error('Error saving user:', saveError);
      console.error('Save error name:', saveError.name);
      console.error('Save error code:', saveError.code);
      console.error('Save error message:', saveError.message);
      console.error('Save error stack:', saveError.stack);
      
      // Check for duplicate key error (unique constraint violation)
      if (saveError.name === 'MongoError' || saveError.name === 'MongoServerError') {
        if (saveError.code === 11000) {
          // Duplicate key error
          const field = Object.keys(saveError.keyPattern)[0];
          console.error('Duplicate key error for field:', field);
          return res.status(400).json({ 
            message: `The ${field} you provided is already in use.`,
            error: saveError.message,
            field
          });
        }
      }
      
      // Check for validation errors
      if (saveError.name === 'ValidationError') {
        console.error('Validation error details:', saveError.errors);
        const validationErrors = {};
        
        // Extract validation error messages for each field
        for (const field in saveError.errors) {
          validationErrors[field] = saveError.errors[field].message;
          console.error(`Validation error for ${field}:`, saveError.errors[field].message);
        }
        
        return res.status(400).json({
          message: 'Validation error',
          errors: validationErrors
        });
      }
      
      // If it's not a specific error we can handle, re-throw it
      console.error('Unhandled error type, re-throwing');
      throw saveError;
    }
    
    // Return the updated user (excluding password)
    console.log('Fetching updated user to return in response');
    const updatedUser = await User.findById(userId).select('-password');
    
    // Ensure secondaryRoles is always an array in the response
    let secondaryRolesArray = [];
    
    if (updatedUser.secondaryRoles && typeof updatedUser.secondaryRoles === 'object' && !Array.isArray(updatedUser.secondaryRoles)) {
      secondaryRolesArray = Object.keys(updatedUser.secondaryRoles).filter(role => updatedUser.secondaryRoles[role]);
    } else if (Array.isArray(updatedUser.secondaryRoles)) {
      secondaryRolesArray = updatedUser.secondaryRoles;
    }
    
    // Create a user profile object with secondaryRoles as an array
    const userProfile = {
      ...updatedUser.toObject(),
      secondaryRoles: secondaryRolesArray
    };
    
    console.log('Sending successful response with updated user profile');
    console.log('=== PROFILE UPDATE COMPLETE ===');
    res.json(userProfile);
  } catch (error) {
    console.error('=== PROFILE UPDATE ERROR ===');
    console.error('Error updating user profile:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Enhanced error response with more details
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
      name: error.name
    });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile
};
