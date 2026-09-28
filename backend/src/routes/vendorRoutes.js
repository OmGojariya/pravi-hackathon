const express = require('express');
const router = express.Router();
const {
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
} = require('../controllers/vendorController');
const { protect } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/')
  .get(getVendors)
  .post(requireRoles('SUPER_ADMIN', 'ADMIN', 'PROCUREMENT_OFFICER'), createVendor);

router.route('/:id')
  .get(getVendorById)
  .put(requireRoles('SUPER_ADMIN', 'ADMIN', 'PROCUREMENT_OFFICER'), updateVendor)
  .delete(requireRoles('SUPER_ADMIN', 'ADMIN'), deleteVendor);

module.exports = router;
