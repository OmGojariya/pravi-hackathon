const Asset = require('../models/Asset');
const Inspection = require('../models/Inspection');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const WorkOrder = require('../models/WorkOrder');
const Project = require('../models/Project');
const Procurement = require('../models/Procurement');

/**
 * @desc    Generate report data based on report type
 * @route   GET /api/reports/:type
 */
const getReportData = async (req, res, next) => {
  try {
    const { type } = req.params;
    let data = [];

    switch (type) {
      case 'inventory':
      case 'assets':
        data = await Asset.find()
          .populate('categoryId', 'name code')
          .populate('managerId', 'name email')
          .sort({ assetCode: 1 });
        break;

      case 'condition':
        data = await Asset.find()
          .select('assetCode name categoryId type condition criticality riskLevel location')
          .populate('categoryId', 'name')
          .sort({ 'condition.score': 1 }); // Lowest condition first
        break;

      case 'maintenance':
        data = await MaintenanceRequest.find()
          .populate('assetId', 'assetCode name type location')
          .populate('requestedBy', 'name')
          .populate('assignedEngineer', 'name')
          .sort({ requestDate: -1 });
        break;

      case 'lifecycle-cost':
      case 'financial':
        data = await Asset.find()
          .select('assetCode name type financial lifecycle department')
          .populate('categoryId', 'name')
          .sort({ 'financial.totalLifecycleCost': -1 });
        break;

      case 'inspections':
        data = await Inspection.find()
          .populate('assetId', 'assetCode name')
          .populate('inspectorId', 'name employeeId')
          .sort({ inspectionDate: -1 });
        break;

      case 'critical':
        data = await Asset.find({
          $or: [{ criticality: 'CRITICAL' }, { 'condition.rating': 'CRITICAL' }, { riskLevel: 'CRITICAL' }],
        })
          .populate('categoryId', 'name')
          .sort({ riskScore: -1 });
        break;

      case 'age':
        data = await Asset.find()
          .select('assetCode name lifecycle type department location')
          .populate('categoryId', 'name');
        break;

      case 'projects':
        data = await Project.find()
          .populate('projectManager', 'name')
          .sort({ createdAt: -1 });
        break;

      case 'procurement':
        data = await Procurement.find()
          .populate('assetId', 'assetCode name')
          .populate('vendorId', 'name contactPerson')
          .sort({ procurementDate: -1 });
        break;

      case 'disposal':
        data = await Asset.find({
          'lifecycle.status': { $in: ['DECOMMISSIONED', 'DISPOSED'] },
        })
          .populate('categoryId', 'name')
          .sort({ updatedAt: -1 });
        break;

      default:
        return res.status(400).json({ success: false, message: `Unknown report type: ${type}` });
    }

    return res.json({
      success: true,
      reportType: type,
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export report data as CSV
 * @route   GET /api/reports/:type/export
 */
const exportReportCSV = async (req, res, next) => {
  try {
    const { type } = req.params;
    let csvHeader = '';
    let rows = [];

    if (type === 'inventory' || type === 'assets') {
      const assets = await Asset.find().populate('categoryId', 'name');
      csvHeader = 'Asset Code,Asset Name,Category,Type,Status,Condition Rating,Score,Criticality,Risk,District,Lifecycle Cost (INR)\n';
      rows = assets.map((a) =>
        `"${a.assetCode}","${a.name}","${a.categoryId?.name || ''}","${a.type}","${a.lifecycle?.status}","${a.condition?.rating}","${a.condition?.score}","${a.criticality}","${a.riskLevel}","${a.location?.district}","${a.financial?.totalLifecycleCost || 0}"`
      );
    } else if (type === 'maintenance') {
      const requests = await MaintenanceRequest.find().populate('assetId', 'assetCode name');
      csvHeader = 'Request ID,Asset Code,Problem,Priority,Status,Request Date,Estimated Cost,Actual Cost\n';
      rows = requests.map((r) =>
        `"${r.requestId}","${r.assetId?.assetCode || ''}","${r.problem.replace(/"/g, '""')}","${r.priority}","${r.status}","${new Date(r.requestDate).toISOString().split('T')[0]}","${r.estimatedCost}","${r.actualCost}"`
      );
    } else {
      const assets = await Asset.find();
      csvHeader = 'Asset Code,Name,Status,Rating,Score\n';
      rows = assets.map((a) => `"${a.assetCode}","${a.name}","${a.lifecycle?.status}","${a.condition?.rating}","${a.condition?.score}"`);
    }

    const csvContent = csvHeader + rows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=infratrack_${type}_report_${Date.now()}.csv`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReportData,
  exportReportCSV,
};
