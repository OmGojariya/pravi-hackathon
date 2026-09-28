/**
 * Middleware to restrict access based on roles
 * @param  {...string} roles 
 */
const requireRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    // SUPER_ADMIN has full permissions across all endpoints
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${req.user.role}' lacks permission for this action. Allowed: [${roles.join(', ')}]`,
      });
    }

    next();
  };
};

module.exports = {
  requireRoles,
};
