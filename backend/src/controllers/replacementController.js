const ReplacementPlan = require('../models/ReplacementPlan');
const Asset = require('../models/Asset');
const LifecycleEvent = require('../models/LifecycleEvent');
const { logAudit } = require('../services/auditService');

/**
 * @desc    Get all replacement plans
 * @route   GET /api/replacement-plans
 */
const getReplacementPlans = async (req, res, next) => {
  try {
    const plans = await ReplacementPlan.find()
      .populate('oldAssetId')
      .populate('newAssetId')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new Replacement Plan
 * @route   POST /api/replacement-plans
 */
const createReplacementPlan = async (req, res, next) => {
  try {
    const {
      oldAssetId,
      replacementReason,
      estimatedReplacementCost,
      proposedYear,
      priority,
      notes,
    } = req.body;

    const oldAsset = await Asset.findById(oldAssetId);
    if (!oldAsset) {
      return res.status(404).json({ success: false, message: 'Old asset not found.' });
    }

    const plan = await ReplacementPlan.create({
      oldAssetId,
      currentCondition: oldAsset.condition?.rating || 'POOR',
      replacementReason,
      estimatedReplacementCost: Number(estimatedReplacementCost || 0),
      proposedYear: Number(proposedYear || new Date().getFullYear() + 1),
      priority: priority || 'HIGH',
      createdBy: req.user._id,
      notes: notes || '',
    });

    await logAudit({
      userId: req.user._id,
      action: 'REPLACEMENT_PLAN_CREATED',
      entityType: 'ReplacementPlan',
      entityId: plan._id,
      newData: { assetCode: oldAsset.assetCode, proposedYear },
    });

    return res.status(201).json({
      success: true,
      message: 'Replacement plan logged successfully.',
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Execute/Complete Replacement: marks Old asset DISPOSED, new asset COMMISSIONED
 * @route   POST /api/replacement-plans/:id/execute
 */
const executeReplacement = async (req, res, next) => {
  try {
    const { newAssetId, remarks } = req.body;
    const plan = await ReplacementPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Replacement plan not found.' });
    }

    const oldAsset = await Asset.findById(plan.oldAssetId);
    if (!oldAsset) {
      return res.status(404).json({ success: false, message: 'Old asset not found.' });
    }

    // 1. Mark Old Asset as DISPOSED
    const prevOldStatus = oldAsset.lifecycle.status;
    oldAsset.lifecycle.status = 'DISPOSED';
    await oldAsset.save();

    await LifecycleEvent.create({
      assetId: oldAsset._id,
      previousStatus: prevOldStatus,
      newStatus: 'DISPOSED',
      reason: `Replaced by newly commissioned asset (${remarks || 'End-of-life decommission'})`,
      remarks: `Replacement Plan ID: ${plan._id}`,
      changedBy: req.user._id,
    });

    // 2. If new asset specified, mark it COMMISSIONED
    let newAsset = null;
    if (newAssetId) {
      newAsset = await Asset.findById(newAssetId);
      if (newAsset) {
        const prevNewStatus = newAsset.lifecycle.status;
        newAsset.lifecycle.status = 'COMMISSIONED';
        newAsset.lifecycle.commissioningDate = new Date();
        await newAsset.save();

        await LifecycleEvent.create({
          assetId: newAsset._id,
          previousStatus: prevNewStatus,
          newStatus: 'COMMISSIONED',
          reason: `Commissioned as replacement for decommissioned asset ${oldAsset.assetCode}`,
          remarks: `Replacement Plan ID: ${plan._id}`,
          changedBy: req.user._id,
        });

        plan.newAssetId = newAsset._id;
      }
    }

    plan.approvalStatus = 'COMPLETED';
    await plan.save();

    await logAudit({
      userId: req.user._id,
      action: 'REPLACEMENT_EXECUTED',
      entityType: 'ReplacementPlan',
      entityId: plan._id,
      newData: { oldAsset: oldAsset.assetCode, newAsset: newAsset?.assetCode },
    });

    return res.json({
      success: true,
      message: 'Asset replacement completed. Old asset disposed and new asset active.',
      data: { plan, oldAsset, newAsset },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReplacementPlans,
  createReplacementPlan,
  executeReplacement,
};
