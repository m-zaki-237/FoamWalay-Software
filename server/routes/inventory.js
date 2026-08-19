const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { requireAuth } = require('../middleware/auth');
const { sendSuccess, sendError } = require('../utils/errors');
const { parseIntegerPKR } = require('../utils/money');

router.use(requireAuth);

// GET /api/inventory - Detailed inventory overview and metrics
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ name: 1 });

    let totalProducts = products.length;
    let totalStock = 0;
    let inventoryCostValue = 0;   // Asset Value = sum(stock * costPrice)
    let inventoryRetailValue = 0; // Potential Revenue = sum(stock * price)
    let lowStockCount = 0;

    const items = products.map(p => {
      const isLowStock = p.stock <= p.minStock;
      const itemCostVal = p.stock * p.costPrice;
      const itemRetailVal = p.stock * p.price;

      totalStock += p.stock;
      inventoryCostValue += itemCostVal;
      inventoryRetailValue += itemRetailVal;
      if (isLowStock) lowStockCount++;

      return {
        _id: p._id,
        name: p.name,
        category: p.category,
        price: p.price,
        costPrice: p.costPrice,
        stock: p.stock,
        minStock: p.minStock,
        isLowStock,
        itemCostVal,
        itemRetailVal,
        description: p.description,
        updatedAt: p.updatedAt
      };
    });

    return sendSuccess(res, {
      summary: {
        totalProducts,
        totalStock,
        inventoryCostValue,
        inventoryRetailValue,
        lowStockCount
      },
      items
    });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

// POST /api/products/:id/stock - Adjust stock level
router.post('/products/:id/stock', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, quantity, note } = req.body;

    if (!action || !['add', 'reduce', 'set'].includes(action)) {
      return sendError(res, 'Action must be one of "add", "reduce", or "set"', 400);
    }

    const qty = parseIntegerPKR(quantity);
    if (isNaN(qty) || qty < 0) {
      return sendError(res, 'Quantity must be a valid non-negative integer', 400);
    }

    const product = await Product.findById(id);
    if (!product) {
      return sendError(res, 'Product not found', 404);
    }

    let newStock = product.stock;
    if (action === 'add') {
      newStock += qty;
    } else if (action === 'reduce') {
      newStock -= qty;
    } else if (action === 'set') {
      newStock = qty;
    }

    if (newStock < 0) {
      return sendError(res, `Stock cannot be reduced below 0. Current stock is ${product.stock}.`, 409);
    }

    product.stock = newStock;
    await product.save();

    return sendSuccess(res, {
      message: `Stock updated successfully (${action} ${qty})`,
      product: {
        _id: product._id,
        name: product.name,
        stock: product.stock,
        isLowStock: product.stock <= product.minStock
      },
      note: note || ''
    });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

module.exports = router;
