const Procurement = require('../models/Procurement');
const Asset = require('../models/Asset');
const { logAudit } = require('../services/auditService');

/**
 * @desc    Get all procurement records
 * @route   GET /api/procurement
 */
const getProcurements = async (req, res, next) => {
  try {
    const procurements = await Procurement.find()
      .populate('assetId', 'assetCode name type location')
      .populate('vendorId', 'name contactPerson email phone')
      .sort({ procurementDate: -1 });

    return res.json({ success: true, data: procurements });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single procurement record
 * @route   GET /api/procurement/:id
 */
const getProcurementById = async (req, res, next) => {
  try {
    const procurement = await Procurement.findById(req.params.id)
      .populate('assetId')
      .populate('vendorId');

    if (!procurement) {
      return res.status(404).json({ success: false, message: 'Procurement record not found.' });
    }

    return res.json({ success: true, data: procurement });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create procurement record
 * @route   POST /api/procurement
 */
const createProcurement = async (req, res, next) => {
  try {
    const {
      assetId,
      vendorId,
      purchaseOrder,
      contractNumber,
      procurementDate,
      contractStart,
      contractEnd,
      purchaseCost,
      warrantyPeriod,
      warrantyExpiry,
      procurementStatus,
    } = req.body;

    const year = new Date().getFullYear();
    const count = await Procurement.countDocuments();
    const procurementId = `PROC-${year}-${String(count + 1).padStart(4, '0')}`;

    const cost = Number(purchaseCost || 0);

    const procurement = await Procurement.create({
      procurementId,
      assetId,
      vendorId,
      purchaseOrder,
      contractNumber: contractNumber || '',
      procurementDate: procurementDate || new Date(),
      contractStart: contractStart || null,
      contractEnd: contractEnd || null,
      purchaseCost: cost,
      warrantyPeriod: Number(warrantyPeriod || 24),
      warrantyExpiry: warrantyExpiry || new Date(Date.now() + 24 * 30 * 24 * 60 * 60 * 1000),
      procurementStatus: procurementStatus || 'WARRANTY_ACTIVE',
    });

    // Update asset acquisition cost
    const asset = await Asset.findById(assetId);
    if (asset) {
      asset.financial.acquisitionCost = cost;
      asset.financial.totalLifecycleCost =
        cost +
        (asset.financial.constructionCost || 0) +
        (asset.financial.installationCost || 0) +
        (asset.financial.maintenanceCost || 0);
      await asset.save();
    }

    await logAudit({
      userId: req.user._id,
      action: 'PROCUREMENT_RECORDED',
      entityType: 'Procurement',
      entityId: procurement._id,
      newData: { procurementId, purchaseOrder, purchaseCost: cost },
    });

    const populated = await Procurement.findById(procurement._id)
      .populate('assetId', 'assetCode name')
      .populate('vendorId', 'name contactPerson');

    return res.status(201).json({
      success: true,
      message: 'Procurement recorded successfully.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update procurement record
 * @route   PUT /api/procurement/:id
 */
const updateProcurement = async (req, res, next) => {
  try {
    const procurement = await Procurement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!procurement) {
      return res.status(404).json({ success: false, message: 'Procurement record not found.' });
    }
    return res.json({ success: true, message: 'Procurement updated successfully.', data: procurement });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProcurements,
  getProcurementById,
  createProcurement,
  updateProcurement,
};
