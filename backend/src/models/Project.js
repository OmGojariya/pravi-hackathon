const mongoose = require('mongoose');

const PROJECT_STATUSES = [
  'PLANNED',
  'APPROVED',
  'IN_PROGRESS',
  'DELAYED',
  'COMPLETED',
  'CANCELLED',
];

const projectSchema = new mongoose.Schema(
  {
    projectId: {
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
    type: {
      type: String,
      default: 'Infrastructure Expansion',
    },
    description: {
      type: String,
      default: '',
    },
    contractor: {
      type: String,
      default: '',
    },
    projectManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    startDate: {
      type: Date,
      default: null,
    },
    expectedCompletion: {
      type: Date,
      default: null,
    },
    actualCompletion: {
      type: Date,
      default: null,
    },
    budget: {
      type: Number,
      default: 0,
    },
    actualCost: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: PROJECT_STATUSES,
      default: 'PLANNED',
    },
  },
  {
    timestamps: true,
  }
);

projectSchema.index({ status: 1 });

module.exports = mongoose.model('Project', projectSchema);
module.exports.PROJECT_STATUSES = PROJECT_STATUSES;
