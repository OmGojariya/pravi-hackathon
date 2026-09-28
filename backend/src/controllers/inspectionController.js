const Inspection = require('../models/Inspection');
const Asset = require('../models/Asset');
const { calculateRisk } = require('../services/riskService');
const { logAudit } = require('../services/auditService');
const { createNotification } = require('../services/notificationService');

const getRatingFromScore = (score) => {
  if (score >= 90) return 'EXCELLENT';
  if (score >= 75) return 'GOOD';
  if (score >= 50) return 'FAIR';
  if (score >= 25) return 'POOR';
  return 'CRITICAL';
};

/**
 * @desc    Get all inspections with pagination
 * @route   GET /api/inspections
 */
const getInspections = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const assetId = req.query.assetId;
    const inspectionType = req.query.inspectionType;
    const conditionRating = req.query.conditionRating;

    const query = {};
    if (assetId) query.assetId = assetId;
    if (inspectionType) query.inspectionType = inspectionType;
    if (conditionRating) query.conditionRating = conditionRating;

    const total = await Inspection.countDocuments(query);
    const inspections = await Inspection.find(query)
      .populate('assetId', 'assetCode name type location criticality condition')
      .populate('inspectorId', 'name email employeeId department')
      .sort({ inspectionDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.json({
      success: true,
      data: inspections,
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
 * @desc    Get single inspection
 * @route   GET /api/inspections/:id
 */
const getInspectionById = async (req, res, next) => {
  try {
    const inspection = await Inspection.findById(req.params.id)
      .populate('assetId')
      .populate('inspectorId', 'name email employeeId department phone');

    if (!inspection) {
      return res.status(404).json({ success: false, message: 'Inspection record not found.' });
    }

    return res.json({ success: true, data: inspection });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new Inspection & auto-update Asset condition
 * @route   POST /api/inspections
 * @access  Inspector, Field Engineer, Asset Manager, Admin, Super Admin
 */
const createInspection = async (req, res, next) => {
  try {
    const {
      assetId,
      inspectionType,
      conditionScore,
      structuralCondition,
      operationalCondition,
      safetyCondition,
      observations,
      recommendations,
      nextInspectionDate,
      photos,
      documents,
    } = req.body;

    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found.' });
    }

    // Generate unique inspection ID
    const year = new Date().getFullYear();
    const count = await Inspection.countDocuments({
      createdAt: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`) },
    });
    const inspectionId = `INSP-${year}-${String(count + 1).padStart(4, '0')}`;

    const score = Number(conditionScore);
    const rating = getRatingFromScore(score);

    const inspection = await Inspection.create({
      inspectionId,
      assetId,
      inspectorId: req.user._id,
      inspectionDate: req.body.inspectionDate || new Date(),
      inspectionType: inspectionType || 'Routine',
      conditionScore: score,
      conditionRating: rating,
      structuralCondition: structuralCondition || { score: 80, notes: '' },
      operationalCondition: operationalCondition || { score: 85, notes: '' },
      safetyCondition: safetyCondition || { score: 90, notes: '' },
      observations,
      recommendations: recommendations || '',
      nextInspectionDate: nextInspectionDate || null,
      photos: photos || [],
      documents: documents || [],
    });

    // Update Asset condition details
    asset.condition.score = score;
    asset.condition.rating = rating;
    asset.condition.lastInspectionDate = inspection.inspectionDate;
    if (nextInspectionDate) {
      asset.condition.nextInspectionDate = nextInspectionDate;
    }

    // Recalculate asset risk
    const risk = calculateRisk(asset);
    asset.riskScore = risk.riskScore;
    asset.riskLevel = risk.riskLevel;

    await asset.save();

    // Log audit
    await logAudit({
      userId: req.user._id,
      action: 'INSPECTION_CONDUCTED',
      entityType: 'Inspection',
      entityId: inspection._id,
      newData: { inspectionId, score, rating, assetCode: asset.assetCode },
    });

    // If condition is critical or poor, fire alert
    if (rating === 'CRITICAL' || rating === 'POOR') {
      await createNotification({
        title: `Critical Condition Alert: ${asset.assetCode}`,
        message: `Inspection ${inspectionId} recorded condition score ${score}/100 (${rating}) for ${asset.name}. Immediate review required.`,
        type: 'CRITICAL_ASSET',
        relatedAsset: asset._id,
      });
    }

    const populated = await Inspection.findById(inspection._id)
      .populate('assetId', 'assetCode name type location condition')
      .populate('inspectorId', 'name email employeeId');

    return res.status(201).json({
      success: true,
      message: 'Inspection completed and asset condition updated successfully.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update inspection (Rule #5: Completed inspections cannot be silently modified - recorded in AuditLog)
 * @route   PUT /api/inspections/:id
 * @access  Inspector, Admin, Super Admin
 */
const updateInspection = async (req, res, next) => {
  try {
    const inspection = await Inspection.findById(req.params.id);
    if (!inspection) {
      return res.status(404).json({ success: false, message: 'Inspection not found.' });
    }

    const previousData = inspection.toObject();

    const { observations, recommendations, nextInspectionDate } = req.body;
    if (observations) inspection.observations = observations;
    if (recommendations !== undefined) inspection.recommendations = recommendations;
    if (nextInspectionDate) inspection.nextInspectionDate = nextInspectionDate;

    await inspection.save();

    await logAudit({
      userId: req.user._id,
      action: 'INSPECTION_UPDATED',
      entityType: 'Inspection',
      entityId: inspection._id,
      previousData: { observations: previousData.observations },
      newData: { observations: inspection.observations },
    });

    return res.json({
      success: true,
      message: 'Inspection details updated successfully.',
      data: inspection,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInspections,
  getInspectionById,
  createInspection,
  updateInspection,
};
