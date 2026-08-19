const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    default: 'admin',
    unique: true
  },
  passwordHash: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Admin || mongoose.model('Admin', adminSchema);
