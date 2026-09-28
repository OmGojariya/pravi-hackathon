const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    contactPerson: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      default: '',
    },
    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 4.5,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'BLACKLISTED'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

vendorSchema.index({ name: 1 });
vendorSchema.index({ status: 1 });

module.exports = mongoose.model('Vendor', vendorSchema);
