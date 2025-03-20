// backend/controllers/settingsController.js
const User = require('../models/userModel');
const Vehicle = require('../models/Vehicle');

/**
 * Get all settings including users
 * @route GET /api/settings
 * @access Private
 */
const getSettings = async (req, res) => {
  try {
    // Fetch users from the database
    const usersFromDB = await User.find({});
    
    // Transform users to match frontend structure
    const users = usersFromDB.map(user => ({
      id: user._id,
      // Use new field names with fallback to legacy fields
      firstName: user.firstName || user.ownerFirstName || '',
      lastName: user.lastName || user.ownerLastName || '',
      phone: user.phone || user.facilityPhone || '',
      email: user.email || '',
      username: user.username || '',
      // Map primary role
      primaryRole: user.primaryRole || user.role || '',
      role: user.role || user.primaryRole || '',
      // Map secondary roles with fallbacks to legacy boolean fields
      secondaryRoles: {
        admin: user.secondaryRoles?.admin || user.isAdmin || false,
        dispatcher: user.secondaryRoles?.dispatcher || user.isDispatcher || false,
        driver: user.secondaryRoles?.driver || user.isDriver || false,
        answeringService: user.secondaryRoles?.answeringService || user.isAnsweringService || false
      },
      // Include legacy boolean fields for backward compatibility
      isAdmin: user.secondaryRoles?.admin || user.isAdmin || user.role === 'OW' || user.role === 'RM' || false,
      isDispatcher: user.secondaryRoles?.dispatcher || user.isDispatcher || user.role === 'DP' || false,
      isDriver: user.secondaryRoles?.driver || user.isDriver || user.role === 'DV' || false,
      isAnsweringService: user.secondaryRoles?.answeringService || user.isAnsweringService || user.role === 'SP' || false,
      // Include status flags
      isActive: user.isActive !== false, // Default to true if not explicitly false
      isOnDuty: user.isOnDuty || false,
      // Include notification preferences
      notifyNewJobAssigned: user.notifyNewJobAssigned || false,
      notifyJobDispatched: user.notifyJobDispatched || false,
      // Include address information
      address: {
        street1: user.address?.street1 || user.facilityAddress1 || '',
        street2: user.address?.street2 || user.facilityAddress2 || '',
        city: user.address?.city || user.facilityCity || '',
        state: user.address?.state || user.facilityState || '',
        zip: user.address?.zip || user.facilityZip || '',
        country: user.address?.country || user.facilityCountry || 'US'
      },
      // Include vendor information
      vendorNumber: user.vendorNumber || user.vendorId || '',
      vendorId: user.vendorId || user.vendorNumber || ''
    }));

    // Fetch vehicles from the database
    let vehicles = [];
    try {
      const vehiclesFromDB = await Vehicle.find({});
      
      // Map to frontend structure
      vehicles = vehiclesFromDB.map(vehicle => ({
        id: vehicle._id,
        name: vehicle.name,
        make: vehicle.make || '',
        model: vehicle.model || '',
        year: vehicle.year || '',
        type: vehicle.type,
        driverId: vehicle.driverId || null,
        driverName: vehicle.driverName || null,
        vendorId: vehicle.vendorId || '',
        status: vehicle.status || 'Off Duty',
        lat: vehicle.lat || 0,
        lng: vehicle.lng || 0,
        driver: vehicle.driverName || null // For backward compatibility
      }));
    } catch (vehicleError) {
      console.error('Error fetching vehicles:', vehicleError);
      // Don't fail the entire request, just log the error and continue with empty vehicles array
    }

    // Return all settings
    res.json({
      locations: [], // Placeholder for locations
      selectedLocation: '', // Placeholder for selected location
      sites: [], // Placeholder for sites
      vehicles, // Vehicles from database
      users
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update settings
 * @route PUT /api/settings
 * @access Private
 */
const updateSettings = async (req, res) => {
  try {
    const { users, vehicles } = req.body;

    // Process users if provided
    if (users && Array.isArray(users)) {
      // Process each user
      for (const user of users) {
        if (user.id) {
          // Update existing user
          const userToUpdate = await User.findById(user.id);
          
          if (userToUpdate) {
            // Update basic information
            userToUpdate.firstName = user.firstName || userToUpdate.firstName;
            userToUpdate.lastName = user.lastName || userToUpdate.lastName;
            userToUpdate.email = user.email || userToUpdate.email;
            userToUpdate.username = user.username || userToUpdate.username;
            userToUpdate.phone = user.phone || userToUpdate.phone;
            
            // Update legacy fields for backward compatibility
            userToUpdate.ownerFirstName = user.firstName || userToUpdate.ownerFirstName;
            userToUpdate.ownerLastName = user.lastName || userToUpdate.ownerLastName;
            
            // Update primary role
            if (user.primaryRole) {
              userToUpdate.primaryRole = user.primaryRole;
              userToUpdate.role = user.primaryRole; // Update legacy role field
            }
            
            // Update secondary roles
            if (user.secondaryRoles) {
              if (!userToUpdate.secondaryRoles) {
                userToUpdate.secondaryRoles = {};
              }
              
              // Update each secondary role
              if (user.secondaryRoles.admin !== undefined) {
                userToUpdate.secondaryRoles.admin = user.secondaryRoles.admin;
              }
              if (user.secondaryRoles.dispatcher !== undefined) {
                userToUpdate.secondaryRoles.dispatcher = user.secondaryRoles.dispatcher;
              }
              if (user.secondaryRoles.driver !== undefined) {
                userToUpdate.secondaryRoles.driver = user.secondaryRoles.driver;
              }
              if (user.secondaryRoles.answeringService !== undefined) {
                userToUpdate.secondaryRoles.answeringService = user.secondaryRoles.answeringService;
              }
            }
            
            // Update status flags
            if (user.isActive !== undefined) {
              userToUpdate.isActive = user.isActive;
            }
            if (user.isOnDuty !== undefined) {
              userToUpdate.isOnDuty = user.isOnDuty;
            }
            
            // Update notification preferences
            if (user.notifyNewJobAssigned !== undefined) {
              userToUpdate.notifyNewJobAssigned = user.notifyNewJobAssigned;
            }
            if (user.notifyJobDispatched !== undefined) {
              userToUpdate.notifyJobDispatched = user.notifyJobDispatched;
            }
            
            // Update address information
            if (user.address) {
              if (!userToUpdate.address) {
                userToUpdate.address = {};
              }
              
              // Update each address field
              if (user.address.street1 !== undefined) {
                userToUpdate.address.street1 = user.address.street1;
                userToUpdate.facilityAddress1 = user.address.street1; // Update legacy field
              }
              if (user.address.street2 !== undefined) {
                userToUpdate.address.street2 = user.address.street2;
                userToUpdate.facilityAddress2 = user.address.street2; // Update legacy field
              }
              if (user.address.city !== undefined) {
                userToUpdate.address.city = user.address.city;
                userToUpdate.facilityCity = user.address.city; // Update legacy field
              }
              if (user.address.state !== undefined) {
                userToUpdate.address.state = user.address.state;
                userToUpdate.facilityState = user.address.state; // Update legacy field
              }
              if (user.address.zip !== undefined) {
                userToUpdate.address.zip = user.address.zip;
                userToUpdate.facilityZip = user.address.zip; // Update legacy field
              }
              if (user.address.country !== undefined) {
                userToUpdate.address.country = user.address.country;
                userToUpdate.facilityCountry = user.address.country; // Update legacy field
              }
            }
            
            // If password is being updated
            if (user.newPassword) {
              userToUpdate.password = user.newPassword;
            }
            
            // Add audit log entry
            if (!userToUpdate.auditLog) {
              userToUpdate.auditLog = [];
            }
            
            userToUpdate.auditLog.push({
              action: 'update',
              performedBy: req.user ? req.user.id : null,
              timestamp: new Date(),
              details: { method: 'updateSettings' }
            });
            
            await userToUpdate.save();
          }
        }
      }
    }

    // Process vehicles if provided
    if (vehicles && Array.isArray(vehicles)) {
      // Process each vehicle
      for (const vehicle of vehicles) {
        if (vehicle.id) {
          // Update existing vehicle
          try {
            const vehicleToUpdate = await Vehicle.findById(vehicle.id);
            
            if (vehicleToUpdate) {
              // Update basic information
              vehicleToUpdate.name = vehicle.name || vehicleToUpdate.name;
              vehicleToUpdate.make = vehicle.make || vehicleToUpdate.make;
              vehicleToUpdate.model = vehicle.model || vehicleToUpdate.model;
              vehicleToUpdate.year = vehicle.year || vehicleToUpdate.year;
              vehicleToUpdate.type = vehicle.type || vehicleToUpdate.type;
              
              // Update driver information
              vehicleToUpdate.driverId = vehicle.driverId || vehicleToUpdate.driverId;
              vehicleToUpdate.driverName = vehicle.driverName || vehicle.driver || vehicleToUpdate.driverName;
              
              // Update status and location
              if (vehicle.status) {
                vehicleToUpdate.status = vehicle.status;
              }
              if (vehicle.lat !== undefined) {
                vehicleToUpdate.lat = vehicle.lat;
              }
              if (vehicle.lng !== undefined) {
                vehicleToUpdate.lng = vehicle.lng;
              }
              
              // Save the updated vehicle
              await vehicleToUpdate.save();
            }
          } catch (vehicleError) {
            console.error(`Error updating vehicle ${vehicle.id}:`, vehicleError);
            // Continue processing other vehicles
          }
        } else {
          // Create new vehicle
          try {
            // Find vendor ID from current user or from vehicle data
            const vendorId = vehicle.vendorId || (req.user && (req.user.vendorId || req.user.vendorNumber)) || 'VEH' + Date.now().toString().slice(-8);
            
            // Create new vehicle document
            const newVehicle = new Vehicle({
              name: vehicle.name,
              make: vehicle.make || '',
              model: vehicle.model || '',
              year: vehicle.year || '',
              type: vehicle.type,
              driverId: vehicle.driverId || null,
              driverName: vehicle.driverName || vehicle.driver || null,
              vendorId: vendorId,
              status: vehicle.status || 'Off Duty',
              lat: vehicle.lat || 0,
              lng: vehicle.lng || 0,
              createdBy: req.user ? req.user.id : null
            });
            
            // Save the new vehicle
            await newVehicle.save();
          } catch (vehicleError) {
            console.error('Error creating new vehicle:', vehicleError);
            // Continue processing other vehicles
          }
        }
      }
    }

    // Return updated settings
    await getSettings(req, res);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Create a new user from the settings page
 * @route POST /api/settings/users
 * @access Private
 */
const createUser = async (req, res) => {
  try {
    const userData = req.body;
    
    // Generate a unique vendorId if not provided
    const vendorId = userData.vendorId || userData.vendorNumber || 
                    ('USER' + Date.now().toString().slice(-8));
    
    // Map frontend fields to backend model
    const newUser = new User({
      // Basic information
      firstName: userData.firstName,
      lastName: userData.lastName,
      username: userData.username,
      password: userData.password,
      email: userData.email,
      phone: userData.phone || '',
      
      // Legacy fields for backward compatibility
      ownerFirstName: userData.firstName,
      ownerLastName: userData.lastName,
      
      // Vendor information
      vendorId: vendorId,
      vendorNumber: vendorId,
      companyName: userData.companyName || 'White Knight Roadside Motor Club',
      
      // Address information
      address: {
        street1: userData.address?.street1 || '',
        street2: userData.address?.street2 || '',
        city: userData.address?.city || '',
        state: userData.address?.state || '',
        zip: userData.address?.zip || '',
        country: userData.address?.country || 'US'
      },
      
      // Legacy address fields
      facilityCountry: userData.address?.country || 'US',
      facilityAddress1: userData.address?.street1 || '',
      facilityAddress2: userData.address?.street2 || '',
      facilityCity: userData.address?.city || '',
      facilityState: userData.address?.state || '',
      facilityZip: userData.address?.zip || '',
      
      // Status flags
      isFirstLogin: true,
      isActive: true,
      isOnDuty: false,
      
      // Territories
      territories: {
        zipCodes: userData.zipCodes || []
      }
    });
    
    // Set primary role
    if (userData.primaryRole) {
      newUser.primaryRole = userData.primaryRole;
      newUser.role = userData.primaryRole; // Set legacy role field
    } else {
      // Determine role based on checkboxes for backward compatibility
      if (userData.isAdmin) {
        newUser.primaryRole = 'OW'; // Owner/Admin
        newUser.role = 'OW';
      } else if (userData.isDispatcher) {
        newUser.primaryRole = 'RM'; // Regional Manager with dispatcher role
        newUser.role = 'RM';
        newUser.secondaryRoles = { dispatcher: true };
      } else if (userData.isDriver) {
        newUser.primaryRole = 'SP'; // Service Provider with driver role
        newUser.role = 'SP';
        newUser.secondaryRoles = { driver: true };
      } else if (userData.isAnsweringService) {
        newUser.primaryRole = 'SP'; // Service Provider with answering service role
        newUser.role = 'SP';
        newUser.secondaryRoles = { answeringService: true };
      } else {
        newUser.primaryRole = 'SP'; // Default to Service Provider
        newUser.role = 'SP';
      }
    }
    
    // Set secondary roles if provided
    if (userData.secondaryRoles) {
      if (!newUser.secondaryRoles) {
        newUser.secondaryRoles = {};
      }
      
      if (userData.secondaryRoles.admin !== undefined) {
        newUser.secondaryRoles.admin = userData.secondaryRoles.admin;
      }
      if (userData.secondaryRoles.dispatcher !== undefined) {
        newUser.secondaryRoles.dispatcher = userData.secondaryRoles.dispatcher;
      }
      if (userData.secondaryRoles.driver !== undefined) {
        newUser.secondaryRoles.driver = userData.secondaryRoles.driver;
      }
      if (userData.secondaryRoles.answeringService !== undefined) {
        newUser.secondaryRoles.answeringService = userData.secondaryRoles.answeringService;
      }
    }
    
    // Set createdBy to the current user if available
    if (req.user && req.user.id) {
      newUser.createdBy = req.user.id;
    }
    
    // Add audit log entry
    newUser.auditLog = [{
      action: 'create',
      performedBy: req.user ? req.user.id : null,
      timestamp: new Date(),
      details: { method: 'createUser' }
    }];
    
    await newUser.save();
    
    // Return the created user with frontend structure
    const userResponse = {
      id: newUser._id,
      firstName: newUser.firstName || newUser.ownerFirstName,
      lastName: newUser.lastName || newUser.ownerLastName,
      phone: newUser.phone || '',
      email: newUser.email,
      username: newUser.username,
      primaryRole: newUser.primaryRole || newUser.role,
      role: newUser.role || newUser.primaryRole,
      secondaryRoles: newUser.secondaryRoles || {},
      isAdmin: newUser.secondaryRoles?.admin || newUser.role === 'OW' || newUser.role === 'RM',
      isDispatcher: newUser.secondaryRoles?.dispatcher || newUser.role === 'DP',
      isDriver: newUser.secondaryRoles?.driver || newUser.role === 'DV',
      isAnsweringService: newUser.secondaryRoles?.answeringService || newUser.role === 'SP',
      isActive: newUser.isActive !== false,
      isOnDuty: newUser.isOnDuty || false,
      notifyNewJobAssigned: newUser.notifyNewJobAssigned || false,
      notifyJobDispatched: newUser.notifyJobDispatched || false,
      address: {
        street1: newUser.address?.street1 || newUser.facilityAddress1 || '',
        street2: newUser.address?.street2 || newUser.facilityAddress2 || '',
        city: newUser.address?.city || newUser.facilityCity || '',
        state: newUser.address?.state || newUser.facilityState || '',
        zip: newUser.address?.zip || newUser.facilityZip || '',
        country: newUser.address?.country || newUser.facilityCountry || 'US'
      },
      vendorNumber: newUser.vendorNumber || newUser.vendorId,
      vendorId: newUser.vendorId || newUser.vendorNumber
    };
    
    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Error creating user:', error);
    
    if (error.code === 11000) {
      // Duplicate key error
      return res.status(400).json({ 
        message: 'User with this email, username, or vendor ID already exists' 
      });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete a user
 * @route DELETE /api/settings/users/:id
 * @access Private
 */
  const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Use deleteOne instead of remove (which is deprecated)
    await User.deleteOne({ _id: req.params.id });
    
    res.json({ message: 'User removed' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  createUser,
  deleteUser
};
