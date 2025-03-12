// backend/controllers/userController.js
const User = require('../models/userModel');

const createUser = async (req, res) => {
  try {
    const userData = req.body;
    const user = new User(userData);
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);

    if (error.code === 11000 && error.keyPattern && error.keyPattern.vendorId) {
      // Duplicate vendorId error
      return res.status(400).json({ message: 'Vendor ID already exists' });
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err) => err.message);
      res.status(400).json({ message: 'Validation failed', errors });
    } else {
      res.status(500).json({ message: 'Server Error' });
    }
  }
};

const getUserVendorIds = async (req, res) => {
  try {
    const users = await User.find({}, 'vendorId');
    const vendorIds = users.map(user => user.vendorId);
    res.json({ vendorIds });
  } catch (error) {
    console.error('Error fetching user vendorIds:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};


module.exports = { createUser, getUserVendorIds };
