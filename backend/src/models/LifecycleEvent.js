const mongoose = require('mongoose');

const lifecycleEventSchema = new mongoose.Schema(
  {
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: true,
    },
    previousStatus: {
      type: String,
      required: true,
    },
    newStatus: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    remarks: {
      type: String,
      default: '',
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    documents: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

lifecycleEventSchema.index({ assetId: 1, changedAt: -1 });

module.exports = mongoose.model('LifecycleEvent', lifecycleEventSchema);
