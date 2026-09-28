const mongoose = require('mongoose');

const MAINTENANCE_STATUSES = [
  'OPEN',
  'ASSIGNED',
  'IN_PROGRESS',
  'ON_HOLD',
  'COMPLETED',
  'CANCELLED',
];

const MAINTENANCE_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const MAINTENANCE_TYPES = [
  'Preventive',
  'Corrective',
  'Emergency',
  'Predictive',
  'Routine',
];

const maintenanceRequestSchema = new mongoose.Schema(
  {
    requestId: {
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
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    requestDate: {
      type: Date,
      default: Date.now,
    },
    maintenanceType: {
      type: String,
      enum: MAINTENANCE_TYPES,
      default: 'Corrective',
    },
    problem: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    priority: {
      type: String,
      enum: MAINTENANCE_PRIORITIES,
      default: 'MEDIUM',
    },
    status: {
      type: String,
      enum: MAINTENANCE_STATUSES,
      default: 'OPEN',
    },
    assignedTeam: {
      type: String,
      default: '',
    },
    assignedEngineer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    estimatedCost: {
      type: Number,
      default: 0,
    },
    actualCost: {
      type: Number,
      default: 0,
    },
    scheduledDate: {
      type: Date,
      default: null,
    },
    completionDate: {
      type: Date,
      default: null,
    },
    remarks: {
      type: String,
      default: '',
    },
    attachments: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

maintenanceRequestSchema.index({ assetId: 1 });
maintenanceRequestSchema.index({ status: 1 });
maintenanceRequestSchema.index({ priority: 1 });

module.exports = mongoose.model('MaintenanceRequest', maintenanceRequestSchema);
module.exports.MAINTENANCE_STATUSES = MAINTENANCE_STATUSES;
module.exports.MAINTENANCE_PRIORITIES = MAINTENANCE_PRIORITIES;
module.exports.MAINTENANCE_TYPES = MAINTENANCE_TYPES;
