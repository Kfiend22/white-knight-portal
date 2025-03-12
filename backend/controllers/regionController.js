// File: backend/controllers/regionController.js
const Region = require('../models/Region');
const User = require('../models/userModel');

/**
 * Create a new region
 * @route POST /api/regions
 * @access Private/Owner
 */
const createRegion = async (req, res) => {
  try {
    const { name, description, countries, states } = req.body;
    
    // Check if region with the same name already exists
    const existingRegion = await Region.findOne({ name });
    if (existingRegion) {
      return res.status(400).json({ message: 'Region with this name already exists' });
    }
    
    // Create new region
    const region = new Region({
      name,
      description,
      countries,
      states,
      createdBy: req.user._id
    });
    
    await region.save();
    
    res.status(201).json(region);
  } catch (error) {
    console.error('Error creating region:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * Get all regions
 * @route GET /api/regions
 * @access Private/Owner, RegionalManager
 */
const getRegions = async (req, res) => {
  try {
    const regions = await Region.find().populate('createdBy', 'ownerFirstName ownerLastName');
    res.json(regions);
  } catch (error) {
    console.error('Error fetching regions:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * Get region by ID
 * @route GET /api/regions/:id
 * @access Private/Owner, RegionalManager
 */
const getRegionById = async (req, res) => {
  try {
    const region = await Region.findById(req.params.id).populate('createdBy', 'ownerFirstName ownerLastName');
    
    if (!region) {
      return res.status(404).json({ message: 'Region not found' });
    }
    
    res.json(region);
  } catch (error) {
    console.error('Error fetching region:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * Update region
 * @route PUT /api/regions/:id
 * @access Private/Owner
 */
const updateRegion = async (req, res) => {
  try {
    const { name, description, countries, states, isActive } = req.body;
    
    // Check if region exists
    let region = await Region.findById(req.params.id);
    if (!region) {
      return res.status(404).json({ message: 'Region not found' });
    }
    
    // Check if updating to a name that already exists (excluding this region)
    if (name && name !== region.name) {
      const existingRegion = await Region.findOne({ name });
      if (existingRegion) {
        return res.status(400).json({ message: 'Region with this name already exists' });
      }
    }
    
    // Update region
    region.name = name || region.name;
    region.description = description || region.description;
    region.countries = countries || region.countries;
    region.states = states || region.states;
    region.isActive = isActive !== undefined ? isActive : region.isActive;
    
    await region.save();
    
    res.json(region);
  } catch (error) {
    console.error('Error updating region:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * Delete region
 * @route DELETE /api/regions/:id
 * @access Private/Owner
 */
const deleteRegion = async (req, res) => {
  try {
    // Check if region exists
    const region = await Region.findById(req.params.id);
    if (!region) {
      return res.status(404).json({ message: 'Region not found' });
    }
    
    // Check if any users are assigned to this region
    const usersInRegion = await User.countDocuments({ region: req.params.id });
    if (usersInRegion > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete region with assigned users. Reassign users first.' 
      });
    }
    
    await region.remove();
    
    res.json({ message: 'Region removed' });
  } catch (error) {
    console.error('Error deleting region:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * Get countries and states reference data
 * @route GET /api/regions/reference-data
 * @access Private/Owner
 */
const getReferenceData = async (req, res) => {
  try {
    // This is a simplified list. In a real application, you might want to use a more comprehensive list
    // or integrate with a third-party API for this data.
    const countries = [
      { code: 'US', name: 'United States' },
      { code: 'CA', name: 'Canada' },
      { code: 'MX', name: 'Mexico' }
    ];
    
    const states = {
      US: [
        { code: 'AL', name: 'Alabama' },
        { code: 'AK', name: 'Alaska' },
        { code: 'AZ', name: 'Arizona' },
        { code: 'AR', name: 'Arkansas' },
        { code: 'CA', name: 'California' },
        { code: 'CO', name: 'Colorado' },
        { code: 'CT', name: 'Connecticut' },
        { code: 'DE', name: 'Delaware' },
        { code: 'FL', name: 'Florida' },
        { code: 'GA', name: 'Georgia' },
        { code: 'HI', name: 'Hawaii' },
        { code: 'ID', name: 'Idaho' },
        { code: 'IL', name: 'Illinois' },
        { code: 'IN', name: 'Indiana' },
        { code: 'IA', name: 'Iowa' },
        { code: 'KS', name: 'Kansas' },
        { code: 'KY', name: 'Kentucky' },
        { code: 'LA', name: 'Louisiana' },
        { code: 'ME', name: 'Maine' },
        { code: 'MD', name: 'Maryland' },
        { code: 'MA', name: 'Massachusetts' },
        { code: 'MI', name: 'Michigan' },
        { code: 'MN', name: 'Minnesota' },
        { code: 'MS', name: 'Mississippi' },
        { code: 'MO', name: 'Missouri' },
        { code: 'MT', name: 'Montana' },
        { code: 'NE', name: 'Nebraska' },
        { code: 'NV', name: 'Nevada' },
        { code: 'NH', name: 'New Hampshire' },
        { code: 'NJ', name: 'New Jersey' },
        { code: 'NM', name: 'New Mexico' },
        { code: 'NY', name: 'New York' },
        { code: 'NC', name: 'North Carolina' },
        { code: 'ND', name: 'North Dakota' },
        { code: 'OH', name: 'Ohio' },
        { code: 'OK', name: 'Oklahoma' },
        { code: 'OR', name: 'Oregon' },
        { code: 'PA', name: 'Pennsylvania' },
        { code: 'RI', name: 'Rhode Island' },
        { code: 'SC', name: 'South Carolina' },
        { code: 'SD', name: 'South Dakota' },
        { code: 'TN', name: 'Tennessee' },
        { code: 'TX', name: 'Texas' },
        { code: 'UT', name: 'Utah' },
        { code: 'VT', name: 'Vermont' },
        { code: 'VA', name: 'Virginia' },
        { code: 'WA', name: 'Washington' },
        { code: 'WV', name: 'West Virginia' },
        { code: 'WI', name: 'Wisconsin' },
        { code: 'WY', name: 'Wyoming' },
        { code: 'DC', name: 'District of Columbia' }
      ],
      CA: [
        { code: 'AB', name: 'Alberta' },
        { code: 'BC', name: 'British Columbia' },
        { code: 'MB', name: 'Manitoba' },
        { code: 'NB', name: 'New Brunswick' },
        { code: 'NL', name: 'Newfoundland and Labrador' },
        { code: 'NS', name: 'Nova Scotia' },
        { code: 'NT', name: 'Northwest Territories' },
        { code: 'NU', name: 'Nunavut' },
        { code: 'ON', name: 'Ontario' },
        { code: 'PE', name: 'Prince Edward Island' },
        { code: 'QC', name: 'Quebec' },
        { code: 'SK', name: 'Saskatchewan' },
        { code: 'YT', name: 'Yukon' }
      ],
      MX: [
        { code: 'AGU', name: 'Aguascalientes' },
        { code: 'BCN', name: 'Baja California' },
        { code: 'BCS', name: 'Baja California Sur' },
        { code: 'CAM', name: 'Campeche' },
        { code: 'CHP', name: 'Chiapas' },
        { code: 'CHH', name: 'Chihuahua' },
        { code: 'COA', name: 'Coahuila' },
        { code: 'COL', name: 'Colima' },
        { code: 'DIF', name: 'Ciudad de México' },
        { code: 'DUR', name: 'Durango' },
        { code: 'GUA', name: 'Guanajuato' },
        { code: 'GRO', name: 'Guerrero' },
        { code: 'HID', name: 'Hidalgo' },
        { code: 'JAL', name: 'Jalisco' },
        { code: 'MEX', name: 'México' },
        { code: 'MIC', name: 'Michoacán' },
        { code: 'MOR', name: 'Morelos' },
        { code: 'NAY', name: 'Nayarit' },
        { code: 'NLE', name: 'Nuevo León' },
        { code: 'OAX', name: 'Oaxaca' },
        { code: 'PUE', name: 'Puebla' },
        { code: 'QUE', name: 'Querétaro' },
        { code: 'ROO', name: 'Quintana Roo' },
        { code: 'SLP', name: 'San Luis Potosí' },
        { code: 'SIN', name: 'Sinaloa' },
        { code: 'SON', name: 'Sonora' },
        { code: 'TAB', name: 'Tabasco' },
        { code: 'TAM', name: 'Tamaulipas' },
        { code: 'TLA', name: 'Tlaxcala' },
        { code: 'VER', name: 'Veracruz' },
        { code: 'YUC', name: 'Yucatán' },
        { code: 'ZAC', name: 'Zacatecas' }
      ]
    };
    
    res.json({ countries, states });
  } catch (error) {
    console.error('Error fetching reference data:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  createRegion,
  getRegions,
  getRegionById,
  updateRegion,
  deleteRegion,
  getReferenceData
};
