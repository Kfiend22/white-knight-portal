const Application = require('../models/Application');
const Rate = require('../models/Rate'); // Import the Rate model

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

// W9 Management
const updateW9 = async (req, res) => {
  try {
    const { id } = req.params;
    const w9Data = req.body;

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Update W9 information
    application.w9 = {
      ...w9Data,
      dateUpdated: new Date()
    };

    await application.save();
    res.json(application);
  } catch (error) {
    console.error('Error updating W9:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const requestW9 = async (req, res) => {
  try {
    const { id } = req.params;
    
    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Generate upload URL (this would be implemented based on your file upload system)
    const uploadUrl = `${req.protocol}://${req.get('host')}/api/v1/applications/${id}/upload-w9`;

    // Send email requesting W9
    const emailResponse = await fetch(`${req.protocol}://${req.get('host')}/api/v1/email/request-w9`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization
      },
      body: JSON.stringify({
        email: application.email,
        companyName: application.companyName,
        applicationId: application._id,
        uploadUrl
      })
    });

    if (!emailResponse.ok) {
      throw new Error('Failed to send W9 request email');
    }

    // Update application to track W9 request
    application.w9RequestDate = new Date();
    await application.save();

    res.json({ message: 'W9 request sent successfully', application });
  } catch (error) {
    console.error('Error requesting W9:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Facility Management
const updateFacility = async (req, res) => {
  try {
    const { id, facilityId } = req.params;
    const facilityData = req.body;

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Find the facility in the application
    const facilityIndex = application.facilities.findIndex(
      facility => facility._id.toString() === facilityId
    );

    if (facilityIndex === -1) {
      return res.status(404).json({ message: 'Facility not found' });
    }

    // Update the facility
    application.facilities[facilityIndex] = {
      ...application.facilities[facilityIndex],
      ...facilityData,
      dateUpdated: new Date()
    };

    await application.save();
    res.json(application);
  } catch (error) {
    console.error('Error updating facility:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const addFacility = async (req, res) => {
  try {
    const { id } = req.params;
    const facilityData = req.body;

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Add the new facility
    application.facilities.push({
      ...facilityData,
      dateCreated: new Date()
    });

    await application.save();
    res.json(application);
  } catch (error) {
    console.error('Error adding facility:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteFacility = async (req, res) => {
  try {
    const { id, facilityId } = req.params;

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Remove the facility
    application.facilities = application.facilities.filter(
      facility => facility._id.toString() !== facilityId
    );

    await application.save();
    res.json(application);
  } catch (error) {
    console.error('Error deleting facility:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Rate Management - Updated to interact directly with Rate collection
const updateRates = async (req, res) => {
  try {
    const { id: applicationId } = req.params; // Rename id to applicationId for clarity
    const ratesData = req.body;
    const clearExisting = req.query.clearExisting === 'true';

    console.log(`[UpdateRates] Received request for App ID: ${applicationId}`);
    console.log(`[UpdateRates] Clear Existing: ${clearExisting}`);
    console.log('[UpdateRates] Incoming Rates Data Count:', ratesData.length); // Log count

    // Verify the application exists
    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Group rates by facilityId
    const ratesByFacility = ratesData.reduce((acc, rate) => {
      if (!acc[rate.facilityId]) {
        acc[rate.facilityId] = [];
      }
      acc[rate.facilityId].push(rate);
      return acc;
    }, {});

    // Process rates for each facility
    for (const facilityId in ratesByFacility) {
      console.log(`[UpdateRates] Processing Facility ID: ${facilityId}`);
      const facilityRatesData = ratesByFacility[facilityId];

      // If clearExisting is true, delete all existing rates for this facility
      if (clearExisting) {
        try {
          console.log(`[UpdateRates] Clearing existing rates for Facility ID: ${facilityId}`);
          const deleteResult = await Rate.deleteMany({ applicationId, facilityId });
          console.log(`[UpdateRates] Cleared ${deleteResult.deletedCount} rates for Facility ID: ${facilityId}`);
        } catch (deleteError) {
          console.error(`[UpdateRates] Error clearing rates for Facility ID ${facilityId}:`, deleteError);
          // Decide if you want to continue processing other facilities or return an error
          // For now, we'll log and continue
        }
      }

      // Prepare new rate documents for bulk insertion
      console.log(`[UpdateRates] Preparing new rate documents for Facility ID: ${facilityId}`); // Log preparation start
      const newRateDocs = facilityRatesData
        .filter(rateData => {
          // Validate dutyLevel before preparing
          const isValidDutyLevel = rateData.dutyLevel && ['light', 'medium', 'heavy', 'road', 'additional', 'all'].includes(rateData.dutyLevel);
          if (!isValidDutyLevel) {
            console.warn(`[UpdateRates] Skipping rate due to invalid or missing dutyLevel: ${rateData.dutyLevel} for service ${rateData.serviceType} in facility ${facilityId}`);
          }
          // Only include rates with a value or mileage rates with free miles
          const hasRateValue = rateData.rate !== undefined && rateData.rate !== null && rateData.rate !== '';
          const isMileage = ['mileage', 'mileageMedium', 'mileageHeavy', 'enrouteMileage', 'enrouteMileageMedium', 'enrouteMileageHeavy', 'deadheadMiles'].includes(rateData.serviceType);
          const hasFreeMilesValue = rateData.freeMiles !== undefined && rateData.freeMiles !== null && rateData.freeMiles !== '';

          return isValidDutyLevel && (hasRateValue || (isMileage && hasFreeMilesValue));
        })
        .map(rateData => {
          const preparedRate = {
            applicationId,
            facilityId,
          serviceType: rateData.serviceType,
            serviceType: rateData.serviceType,
            dutyLevel: rateData.dutyLevel,
            rate: parseFloat(rateData.rate) || 0,
            freeMiles: parseFloat(rateData.freeMiles) || 0,
            dateUpdated: new Date() // Set update timestamp
          };
          // Log each prepared rate object before insertion
          // console.log(`[UpdateRates] Prepared rate for Facility ${facilityId}:`, JSON.stringify(preparedRate)); 
          return preparedRate;
        });

      // Bulk insert the new rates for the current facility
      if (newRateDocs.length > 0) {
        try {
          console.log(`[UpdateRates] Attempting to insert ${newRateDocs.length} new rate documents for Facility ID: ${facilityId}`);
          // console.log('[UpdateRates] Docs to insert:', JSON.stringify(newRateDocs, null, 2)); // Optional: Log full docs if needed for deep debug
          const insertResult = await Rate.insertMany(newRateDocs, { ordered: false }); // Use ordered: false to attempt inserting all valid docs even if some fail
          console.log(`[UpdateRates] Successfully inserted ${insertResult.length} new rate documents for Facility ID: ${facilityId}`);
        } catch (insertError) {
          console.error(`[UpdateRates] Error inserting rates for Facility ID ${facilityId}:`, insertError);
          // Log specific validation errors if available
          if (insertError.writeErrors) {
            insertError.writeErrors.forEach(err => {
              console.error(`[UpdateRates] Insert Error Detail (Facility ${facilityId}): Index ${err.index}, Code ${err.code}, Message: ${err.errmsg}`);
            });
          }
          // Decide if you want to continue processing other facilities or return an error
          // For now, we'll log and continue
        }
      } else {
        console.log(`[UpdateRates] No valid new rates prepared for insertion for Facility ID: ${facilityId}`);
      }
    } // End loop for facilities

    // Fetch all rates for the application again to return the updated state
    const updatedRates = await Rate.find({ applicationId });

    console.log(`[UpdateRates] Successfully updated rates for App ID: ${applicationId}. Returning ${updatedRates.length} rates.`);
    res.json(updatedRates); // Return the rates from the Rate collection

  } catch (error) {
    console.error('[UpdateRates] Error updating rates:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PDF Generation
const generateRateSheet = async (req, res) => {
  try {
    const { id } = req.params;
    const { facilityId, type } = req.query;

    const application = await Application.findById(id)
      .populate('facilities')
      .populate('rates');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const { generateFacilityRateSheet, generateConsolidatedRateSheet, generateBlankRateSheet } = require('../utils/pdfGenerator');

    let pdfBuffer;

    if (type === 'blank') {
      // Generate blank rate sheet
      pdfBuffer = await generateBlankRateSheet();
    } else if (facilityId) {
      // Generate rate sheet for a specific facility
      const facility = application.facilities.find(f => f._id.toString() === facilityId);

      if (!facility) {
        return res.status(404).json({ message: 'Facility not found' });
      }

      const rates = facility.rates || [];
      pdfBuffer = await generateFacilityRateSheet(application, facility, rates);
    } else {
      // Generate consolidated rate sheet for all facilities
      const facilities = application.facilities || [];
      const rates = facilities.flatMap(f => f.rates || []);
      pdfBuffer = await generateConsolidatedRateSheet(application, facilities, rates);
    }

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=rate-sheet-${id}.pdf`);

    // Send the PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating rate sheet:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Application Approval
const approveApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { tempPassword } = req.body;

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Update application status
    application.status = 'approved';
    application.approvalDate = new Date();
    application.approvedBy = req.user.id; // Assuming user ID is available in req.user

    await application.save();

    // Create SP user account if it doesn't exist
    let user = await User.findOne({ email: application.email });

    if (!user) {
      // Generate temporary password if not provided
      const password = tempPassword || Math.random().toString(36).slice(-8);

      user = new User({
        email: application.email,
        password: await bcrypt.hash(password, 10),
        name: `${application.ownerFirstName} ${application.ownerLastName}`,
        vendorId: application.vendorId,
        role: 'SP', // Service Provider role
        status: 'active',
        passwordChangeRequired: true
      });

      await user.save();
    } else {
      // Update existing user
      user.status = 'active';
      user.role = 'SP';
      await user.save();
    }

    // Send approval email
    const portalUrl = `${req.protocol}://${req.get('host')}`;

    const emailResponse = await fetch(`${req.protocol}://${req.get('host')}/api/v1/email/approval`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization
      },
      body: JSON.stringify({
        email: application.email,
        companyName: application.companyName,
        vendorId: application.vendorId,
        tempPassword: tempPassword || password,
        portalUrl
      })
    });

    if (!emailResponse.ok) {
      throw new Error('Failed to send approval email');
    }

    res.json({ message: 'Application approved successfully', application, user });
  } catch (error) {
    console.error('Error approving application:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Export the function along with other controller functions
module.exports = {
  createApplication,
  updateApplication,
  getMaxVendorId,
  getApplications,
  updateW9,
  requestW9,
  updateFacility,
  addFacility,
  deleteFacility,
  updateRates,
  generateRateSheet,
  approveApplication
};
