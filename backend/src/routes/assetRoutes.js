const express = require('express');
const router = express.Router();
const {
  getAssets,
  getAssetByIdOrCode,
  createAsset,
  updateAsset,
  deleteAsset,
  updateLifecycleStatus,
  getAssetTimeline,
  getAssetInspections,
  getAssetMaintenance,
  getAssetDocuments,
  uploadAssetPhotos,
  uploadAssetDocument,
} = require('../controllers/assetController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/', optionalAuth, getAssets);
router.get('/:identifier', optionalAuth, getAssetByIdOrCode);
router.get('/:id/timeline', optionalAuth, getAssetTimeline);
router.get('/:id/inspections', optionalAuth, getAssetInspections);
router.get('/:id/maintenance', optionalAuth, getAssetMaintenance);
router.get('/:id/documents', optionalAuth, getAssetDocuments);

// Mutation endpoints protected with RBAC
router.post(
  '/',
  protect,
  requireRoles('SUPER_ADMIN', 'ADMIN', 'ASSET_MANAGER', 'PROJECT_MANAGER'),
  createAsset
);

router.put(
  '/:id',
  protect,
  requireRoles('SUPER_ADMIN', 'ADMIN', 'ASSET_MANAGER', 'PROJECT_MANAGER', 'FIELD_ENGINEER'),
  updateAsset
);

router.delete(
  '/:id',
  protect,
  requireRoles('SUPER_ADMIN', 'ADMIN'),
  deleteAsset
);

router.post(
  '/:id/lifecycle',
  protect,
  requireRoles('SUPER_ADMIN', 'ADMIN', 'ASSET_MANAGER', 'PROJECT_MANAGER'),
  updateLifecycleStatus
);

router.post(
  '/:id/photos',
  protect,
  upload.single('photo'),
  uploadAssetPhotos
);

router.post(
  '/:id/documents',
  protect,
  upload.single('document'),
  uploadAssetDocument
);

module.exports = router;
