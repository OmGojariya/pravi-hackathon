const express = require('express');
const router = express.Router();
const {
  getInspections,
  getInspectionById,
  createInspection,
  updateInspection,
} = require('../controllers/inspectionController');
const { protect } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/')
  .get(getInspections)
  .post(
    requireRoles('SUPER_ADMIN', 'ADMIN', 'ASSET_MANAGER', 'INSPECTOR', 'FIELD_ENGINEER'),
    createInspection
  );

router.route('/:id')
  .get(getInspectionById)
  .put(
    requireRoles('SUPER_ADMIN', 'ADMIN', 'INSPECTOR'),
    updateInspection
  );

module.exports = router;
