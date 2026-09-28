const mongoose = require('mongoose');

const INCIDENT_STATUSES = ['OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED'];
const INCIDENT_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const incidentSchema = new mongoose.Schema(
  {
    incidentId: {
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
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    time: {
      type: String,
      default: () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
    incidentType: {
      type: String,
      required: true,
      default: 'Equipment Failure',
    },
    severity: {
      type: String,
      enum: INCIDENT_SEVERITIES,
      default: 'MEDIUM',
    },
    description: {
      type: String,
      required: true,
    },
    location: {
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
    immediateAction: {
      type: String,
      default: '',
    },
    rootCause: {
      type: String,
      default: '',
    },
    correctiveAction: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: INCIDENT_STATUSES,
      default: 'OPEN',
    },
  },
  {
    timestamps: true,
  }
);

incidentSchema.index({ assetId: 1 });
incidentSchema.index({ status: 1 });
incidentSchema.index({ severity: 1 });

module.exports = mongoose.model('Incident', incidentSchema);
module.exports.INCIDENT_STATUSES = INCIDENT_STATUSES;
module.exports.INCIDENT_SEVERITIES = INCIDENT_SEVERITIES;
