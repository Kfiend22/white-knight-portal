// routes/applications.js
const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const multer = require('multer');
const path = require('path');
const User = require('../models/userModel');

const {
  // ... other controller functions
  getApplications,
  getMaxVendorId,
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

router.get('/applications', getApplications);

router.get('/maxVendorId', async (req, res) => {
  try {
    const maxVendor = await Application.findOne().sort('-vendorId').limit(1);
    res.json({ maxVendorId: maxVendor ? maxVendor.vendorId : 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT update application step
router.put('/applications/:id', async (req, res) => {
  console.log('Request body:', req.body);
  try {
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { step: req.body.step },
      { new: true }
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
router.delete('/applications/:id', async (req, res) => {
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
  '/applications',
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
        applicationData.backgroundCheckPath = req.files.backgroundCheck[0].filename;
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

module.exports = router;
