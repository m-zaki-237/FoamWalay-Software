const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/foamwalay';

let isConnected = false;

async function connectDB() {
  if (isConnected) return mongoose.connection;

  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    isConnected = true;
    console.log(`[DB] Connected to MongoDB at ${MONGODB_URI}`);
    return conn.connection;
  } catch (err) {
    console.error(`[DB] Connection error: ${err.message}`);
    throw err;
  }
}

/**
 * Execute a function within a transaction if MongoDB replica set is active,
 * otherwise execute batch operations safely on standalone server.
 */
async function runInTransaction(fn) {
  await connectDB();
  const session = await mongoose.startSession();

  try {
    let result;
    try {
      await session.withTransaction(async () => {
        result = await fn(session);
      });
      return result;
    } catch (txErr) {
      // If error is thrown customly from business logic (e.g. status: 409, 400, 404), rethrow immediately
      if (txErr && (txErr.status || txErr.statusCode)) {
        throw txErr;
      }

      const isTxUnsupported =
        txErr.message &&
        (txErr.message.includes('replica set') ||
         txErr.message.includes('Transaction numbers') ||
         txErr.message.includes('Standalone') ||
         txErr.message.includes('transactions'));

      if (isTxUnsupported) {
        return await fn(null);
      }

      throw txErr;
    }
  } finally {
    session.endSession();
  }
}

module.exports = {
  connectDB,
  runInTransaction
};
