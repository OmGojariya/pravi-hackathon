const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logAudit } = require('../services/auditService');

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || 'infratrack_secret_jwt_key_2026_production';
  return jwt.sign({ id }, secret, {
    expiresIn: '7d',
  });
};

/**
 * @desc    Login user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password incorrect.',
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact an administrator.',
      });
    }

    user.lastLogin = new Date();
    await user.save();

    await logAudit({
      userId: user._id,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user._id,
      ipAddress: req.ip || req.connection.remoteAddress,
    });

    const token = generateToken(user._id);

    return res.json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          _id: user._id,
          employeeId: user.employeeId,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          phone: user.phone,
          profileImage: user.profileImage,
          status: user.status,
          lastLogin: user.lastLogin,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Register a new user (Super Admin / Admin or Initial setup)
 * @route   POST /api/auth/register
 * @access  Public / Admin
 */
const register = async (req, res, next) => {
  try {
    const { employeeId, name, email, phone, password, role, department } = req.body;

    const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists.',
      });
    }

    const existingEmpId = await User.findOne({ employeeId: employeeId.trim() });
    if (existingEmpId) {
      return res.status(409).json({
        success: false,
        message: 'User with this Employee ID already exists.',
      });
    }

    const user = await User.create({
      employeeId: employeeId.trim(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone || '',
      password,
      role: role || 'VIEWER',
      department: department || 'Infrastructure Works',
      status: 'ACTIVE',
    });

    await logAudit({
      userId: req.user ? req.user._id : user._id,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: user._id,
      newData: { email: user.email, role: user.role, name: user.name },
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: {
        token,
        user: {
          _id: user._id,
          employeeId: user.employeeId,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          status: user.status,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Forgot Password Request
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address.',
      });
    }

    // In production, send email with reset token. Here, return demo reset token
    const resetToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'infratrack_secret_jwt_key_2026_production',
      { expiresIn: '30m' }
    );

    return res.json({
      success: true,
      message: 'Password reset link sent to your registered email.',
      data: {
        resetToken, // Provided for direct demo/test convenience
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset password using token
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required.',
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'infratrack_secret_jwt_key_2026_production'
    );
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token.',
      });
    }

    user.password = newPassword;
    await user.save();

    await logAudit({
      userId: user._id,
      action: 'PASSWORD_RESET',
      entityType: 'User',
      entityId: user._id,
    });

    return res.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in.',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired reset token.',
      error: error.message,
    });
  }
};

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    user.password = newPassword;
    await user.save();

    await logAudit({
      userId: user._id,
      action: 'PASSWORD_CHANGED',
      entityType: 'User',
      entityId: user._id,
    });

    return res.json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  register,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
};
