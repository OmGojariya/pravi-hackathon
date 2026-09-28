const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleMiddleware');

router.get('/', getCategories);
router.get('/:id', getCategoryById);

router.post('/', protect, requireRoles('SUPER_ADMIN', 'ADMIN'), createCategory);
router.put('/:id', protect, requireRoles('SUPER_ADMIN', 'ADMIN'), updateCategory);
router.delete('/:id', protect, requireRoles('SUPER_ADMIN', 'ADMIN'), deleteCategory);

module.exports = router;
