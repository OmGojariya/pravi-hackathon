const Notification = require('../models/Notification');
const Asset = require('../models/Asset');
const Inspection = require('../models/Inspection');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const Procurement = require('../models/Procurement');

/**
 * Create a new notification
 */
const createNotification = async ({
  userId = null,
  role = null,
  title,
  message,
  type = 'SYSTEM',
  relatedAsset = null,
}) => {
  try {
    return await Notification.create({
      userId,
      role,
      title,
      message,
      type,
      relatedAsset,
    });
  } catch (error) {
    console.error('Error creating notification:', error.message);
  }
};

/**
 * Scan system state to auto-generate alerts
 */
const runAutomatedChecks = async () => {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // 1. Check critical assets in poor condition
    const criticalAssets = await Asset.find({
      $or: [{ criticality: 'CRITICAL' }, { 'condition.rating': 'CRITICAL' }],
      'lifecycle.status': { $in: ['OPERATIONAL', 'UNDER_INSPECTION', 'UNDER_MAINTENANCE'] },
    }).limit(10);

    for (const asset of criticalAssets) {
      const existing = await Notification.findOne({
        type: 'CRITICAL_ASSET',
        relatedAsset: asset._id,
        createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      });
      if (!existing) {
        await createNotification({
          title: `Critical Alert: ${asset.name}`,
          message: `Asset ${asset.assetCode} is designated CRITICAL with condition rating ${asset.condition?.rating} (Score: ${asset.condition?.score}/100). Immediate inspection or remediation advised.`,
          type: 'CRITICAL_ASSET',
          relatedAsset: asset._id,
        });
      }
    }

    // 2. Check Overdue Inspections
    const overdueAssets = await Asset.find({
      'condition.nextInspectionDate': { $lt: now, $ne: null },
      'lifecycle.status': 'OPERATIONAL',
    }).limit(10);

    for (const asset of overdueAssets) {
      const existing = await Notification.findOne({
        type: 'INSPECTION_DUE',
        relatedAsset: asset._id,
        createdAt: { $gt: new Date(Date.now() - 48 * 60 * 60 * 1000) },
      });
      if (!existing) {
        await createNotification({
          title: `Overdue Inspection: ${asset.assetCode}`,
          message: `Scheduled inspection date ${asset.condition?.nextInspectionDate?.toLocaleDateString()} has passed for ${asset.name}.`,
          type: 'INSPECTION_DUE',
          relatedAsset: asset._id,
        });
      }
    }

    // 3. Check Expiring Warranties
    const expiringProcurements = await Procurement.find({
      warrantyExpiry: { $gte: now, $lte: thirtyDaysFromNow },
      procurementStatus: 'WARRANTY_ACTIVE',
    }).populate('assetId').limit(10);

    for (const proc of expiringProcurements) {
      if (proc.assetId) {
        const existing = await Notification.findOne({
          type: 'WARRANTY_EXPIRING',
          relatedAsset: proc.assetId._id,
          createdAt: { $gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        });
        if (!existing) {
          await createNotification({
            title: `Warranty Expiring Soon`,
            message: `Warranty for ${proc.assetId.name} (${proc.assetId.assetCode}) expires on ${proc.warrantyExpiry.toLocaleDateString()}.`,
            type: 'WARRANTY_EXPIRING',
            relatedAsset: proc.assetId._id,
          });
        }
      }
    }
  } catch (err) {
    console.error('Error running automated notification checks:', err.message);
  }
};

module.exports = {
  createNotification,
  runAutomatedChecks,
};
