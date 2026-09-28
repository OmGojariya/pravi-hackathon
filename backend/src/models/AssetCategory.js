const mongoose = require('mongoose');

const assetCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    subcategories: {
      type: [String],
      default: [],
    },
    icon: {
      type: String,
      default: 'Layers',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes handled by unique: true

module.exports = mongoose.model('AssetCategory', assetCategorySchema);
