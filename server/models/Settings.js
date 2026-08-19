const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  businessName: {
    type: String,
    default: 'Al Harmain Foam Center'
  },
  address: {
    type: String,
    default: 'Main Market, City'
  },
  phone: {
    type: String,
    default: '0300-1234567'
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);
