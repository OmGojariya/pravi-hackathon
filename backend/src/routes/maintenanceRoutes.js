const express = require('express');
const router = express.Router();
const {
  getMaintenanceRequests,
  getMaintenanceRequestById,
  createMaintenanceRequest,
  updateMaintenanceRequest,
  getSchedules,
  createSchedule,
} = require('../controllers/maintenanceController');
const { protect } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/schedules', getSchedules);
router.post('/schedules', requireRoles('SUPER_ADMIN', 'ADMIN', 'MAINTENANCE_MANAGER'), createSchedule);

router.route('/')
  .get(getMaintenanceRequests)
  .post(
    requireRoles(
      'SUPER_ADMIN',
      'ADMIN',
      'ASSET_MANAGER',
      'MAINTENANCE_MANAGER',
      'FIELD_ENGINEER',
      'INSPECTOR'
    ),
    createMaintenanceRequest
  );

router.route('/:id')
  .get(getMaintenanceRequestById)
  .put(
    requireRoles(
      'SUPER_ADMIN',
      'ADMIN',
      'MAINTENANCE_MANAGER',
      'FIELD_ENGINEER'
    ),
    updateMaintenanceRequest
  );

module.exports = router;
