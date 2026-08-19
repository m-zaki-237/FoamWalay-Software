const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const { requireAuth } = require('../middleware/auth');
const { sendSuccess, sendError } = require('../utils/errors');

router.use(requireAuth);

// GET /api/reports/inventory - Inventory detailed report
router.get('/inventory', async (req, res) => {
  try {
    const products = await Product.find().sort({ category: 1, name: 1 });

    let totalProducts = products.length;
    let totalStock = 0;
    let totalCostValuation = 0;
    let totalRetailValuation = 0;
    let lowStockCount = 0;

    const categoriesMap = {};

    products.forEach(p => {
      totalStock += p.stock;
      const costVal = p.stock * p.costPrice;
      const retailVal = p.stock * p.price;

      totalCostValuation += costVal;
      totalRetailValuation += retailVal;

      if (p.stock <= p.minStock) lowStockCount++;

      const cat = p.category || 'General';
      if (!categoriesMap[cat]) {
        categoriesMap[cat] = {
          category: cat,
          productCount: 0,
          totalStock: 0,
          costValuation: 0,
          retailValuation: 0
        };
      }
      categoriesMap[cat].productCount += 1;
      categoriesMap[cat].totalStock += p.stock;
      categoriesMap[cat].costValuation += costVal;
      categoriesMap[cat].retailValuation += retailVal;
    });

    return sendSuccess(res, {
      summary: {
        totalProducts,
        totalStock,
        totalCostValuation,
        totalRetailValuation,
        lowStockCount
      },
      categories: Object.values(categoriesMap),
      items: products
    });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

// GET /api/reports/:period - period = month | quarter | year | custom
router.get('/:period', async (req, res) => {
  try {
    const { period } = req.params;
    const { from, to } = req.query;

    const now = new Date();
    let startDate, endDate;
    let periodTitle = '';

    if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      periodTitle = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    } else if (period === 'quarter') {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      startDate = new Date(now.getFullYear(), qMonth, 1);
      endDate = new Date(now.getFullYear(), qMonth + 3, 0, 23, 59, 59, 999);
      const qNum = Math.floor(now.getMonth() / 3) + 1;
      periodTitle = `Q${qNum} ${now.getFullYear()}`;
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      periodTitle = `${now.getFullYear()}`;
    } else if (period === 'custom') {
      if (!from || !to) {
        return sendError(res, 'Custom period requires "from" and "to" date parameters', 400);
      }
      startDate = new Date(from);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);
      periodTitle = `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`;
    } else {
      return sendError(res, 'Invalid report period. Choose month, quarter, year, or custom.', 400);
    }

    const sales = await Sale.find({
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: -1 });

    let salesCount = sales.length;
    let itemsSold = 0;
    let revenue = 0;
    let cogs = 0;

    const breakdownMap = {};

    sales.forEach(s => {
      revenue += s.totalRevenue;
      cogs += s.totalCogs;

      let subItems = 0;
      s.items.forEach(i => {
        itemsSold += i.quantity;
        subItems += i.quantity;
      });

      // Group breakdown by day for month/custom, by month for quarter/year
      let key;
      const sDate = new Date(s.date);
      if (period === 'month' || period === 'custom') {
        key = sDate.toISOString().split('T')[0];
      } else {
        key = sDate.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      }

      if (!breakdownMap[key]) {
        breakdownMap[key] = {
          label: key,
          salesCount: 0,
          itemsSold: 0,
          revenue: 0,
          cogs: 0,
          grossProfit: 0
        };
      }

      breakdownMap[key].salesCount += 1;
      breakdownMap[key].itemsSold += subItems;
      breakdownMap[key].revenue += s.totalRevenue;
      breakdownMap[key].cogs += s.totalCogs;
      breakdownMap[key].grossProfit += s.grossProfit;
    });

    const grossProfit = revenue - cogs;
    const breakdown = Object.values(breakdownMap).sort((a, b) => a.label.localeCompare(b.label));

    return sendSuccess(res, {
      period,
      periodTitle,
      startDate,
      endDate,
      summary: {
        salesCount,
        itemsSold,
        revenue,
        cogs,
        grossProfit
      },
      breakdown,
      sales
    });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

module.exports = router;
