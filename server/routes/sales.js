const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const { requireAuth } = require('../middleware/auth');
const { runInTransaction } = require('../db');
const { sendSuccess, sendError } = require('../utils/errors');
const { parseIntegerPKR } = require('../utils/money');

router.use(requireAuth);

// GET /api/sales?from=&to=&productId= - list sales with optional date filtering
router.get('/', async (req, res) => {
  try {
    const { from, to, productId } = req.query;
    const query = {};

    if (from || to) {
      query.date = {};
      if (from) {
        const fromDate = new Date(from);
        fromDate.setHours(0, 0, 0, 0);
        query.date.$gte = fromDate;
      }
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        query.date.$lte = toDate;
      }
    }

    if (productId) {
      query['items.productId'] = productId;
    }

    const sales = await Sale.find(query).sort({ date: -1 });

    return sendSuccess(res, sales);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

// POST /api/sales - Transactional sale creation
router.post('/', async (req, res) => {
  try {
    const { items, date, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return sendError(res, 'Sale must contain at least one line item', 400);
    }

    // Perform inside transaction / atomic batch
    const createdSale = await runInTransaction(async (session) => {
      const saleItems = [];
      let totalRevenue = 0;
      let totalCogs = 0;

      for (const item of items) {
        const { productId, quantity } = item;
        const qty = parseIntegerPKR(quantity);

        if (!productId) {
          throw { status: 400, message: 'Every line item requires a productId' };
        }
        if (qty <= 0) {
          throw { status: 400, message: 'Line item quantity must be greater than 0' };
        }

        const product = session
          ? await Product.findById(productId).session(session)
          : await Product.findById(productId);

        if (!product) {
          throw { status: 404, message: `Product with ID "${productId}" was not found` };
        }

        if (product.stock < qty) {
          throw {
            status: 409,
            message: `Insufficient stock for "${product.name}". Required: ${qty}, Available: ${product.stock}.`
          };
        }

        const lineTotal = product.price * qty;
        const lineCogs = product.costPrice * qty;

        totalRevenue += lineTotal;
        totalCogs += lineCogs;

        saleItems.push({
          productId: product._id,
          productName: product.name,
          quantity: qty,
          unitPrice: product.price,
          unitCost: product.costPrice,
          total: lineTotal,
          cogs: lineCogs
        });

        // Decrement stock
        product.stock -= qty;
        if (session) {
          await product.save({ session });
        } else {
          await product.save();
        }
      }

      const grossProfit = totalRevenue - totalCogs;
      const saleDate = date ? new Date(date) : new Date();

      const saleData = {
        items: saleItems,
        totalRevenue,
        totalCogs,
        grossProfit,
        date: saleDate,
        notes: (notes && notes.trim()) || ''
      };

      let saleDoc;
      if (session) {
        const created = await Sale.create([saleData], { session });
        saleDoc = created[0];
      } else {
        saleDoc = await Sale.create(saleData);
      }

      return saleDoc;
    });

    return sendSuccess(res, createdSale, 201);
  } catch (err) {
    const status = err.status || 500;
    const message = err.message || 'Failed to process sale';
    return sendError(res, message, status);
  }
});

module.exports = router;
