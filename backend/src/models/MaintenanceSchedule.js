const mongoose = require('mongoose');

const maintenanceScheduleSchema = new mongoose.Schema(
  {
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    frequencyDays: {
      type: Number,
      required: true,
      default: 30, // e.g. every 30 days
    },
    lastPerformedDate: {
      type: Date,
      default: null,
    },
    nextDueDate: {
      type: Date,
      required: true,
    },
    assignedTeam: {
      type: String,
      default: 'Preventive Squad A',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'PAUSED', 'DISCONTINUED'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

maintenanceScheduleSchema.index({ assetId: 1 });
maintenanceScheduleSchema.index({ nextDueDate: 1 });
maintenanceScheduleSchema.index({ status: 1 });

module.exports = mongoose.model('MaintenanceSchedule', maintenanceScheduleSchema);
