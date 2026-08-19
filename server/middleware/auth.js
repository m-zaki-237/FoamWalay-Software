const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/errors');

const JWT_SECRET = process.env.JWT_SECRET || 'foamwalay_local_secret_key_2026';

function requireAuth(req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return sendError(res, 'Authentication required. Please log in.', 401);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return sendError(res, 'Invalid or expired session. Please log in again.', 401);
  }
}

module.exports = {
  requireAuth,
  JWT_SECRET
};
