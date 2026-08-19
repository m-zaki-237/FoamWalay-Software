const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { format } = require('fast-csv');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Settings = require('../models/Settings');
const { requireAuth } = require('../middleware/auth');
const { formatMoney } = require('../utils/money');

router.use(requireAuth);

// POST /api/exports/:type/:format
// type: sales | earnings | inventory
// format: pdf | xlsx | csv
router.post('/:type/:format', async (req, res) => {
  try {
    const { type, format: fmt } = req.params;
    const { from, to, period } = req.body;

    const settings = (await Settings.findOne()) || {
      businessName: 'Al Harmain Foam Center',
      address: 'Main Market, City',
      phone: '0300-1234567'
    };

    if (!['sales', 'earnings', 'inventory'].includes(type)) {
      return res.status(400).json({ error: { message: 'Invalid export type. Must be sales, earnings, or inventory.' } });
    }

    if (!['pdf', 'xlsx', 'csv'].includes(fmt)) {
      return res.status(400).json({ error: { message: 'Invalid export format. Must be pdf, xlsx, or csv.' } });
    }

    if (type === 'inventory') {
      const products = await Product.find().sort({ category: 1, name: 1 });

      if (fmt === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="inventory-report-${Date.now()}.csv"`);

        const csvStream = format({ headers: true });
        csvStream.pipe(res);

        products.forEach(p => {
          csvStream.write({
            'Product Name': p.name,
            'Category': p.category,
            'Selling Price (PKR)': p.price,
            'Cost Price (PKR)': p.costPrice,
            'Stock Quantity': p.stock,
            'Min Stock': p.minStock,
            'Cost Valuation (PKR)': p.stock * p.costPrice,
            'Retail Valuation (PKR)': p.stock * p.price,
            'Status': p.stock <= p.minStock ? 'LOW STOCK' : 'IN STOCK'
          });
        });
        csvStream.end();
        return;
      }

      if (fmt === 'xlsx') {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Inventory Report');

        sheet.columns = [
          { header: 'Product Name', key: 'name', width: 25 },
          { header: 'Category', key: 'category', width: 15 },
          { header: 'Selling Price (PKR)', key: 'price', width: 18 },
          { header: 'Cost Price (PKR)', key: 'costPrice', width: 18 },
          { header: 'Stock', key: 'stock', width: 12 },
          { header: 'Cost Valuation (PKR)', key: 'costVal', width: 20 },
          { header: 'Retail Valuation (PKR)', key: 'retailVal', width: 20 },
          { header: 'Status', key: 'status', width: 15 }
        ];

        sheet.getRow(1).font = { bold: true };

        let totalCostVal = 0;
        let totalRetailVal = 0;

        products.forEach(p => {
          const cVal = p.stock * p.costPrice;
          const rVal = p.stock * p.price;
          totalCostVal += cVal;
          totalRetailVal += rVal;

          sheet.addRow({
            name: p.name,
            category: p.category,
            price: p.price,
            costPrice: p.costPrice,
            stock: p.stock,
            costVal: cVal,
            retailVal: rVal,
            status: p.stock <= p.minStock ? 'LOW STOCK' : 'IN STOCK'
          });
        });

        sheet.addRow({});
        const totalRow = sheet.addRow({
          name: 'TOTALS',
          costVal: totalCostVal,
          retailVal: totalRetailVal
        });
        totalRow.font = { bold: true };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="inventory-report-${Date.now()}.xlsx"`);

        await workbook.xlsx.write(res);
        return res.end();
      }

      if (fmt === 'pdf') {
        const doc = new PDFDocument({ margin: 40 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="inventory-report-${Date.now()}.pdf"`);

        doc.pipe(res);

        // Header
        doc.fontSize(18).text(settings.businessName, { align: 'center' });
        doc.fontSize(10).text(`${settings.address} | Phone: ${settings.phone}`, { align: 'center' });
        doc.moveDown();
        doc.fontSize(14).text('INVENTORY VALUATION REPORT', { align: 'center' });
        doc.fontSize(9).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown();

        // Table Header
        let y = doc.y;
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('Product Name', 40, y);
        doc.text('Category', 180, y);
        doc.text('Price', 270, y);
        doc.text('Stock', 340, y);
        doc.text('Cost Valuation', 400, y);
        doc.text('Retail Valuation', 490, y);
        doc.moveDown();

        doc.font('Helvetica');
        let totalCostVal = 0;
        let totalRetailVal = 0;

        products.forEach(p => {
          const cVal = p.stock * p.costPrice;
          const rVal = p.stock * p.price;
          totalCostVal += cVal;
          totalRetailVal += rVal;

          if (doc.y > 700) {
            doc.addPage();
          }

          y = doc.y;
          doc.fontSize(8);
          doc.text(p.name.slice(0, 24), 40, y);
          doc.text((p.category || 'General').slice(0, 15), 180, y);
          doc.text(formatMoney(p.price), 270, y);
          doc.text(String(p.stock), 340, y);
          doc.text(formatMoney(cVal), 400, y);
          doc.text(formatMoney(rVal), 490, y);
          doc.moveDown(0.5);
        });

        doc.moveDown();
        doc.font('Helvetica-Bold').fontSize(10);
        doc.text(`Total Cost Valuation: ${formatMoney(totalCostVal)}`, 40);
        doc.text(`Total Retail Valuation: ${formatMoney(totalRetailVal)}`, 40);

        doc.end();
        return;
      }
    }

    // Sales & Earnings exports
    const query = {};
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        query.date.$lte = toDate;
      }
    }

    const sales = await Sale.find(query).sort({ date: -1 });

    let totalRevenue = 0;
    let totalCogs = 0;
    let totalGrossProfit = 0;

    sales.forEach(s => {
      totalRevenue += s.totalRevenue;
      totalCogs += s.totalCogs;
      totalGrossProfit += s.grossProfit;
    });

    if (fmt === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-report-${Date.now()}.csv"`);

      const csvStream = format({ headers: true });
      csvStream.pipe(res);

      sales.forEach(s => {
        const itemsSummary = s.items.map(i => `${i.productName} (x${i.quantity})`).join(', ');
        csvStream.write({
          'Date': new Date(s.date).toISOString().split('T')[0],
          'Sale ID': s._id.toString(),
          'Items': itemsSummary,
          'Revenue (PKR)': s.totalRevenue,
          'COGS (PKR)': s.totalCogs,
          'Gross Profit (PKR)': s.grossProfit,
          'Notes': s.notes || ''
        });
      });
      csvStream.end();
      return;
    }

    if (fmt === 'xlsx') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Sales Report');

      sheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Sale ID', key: 'id', width: 25 },
        { header: 'Items Summary', key: 'items', width: 35 },
        { header: 'Revenue (PKR)', key: 'revenue', width: 18 },
        { header: 'COGS (PKR)', key: 'cogs', width: 18 },
        { header: 'Gross Profit (PKR)', key: 'profit', width: 18 },
        { header: 'Notes', key: 'notes', width: 20 }
      ];

      sheet.getRow(1).font = { bold: true };

      sales.forEach(s => {
        const itemsSummary = s.items.map(i => `${i.productName} (x${i.quantity})`).join(', ');
        sheet.addRow({
          date: new Date(s.date).toISOString().split('T')[0],
          id: s._id.toString(),
          items: itemsSummary,
          revenue: s.totalRevenue,
          cogs: s.totalCogs,
          profit: s.grossProfit,
          notes: s.notes || ''
        });
      });

      sheet.addRow({});
      const totalRow = sheet.addRow({
        date: 'TOTALS',
        revenue: totalRevenue,
        cogs: totalCogs,
        profit: totalGrossProfit
      });
      totalRow.font = { bold: true };

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-report-${Date.now()}.xlsx"`);

      await workbook.xlsx.write(res);
      return res.end();
    }

    if (fmt === 'pdf') {
      const doc = new PDFDocument({ margin: 40 });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-report-${Date.now()}.pdf"`);

      doc.pipe(res);

      doc.fontSize(18).text(settings.businessName, { align: 'center' });
      doc.fontSize(10).text(`${settings.address} | Phone: ${settings.phone}`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text(`${type.toUpperCase()} SUMMARY REPORT`, { align: 'center' });
      doc.fontSize(9).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown();

      // Summary Card
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text(`Total Revenue: ${formatMoney(totalRevenue)}`, 40);
      doc.text(`Total COGS: ${formatMoney(totalCogs)}`, 40);
      doc.text(`Total Gross Profit: ${formatMoney(totalGrossProfit)}`, 40);
      doc.moveDown();

      // Sales Table Header
      let y = doc.y;
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Date', 40, y);
      doc.text('Items', 120, y);
      doc.text('Revenue', 320, y);
      doc.text('COGS', 400, y);
      doc.text('Gross Profit', 480, y);
      doc.moveDown();

      doc.font('Helvetica');
      sales.forEach(s => {
        if (doc.y > 700) {
          doc.addPage();
        }
        y = doc.y;
        const itemsSummary = s.items.map(i => `${i.productName} (x${i.quantity})`).join(', ');
        doc.fontSize(8);
        doc.text(new Date(s.date).toISOString().split('T')[0], 40, y);
        doc.text(itemsSummary.slice(0, 35), 120, y);
        doc.text(formatMoney(s.totalRevenue), 320, y);
        doc.text(formatMoney(s.totalCogs), 400, y);
        doc.text(formatMoney(s.grossProfit), 480, y);
        doc.moveDown(0.5);
      });

      doc.end();
      return;
    }
  } catch (err) {
    return res.status(500).json({ error: { message: err.message } });
  }
});

module.exports = router;
