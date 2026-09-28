const express = require('express');
const router = express.Router();
const {
  getIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
} = require('../controllers/incidentController');
const { protect } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/')
  .get(getIncidents)
  .post(createIncident);

router.route('/:id')
  .get(getIncidentById)
  .put(
    requireRoles('SUPER_ADMIN', 'ADMIN', 'ASSET_MANAGER', 'MAINTENANCE_MANAGER', 'FIELD_ENGINEER'),
    updateIncident
  );

module.exports = router;
