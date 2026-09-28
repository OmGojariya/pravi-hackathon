const mongoose = require('mongoose');

const NOTIFICATION_TYPES = [
  'INSPECTION_DUE',
  'MAINTENANCE_DUE',
  'CRITICAL_ASSET',
  'WORK_ORDER',
  'LIFECYCLE_CHANGE',
  'WARRANTY_EXPIRING',
  'END_OF_LIFE',
  'SYSTEM',
];

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // Null means broadcast to role or all
    },
    role: {
      type: String,
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      default: 'SYSTEM',
    },
    relatedAsset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;
