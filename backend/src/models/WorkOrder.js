const mongoose = require('mongoose');

const WORK_ORDER_STATUSES = [
  'ASSIGNED',
  'IN_PROGRESS',
  'ON_HOLD',
  'COMPLETED',
  'CANCELLED',
];

const workOrderSchema = new mongoose.Schema(
  {
    workOrderId: {
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
    maintenanceRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MaintenanceRequest',
      default: null,
    },
    maintenanceType: {
      type: String,
      default: 'Corrective',
    },
    assignedTeam: {
      type: String,
      default: 'General Maintenance Unit',
    },
    assignedEngineer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    expectedCompletionDate: {
      type: Date,
      default: null,
    },
    actualCompletionDate: {
      type: Date,
      default: null,
    },
    laborCost: {
      type: Number,
      default: 0,
    },
    materialCost: {
      type: Number,
      default: 0,
    },
    otherCost: {
      type: Number,
      default: 0,
    },
    totalCost: {
      type: Number,
      default: 0,
    },
    workDescription: {
      type: String,
      required: true,
    },
    completionNotes: {
      type: String,
      default: '',
    },
    beforeImages: {
      type: [String],
      default: [],
    },
    afterImages: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: WORK_ORDER_STATUSES,
      default: 'ASSIGNED',
    },
  },
  {
    timestamps: true,
  }
);

workOrderSchema.pre('save', function (next) {
  this.totalCost = (this.laborCost || 0) + (this.materialCost || 0) + (this.otherCost || 0);
  next();
});

workOrderSchema.index({ assetId: 1 });
workOrderSchema.index({ status: 1 });

module.exports = mongoose.model('WorkOrder', workOrderSchema);
module.exports.WORK_ORDER_STATUSES = WORK_ORDER_STATUSES;
