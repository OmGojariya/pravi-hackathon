const express = require('express');
const router = express.Router();
const {
  getProcurements,
  getProcurementById,
  createProcurement,
  updateProcurement,
} = require('../controllers/procurementController');
const { protect } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/')
  .get(getProcurements)
  .post(
    requireRoles('SUPER_ADMIN', 'ADMIN', 'PROCUREMENT_OFFICER', 'FINANCE_OFFICER'),
    createProcurement
  );

router.route('/:id')
  .get(getProcurementById)
  .put(
    requireRoles('SUPER_ADMIN', 'ADMIN', 'PROCUREMENT_OFFICER'),
    updateProcurement
  );

module.exports = router;
