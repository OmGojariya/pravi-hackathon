const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditController');
const { protect } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleMiddleware');

router.use(protect);
router.get('/', requireRoles('SUPER_ADMIN', 'ADMIN'), getAuditLogs);

module.exports = router;
