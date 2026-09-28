const User = require('../models/User');
const { logAudit } = require('../services/auditService');

/**
 * @desc    Get all users with search, filtering and pagination
 * @route   GET /api/users
 * @access  Admin, Super Admin
 */
const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const search = req.query.search || '';
    const role = req.query.role || '';
    const department = req.query.department || '';

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) query.role = role;
    if (department) query.department = department;

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single user
 * @route   GET /api/users/:id
 * @access  Private
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new user
 * @route   POST /api/users
 * @access  Admin, Super Admin
 */
const createUser = async (req, res, next) => {
  try {
    const { employeeId, name, email, phone, role, department, password, status } = req.body;

    const existing = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { employeeId }],
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A user with this Email or Employee ID already exists.',
      });
    }

    const user = await User.create({
      employeeId,
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      role: role || 'VIEWER',
      department: department || 'Operations',
      password: password || 'Default@123',
      status: status || 'ACTIVE',
    });

    await logAudit({
      userId: req.user._id,
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: user._id,
      newData: { name: user.name, email: user.email, role: user.role },
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully.',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user
 * @route   PUT /api/users/:id
 * @access  Admin, Super Admin
 */
const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const previousData = {
      name: user.name,
      role: user.role,
      department: user.department,
      status: user.status,
    };

    const { name, phone, role, department, status, password } = req.body;
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (role) user.role = role;
    if (department) user.department = department;
    if (status) user.status = status;
    if (password) user.password = password;

    await user.save();

    await logAudit({
      userId: req.user._id,
      action: 'USER_UPDATED',
      entityType: 'User',
      entityId: user._id,
      previousData,
      newData: { name: user.name, role: user.role, status: user.status },
    });

    return res.json({
      success: true,
      message: 'User updated successfully.',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete or deactivate user
 * @route   DELETE /api/users/:id
 * @access  Super Admin
 */
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Protect last admin
    if (user.role === 'SUPER_ADMIN') {
      const adminCount = await User.countDocuments({ role: 'SUPER_ADMIN' });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the sole Super Administrator.',
        });
      }
    }

    await User.findByIdAndDelete(req.params.id);

    await logAudit({
      userId: req.user._id,
      action: 'USER_DELETED',
      entityType: 'User',
      entityId: req.params.id,
      previousData: { name: user.name, email: user.email },
    });

    return res.json({
      success: true,
      message: 'User deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
