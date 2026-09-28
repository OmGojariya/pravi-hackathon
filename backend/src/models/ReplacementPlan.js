const mongoose = require('mongoose');

const replacementPlanSchema = new mongoose.Schema(
  {
    oldAssetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: true,
    },
    newAssetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      default: null,
    },
    currentCondition: {
      type: String,
      default: 'POOR',
    },
    replacementReason: {
      type: String,
      required: true,
    },
    estimatedReplacementCost: {
      type: Number,
      required: true,
      default: 0,
    },
    proposedYear: {
      type: Number,
      required: true,
      default: () => new Date().getFullYear() + 1,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'HIGH',
    },
    approvalStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'],
      default: 'PENDING',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

replacementPlanSchema.index({ oldAssetId: 1 });
replacementPlanSchema.index({ approvalStatus: 1 });

module.exports = mongoose.model('ReplacementPlan', replacementPlanSchema);
