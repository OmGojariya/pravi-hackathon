const mongoose = require('mongoose');
const Asset = require('../models/Asset');
const AssetCategory = require('../models/AssetCategory');
const LifecycleEvent = require('../models/LifecycleEvent');
const Inspection = require('../models/Inspection');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const WorkOrder = require('../models/WorkOrder');
const Incident = require('../models/Incident');
const Document = require('../models/Document');
const { generateAssetCode } = require('../utils/generateAssetCode');
const { generateAssetQRCode } = require('../services/qrService');
const { calculateRisk } = require('../services/riskService');
const { logAudit } = require('../services/auditService');
const { createNotification } = require('../services/notificationService');

/**
 * @desc    Get all assets with filters, search, sorting & pagination
 * @route   GET /api/assets
 * @access  Public / Private
 */
const getAssets = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const condition = req.query.condition || '';
    const status = req.query.status || '';
    const district = req.query.district || '';
    const department = req.query.department || '';
    const criticality = req.query.criticality || '';
    const riskLevel = req.query.riskLevel || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const query = {};

    if (search) {
      query.$or = [
        { assetCode: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } },
        { 'location.address': { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } },
        { 'physicalDetails.serialNumber': { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        query.categoryId = category;
      } else {
        const catDoc = await AssetCategory.findOne({ code: category.toUpperCase() });
        if (catDoc) query.categoryId = catDoc._id;
      }
    }

    if (condition) query['condition.rating'] = condition;
    if (status) query['lifecycle.status'] = status;
    if (district) query['location.district'] = district;
    if (department) query.department = department;
    if (criticality) query.criticality = criticality;
    if (riskLevel) query.riskLevel = riskLevel;

    const total = await Asset.countDocuments(query);
    const assets = await Asset.find(query)
      .populate('categoryId', 'name code icon')
      .populate('managerId', 'name email phone')
      .populate('projectId', 'name projectId')
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.json({
      success: true,
      data: assets,
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
 * @desc    Get single asset by ID or Asset Code (supports QR link navigation)
 * @route   GET /api/assets/:identifier
 * @access  Public (limited) / Private (full)
 */
const getAssetByIdOrCode = async (req, res, next) => {
  try {
    const { identifier } = req.params;
    let query = {};

    if (mongoose.Types.ObjectId.isValid(identifier)) {
      query = { $or: [{ _id: identifier }, { assetCode: identifier.toUpperCase() }] };
    } else {
      query = { assetCode: identifier.toUpperCase() };
    }

    const asset = await Asset.findOne(query)
      .populate('categoryId')
      .populate('managerId', 'name email phone department')
      .populate('projectId')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: `Asset not found with identifier '${identifier}'.`,
      });
    }

    // Calculate age & remaining life
    const usefulLife = asset.lifecycle?.usefulLife || 30;
    const commissionDate = asset.lifecycle?.commissioningDate || asset.createdAt;
    const ageYears = Math.max(0, (Date.now() - new Date(commissionDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
    const remainingLifeYears = Math.max(0, usefulLife - ageYears);
    const replacementRequired = remainingLifeYears <= 2;

    const data = {
      ...asset.toObject(),
      metrics: {
        currentAgeYears: parseFloat(ageYears.toFixed(1)),
        remainingUsefulLifeYears: parseFloat(remainingLifeYears.toFixed(1)),
        replacementRequired,
      },
    };

    // If public viewer without login, obscure sensitive financial data
    if (!req.user) {
      delete data.financial;
      data.isPublicScan = true;
    }

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new Asset
 * @route   POST /api/assets
 * @access  Asset Manager, Admin, Super Admin
 */
const createAsset = async (req, res, next) => {
  try {
    const body = { ...req.body };

    // Auto-generate code if not provided
    if (!body.assetCode) {
      body.assetCode = await generateAssetCode(body.categoryId);
    } else {
      body.assetCode = body.assetCode.toUpperCase().trim();
      const existing = await Asset.findOne({ assetCode: body.assetCode });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: `Asset code '${body.assetCode}' already exists. Must be unique.`,
        });
      }
    }

    // Generate QR Code
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    body.qrCode = await generateAssetQRCode(body.assetCode, clientUrl);

    // Initial lifecycle calculation
    const acqCost = Number(body.financial?.acquisitionCost || 0);
    const constCost = Number(body.financial?.constructionCost || 0);
    const instCost = Number(body.financial?.installationCost || 0);
    body.financial = {
      ...body.financial,
      currentValue: acqCost + constCost + instCost,
      totalLifecycleCost: acqCost + constCost + instCost,
    };

    // Calculate risk
    const risk = calculateRisk(body);
    body.riskScore = risk.riskScore;
    body.riskLevel = risk.riskLevel;

    if (req.user) {
      body.createdBy = req.user._id;
      body.updatedBy = req.user._id;
    }

    const asset = await Asset.create(body);

    // Record initial lifecycle event
    await LifecycleEvent.create({
      assetId: asset._id,
      previousStatus: 'NONE',
      newStatus: asset.lifecycle.status || 'PLANNED',
      reason: 'Initial asset registration',
      remarks: 'Asset created in the inventory system',
      changedBy: req.user ? req.user._id : asset.createdBy,
    });

    // Record audit log
    await logAudit({
      userId: req.user ? req.user._id : null,
      action: 'ASSET_CREATED',
      entityType: 'Asset',
      entityId: asset._id,
      newData: { assetCode: asset.assetCode, name: asset.name, categoryId: asset.categoryId },
    });

    const populated = await Asset.findById(asset._id)
      .populate('categoryId')
      .populate('managerId', 'name email');

    return res.status(201).json({
      success: true,
      message: 'Asset created successfully.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Asset
 * @route   PUT /api/assets/:id
 * @access  Asset Manager, Admin, Super Admin
 */
const updateAsset = async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found.' });
    }

    const previousData = asset.toObject();

    // Prevent changing unique assetCode
    if (req.body.assetCode && req.body.assetCode !== asset.assetCode) {
      return res.status(400).json({
        success: false,
        message: 'Asset Code cannot be modified after registration.',
      });
    }

    // Merge updates
    Object.assign(asset, req.body);
    if (req.user) {
      asset.updatedBy = req.user._id;
    }

    // Recalculate lifecycle cost
    const f = asset.financial || {};
    asset.financial.totalLifecycleCost =
      (f.acquisitionCost || 0) +
      (f.constructionCost || 0) +
      (f.installationCost || 0) +
      (f.maintenanceCost || 0) +
      (f.repairCost || 0) +
      (f.rehabilitationCost || 0) +
      (f.disposalCost || 0);

    // Recalculate risk score
    const risk = calculateRisk(asset);
    asset.riskScore = risk.riskScore;
    asset.riskLevel = risk.riskLevel;

    await asset.save();

    await logAudit({
      userId: req.user ? req.user._id : null,
      action: 'ASSET_UPDATED',
      entityType: 'Asset',
      entityId: asset._id,
      previousData: { name: previousData.name, condition: previousData.condition },
      newData: { name: asset.name, condition: asset.condition },
    });

    const populated = await Asset.findById(asset._id)
      .populate('categoryId')
      .populate('managerId', 'name email phone')
      .populate('projectId');

    return res.json({
      success: true,
      message: 'Asset updated successfully.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete Asset (Enforces Rule 2: Cannot delete if history exists, mark DECOMMISSIONED/DISPOSED)
 * @route   DELETE /api/assets/:id
 * @access  Admin, Super Admin
 */
const deleteAsset = async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found.' });
    }

    // Check for historical records
    const [inspectionsCount, maintenanceCount, workOrdersCount, incidentsCount] = await Promise.all([
      Inspection.countDocuments({ assetId: asset._id }),
      MaintenanceRequest.countDocuments({ assetId: asset._id }),
      WorkOrder.countDocuments({ assetId: asset._id }),
      Incident.countDocuments({ assetId: asset._id }),
    ]);

    const hasHistory = inspectionsCount > 0 || maintenanceCount > 0 || workOrdersCount > 0 || incidentsCount > 0;

    if (hasHistory) {
      return res.status(400).json({
        success: false,
        message: `Asset cannot be permanently deleted because historical records exist (${inspectionsCount} inspections, ${maintenanceCount} maintenance requests, ${incidentsCount} incidents). Please transition its lifecycle status to DECOMMISSIONED or DISPOSED instead.`,
      });
    }

    await Asset.findByIdAndDelete(req.params.id);

    await logAudit({
      userId: req.user ? req.user._id : null,
      action: 'ASSET_DELETED',
      entityType: 'Asset',
      entityId: req.params.id,
      previousData: { assetCode: asset.assetCode, name: asset.name },
    });

    return res.json({
      success: true,
      message: 'Asset removed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Asset Lifecycle Status
 * @route   POST /api/assets/:id/lifecycle
 * @access  Asset Manager, Project Manager, Admin, Super Admin
 */
const updateLifecycleStatus = async (req, res, next) => {
  try {
    const { newStatus, reason, remarks, documents } = req.body;

    if (!newStatus) {
      return res.status(400).json({ success: false, message: 'New status is required.' });
    }

    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found.' });
    }

    const previousStatus = asset.lifecycle.status;
    asset.lifecycle.status = newStatus;

    if (newStatus === 'COMMISSIONED' && !asset.lifecycle.commissioningDate) {
      asset.lifecycle.commissioningDate = new Date();
    }
    if (newStatus === 'UNDER_CONSTRUCTION' && !asset.lifecycle.constructionStartDate) {
      asset.lifecycle.constructionStartDate = new Date();
    }

    await asset.save();

    // Create immutable LifecycleEvent
    const lifecycleEvent = await LifecycleEvent.create({
      assetId: asset._id,
      previousStatus,
      newStatus,
      reason: reason || 'Status transition requested by authorized personnel',
      remarks: remarks || '',
      changedBy: req.user._id,
      documents: documents || [],
    });

    // Send notification
    await createNotification({
      title: `Lifecycle Change: ${asset.assetCode}`,
      message: `Asset '${asset.name}' transitioned from ${previousStatus} to ${newStatus}.`,
      type: 'LIFECYCLE_CHANGE',
      relatedAsset: asset._id,
    });

    await logAudit({
      userId: req.user._id,
      action: 'LIFECYCLE_CHANGED',
      entityType: 'Asset',
      entityId: asset._id,
      previousData: { status: previousStatus },
      newData: { status: newStatus, reason },
    });

    return res.json({
      success: true,
      message: `Asset lifecycle updated from ${previousStatus} to ${newStatus}.`,
      data: {
        asset,
        lifecycleEvent,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get complete chronological asset timeline
 * @route   GET /api/assets/:id/timeline
 * @access  Public / Private
 */
const getAssetTimeline = async (req, res, next) => {
  try {
    const assetId = req.params.id;

    const [lifecycleEvents, inspections, maintenance, incidents] = await Promise.all([
      LifecycleEvent.find({ assetId }).populate('changedBy', 'name role').lean(),
      Inspection.find({ assetId }).populate('inspectorId', 'name role').lean(),
      MaintenanceRequest.find({ assetId }).populate('requestedBy', 'name role').lean(),
      Incident.find({ assetId }).populate('reportedBy', 'name role').lean(),
    ]);

    const timeline = [];

    lifecycleEvents.forEach((item) => {
      timeline.push({
        type: 'LIFECYCLE',
        title: `Lifecycle: ${item.newStatus}`,
        date: item.changedAt || item.createdAt,
        user: item.changedBy?.name || 'System',
        description: item.reason + (item.remarks ? ` — ${item.remarks}` : ''),
        details: { previousStatus: item.previousStatus, newStatus: item.newStatus },
      });
    });

    inspections.forEach((item) => {
      timeline.push({
        type: 'INSPECTION',
        title: `${item.inspectionType} Inspection (Score: ${item.conditionScore}/100)`,
        date: item.inspectionDate || item.createdAt,
        user: item.inspectorId?.name || 'Inspector',
        description: item.observations,
        details: { rating: item.conditionRating, score: item.conditionScore },
      });
    });

    maintenance.forEach((item) => {
      timeline.push({
        type: 'MAINTENANCE',
        title: `Maintenance: ${item.problem} (${item.status})`,
        date: item.requestDate || item.createdAt,
        user: item.requestedBy?.name || 'Officer',
        description: item.description,
        details: { priority: item.priority, status: item.status },
      });
    });

    incidents.forEach((item) => {
      timeline.push({
        type: 'INCIDENT',
        title: `Incident [${item.severity}]: ${item.incidentType}`,
        date: item.date || item.createdAt,
        user: item.reportedBy?.name || 'Staff',
        description: item.description,
        details: { severity: item.severity, status: item.status },
      });
    });

    // Sort descending by date
    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    return res.json({
      success: true,
      data: timeline,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Asset Inspections
 * @route   GET /api/assets/:id/inspections
 */
const getAssetInspections = async (req, res, next) => {
  try {
    const inspections = await Inspection.find({ assetId: req.params.id })
      .populate('inspectorId', 'name email role')
      .sort({ inspectionDate: -1 });

    return res.json({ success: true, data: inspections });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Asset Maintenance requests & work orders
 * @route   GET /api/assets/:id/maintenance
 */
const getAssetMaintenance = async (req, res, next) => {
  try {
    const [requests, workOrders] = await Promise.all([
      MaintenanceRequest.find({ assetId: req.params.id })
        .populate('requestedBy', 'name email')
        .populate('assignedEngineer', 'name email')
        .sort({ requestDate: -1 }),
      WorkOrder.find({ assetId: req.params.id })
        .populate('assignedEngineer', 'name email')
        .sort({ startDate: -1 }),
    ]);

    return res.json({
      success: true,
      data: { requests, workOrders },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Asset Documents
 * @route   GET /api/assets/:id/documents
 */
const getAssetDocuments = async (req, res, next) => {
  try {
    const documents = await Document.find({ assetId: req.params.id })
      .populate('uploadedBy', 'name email')
      .sort({ uploadDate: -1 });

    return res.json({ success: true, data: documents });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload photos for asset
 * @route   POST /api/assets/:id/photos
 */
const uploadAssetPhotos = async (req, res, next) => {
  try {
    if (!req.file && !req.files) {
      return res.status(400).json({ success: false, message: 'Please attach an image.' });
    }

    const file = req.file || (req.files && req.files[0]);
    const fileUrl = `/uploads/${file.filename}`;

    const doc = await Document.create({
      fileName: file.originalname,
      fileUrl,
      fileType: file.mimetype,
      fileSize: file.size,
      uploadedBy: req.user._id,
      documentType: 'Image',
      assetId: req.params.id,
      description: req.body.caption || 'Asset Photo',
    });

    return res.status(201).json({
      success: true,
      message: 'Photo uploaded successfully.',
      data: doc,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload document for asset
 * @route   POST /api/assets/:id/documents
 */
const uploadAssetDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select a document to upload.' });
    }

    const file = req.file;
    const fileUrl = `/uploads/${file.filename}`;

    const doc = await Document.create({
      fileName: file.originalname,
      fileUrl,
      fileType: file.mimetype,
      fileSize: file.size,
      uploadedBy: req.user._id,
      documentType: req.body.documentType || 'Other',
      assetId: req.params.id,
      description: req.body.description || '',
    });

    return res.status(201).json({
      success: true,
      message: 'Document uploaded successfully.',
      data: doc,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAssets,
  getAssetByIdOrCode,
  createAsset,
  updateAsset,
  deleteAsset,
  updateLifecycleStatus,
  getAssetTimeline,
  getAssetInspections,
  getAssetMaintenance,
  getAssetDocuments,
  uploadAssetPhotos,
  uploadAssetDocument,
};
