const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const { connectDB } = require('./db');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const inventoryRoutes = require('./routes/inventory');
const saleRoutes = require('./routes/sales');
const dashboardRoutes = require('./routes/dashboard');
const reportRoutes = require('./routes/reports');
const exportRoutes = require('./routes/exports');
const settingsRoutes = require('./routes/settings');
const backupRoutes = require('./routes/backup');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:4000', 'http://127.0.0.1:4000'],
  credentials: true
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/exports', exportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/backup', backupRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'FoamWalay API', time: new Date() });
});

// Production Static Client Serving (client/dist)
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Central error handler
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error'
    }
  });
});

let serverInstance = null;

async function startServer(port = PORT) {
  if (serverInstance) {
    return serverInstance;
  }
  await connectDB();
  return new Promise((resolve, reject) => {
    serverInstance = app.listen(port, '127.0.0.1', (err) => {
      if (err) return reject(err);
      console.log(`[FoamWalay API] Server listening on http://127.0.0.1:${port}`);
      resolve(serverInstance);
    });
  });
}

async function stopServer() {
  if (serverInstance) {
    await new Promise((resolve) => serverInstance.close(resolve));
    serverInstance = null;
    console.log('[FoamWalay API] Server closed.');
  }
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[DB] MongoDB disconnected.');
  }
}

if (require.main === module) {
  startServer().catch(err => console.error('Failed to start server:', err));
}

module.exports = app;
module.exports.app = app;
module.exports.connectDB = connectDB;
module.exports.startServer = startServer;
module.exports.stopServer = stopServer;
