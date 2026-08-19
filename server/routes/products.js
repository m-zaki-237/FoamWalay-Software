const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { requireAuth } = require('../middleware/auth');
const { sendSuccess, sendError } = require('../utils/errors');
const { parseIntegerPKR } = require('../utils/money');

router.use(requireAuth);

// GET /api/products/categories - unique category list for autocompletion
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    const filtered = categories.filter(c => c && c.trim().length > 0).sort();
    return sendSuccess(res, filtered);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

// GET /api/products?search=&category=&lowStock=true
router.get('/', async (req, res) => {
  try {
    const { search, category, lowStock } = req.query;
    const query = {};

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: regex },
        { category: regex },
        { description: regex }
      ];
    }

    if (category && category.trim() && category !== 'All') {
      query.category = category.trim();
    }

    let products = await Product.find(query).sort({ updatedAt: -1 });

    if (lowStock === 'true') {
      products = products.filter(p => p.stock <= p.minStock);
    }

    return sendSuccess(res, products);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

// POST /api/products - Create product
router.post('/', async (req, res) => {
  try {
    const { name, category, price, costPrice, stock, minStock, description } = req.body;

    if (!name || !name.trim()) {
      return sendError(res, 'Product name is required', 400);
    }

    if (price === undefined || price === null || isNaN(price) || price < 0) {
      return sendError(res, 'Valid selling price (≥ 0) is required', 400);
    }

    if (costPrice === undefined || costPrice === null || isNaN(costPrice) || costPrice < 0) {
      return sendError(res, 'Valid cost price (≥ 0) is required', 400);
    }

    const product = await Product.create({
      name: name.trim(),
      category: (category && category.trim()) || 'General',
      price: parseIntegerPKR(price),
      costPrice: parseIntegerPKR(costPrice),
      stock: parseIntegerPKR(stock || 0),
      minStock: parseIntegerPKR(minStock || 0),
      description: (description && description.trim()) || ''
    });

    return sendSuccess(res, product, 201);
  } catch (err) {
    return sendError(res, err.message, 400);
  }
});

// PUT /api/products/:id - Update product
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, price, costPrice, stock, minStock, description } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return sendError(res, 'Product not found', 404);
    }

    if (name !== undefined) {
      if (!name.trim()) return sendError(res, 'Product name cannot be empty', 400);
      product.name = name.trim();
    }

    if (category !== undefined) {
      product.category = category.trim() || 'General';
    }

    if (price !== undefined) {
      if (isNaN(price) || price < 0) return sendError(res, 'Selling price must be ≥ 0', 400);
      product.price = parseIntegerPKR(price);
    }

    if (costPrice !== undefined) {
      if (isNaN(costPrice) || costPrice < 0) return sendError(res, 'Cost price must be ≥ 0', 400);
      product.costPrice = parseIntegerPKR(costPrice);
    }

    if (stock !== undefined) {
      if (isNaN(stock) || stock < 0) return sendError(res, 'Stock cannot be negative', 400);
      product.stock = parseIntegerPKR(stock);
    }

    if (minStock !== undefined) {
      if (isNaN(minStock) || minStock < 0) return sendError(res, 'Minimum stock cannot be negative', 400);
      product.minStock = parseIntegerPKR(minStock);
    }

    if (description !== undefined) {
      product.description = description.trim();
    }

    await product.save();
    return sendSuccess(res, product);
  } catch (err) {
    return sendError(res, err.message, 400);
  }
});

// DELETE /api/products/:id - Delete product
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return sendError(res, 'Product not found', 404);
    }

    return sendSuccess(res, { message: 'Product deleted successfully', id });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

module.exports = router;
