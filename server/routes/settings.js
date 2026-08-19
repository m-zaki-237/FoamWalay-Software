const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { requireAuth } = require('../middleware/auth');
const { sendSuccess, sendError } = require('../utils/errors');

router.use(requireAuth);

// GET /api/settings
router.get('/', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        businessName: 'Al Harmain Foam Center',
        address: 'Main Market, City',
        phone: '0300-1234567'
      });
    }
    return sendSuccess(res, settings);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

// PUT /api/settings
router.put('/', async (req, res) => {
  try {
    const { businessName, address, phone } = req.body;

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    if (businessName !== undefined) settings.businessName = businessName.trim();
    if (address !== undefined) settings.address = address.trim();
    if (phone !== undefined) settings.phone = phone.trim();

    await settings.save();
    return sendSuccess(res, settings);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

module.exports = router;
