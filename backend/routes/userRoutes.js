const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/', userController.createUser);

router.get('/vendorIds', userController.getUserVendorIds);

router.get('/profile', async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

module.exports = router;
