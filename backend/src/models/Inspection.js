const mongoose = require('mongoose');

const INSPECTION_TYPES = [
  'Routine',
  'Safety',
  'Structural',
  'Emergency',
  'Annual',
  'Post-Maintenance',
];

const inspectionSchema = new mongoose.Schema(
  {
    inspectionId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: true,
    },
    inspectorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    inspectionDate: {
      type: Date,
      default: Date.now,
    },
    inspectionType: {
      type: String,
      enum: INSPECTION_TYPES,
      default: 'Routine',
    },
    conditionScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    conditionRating: {
      type: String,
      enum: ['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL'],
      required: true,
    },
    structuralCondition: {
      score: { type: Number, min: 0, max: 100, default: 80 },
      notes: { type: String, default: '' },
    },
    operationalCondition: {
      score: { type: Number, min: 0, max: 100, default: 85 },
      notes: { type: String, default: '' },
    },
    safetyCondition: {
      score: { type: Number, min: 0, max: 100, default: 90 },
      notes: { type: String, default: '' },
    },
    observations: {
      type: String,
      required: true,
    },
    recommendations: {
      type: String,
      default: '',
    },
    photos: {
      type: [String],
      default: [],
    },
    documents: {
      type: [String],
      default: [],
    },
    nextInspectionDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

inspectionSchema.index({ assetId: 1 });
inspectionSchema.index({ inspectionDate: -1 });

module.exports = mongoose.model('Inspection', inspectionSchema);
module.exports.INSPECTION_TYPES = INSPECTION_TYPES;
