const bcrypt = require('bcryptjs');
const { connectDB } = require('./db');
const Admin = require('./models/Admin');
const Product = require('./models/Product');
const Sale = require('./models/Sale');
const Settings = require('./models/Settings');

async function resetData() {
  console.log('[RESET] Resetting database records...');
  await connectDB();

  // Clear products, sales, and admin
  await Product.deleteMany({});
  await Sale.deleteMany({});
  await Admin.deleteMany({});
  console.log('[RESET] Products and sales database cleared.');

  // Create clean admin user
  const passwordHash = await bcrypt.hash('admin', 10);
  await Admin.create({
    username: 'admin',
    passwordHash
  });
  console.log('[RESET] Master admin created (username: admin, password: admin)');

  // Ensure Business Settings exist
  const settingsCount = await Settings.countDocuments();
  if (settingsCount === 0) {
    await Settings.create({
      businessName: 'Al Harmain Foam Center',
      address: '',
      phone: ''
    });
  }
  console.log('[RESET] Business settings verified.');

  console.log('[RESET] Reset complete! Master password reset to "admin".');
  process.exit(0);
}

if (require.main === module) {
  resetData().catch(err => {
    console.error('[RESET FAILED]', err);
    process.exit(1);
  });
}

module.exports = resetData;
