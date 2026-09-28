const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const secret = process.env.JWT_SECRET || 'infratrack_secret_jwt_key_2026_production';
      const decoded = jwt.verify(token, secret);

      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User no longer exists or session expired.',
        });
      }

      if (req.user.status !== 'ACTIVE') {
        return res.status(403).json({
          success: false,
          message: 'Account is inactive or suspended. Please contact administrator.',
        });
      }

      return next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authorization token.',
        error: error.message,
      });
    }
  }

  return res.status(401).json({
    success: false,
    message: 'Access denied. No authorization token provided.',
  });
};

// Optional auth for public QR scans: if token exists, populate req.user, else leave req.user null
const optionalAuth = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const secret = process.env.JWT_SECRET || 'infratrack_secret_jwt_key_2026_production';
      const decoded = jwt.verify(token, secret);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (e) {
      // Continue without user
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
};

module.exports = {
  protect,
  optionalAuth,
};
