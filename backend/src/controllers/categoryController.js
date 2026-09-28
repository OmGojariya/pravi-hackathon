const AssetCategory = require('../models/AssetCategory');
const Asset = require('../models/Asset');
const { logAudit } = require('../services/auditService');

/**
 * @desc    Get all asset categories
 * @route   GET /api/categories
 * @access  Public / Authenticated
 */
const getCategories = async (req, res, next) => {
  try {
    const categories = await AssetCategory.find({ isActive: true }).sort({ name: 1 });
    return res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get category by ID
 * @route   GET /api/categories/:id
 * @access  Public / Authenticated
 */
const getCategoryById = async (req, res, next) => {
  try {
    const category = await AssetCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }
    return res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new category
 * @route   POST /api/categories
 * @access  Admin, Super Admin
 */
const createCategory = async (req, res, next) => {
  try {
    const { name, code, description, subcategories, icon } = req.body;

    const existing = await AssetCategory.findOne({
      $or: [{ name: name.trim() }, { code: code.toUpperCase().trim() }],
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A category with this Name or Code already exists.',
      });
    }

    const category = await AssetCategory.create({
      name: name.trim(),
      code: code.toUpperCase().trim(),
      description: description || '',
      subcategories: subcategories || [],
      icon: icon || 'Layers',
    });

    await logAudit({
      userId: req.user._id,
      action: 'CATEGORY_CREATED',
      entityType: 'AssetCategory',
      entityId: category._id,
      newData: { name: category.name, code: category.code },
    });

    return res.status(201).json({
      success: true,
      message: 'Asset Category created successfully.',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update category
 * @route   PUT /api/categories/:id
 * @access  Admin, Super Admin
 */
const updateCategory = async (req, res, next) => {
  try {
    const category = await AssetCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    const { name, description, subcategories, icon, isActive } = req.body;
    if (name) category.name = name.trim();
    if (description !== undefined) category.description = description;
    if (subcategories) category.subcategories = subcategories;
    if (icon) category.icon = icon;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    await logAudit({
      userId: req.user._id,
      action: 'CATEGORY_UPDATED',
      entityType: 'AssetCategory',
      entityId: category._id,
      newData: { name: category.name },
    });

    return res.json({
      success: true,
      message: 'Asset Category updated successfully.',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete category (soft or hard if no assets)
 * @route   DELETE /api/categories/:id
 * @access  Admin, Super Admin
 */
const deleteCategory = async (req, res, next) => {
  try {
    const assetCount = await Asset.countDocuments({ categoryId: req.params.id });
    if (assetCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. There are ${assetCount} assets associated with it.`,
      });
    }

    await AssetCategory.findByIdAndDelete(req.params.id);

    await logAudit({
      userId: req.user._id,
      action: 'CATEGORY_DELETED',
      entityType: 'AssetCategory',
      entityId: req.params.id,
    });

    return res.json({
      success: true,
      message: 'Asset Category deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
