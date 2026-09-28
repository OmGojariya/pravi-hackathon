const Notification = require('../models/Notification');
const { runAutomatedChecks } = require('../services/notificationService');

/**
 * @desc    Get user notifications
 * @route   GET /api/notifications
 */
const getNotifications = async (req, res, next) => {
  try {
    // Run automated scans to ensure up to the minute alerts
    await runAutomatedChecks();

    const query = {
      $or: [
        { userId: req.user._id },
        { role: req.user.role },
        { userId: null, role: null },
      ],
    };

    const notifications = await Notification.find(query)
      .populate('relatedAsset', 'assetCode name condition criticality')
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({
      ...query,
      isRead: false,
    });

    return res.json({
      success: true,
      unreadCount,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark notification as read
 * @route   PUT /api/notifications/:id/read
 */
const markAsRead = async (req, res, next) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    return res.json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/notifications/read-all
 */
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      {
        $or: [
          { userId: req.user._id },
          { role: req.user.role },
          { userId: null, role: null },
        ],
      },
      { isRead: true }
    );
    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
