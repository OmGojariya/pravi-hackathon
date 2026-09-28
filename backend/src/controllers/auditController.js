const AuditLog = require('../models/AuditLog');

/**
 * @desc    Get audit logs with filtering and pagination
 * @route   GET /api/audit-logs
 * @access  Admin, Super Admin
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const entityType = req.query.entityType;
    const action = req.query.action;
    const userId = req.query.userId;

    const query = {};
    if (entityType) query.entityType = entityType;
    if (action) query.action = { $regex: action, $options: 'i' };
    if (userId) query.userId = userId;

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .populate('userId', 'name email role employeeId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.json({
      success: true,
      data: logs,
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

module.exports = {
  getAuditLogs,
};
