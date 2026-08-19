const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');
const { sendSuccess, sendError } = require('../utils/errors');

// GET /api/auth/me - check setup status & current session
router.get('/me', async (req, res) => {
  try {
    const admin = await Admin.findOne({ username: 'admin' });
    const isSetup = !!admin;

    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
    let isAuthenticated = false;
    let username = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        isAuthenticated = true;
        username = decoded.username;
      } catch (e) {
        // Token invalid/expired
      }
    }

    return sendSuccess(res, {
      isSetup,
      isAuthenticated,
      username
    });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

// POST /api/auth/setup - initial password creation
router.post('/setup', async (req, res) => {
  try {
    const existing = await Admin.findOne({ username: 'admin' });
    if (existing) {
      return sendError(res, 'Admin password has already been set up.', 409);
    }

    const { password } = req.body;
    if (!password || password.trim().length < 4) {
      return sendError(res, 'Password must be at least 4 characters long.', 400);
    }

    const passwordHash = await bcrypt.hash(password.trim(), 10);
    const admin = await Admin.create({ username: 'admin', passwordHash });

    const token = jwt.sign({ id: admin._id, username: admin.username }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return sendSuccess(res, { message: 'Setup completed successfully', username: admin.username });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return sendError(res, 'Password is required', 400);
    }

    const admin = await Admin.findOne({ username: 'admin' });
    if (!admin) {
      return sendError(res, 'Admin account not set up yet. Please complete setup first.', 404);
    }

    const match = await bcrypt.compare(password, admin.passwordHash);
    if (!match) {
      return sendError(res, 'Invalid password', 401);
    }

    const token = jwt.sign({ id: admin._id, username: admin.username }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return sendSuccess(res, { message: 'Login successful', username: admin.username });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  return sendSuccess(res, { message: 'Logged out successfully' });
});

// POST /api/auth/change-password
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { current, next } = req.body;
    if (!current || !next) {
      return sendError(res, 'Current and new passwords are required', 400);
    }

    if (next.trim().length < 4) {
      return sendError(res, 'New password must be at least 4 characters long.', 400);
    }

    const admin = await Admin.findOne({ username: 'admin' });
    if (!admin) {
      return sendError(res, 'Admin account not found', 404);
    }

    const match = await bcrypt.compare(current, admin.passwordHash);
    if (!match) {
      return sendError(res, 'Current password is incorrect', 401);
    }

    admin.passwordHash = await bcrypt.hash(next.trim(), 10);
    await admin.save();

    return sendSuccess(res, { message: 'Password updated successfully' });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

module.exports = router;
