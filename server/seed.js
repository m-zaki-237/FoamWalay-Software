const bcrypt = require('bcryptjs');
const { connectDB } = require('./db');
const Admin = require('./models/Admin');
const Product = require('./models/Product');
const Sale = require('./models/Sale');
const Settings = require('./models/Settings');

async function seed() {
  console.log('[SEED] Starting demo data seeding for Al Harmain Foam Center...');
  await connectDB();

  // Clear existing collections & drop stale indexes
  try {
    await Product.collection.dropIndexes();
  } catch (e) {
    // ignore if no indexes exist
  }

  await Admin.deleteMany({});
  await Product.deleteMany({});
  await Sale.deleteMany({});
  await Settings.deleteMany({});

  // 1. Seed Admin
  const passwordHash = await bcrypt.hash('admin', 10);
  await Admin.create({
    username: 'admin',
    passwordHash
  });
  console.log('[SEED] Admin user created (username: admin, password: admin)');

  // 2. Seed Settings
  await Settings.create({
    businessName: 'Al Harmain Foam Center',
    address: 'Main Boulevard, Gulberg, Lahore',
    phone: '0300-4567890'
  });
  console.log('[SEED] Business settings created');

  // 3. Seed Products
  const seedProducts = [
    {
      name: 'Master Celeste Ultra Foam 4x6',
      category: 'Mattresses',
      price: 18500,
      costPrice: 14000,
      stock: 15,
      minStock: 3,
      description: 'Premium orthopaedic 4x6 foam mattress with 10-year warranty'
    },
    {
      name: 'Master MoltyFoam Supreme 3x6',
      category: 'Mattresses',
      price: 12500,
      costPrice: 9200,
      stock: 20,
      minStock: 5,
      description: 'High resilience 3x6 single mattress'
    },
    {
      name: 'Diamond Foam Gold 4x6 Sheet',
      category: 'Foam Sheets',
      price: 14000,
      costPrice: 10500,
      stock: 8,
      minStock: 3,
      description: 'Heavy density 4-inch raw foam sheet'
    },
    {
      name: 'Diamond Foam Luxury 3x6 Sheet',
      category: 'Foam Sheets',
      price: 9500,
      costPrice: 7000,
      stock: 2, // Low stock
      minStock: 5,
      description: 'Medium density 3-inch foam sheet'
    },
    {
      name: 'Ergonomic Orthopedic Pillow',
      category: 'Pillows',
      price: 2200,
      costPrice: 1400,
      stock: 40,
      minStock: 10,
      description: 'Contoured neck support memory foam pillow'
    },
    {
      name: 'High-Density Foam Cushion 18x18',
      category: 'Cushions',
      price: 850,
      costPrice: 500,
      stock: 60,
      minStock: 15,
      description: '18x18 inch sofa seat cushion insert'
    },
    {
      name: 'Quilted Waterproof Mattress Protector',
      category: 'Accessories',
      price: 3200,
      costPrice: 2000,
      stock: 25,
      minStock: 5,
      description: 'Fitted king size mattress cover'
    },
    {
      name: 'Hotel Grade Microfiber Pillow',
      category: 'Pillows',
      price: 1800,
      costPrice: 1100,
      stock: 1, // Low stock
      minStock: 8,
      description: 'Ultra soft microfiber hotel pillow'
    }
  ];

  const createdProducts = await Product.insertMany(seedProducts);
  console.log(`[SEED] Created ${createdProducts.length} demo products`);

  // 4. Seed Historical Sales over the past 30 days
  const now = new Date();
  const salesToInsert = [];

  for (let i = 25; i >= 0; i -= 2) {
    const saleDate = new Date(now);
    saleDate.setDate(saleDate.getDate() - i);

    // Pick 1 to 3 products randomly
    const prod1 = createdProducts[i % createdProducts.length];
    const prod2 = createdProducts[(i + 3) % createdProducts.length];

    const item1Qty = (i % 2) + 1;
    const item2Qty = 1;

    const item1Total = prod1.price * item1Qty;
    const item1Cogs = prod1.costPrice * item1Qty;

    const item2Total = prod2.price * item2Qty;
    const item2Cogs = prod2.costPrice * item2Qty;

    const totalRevenue = item1Total + item2Total;
    const totalCogs = item1Cogs + item2Cogs;
    const grossProfit = totalRevenue - totalCogs;

    salesToInsert.push({
      items: [
        {
          productId: prod1._id,
          productName: prod1.name,
          quantity: item1Qty,
          unitPrice: prod1.price,
          unitCost: prod1.costPrice,
          total: item1Total,
          cogs: item1Cogs
        },
        {
          productId: prod2._id,
          productName: prod2.name,
          quantity: item2Qty,
          unitPrice: prod2.price,
          unitCost: prod2.costPrice,
          total: item2Total,
          cogs: item2Cogs
        }
      ],
      totalRevenue,
      totalCogs,
      grossProfit,
      date: saleDate,
      notes: i % 4 === 0 ? 'Regular customer purchase' : ''
    });
  }

  await Sale.insertMany(salesToInsert);
  console.log(`[SEED] Created ${salesToInsert.length} historical sale records`);

  console.log('[SEED] Seeding completed successfully!');
  process.exit(0);
}

if (require.main === module) {
  seed().catch(err => {
    console.error('[SEED FAILED]', err);
    process.exit(1);
  });
}

module.exports = seed;
