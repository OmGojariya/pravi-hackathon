const WorkOrder = require('../models/WorkOrder');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const Asset = require('../models/Asset');
const { logAudit } = require('../services/auditService');
const { createNotification } = require('../services/notificationService');

/**
 * @desc    Get all work orders with pagination
 * @route   GET /api/work-orders
 */
const getWorkOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const assetId = req.query.assetId;
    const status = req.query.status;

    const query = {};
    if (assetId) query.assetId = assetId;
    if (status) query.status = status;

    const total = await WorkOrder.countDocuments(query);
    const workOrders = await WorkOrder.find(query)
      .populate('assetId', 'assetCode name type location')
      .populate('maintenanceRequestId', 'requestId problem priority')
      .populate('assignedEngineer', 'name email employeeId phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.json({
      success: true,
      data: workOrders,
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
 * @desc    Get single work order
 * @route   GET /api/work-orders/:id
 */
const getWorkOrderById = async (req, res, next) => {
  try {
    const workOrder = await WorkOrder.findById(req.params.id)
      .populate('assetId')
      .populate('maintenanceRequestId')
      .populate('assignedEngineer', 'name email phone department');

    if (!workOrder) {
      return res.status(404).json({ success: false, message: 'Work order not found.' });
    }

    return res.json({ success: true, data: workOrder });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new work order
 * @route   POST /api/work-orders
 */
const createWorkOrder = async (req, res, next) => {
  try {
    const {
      assetId,
      maintenanceRequestId,
      maintenanceType,
      assignedTeam,
      assignedEngineer,
      startDate,
      expectedCompletionDate,
      laborCost,
      materialCost,
      otherCost,
      workDescription,
      beforeImages,
    } = req.body;

    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found.' });
    }

    const year = new Date().getFullYear();
    const count = await WorkOrder.countDocuments({
      createdAt: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`) },
    });
    const workOrderId = `WO-${year}-${String(count + 1).padStart(4, '0')}`;

    const lCost = Number(laborCost || 0);
    const mCost = Number(materialCost || 0);
    const oCost = Number(otherCost || 0);
    const totalCost = lCost + mCost + oCost;

    const workOrder = await WorkOrder.create({
      workOrderId,
      assetId,
      maintenanceRequestId: maintenanceRequestId || null,
      maintenanceType: maintenanceType || 'Corrective',
      assignedTeam: assignedTeam || 'Field Works Team',
      assignedEngineer: assignedEngineer || null,
      startDate: startDate || new Date(),
      expectedCompletionDate: expectedCompletionDate || null,
      laborCost: lCost,
      materialCost: mCost,
      otherCost: oCost,
      totalCost,
      workDescription,
      beforeImages: beforeImages || [],
      status: 'ASSIGNED',
    });

    if (maintenanceRequestId) {
      await MaintenanceRequest.findByIdAndUpdate(maintenanceRequestId, {
        status: 'ASSIGNED',
        assignedEngineer: assignedEngineer || null,
      });
    }

    await logAudit({
      userId: req.user._id,
      action: 'WORK_ORDER_CREATED',
      entityType: 'WorkOrder',
      entityId: workOrder._id,
      newData: { workOrderId, assetCode: asset.assetCode },
    });

    await createNotification({
      title: `Work Order Issued: ${workOrderId}`,
      message: `Work Order assigned for ${asset.assetCode} (${asset.name}): ${workDescription.substring(0, 60)}...`,
      type: 'WORK_ORDER',
      relatedAsset: asset._id,
    });

    const populated = await WorkOrder.findById(workOrder._id)
      .populate('assetId', 'assetCode name')
      .populate('assignedEngineer', 'name email');

    return res.status(201).json({
      success: true,
      message: 'Work order created successfully.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Work Order (e.g. status, costs, photos, completion)
 * @route   PUT /api/work-orders/:id
 */
const updateWorkOrder = async (req, res, next) => {
  try {
    const workOrder = await WorkOrder.findById(req.params.id);
    if (!workOrder) {
      return res.status(404).json({ success: false, message: 'Work order not found.' });
    }

    const prevStatus = workOrder.status;
    const prevCost = workOrder.totalCost || 0;

    Object.assign(workOrder, req.body);

    const lCost = Number(workOrder.laborCost || 0);
    const mCost = Number(workOrder.materialCost || 0);
    const oCost = Number(workOrder.otherCost || 0);
    workOrder.totalCost = lCost + mCost + oCost;

    if (req.body.status === 'COMPLETED' && prevStatus !== 'COMPLETED') {
      workOrder.actualCompletionDate = new Date();

      // Rule #6: Maintenance cost must update the asset's lifecycle cost!
      const asset = await Asset.findById(workOrder.assetId);
      if (asset) {
        const addedCost = workOrder.totalCost;
        asset.financial.maintenanceCost = (asset.financial.maintenanceCost || 0) + addedCost;
        asset.financial.totalLifecycleCost = (asset.financial.totalLifecycleCost || 0) + addedCost;
        await asset.save();
      }

      // If linked to maintenance request, complete it too
      if (workOrder.maintenanceRequestId) {
        await MaintenanceRequest.findByIdAndUpdate(workOrder.maintenanceRequestId, {
          status: 'COMPLETED',
          actualCost: workOrder.totalCost,
          completionDate: new Date(),
        });
      }

      await createNotification({
        title: `Work Order Completed: ${workOrder.workOrderId}`,
        message: `Maintenance completed for asset. Total recorded expenditure: ₹${workOrder.totalCost.toLocaleString()}`,
        type: 'WORK_ORDER',
        relatedAsset: workOrder.assetId,
      });
    }

    await workOrder.save();

    await logAudit({
      userId: req.user._id,
      action: 'WORK_ORDER_UPDATED',
      entityType: 'WorkOrder',
      entityId: workOrder._id,
      previousData: { status: prevStatus, totalCost: prevCost },
      newData: { status: workOrder.status, totalCost: workOrder.totalCost },
    });

    return res.json({
      success: true,
      message: 'Work order updated successfully.',
      data: workOrder,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWorkOrders,
  getWorkOrderById,
  createWorkOrder,
  updateWorkOrder,
};
