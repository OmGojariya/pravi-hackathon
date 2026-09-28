const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/')
  .get(getUsers)
  .post(requireRoles('SUPER_ADMIN', 'ADMIN'), createUser);

router.route('/:id')
  .get(getUserById)
  .put(requireRoles('SUPER_ADMIN', 'ADMIN'), updateUser)
  .delete(requireRoles('SUPER_ADMIN'), deleteUser);

module.exports = router;
