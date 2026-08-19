const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Admin = require('../models/Admin');
const Settings = require('../models/Settings');
const { requireAuth } = require('../middleware/auth');
const { sendSuccess, sendError } = require('../utils/errors');

router.use(requireAuth);

// POST /api/backup - JSON export dump
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().lean();
    const sales = await Sale.find().lean();
    const settings = await Settings.find().lean();
    const admin = await Admin.find().select('-passwordHash').lean();

    const backupData = {
      app: 'FoamWalay',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      data: {
        products,
        sales,
        settings,
        adminCount: admin.length
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="foamwalay-backup-${Date.now()}.json"`);
    return res.status(200).send(JSON.stringify(backupData, null, 2));
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

// POST /api/restore - JSON import restore
router.post('/restore', async (req, res) => {
  try {
    const { backup } = req.body;

    if (!backup || backup.app !== 'FoamWalay' || !backup.data) {
      return sendError(res, 'Invalid or incompatible FoamWalay backup file.', 400);
    }

    const { products, sales, settings } = backup.data;

    if (!Array.isArray(products) || !Array.isArray(sales)) {
      return sendError(res, 'Backup file contains corrupted collection data.', 400);
    }

    // Wipe existing products & sales
    await Product.deleteMany({});
    await Sale.deleteMany({});

    if (products.length > 0) {
      await Product.insertMany(products);
    }

    if (sales.length > 0) {
      await Sale.insertMany(sales);
    }

    if (settings && Array.isArray(settings) && settings.length > 0) {
      await Settings.deleteMany({});
      await Settings.insertMany(settings);
    }

    return sendSuccess(res, {
      message: 'Database restored successfully',
      restored: {
        productsCount: products.length,
        salesCount: sales.length
      }
    });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

module.exports = router;
