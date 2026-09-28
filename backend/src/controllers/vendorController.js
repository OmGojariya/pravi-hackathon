const Vendor = require('../models/Vendor');
const { logAudit } = require('../services/auditService');

/**
 * @desc    Get all vendors
 * @route   GET /api/vendors
 */
const getVendors = async (req, res, next) => {
  try {
    const vendors = await Vendor.find().sort({ name: 1 });
    return res.json({ success: true, data: vendors });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single vendor
 * @route   GET /api/vendors/:id
 */
const getVendorById = async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found.' });
    }
    return res.json({ success: true, data: vendor });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new vendor
 * @route   POST /api/vendors
 */
const createVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.create(req.body);
    await logAudit({
      userId: req.user._id,
      action: 'VENDOR_CREATED',
      entityType: 'Vendor',
      entityId: vendor._id,
      newData: { name: vendor.name },
    });
    return res.status(201).json({ success: true, message: 'Vendor added successfully.', data: vendor });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update vendor
 * @route   PUT /api/vendors/:id
 */
const updateVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found.' });
    }
    return res.json({ success: true, message: 'Vendor updated successfully.', data: vendor });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete vendor
 * @route   DELETE /api/vendors/:id
 */
const deleteVendor = async (req, res, next) => {
  try {
    await Vendor.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Vendor removed successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
};
