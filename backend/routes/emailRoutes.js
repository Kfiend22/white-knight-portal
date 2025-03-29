const express = require('express');
const router = express.Router();
const { 
  sendWelcomeEmail,
  requestW9Email,
  sendRateSheetEmail,
  sendApprovalEmail,
  requestCOIEmail
} = require('../controllers/emailController');

// Welcome email for new service providers
router.post('/welcome', sendWelcomeEmail);

// Request a new W9 from the applicant
router.post('/request-w9', requestW9Email);

// Send rate sheet to the applicant
router.post('/rate-sheet', sendRateSheetEmail);

// Send approval notification with temporary credentials
router.post('/approval', sendApprovalEmail);

// Request a new Certificate of Insurance from the applicant
router.post('/request-coi', requestCOIEmail);

module.exports = router;
