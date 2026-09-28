const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/')
  .get(getProjects)
  .post(requireRoles('SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'), createProject);

router.route('/:id')
  .get(getProjectById)
  .put(requireRoles('SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'), updateProject)
  .delete(requireRoles('SUPER_ADMIN', 'ADMIN'), deleteProject);

module.exports = router;
