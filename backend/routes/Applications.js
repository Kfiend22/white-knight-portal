// routes/applications.js
const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const Facility = require('../models/Facility');
const Rate = require('../models/Rate');
const multer = require('multer');
const path = require('path');
const User = require('../models/userModel');

const {
  getApplications,
  getMaxVendorId,
  createApplication,
  updateApplication,
  updateW9,
  requestW9,
  updateFacility,
  addFacility,
  deleteFacility,
  updateRates,
  generateRateSheet,
  approveApplication
} = require('../controllers/applicationsController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/applications/');
  },
  filename: (req, file, cb) => {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({ storage: storage });

router.get('/', getApplications);

router.get('/maxVendorId', async (req, res) => {
  try {
    const maxVendor = await Application.findOne().sort('-vendorId').limit(1);
    res.json({ maxVendorId: maxVendor ? maxVendor.vendorId : 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT update application step
router.put('/:id', async (req, res) => {
  console.log('Request body:', req.body);
  try {
    // Use the entire request body for the update, allowing all fields to be modified
    // Ensure Mongoose validation is enabled by default or add { runValidators: true } if needed
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      req.body, // Use the full request body for the update
      { new: true, runValidators: true } // Ensure validators run and return the updated doc
    );
    if (!application) {
      console.log('Application not found.');
      return res.status(404).json({ message: 'Application not found.' });
    }
    res.json(application);
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update application step
router.patch('/:id/step', async (req, res) => {
  try {
    const { step } = req.body;
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { step },
      { new: true }
    );
    res.json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete application
router.delete('/:id', async (req, res) => {
  try {
    const application = await Application.findByIdAndDelete(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Advanced search
router.post('/search', async (req, res) => {
  try {
    const searchCriteria = { ...req.body };
    delete searchCriteria.step;
    delete searchCriteria.termsAgreement;
    delete searchCriteria.signature;
    delete searchCriteria.codeOfConductAgreement;
    
    const applications = await Application.find(searchCriteria);
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Handle form submission
router.post('/', upload.fields([
  { name: 'w9', maxCount: 1 },
  { name: 'backgroundCheck', maxCount: 1 },
  { name: 'coi', maxCount: 1 },
  { name: 'zipCodeFile', maxCount: 1 },
]), async (req, res) => {
  try {
    const transformedData = {
      ...req.body,
      services: {
        roadOnly: req.body.services.roadOnly === "on",
        lightDuty: req.body.services.lightDuty === "on",
        mediumDuty: req.body.services.mediumDuty === "on",
        heavyDuty: req.body.services.heavyDuty === "on",
        mobileMechanic: req.body.services.mobileMechanic === "on",
        mediumHeavyTire: req.body.services.mediumHeavyTire === "on",
        accidentSceneTowing: req.body.services.accidentSceneTowing === "on",
        secondaryTow: req.body.services.secondaryTow === "on",
        storageFacility: req.body.services.storageFacility === "on"
      }
    };

    const application = new Application(transformedData);
    const savedApplication = await application.save();
    console.log('Saved application:', savedApplication);
    
    res.status(201).json({ message: "Application submitted successfully" });
  } catch (error) {
    console.error('Error saving application:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route to handle application submissions with file uploads
router.post(
  '/',
  upload.fields([
    { name: 'w9', maxCount: 1 },
    { name: 'backgroundCheck', maxCount: 1 },
    { name: 'coi', maxCount: 1 },
    { name: 'zipCodeFile', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const applicationData = JSON.parse(req.body.data);

      // Save file paths
      if (req.files.w9) {
        applicationData.w9Path = req.files.w9[0].filename;
      }
      if (req.files.backgroundCheck) {
        // Ensure the backgroundCheck object exists
        applicationData.backgroundCheck = applicationData.backgroundCheck || {}; 
        // Save path to the correct nested field
        applicationData.backgroundCheck.path = req.files.backgroundCheck[0].filename; 
      }
      if (req.files.coi) {
        applicationData.insurance = applicationData.insurance || {};
        applicationData.insurance.coiPath = req.files.coi[0].filename;
      }
      if (req.files.zipCodeFile) {
        applicationData.territories = applicationData.territories || {};
        applicationData.territories.zipCodeFile = req.files.zipCodeFile[0].filename;
      }

      const application = new Application(applicationData);
      await application.save();

      res.status(201).json(application);
    } catch (error) {
      console.error('Error saving application:', error);
      res.status(500).json({ message: error.message });
    }
  }
);

// W9 Management
router.put('/:id/w9', updateW9);
router.post('/:id/request-w9', requestW9);

// Insurance Management
router.put('/:id/insurance', async (req, res) => {
  try {
    const { id } = req.params;
    const insuranceData = req.body;

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Update insurance information
    application.insurance = {
      ...application.insurance,
      ...insuranceData,
      dateUpdated: new Date()
    };

    await application.save();
    res.json(application);
  } catch (error) {
    console.error('Error updating insurance:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/request-coi', async (req, res) => {
  try {
    const { id } = req.params;
    
    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Generate upload URL
    const uploadUrl = `${req.protocol}://${req.get('host')}/api/v1/applications/${id}/upload-coi`;

    // Send email requesting COI
    const emailResponse = await fetch(`${req.protocol}://${req.get('host')}/api/v1/email/request-coi`, {
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
      throw new Error('Failed to send COI request email');
    }

    // Update application to track COI request
    application.coiRequestDate = new Date();
    await application.save();

    res.json({ message: 'COI request sent successfully', application });
  } catch (error) {
    console.error('Error requesting COI:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload COI
router.post('/:id/upload-coi', upload.single('coi'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    // Initialize insurance object if it doesn't exist
    if (!application.insurance) {
      application.insurance = {};
    }
    
    // Save the file path to the application
    application.insurance.coiPath = req.file.filename;
    await application.save();
    
    res.json({ message: 'Certificate of Insurance uploaded successfully', application });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Facility Management - Fetch from Facility collection
router.get('/:id/facilities', async (req, res) => {
  try {
    // Find facilities linked to the application ID
    const facilities = await Facility.find({ applicationId: req.params.id });
    // No need to check application existence here, an empty array is a valid response
    res.json(facilities); 
  } catch (error) {
    console.error('Error fetching facilities:', error);
    res.status(500).json({ message: 'Server error while fetching facilities' });
  }
});

router.post('/:id/facilities', addFacility);
router.put('/:id/facilities/:facilityId', updateFacility);
router.delete('/:id/facilities/:facilityId', deleteFacility);

// Rate Management - Fetch from Rate collection
router.get('/:id/rates', async (req, res) => {
  try {
    // Find rates linked to the application ID
    const rates = await Rate.find({ applicationId: req.params.id });
    // No need to check application existence here, an empty array is a valid response
    // The response structure already matches what the frontend expects (array of rate objects)
    res.json(rates); 
  } catch (error) {
    console.error('Error fetching rates:', error); 
    res.status(500).json({ message: 'Server error while fetching rates' });
  }
});

router.post('/:id/rates', updateRates);

// PDF Generation
router.post('/:id/generate-rate-sheet', async (req, res) => {
  try {
    const { id } = req.params;
    const { facilityId } = req.body;

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Generate PDF using the pdfGenerator utility
    const { generateFacilityRateSheet, generateConsolidatedRateSheet } = require('../utils/pdfGenerator');
    
    let pdfBuffer;
    let filename;
    
    if (facilityId) {
      // Generate rate sheet for a specific facility
      const facility = application.facilities.find(f => f._id.toString() === facilityId);
      
      if (!facility) {
        return res.status(404).json({ message: 'Facility not found' });
      }
      
      const rates = facility.rates || [];
      pdfBuffer = await generateFacilityRateSheet(application, facility, rates);
      filename = `rate-sheet-${application.companyName.replace(/\s+/g, '-')}-${facility.facilityName.replace(/\s+/g, '-')}.pdf`;
    } else {
      // Generate consolidated rate sheet for all facilities
      const facilities = application.facilities || [];
      pdfBuffer = await generateConsolidatedRateSheet(application, facilities);
      filename = `rate-sheet-${application.companyName.replace(/\s+/g, '-')}-consolidated.pdf`;
    }
    
    // Save the PDF to the uploads directory
    const fs = require('fs');
    const path = require('path');
    const pdfPath = path.join('uploads', 'applications', filename);
    
    fs.writeFileSync(pdfPath, pdfBuffer);
    
    // Update application to track rate sheet generation
    application.rateSheetPath = filename;
    application.rateSheetSentDate = new Date();
    await application.save();
    
    // Send email with rate sheet
    const emailResponse = await fetch(`${req.protocol}://${req.get('host')}/api/v1/email/rate-sheet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization
      },
      body: JSON.stringify({
        email: application.email,
        companyName: application.companyName,
        uploadUrl: `${req.protocol}://${req.get('host')}/api/v1/applications/${id}/upload-rate-sheet`,
        attachments: [
          {
            filename,
            path: pdfPath
          }
        ]
      })
    });
    
    if (!emailResponse.ok) {
      throw new Error('Failed to send rate sheet email');
    }
    
    res.json({ 
      message: 'Rate sheet generated and sent successfully',
      pdfPath: `/uploads/applications/${filename}`
    });
  } catch (error) {
    console.error('Error generating rate sheet:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate blank rate sheet
router.get('/:id/blank-rate-sheet', async (req, res) => {
  try {
    const { generateBlankRateSheet } = require('../utils/pdfGenerator');
    
    // Generate blank rate sheet
    const pdfBuffer = await generateBlankRateSheet();
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=blank-rate-sheet.pdf');
    
    // Send the PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating blank rate sheet:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Application Approval
router.post('/:id/approve', approveApplication);

// Upload rate sheet endpoint
router.post('/:id/upload-rate-sheet', upload.single('rateSheet'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    // Save the file path to the application
    application.rateSheetPath = req.file.filename;
    await application.save();
    
    res.json({ message: 'Rate sheet uploaded successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
