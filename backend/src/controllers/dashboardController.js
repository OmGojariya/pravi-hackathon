const Asset = require('../models/Asset');
const Inspection = require('../models/Inspection');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const WorkOrder = require('../models/WorkOrder');
const Procurement = require('../models/Procurement');

/**
 * @desc    Get top-level KPI cards for the executive dashboard
 * @route   GET /api/dashboard/summary
 */
const getDashboardSummary = async (req, res, next) => {
  try {
    const now = new Date();

    const [
      totalAssets,
      operationalAssets,
      maintenanceAssets,
      criticalAssets,
      underConstruction,
      decommissionedAssets,
      overdueInspections,
      overdueMaintenance,
      costAggregations,
    ] = await Promise.all([
      Asset.countDocuments(),
      Asset.countDocuments({ 'lifecycle.status': 'OPERATIONAL' }),
      Asset.countDocuments({ 'lifecycle.status': 'UNDER_MAINTENANCE' }),
      Asset.countDocuments({
        $or: [{ criticality: 'CRITICAL' }, { 'condition.rating': 'CRITICAL' }, { riskLevel: 'CRITICAL' }],
      }),
      Asset.countDocuments({ 'lifecycle.status': 'UNDER_CONSTRUCTION' }),
      Asset.countDocuments({ 'lifecycle.status': { $in: ['DECOMMISSIONED', 'DISPOSED'] } }),
      Asset.countDocuments({
        'condition.nextInspectionDate': { $lt: now, $ne: null },
        'lifecycle.status': 'OPERATIONAL',
      }),
      MaintenanceRequest.countDocuments({
        status: { $in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] },
        scheduledDate: { $lt: now, $ne: null },
      }),
      Asset.aggregate([
        {
          $group: {
            _id: null,
            totalAcquisition: { $sum: '$financial.acquisitionCost' },
            totalMaintenance: { $sum: '$financial.maintenanceCost' },
            totalLifecycle: { $sum: '$financial.totalLifecycleCost' },
          },
        },
      ]),
    ]);

    const financialTotals = costAggregations[0] || {
      totalAcquisition: 0,
      totalMaintenance: 0,
      totalLifecycle: 0,
    };

    return res.json({
      success: true,
      data: {
        totalAssets,
        operationalAssets,
        maintenanceAssets,
        criticalAssets,
        underConstruction,
        decommissionedAssets,
        overdueInspections,
        overdueMaintenance,
        totalAcquisitionValue: financialTotals.totalAcquisition,
        totalMaintenanceExpenditure: financialTotals.totalMaintenance,
        totalLifecycleValue: financialTotals.totalLifecycle,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get chart datasets for the analytics dashboard
 * @route   GET /api/dashboard/charts
 */
const getDashboardCharts = async (req, res, next) => {
  try {
    const [
      byCategory,
      byLifecycle,
      byCondition,
      byCriticality,
      byDepartment,
      byDistrict,
      maintenanceByPriority,
      maintenanceByStatus,
      costByYear,
    ] = await Promise.all([
      // Assets by Category
      Asset.aggregate([
        {
          $lookup: {
            from: 'assetcategories',
            localField: 'categoryId',
            foreignField: '_id',
            as: 'category',
          },
        },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: { $ifNull: ['$category.name', 'Uncategorized'] },
            count: { $sum: 1 },
          },
        },
        { $project: { name: '$_id', count: 1, _id: 0 } },
        { $sort: { count: -1 } },
      ]),

      // Assets by Lifecycle Status
      Asset.aggregate([
        {
          $group: {
            _id: '$lifecycle.status',
            count: { $sum: 1 },
          },
        },
        { $project: { status: '$_id', count: 1, _id: 0 } },
      ]),

      // Assets by Condition Rating
      Asset.aggregate([
        {
          $group: {
            _id: '$condition.rating',
            count: { $sum: 1 },
          },
        },
        { $project: { rating: '$_id', count: 1, _id: 0 } },
      ]),

      // Assets by Criticality Level
      Asset.aggregate([
        {
          $group: {
            _id: '$criticality',
            count: { $sum: 1 },
          },
        },
        { $project: { criticality: '$_id', count: 1, _id: 0 } },
      ]),

      // Assets by Department
      Asset.aggregate([
        {
          $group: {
            _id: '$department',
            count: { $sum: 1 },
          },
        },
        { $project: { department: '$_id', count: 1, _id: 0 } },
        { $sort: { count: -1 } },
      ]),

      // Assets by District
      Asset.aggregate([
        {
          $group: {
            _id: '$location.district',
            count: { $sum: 1 },
          },
        },
        { $project: { district: '$_id', count: 1, _id: 0 } },
        { $sort: { count: -1 } },
      ]),

      // Maintenance Requests by Priority
      MaintenanceRequest.aggregate([
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 },
          },
        },
        { $project: { priority: '$_id', count: 1, _id: 0 } },
      ]),

      // Maintenance Requests by Status
      MaintenanceRequest.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
        { $project: { status: '$_id', count: 1, _id: 0 } },
      ]),

      // Maintenance & Acquisition Cost by Year
      WorkOrder.aggregate([
        {
          $group: {
            _id: { $year: '$startDate' },
            totalCost: { $sum: '$totalCost' },
          },
        },
        { $project: { year: '$_id', totalCost: 1, _id: 0 } },
        { $sort: { year: 1 } },
      ]),
    ]);

    return res.json({
      success: true,
      data: {
        byCategory,
        byLifecycle,
        byCondition,
        byCriticality,
        byDepartment,
        byDistrict,
        maintenanceByPriority,
        maintenanceByStatus,
        costByYear,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get urgent actionable alerts for the dashboard banner
 * @route   GET /api/dashboard/alerts
 */
const getDashboardAlerts = async (req, res, next) => {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const [
      criticalAssets,
      overdueInspections,
      overdueMaintenance,
      expiringWarranties,
      approachingEndOfLife,
    ] = await Promise.all([
      Asset.find({
        $or: [{ 'condition.rating': 'CRITICAL' }, { riskLevel: 'CRITICAL' }],
        'lifecycle.status': { $in: ['OPERATIONAL', 'UNDER_INSPECTION', 'UNDER_MAINTENANCE'] },
      }).select('assetCode name condition criticality riskLevel location.district').limit(5),

      Asset.find({
        'condition.nextInspectionDate': { $lt: now, $ne: null },
        'lifecycle.status': 'OPERATIONAL',
      }).select('assetCode name condition.nextInspectionDate department').limit(5),

      MaintenanceRequest.find({
        status: { $in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] },
        scheduledDate: { $lt: now, $ne: null },
      }).populate('assetId', 'assetCode name').limit(5),

      Procurement.find({
        warrantyExpiry: { $gte: now, $lte: thirtyDaysFromNow },
        procurementStatus: 'WARRANTY_ACTIVE',
      }).populate('assetId', 'assetCode name').limit(5),

      // Useful life >= 25 years and age near 25, or flagged
      Asset.find({
        'lifecycle.status': 'OPERATIONAL',
      }).select('assetCode name lifecycle.usefulLife lifecycle.commissioningDate createdAt').limit(20),
    ]);

    // Filter end-of-life assets (remaining life <= 2 years)
    const eolAssets = approachingEndOfLife.filter((a) => {
      const useful = a.lifecycle?.usefulLife || 30;
      const start = a.lifecycle?.commissioningDate || a.createdAt;
      const age = (now.getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      return (useful - age) <= 2;
    }).slice(0, 5);

    const alerts = [];

    criticalAssets.forEach((a) => {
      alerts.push({
        id: `crit-${a._id}`,
        level: 'CRITICAL',
        title: `Critical Asset Alert: ${a.assetCode}`,
        message: `${a.name} is in ${a.condition?.rating} condition with ${a.riskLevel} risk level.`,
        link: `/assets/${a.assetCode}`,
      });
    });

    overdueInspections.forEach((a) => {
      alerts.push({
        id: `insp-${a._id}`,
        level: 'HIGH',
        title: `Overdue Inspection: ${a.assetCode}`,
        message: `Inspection was scheduled for ${new Date(a.condition?.nextInspectionDate).toLocaleDateString()}.`,
        link: `/assets/${a.assetCode}`,
      });
    });

    overdueMaintenance.forEach((m) => {
      alerts.push({
        id: `maint-${m._id}`,
        level: 'HIGH',
        title: `Overdue Maintenance: ${m.requestId}`,
        message: `${m.problem} on ${m.assetId?.assetCode || 'Asset'} was scheduled for ${new Date(m.scheduledDate).toLocaleDateString()}.`,
        link: `/maintenance/${m._id}`,
      });
    });

    eolAssets.forEach((a) => {
      alerts.push({
        id: `eol-${a._id}`,
        level: 'MEDIUM',
        title: `Approaching End-of-Life: ${a.assetCode}`,
        message: `${a.name} has less than 2 years of remaining useful service. Replacement planning required.`,
        link: `/assets/${a.assetCode}`,
      });
    });

    expiringWarranties.forEach((p) => {
      alerts.push({
        id: `warr-${p._id}`,
        level: 'LOW',
        title: `Warranty Expiring Soon`,
        message: `Warranty for ${p.assetId?.name || 'Asset'} expires on ${new Date(p.warrantyExpiry).toLocaleDateString()}.`,
        link: `/procurement`,
      });
    });

    return res.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardSummary,
  getDashboardCharts,
  getDashboardAlerts,
};
