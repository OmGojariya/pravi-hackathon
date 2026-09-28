const AuditLog = require('../models/AuditLog');

/**
 * Log an audit trail entry
 */
const logAudit = async ({
  userId = null,
  action,
  entityType,
  entityId = '',
  previousData = null,
  newData = null,
  ipAddress = '127.0.0.1',
}) => {
  try {
    await AuditLog.create({
      userId,
      action,
      entityType,
      entityId: String(entityId),
      previousData,
      newData,
      ipAddress,
    });
  } catch (error) {
    console.error('Audit log failed to record:', error.message);
  }
};

module.exports = {
  logAudit,
};
