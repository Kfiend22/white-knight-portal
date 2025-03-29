const Facility = require('../models/Facility'); // Import the Facility model

// @desc    Update a standalone facility
// @route   PUT /api/v1/facilities/:id
// @access  Private (requires authentication via 'protect' middleware)
const updateStandaloneFacility = async (req, res) => {
  try {
    const facilityId = req.params.id;
    const updateData = req.body;

    // Add a timestamp for the update
    updateData.dateUpdated = new Date(); 

    const updatedFacility = await Facility.findByIdAndUpdate(
      facilityId,
      updateData,
      { new: true, runValidators: true } // Return the updated document and run schema validators
    );

    if (!updatedFacility) {
      return res.status(404).json({ message: 'Facility not found' });
    }

    console.log(`Facility ${facilityId} updated successfully.`);
    res.json(updatedFacility); // Send back the updated facility data

  } catch (error) {
    console.error('Error updating standalone facility:', error);
    // Handle potential validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation Error', errors: error.errors });
    }
    res.status(500).json({ message: 'Server error while updating facility' });
  }
};

module.exports = {
  updateStandaloneFacility,
  // Add other facility controller functions here if needed
};
