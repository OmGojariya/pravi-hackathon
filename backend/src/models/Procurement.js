const mongoose = require('mongoose');

const PROCUREMENT_STATUSES = [
  'PLANNED',
  'ORDERED',
  'DELIVERED',
  'INSTALLED',
  'WARRANTY_ACTIVE',
  'WARRANTY_EXPIRED',
];

const procurementSchema = new mongoose.Schema(
  {
    procurementId: {
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
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    purchaseOrder: {
      type: String,
      required: true,
      trim: true,
    },
    contractNumber: {
      type: String,
      default: '',
      trim: true,
    },
    procurementDate: {
      type: Date,
      default: Date.now,
    },
    contractStart: {
      type: Date,
      default: null,
    },
    contractEnd: {
      type: Date,
      default: null,
    },
    purchaseCost: {
      type: Number,
      default: 0,
    },
    warrantyPeriod: {
      type: Number, // in months
      default: 24,
    },
    warrantyExpiry: {
      type: Date,
      default: null,
    },
    procurementStatus: {
      type: String,
      enum: PROCUREMENT_STATUSES,
      default: 'WARRANTY_ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

procurementSchema.index({ assetId: 1 });
procurementSchema.index({ vendorId: 1 });
procurementSchema.index({ warrantyExpiry: 1 });

module.exports = mongoose.model('Procurement', procurementSchema);
module.exports.PROCUREMENT_STATUSES = PROCUREMENT_STATUSES;
