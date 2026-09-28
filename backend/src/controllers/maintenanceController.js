const MaintenanceRequest = require('../models/MaintenanceRequest');
const MaintenanceSchedule = require('../models/MaintenanceSchedule');
const Asset = require('../models/Asset');
const { logAudit } = require('../services/auditService');
const { createNotification } = require('../services/notificationService');

/**
 * @desc    Get all maintenance requests with pagination & filters
 * @route   GET /api/maintenance
 */
const getMaintenanceRequests = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const assetId = req.query.assetId;
    const status = req.query.status;
    const priority = req.query.priority;

    const query = {};
    if (assetId) query.assetId = assetId;
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const total = await MaintenanceRequest.countDocuments(query);
    const requests = await MaintenanceRequest.find(query)
      .populate('assetId', 'assetCode name type location criticality condition')
      .populate('requestedBy', 'name email role department')
      .populate('assignedEngineer', 'name email phone')
      .sort({ requestDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.json({
      success: true,
      data: requests,
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
 * @desc    Get single maintenance request
 * @route   GET /api/maintenance/:id
 */
const getMaintenanceRequestById = async (req, res, next) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id)
      .populate('assetId')
      .populate('requestedBy', 'name email phone department')
      .populate('assignedEngineer', 'name email phone department');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Maintenance request not found.' });
    }

    return res.json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new maintenance request
 * @route   POST /api/maintenance
 * @access  Authenticated
 */
const createMaintenanceRequest = async (req, res, next) => {
  try {
    const {
      assetId,
      problem,
      description,
      priority,
      maintenanceType,
      assignedTeam,
      assignedEngineer,
      estimatedCost,
      scheduledDate,
      attachments,
    } = req.body;

    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found.' });
    }

    const year = new Date().getFullYear();
    const count = await MaintenanceRequest.countDocuments({
      createdAt: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`) },
    });
    const requestId = `MR-${year}-${String(count + 1).padStart(4, '0')}`;

    const request = await MaintenanceRequest.create({
      requestId,
      assetId,
      requestedBy: req.user._id,
      requestDate: new Date(),
      problem,
      description: description || '',
      priority: priority || 'MEDIUM',
      maintenanceType: maintenanceType || 'Corrective',
      status: assignedEngineer ? 'ASSIGNED' : 'OPEN',
      assignedTeam: assignedTeam || '',
      assignedEngineer: assignedEngineer || null,
      estimatedCost: Number(estimatedCost || 0),
      scheduledDate: scheduledDate || null,
      attachments: attachments || [],
    });

    await logAudit({
      userId: req.user._id,
      action: 'MAINTENANCE_REQUEST_CREATED',
      entityType: 'MaintenanceRequest',
      entityId: request._id,
      newData: { requestId, problem, priority: request.priority },
    });

    await createNotification({
      title: `New Maintenance Request: ${requestId}`,
      message: `Priority [${request.priority}]: ${request.problem} reported for ${asset.assetCode} (${asset.name}).`,
      type: 'MAINTENANCE_DUE',
      relatedAsset: asset._id,
    });

    const populated = await MaintenanceRequest.findById(request._id)
      .populate('assetId', 'assetCode name')
      .populate('requestedBy', 'name');

    return res.status(201).json({
      success: true,
      message: 'Maintenance request created successfully.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update maintenance request status or assignment
 * @route   PUT /api/maintenance/:id
 */
const updateMaintenanceRequest = async (req, res, next) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    const prevStatus = request.status;
    Object.assign(request, req.body);

    if (req.body.status === 'COMPLETED' && !request.completionDate) {
      request.completionDate = new Date();
    }

    await request.save();

    await logAudit({
      userId: req.user._id,
      action: 'MAINTENANCE_REQUEST_UPDATED',
      entityType: 'MaintenanceRequest',
      entityId: request._id,
      previousData: { status: prevStatus },
      newData: { status: request.status },
    });

    return res.json({
      success: true,
      message: 'Maintenance request updated.',
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Preventive Maintenance Schedules
 * @route   GET /api/maintenance/schedules
 */
const getSchedules = async (req, res, next) => {
  try {
    const schedules = await MaintenanceSchedule.find()
      .populate('assetId', 'assetCode name type location')
      .sort({ nextDueDate: 1 });

    return res.json({ success: true, data: schedules });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create Preventive Maintenance Schedule
 * @route   POST /api/maintenance/schedules
 */
const createSchedule = async (req, res, next) => {
  try {
    const { assetId, title, frequencyDays, nextDueDate, assignedTeam } = req.body;

    const schedule = await MaintenanceSchedule.create({
      assetId,
      title,
      frequencyDays: Number(frequencyDays || 30),
      nextDueDate: nextDueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      assignedTeam: assignedTeam || 'Preventive Maintenance Squad',
    });

    return res.status(201).json({
      success: true,
      message: 'Preventive maintenance schedule established.',
      data: schedule,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMaintenanceRequests,
  getMaintenanceRequestById,
  createMaintenanceRequest,
  updateMaintenanceRequest,
  getSchedules,
  createSchedule,
};
