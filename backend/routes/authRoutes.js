const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');

router.put('/register', async (req, res) => {
  try {
    const { vendorId, username, password, companyName, email } = req.body;
    
    // Find user by vendorId
    const user = await User.findOne({ vendorId });
    
    if (!user) {
      return res.status(404).json({ message: 'Vendor ID not found' });
    }
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Update user with new credentials
    user.username = username;
    user.password = hashedPassword;
    user.companyName = companyName;
    user.email = email;
    
    await user.save();
    
    res.status(200).json({ message: 'Registration successful' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

module.exports = router;
