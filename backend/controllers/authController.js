const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const validateUserData = (userData) => {
  const errors = {};

  if (!userData.username || userData.username.length > 28) {
    errors.username = "Username is required and must be 28 characters or less";
  }

  if (!userData.password || userData.password.length > 28) {
    errors.password = "Password is required and must be 28 characters or less";
  }

  if (!["Driver", "Admin", "Dispatch", "Answering Service"].includes(userData.position)) {
    errors.position = "Invalid position";
  }

  if (!userData.firstName || !/^[A-Za-z]+$/.test(userData.firstName) || userData.firstName.length > 28) {
    errors.firstName = "First name must contain only letters and be 28 characters or less";
  }

  // Add similar validations for other fields

  return Object.keys(errors).length === 0 ? null : errors;
};


const registerUser = async (req, res) => {
  const userData = req.body;
  const validationErrors = validateUserData(userData);

  if (validationErrors) {
    return res.status(400).json({ errors: validationErrors });
  }

  try {
    // Proceed with user creation
    const user = await User.create(userData);
    res.status(201).json({
      _id: user.id,
      username: user.username,
      // other fields...
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  const userData = req.body;
  const validationErrors = validateUserData(userData);

  if (validationErrors) {
    return res.status(400).json({ errors: validationErrors });
  }

  try {
    // Proceed with user update
    const updatedUser = await User.findByIdAndUpdate(req.params.id, userData, { new: true });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        token: generateToken(user.id),
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser };
