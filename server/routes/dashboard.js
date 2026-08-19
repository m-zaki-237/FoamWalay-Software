const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const { requireAuth } = require('../middleware/auth');
const { sendSuccess, sendError } = require('../utils/errors');

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const products = await Product.find();

    let productCount = products.length;
    let totalStock = 0;
    let inventoryCostValue = 0;
    let inventoryRetailValue = 0;
    let lowStockCount = 0;

    products.forEach(p => {
      totalStock += p.stock;
      inventoryCostValue += (p.stock * p.costPrice);
      inventoryRetailValue += (p.stock * p.price);
      if (p.stock <= p.minStock) lowStockCount++;
    });

    const sales = await Sale.find().sort({ date: -1 });

    let totalSales = sales.length;
    let totalItemsSold = 0;
    let totalRevenue = 0;
    let totalCogs = 0;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Quarter calculation
    const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
    const startOfQuarter = new Date(now.getFullYear(), quarterMonth, 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    let revenueToday = 0, profitToday = 0;
    let revenueMonth = 0, profitMonth = 0;
    let revenueQuarter = 0, profitQuarter = 0;
    let revenueYear = 0, profitYear = 0;

    sales.forEach(s => {
      const saleRev = s.totalRevenue || 0;
      const saleCogs = s.totalCogs || 0;
      const saleProfit = s.grossProfit || (saleRev - saleCogs);

      totalRevenue += saleRev;
      totalCogs += saleCogs;

      s.items.forEach(item => {
        totalItemsSold += item.quantity;
      });

      const sDate = new Date(s.date);

      if (sDate >= startOfToday) {
        revenueToday += saleRev;
        profitToday += saleProfit;
      }
      if (sDate >= startOfMonth) {
        revenueMonth += saleRev;
        profitMonth += saleProfit;
      }
      if (sDate >= startOfQuarter) {
        revenueQuarter += saleRev;
        profitQuarter += saleProfit;
      }
      if (sDate >= startOfYear) {
        revenueYear += saleRev;
        profitYear += saleProfit;
      }
    });

    const grossProfit = totalRevenue - totalCogs;

    // 30-day Sales & Revenue Trend
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const dailyMap = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo);
      d.setDate(d.getDate() + i);
      const dateKey = d.toISOString().split('T')[0];
      dailyMap[dateKey] = { date: dateKey, revenue: 0, profit: 0, count: 0 };
    }

    sales.forEach(s => {
      const sDate = new Date(s.date);
      if (sDate >= thirtyDaysAgo) {
        const dateKey = sDate.toISOString().split('T')[0];
        if (dailyMap[dateKey]) {
          dailyMap[dateKey].revenue += (s.totalRevenue || 0);
          dailyMap[dateKey].profit += (s.grossProfit || 0);
          dailyMap[dateKey].count += 1;
        }
      }
    });

    const salesTrend = Object.values(dailyMap);

    // 12-month Revenue vs Profit Trend
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const monthlyMap = {};

    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const monthKey = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      monthlyMap[monthKey] = { month: monthKey, revenue: 0, profit: 0 };
    }

    sales.forEach(s => {
      const sDate = new Date(s.date);
      if (sDate >= twelveMonthsAgo) {
        const monthKey = sDate.toLocaleString('en-US', { month: 'short', year: 'numeric' });
        if (monthlyMap[monthKey]) {
          monthlyMap[monthKey].revenue += (s.totalRevenue || 0);
          monthlyMap[monthKey].profit += (s.grossProfit || 0);
        }
      }
    });

    const monthlyTrend = Object.values(monthlyMap);

    const recentSales = sales.slice(0, 5);

    return sendSuccess(res, {
      inventory: {
        productCount,
        totalStock,
        inventoryCostValue,
        inventoryRetailValue,
        lowStockCount
      },
      sales: {
        totalSales,
        totalItemsSold,
        totalRevenue,
        totalCogs,
        grossProfit
      },
      financials: {
        revenueToday,
        profitToday,
        revenueMonth,
        profitMonth,
        revenueQuarter,
        profitQuarter,
        revenueYear,
        profitYear
      },
      salesTrend,
      monthlyTrend,
      recentSales
    });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

module.exports = router;
