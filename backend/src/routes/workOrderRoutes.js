const express = require('express');
const router = express.Router();
const {
  getWorkOrders,
  getWorkOrderById,
  createWorkOrder,
  updateWorkOrder,
} = require('../controllers/workOrderController');
const { protect } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/')
  .get(getWorkOrders)
  .post(
    requireRoles('SUPER_ADMIN', 'ADMIN', 'MAINTENANCE_MANAGER'),
    createWorkOrder
  );

router.route('/:id')
  .get(getWorkOrderById)
  .put(
    requireRoles('SUPER_ADMIN', 'ADMIN', 'MAINTENANCE_MANAGER', 'FIELD_ENGINEER'),
    updateWorkOrder
  );

module.exports = router;
