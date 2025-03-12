const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// In-memory storage for location requests
// In a production app, this would be stored in a database
const locationRequests = new Map();

/**
 * @route   POST /api/location/request
 * @desc    Send a location request to a customer
 * @access  Private
 */
router.post('/request', protect, async (req, res) => {
  try {
    const { phone, requestId } = req.body;

    if (!phone || !requestId) {
      return res.status(400).json({ message: 'Phone number and request ID are required' });
    }

    // Store the request in our map with pending status
    locationRequests.set(requestId, {
      phone,
      status: 'pending',
      createdAt: new Date(),
      userId: req.user.id
    });

    // In a real implementation, this would send an SMS via a service like Twilio
    // For now, we'll just simulate success
    
    return res.status(200).json({ 
      success: true, 
      message: 'Location request sent successfully',
      requestId
    });
  } catch (error) {
    console.error('Error sending location request:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/location/:requestId
 * @desc    Check status of a location request
 * @access  Private
 */
router.get('/:requestId', protect, async (req, res) => {
  try {
    const { requestId } = req.params;
    
    // Get the request from our map
    const request = locationRequests.get(requestId);
    
    if (!request) {
      return res.status(404).json({ message: 'Location request not found' });
    }
    
    // Check if this request belongs to the current user
    if (request.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this request' });
    }
    
    return res.status(200).json(request);
  } catch (error) {
    console.error('Error checking location request:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/location/submit
 * @desc    Submit location from customer
 * @access  Public
 */
router.post('/submit', async (req, res) => {
  try {
    const { requestId, latitude, longitude, address } = req.body;
    
    if (!requestId || !latitude || !longitude) {
      return res.status(400).json({ message: 'Request ID, latitude, and longitude are required' });
    }
    
    // Get the request from our map
    const request = locationRequests.get(requestId);
    
    if (!request) {
      return res.status(404).json({ message: 'Location request not found' });
    }
    
    // Update the request with the location data
    request.status = 'completed';
    request.location = {
      latitude,
      longitude,
      address,
      receivedAt: new Date()
    };
    
    // Save the updated request
    locationRequests.set(requestId, request);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Location submitted successfully' 
    });
  } catch (error) {
    console.error('Error submitting location:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
