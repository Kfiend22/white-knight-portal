// backend/controllers/driverController.js
const User = require('../models/userModel');

/**
 * Get all drivers
 * @route GET /api/drivers
 * @access Private
 */
const getDrivers = async (req, res) => {
  try {
    // Check if isOnDuty query parameter is provided
    const { isOnDuty } = req.query;
    
    // Build query based on parameters
    const query = { 'secondaryRoles.driver': true };
    
    // If isOnDuty is specified, filter by duty status
    if (isOnDuty !== undefined) {
      // Convert string 'true'/'false' to boolean
      const isOnDutyBool = isOnDuty === 'true';
      query.isOnDuty = isOnDutyBool;
    }
    
    // Find users with driver secondary role matching the query
    const drivers = await User.find(query);
    
    // Transform the data to match the frontend expectations
    const formattedDrivers = drivers.map(driver => ({
      id: driver._id,
      name: `${driver.firstName} ${driver.lastName}`,
      phone: driver.phone || '',
      email: driver.email,
      assignedTruck: driver.assignedTruck || 'Unassigned',
      status: driver.isOnDuty ? 'On Duty' : 'Off Duty'
    }));
    
    res.json(formattedDrivers);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get all available (on-duty) drivers
 * @route GET /api/drivers/available
 * @access Private
 */
const getAvailableDrivers = async (req, res) => {
  try {
    // Find all users with driver role who are on duty
    const drivers = await User.find({ 
      'secondaryRoles.driver': true,
      isOnDuty: true
    });
    
    // Transform the data to match the frontend expectations
    const formattedDrivers = drivers.map(driver => ({
      id: driver._id,
      name: `${driver.firstName} ${driver.lastName}`,
      phone: driver.phone || '',
      email: driver.email,
      assignedTruck: driver.assignedTruck || 'Unassigned',
      status: 'On Duty'
    }));
    
    res.json(formattedDrivers);
  } catch (error) {
    console.error('Error fetching available drivers:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get a single driver by ID
 * @route GET /api/drivers/:id
 * @access Private
 */
const getDriverById = async (req, res) => {
  try {
    const driver = await User.findOne({ 
      _id: req.params.id, 
      'secondaryRoles.driver': true 
    });
    
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    
    // Format the driver data
    const formattedDriver = {
      id: driver._id,
      name: `${driver.firstName} ${driver.lastName}`,
      phone: driver.phone || '',
      email: driver.email,
      assignedTruck: driver.assignedTruck || 'Unassigned',
      status: driver.isOnDuty ? 'On Duty' : 'Off Duty'
    };
    
    res.json(formattedDriver);
  } catch (error) {
    console.error('Error fetching driver:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update driver status
 * @route PUT /api/drivers/:id/status
 * @access Private
 */
const updateDriverStatus = async (req, res) => {
  try {
    const { isOnDuty } = req.body;
    
    if (isOnDuty === undefined) {
      return res.status(400).json({ message: 'On-duty status is required' });
    }
    
    const driver = await User.findOne({ 
      _id: req.params.id, 
      'secondaryRoles.driver': true 
    });
    
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    
    // Update driver status
    driver.isOnDuty = isOnDuty;
    await driver.save();
    
    res.json({ 
      message: `Driver status updated to ${isOnDuty ? 'On Duty' : 'Off Duty'} successfully` 
    });
  } catch (error) {
    console.error('Error updating driver status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Assign truck to driver
 * @route PUT /api/drivers/:id/assign-truck
 * @access Private
 */
const assignTruck = async (req, res) => {
  try {
    const { truckId } = req.body;
    
    if (!truckId) {
      return res.status(400).json({ message: 'Truck ID is required' });
    }
    
    const driver = await User.findOne({ 
      _id: req.params.id, 
      'secondaryRoles.driver': true 
    });
    
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    
    // Update driver's assigned truck
    driver.assignedTruck = truckId;
    await driver.save();
    
    res.json({ message: 'Truck assigned successfully' });
  } catch (error) {
    console.error('Error assigning truck:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDrivers,
  getAvailableDrivers,
  getDriverById,
  updateDriverStatus,
  assignTruck
};
