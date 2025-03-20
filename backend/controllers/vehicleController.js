// vehicleController.js
const Vehicle = require('../models/Vehicle');
const asyncHandler = require('express-async-handler');

/**
 * Get all vehicles
 * @route GET /api/vehicles
 * @access Private
 */
const getVehicles = asyncHandler(async (req, res) => {
  try {
    // Get current user's vendor ID for filtering
    const vendorId = req.user.vendorId || req.user.vendorNumber;
    
    // Query vehicles belonging to this vendor
    const vehicles = await Vehicle.find({ vendorId });
    
    res.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ message: 'Error fetching vehicles', error: error.message });
  }
});

/**
 * Get a single vehicle by ID
 * @route GET /api/vehicles/:id
 * @access Private
 */
const getVehicleById = asyncHandler(async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    
    // Check if vehicle belongs to user's vendor
    const vendorId = req.user.vendorId || req.user.vendorNumber;
    if (vehicle.vendorId !== vendorId) {
      return res.status(403).json({ message: 'Not authorized to access this vehicle' });
    }
    
    res.json(vehicle);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({ message: 'Error fetching vehicle', error: error.message });
  }
});

/**
 * Create a new vehicle
 * @route POST /api/vehicles
 * @access Private
 */
const createVehicle = asyncHandler(async (req, res) => {
  try {
    const vehicleData = req.body;
    
    // Set vendor ID if not provided
    if (!vehicleData.vendorId) {
      vehicleData.vendorId = req.user.vendorId || req.user.vendorNumber;
    }
    
    // Set created by
    vehicleData.createdBy = req.user.id;
    
    // Create vehicle
    const vehicle = new Vehicle(vehicleData);
    
    // Save to database
    const savedVehicle = await vehicle.save();
    
    res.status(201).json(savedVehicle);
  } catch (error) {
    console.error('Error creating vehicle:', error);
    
    if (error.name === 'ValidationError') {
      // Extract validation error messages
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation error', errors });
    }
    
    res.status(500).json({ message: 'Error creating vehicle', error: error.message });
  }
});

/**
 * Update a vehicle
 * @route PUT /api/vehicles/:id
 * @access Private
 */
const updateVehicle = asyncHandler(async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    
    // Check if vehicle belongs to user's vendor
    const vendorId = req.user.vendorId || req.user.vendorNumber;
    if (vehicle.vendorId !== vendorId) {
      return res.status(403).json({ message: 'Not authorized to update this vehicle' });
    }
    
    // Update vehicle fields from request body
    const updatedData = req.body;
    
    // Prevent changing vendorId
    if (updatedData.vendorId && updatedData.vendorId !== vehicle.vendorId) {
      delete updatedData.vendorId;
    }
    
    // Update all provided fields
    Object.keys(updatedData).forEach(key => {
      vehicle[key] = updatedData[key];
    });
    
    // Save updated vehicle
    const updatedVehicle = await vehicle.save();
    
    res.json(updatedVehicle);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation error', errors });
    }
    
    res.status(500).json({ message: 'Error updating vehicle', error: error.message });
  }
});

/**
 * Delete a vehicle
 * @route DELETE /api/vehicles/:id
 * @access Private
 */
const deleteVehicle = asyncHandler(async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    
    // Check if vehicle belongs to user's vendor
    const vendorId = req.user.vendorId || req.user.vendorNumber;
    if (vehicle.vendorId !== vendorId) {
      return res.status(403).json({ message: 'Not authorized to delete this vehicle' });
    }
    
    // Delete the vehicle
    await vehicle.remove();
    
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({ message: 'Error deleting vehicle', error: error.message });
  }
});

module.exports = {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle
};
