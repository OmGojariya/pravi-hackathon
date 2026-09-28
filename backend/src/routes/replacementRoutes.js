const express = require('express');
const router = express.Router();
const {
  getReplacementPlans,
  createReplacementPlan,
  executeReplacement,
} = require('../controllers/replacementController');
const { protect } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/')
  .get(getReplacementPlans)
  .post(
    requireRoles('SUPER_ADMIN', 'ADMIN', 'ASSET_MANAGER', 'FINANCE_OFFICER'),
    createReplacementPlan
  );

router.post(
  '/:id/execute',
  requireRoles('SUPER_ADMIN', 'ADMIN', 'ASSET_MANAGER'),
  executeReplacement
);

module.exports = router;
