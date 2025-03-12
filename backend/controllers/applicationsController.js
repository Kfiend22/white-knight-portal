const Application = require('../models/Application');

const getApplications = async (req, res) => {
  try {
    const { step, search, ...otherParams } = req.query;
    let query = {};

    // Build query based on otherParams
    const buildQuery = (obj, prefix = '') => {
      Object.entries(obj).forEach(([key, value]) => {
        const path = prefix ? `${prefix}.${key}` : key;

        if (typeof value === 'object' && value !== null) {
          buildQuery(value, path);
        } else if (
          value !== '' &&
          value !== 'false' &&
          value !== false &&
          value !== null &&
          value !== undefined
        ) {
          // Handle boolean values represented as strings
          if (value === 'true') {
            query[path] = true;
          } else if (value === 'false') {
            query[path] = false;
          } else {
            // For string fields, use regex for partial matching (case-insensitive)
            query[path] = { $regex: value, $options: 'i' };
          }
        }
      });
    };

    buildQuery(otherParams);

    // Include step and search in the query if they exist
    if (step) {
      query.step = step;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { companyName: searchRegex },
        { ownerFirstName: searchRegex },
        { ownerLastName: searchRegex },
        // Add other fields as needed
      ];
    }

    // Fetch applications based on the constructed query
    const applications = await Application.find(query);
    res.json({ applications });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMaxVendorId = async (req, res) => {
  try {
    // Find the application with the highest vendorId
    const maxApplication = await Application.findOne()
      .sort({ vendorId: -1 })
      .select('vendorId');

    let maxIdNumber = 0;
    if (maxApplication && maxApplication.vendorId) {
      // Extract the numeric part of the vendorId (assuming vendorId starts with state abbreviation)
      maxIdNumber = parseInt(maxApplication.vendorId.slice(2), 10);
    }

    res.json({ maxIdNumber });
  } catch (error) {
    console.error('Error in getMaxVendorId:', error);
    res.status(500).json({ message: error.message });
  }
};

const validateApplicationData = (data) => {
  const errors = {};

  if (!data.companyName || data.companyName.length > 100) {
    errors.companyName = "Company name is required and must be 100 characters or less";
  }

  if (!data.contactName || data.contactName.length > 100) {
    errors.contactName = "Contact name is required and must be 100 characters or less";
  }

  if (!data.email || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(data.email)) {
    errors.email = "Valid email is required";
  }

  if (!data.phone || !/^\+?[1-9]\d{1,14}$/.test(data.phone)) {
    errors.phone = "Valid phone number is required";
  }

  if (!data.serviceArea || data.serviceArea.length > 200) {
    errors.serviceArea = "Service area is required and must be 200 characters or less";
  }

  if (!Number.isInteger(data.yearsInBusiness) || data.yearsInBusiness < 0) {
    errors.yearsInBusiness = "Years in business must be a non-negative integer";
  }

  if (data.licensesAndCertifications && data.licensesAndCertifications.length > 1000) {
    errors.licensesAndCertifications = "Licenses and certifications must be 1000 characters or less";
  }

  if (data.references && data.references.length > 1000) {
    errors.references = "References must be 1000 characters or less";
  }

  return Object.keys(errors).length === 0 ? null : errors;
};

const createApplication = async (req, res) => {
  const applicationData = req.body;
  const validationErrors = validateApplicationData(applicationData);

  if (validationErrors) {
    return res.status(400).json({ errors: validationErrors });
  }

  try {
    // Generate new vendor ID
    const lastVendor = await Application.findOne().sort('-vendorId');
    const newVendorId = lastVendor ? lastVendor.vendorId + 1 : 1000;
    
    // Add vendor ID and submission data
    applicationData.vendorId = newVendorId;
    applicationData.submissionDate = new Date();
    applicationData.status = 'pending';

    // Create application
    const application = await Application.create(applicationData);

    // Create user document
    const user = await User.create({
      email: applicationData.email,
      password: generateTempPassword(), // Implement this helper function
      vendorId: newVendorId,
      role: 'vendor'
    });

    // Create vendor document
    const vendor = await VendorId.create({
      vendorId: newVendorId,
      applicationId: application._id,
      userId: user._id
    });

    res.status(201).json({ application, user, vendor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateApplication = async (req, res) => {
  const applicationData = req.body;
  const validationErrors = validateApplicationData(applicationData);

  if (validationErrors) {
    return res.status(400).json({ errors: validationErrors });
  }

  try {
    const updatedApplication = await Application.findByIdAndUpdate(
      req.params.id,
      applicationData,
      { new: true, runValidators: true }
    );
    if (!updatedApplication) {
      return res.status(404).json({ message: 'Application not found' });
    }
    res.json(updatedApplication);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Export the function along with other controller functions
module.exports = { createApplication, updateApplication, getMaxVendorId, getApplications, };