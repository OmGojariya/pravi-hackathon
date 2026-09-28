const express = require('express');
const router = express.Router();
const {
  getDashboardSummary,
  getDashboardCharts,
  getDashboardAlerts,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.get('/summary', getDashboardSummary);
router.get('/charts', getDashboardCharts);
router.get('/alerts', getDashboardAlerts);

module.exports = router;
