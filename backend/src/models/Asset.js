const mongoose = require('mongoose');

const LIFECYCLE_STATUSES = [
  'PLANNED',
  'APPROVED',
  'PROCUREMENT',
  'UNDER_CONSTRUCTION',
  'COMMISSIONED',
  'OPERATIONAL',
  'UNDER_INSPECTION',
  'UNDER_MAINTENANCE',
  'REHABILITATION',
  'DECOMMISSIONED',
  'DISPOSED',
];

const CONDITION_RATINGS = ['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL'];
const CRITICALITY_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const assetSchema = new mongoose.Schema(
  {
    assetCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AssetCategory',
      required: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    ownerOrganization: {
      type: String,
      default: 'State Infrastructure Development Corporation',
      trim: true,
    },
    department: {
      type: String,
      default: 'Public Works Department',
      trim: true,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    responsibleOfficer: {
      type: String,
      default: '',
    },
    location: {
      address: { type: String, default: '' },
      city: { type: String, default: '' },
      district: { type: String, default: 'Ahmedabad' },
      state: { type: String, default: 'Gujarat' },
      pincode: { type: String, default: '' },
      latitude: { type: Number, default: 23.0225 },
      longitude: { type: Number, default: 72.5714 },
    },
    physicalDetails: {
      size: { type: String, default: '' },
      length: { type: String, default: '' },
      width: { type: String, default: '' },
      height: { type: String, default: '' },
      capacity: { type: String, default: '' },
      unit: { type: String, default: '' },
      material: { type: String, default: 'Reinforced Concrete / Steel' },
      manufacturer: { type: String, default: '' },
      model: { type: String, default: '' },
      serialNumber: { type: String, default: '' },
    },
    lifecycle: {
      status: {
        type: String,
        enum: LIFECYCLE_STATUSES,
        default: 'PLANNED',
      },
      plannedDate: { type: Date, default: Date.now },
      constructionStartDate: { type: Date, default: null },
      commissioningDate: { type: Date, default: null },
      expectedEndOfLife: { type: Date, default: null },
      usefulLife: { type: Number, default: 30 }, // In years
    },
    condition: {
      score: { type: Number, min: 0, max: 100, default: 85 },
      rating: {
        type: String,
        enum: CONDITION_RATINGS,
        default: 'GOOD',
      },
      lastInspectionDate: { type: Date, default: null },
      nextInspectionDate: { type: Date, default: null },
    },
    financial: {
      acquisitionCost: { type: Number, default: 0 },
      constructionCost: { type: Number, default: 0 },
      installationCost: { type: Number, default: 0 },
      currentValue: { type: Number, default: 0 },
      maintenanceCost: { type: Number, default: 0 },
      repairCost: { type: Number, default: 0 },
      rehabilitationCost: { type: Number, default: 0 },
      disposalCost: { type: Number, default: 0 },
      totalLifecycleCost: { type: Number, default: 0 },
    },
    criticality: {
      type: String,
      enum: CRITICALITY_LEVELS,
      default: 'MEDIUM',
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 20,
    },
    riskLevel: {
      type: String,
      enum: CRITICALITY_LEVELS,
      default: 'LOW',
    },
    qrCode: {
      type: String,
      default: '',
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for query performance
assetSchema.index({ name: 'text', description: 'text' });
assetSchema.index({ categoryId: 1 });
assetSchema.index({ 'location.district': 1 });
assetSchema.index({ 'lifecycle.status': 1 });
assetSchema.index({ 'condition.rating': 1 });
assetSchema.index({ criticality: 1 });
assetSchema.index({ riskScore: -1 });

module.exports = mongoose.model('Asset', assetSchema);
module.exports.LIFECYCLE_STATUSES = LIFECYCLE_STATUSES;
module.exports.CONDITION_RATINGS = CONDITION_RATINGS;
module.exports.CRITICALITY_LEVELS = CRITICALITY_LEVELS;
