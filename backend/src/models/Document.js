const mongoose = require('mongoose');

const DOCUMENT_TYPES = [
  'Ownership Document',
  'Construction Document',
  'Contract',
  'Purchase Order',
  'Inspection Report',
  'Maintenance Report',
  'Warranty',
  'Certificate',
  'Drawing',
  'Image',
  'Other',
];

const documentSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      default: 'application/pdf',
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
    documentType: {
      type: String,
      enum: DOCUMENT_TYPES,
      default: 'Other',
    },
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      default: null,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

documentSchema.index({ assetId: 1 });
documentSchema.index({ projectId: 1 });
documentSchema.index({ documentType: 1 });

module.exports = mongoose.model('Document', documentSchema);
module.exports.DOCUMENT_TYPES = DOCUMENT_TYPES;
