const Incident = require('../models/Incident');
const Asset = require('../models/Asset');
const { calculateRisk } = require('../services/riskService');
const { logAudit } = require('../services/auditService');
const { createNotification } = require('../services/notificationService');

/**
 * @desc    Get all incidents
 * @route   GET /api/incidents
 */
const getIncidents = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const assetId = req.query.assetId;
    const severity = req.query.severity;
    const status = req.query.status;

    const query = {};
    if (assetId) query.assetId = assetId;
    if (severity) query.severity = severity;
    if (status) query.status = status;

    const total = await Incident.countDocuments(query);
    const incidents = await Incident.find(query)
      .populate('assetId', 'assetCode name type location condition criticality')
      .populate('reportedBy', 'name email employeeId department')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.json({
      success: true,
      data: incidents,
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
 * @desc    Get single incident
 * @route   GET /api/incidents/:id
 */
const getIncidentById = async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('assetId')
      .populate('reportedBy', 'name email phone department');

    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident record not found.' });
    }

    return res.json({ success: true, data: incident });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new incident report
 * @route   POST /api/incidents
 */
const createIncident = async (req, res, next) => {
  try {
    const {
      assetId,
      incidentType,
      severity,
      description,
      location,
      immediateAction,
      rootCause,
      correctiveAction,
      photos,
      documents,
    } = req.body;

    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found.' });
    }

    const year = new Date().getFullYear();
    const count = await Incident.countDocuments();
    const incidentId = `INC-${year}-${String(count + 1).padStart(4, '0')}`;

    const incident = await Incident.create({
      incidentId,
      assetId,
      reportedBy: req.user._id,
      date: new Date(),
      incidentType: incidentType || 'Operational Failure',
      severity: severity || 'MEDIUM',
      description,
      location: location || asset.location?.address || '',
      immediateAction: immediateAction || '',
      rootCause: rootCause || '',
      correctiveAction: correctiveAction || '',
      photos: photos || [],
      documents: documents || [],
      status: 'OPEN',
    });

    // Recalculate asset risk
    const openIncidents = await Incident.countDocuments({ assetId, status: { $in: ['OPEN', 'INVESTIGATING'] } });
    const risk = calculateRisk(asset, openIncidents);
    asset.riskScore = risk.riskScore;
    asset.riskLevel = risk.riskLevel;
    await asset.save();

    await logAudit({
      userId: req.user._id,
      action: 'INCIDENT_REPORTED',
      entityType: 'Incident',
      entityId: incident._id,
      newData: { incidentId, severity: incident.severity },
    });

    if (severity === 'CRITICAL' || severity === 'HIGH') {
      await createNotification({
        title: `Urgent Incident Reported: ${incidentId}`,
        message: `High severity incident reported for ${asset.assetCode}: ${description.substring(0, 60)}...`,
        type: 'CRITICAL_ASSET',
        relatedAsset: asset._id,
      });
    }

    const populated = await Incident.findById(incident._id)
      .populate('assetId', 'assetCode name')
      .populate('reportedBy', 'name');

    return res.status(201).json({
      success: true,
      message: 'Incident reported successfully.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update incident status / investigation
 * @route   PUT /api/incidents/:id
 */
const updateIncident = async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found.' });
    }

    Object.assign(incident, req.body);
    await incident.save();

    return res.json({
      success: true,
      message: 'Incident record updated.',
      data: incident,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
};
