const express = require('express');
const router = express.Router();
const {
  getReportData,
  exportReportCSV,
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.get('/:type/export', exportReportCSV);
router.get('/:type', getReportData);

module.exports = router;
