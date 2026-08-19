const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  unitCost: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  cogs: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: true });

const saleSchema = new mongoose.Schema({
  items: {
    type: [saleItemSchema],
    validate: [val => val.length > 0, 'Sale must contain at least one item']
  },
  totalRevenue: {
    type: Number,
    required: true,
    min: 0
  },
  totalCogs: {
    type: Number,
    required: true,
    min: 0
  },
  grossProfit: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Sale || mongoose.model('Sale', saleSchema);
