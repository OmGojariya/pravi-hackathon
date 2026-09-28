const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const USER_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'ASSET_MANAGER',
  'PROJECT_MANAGER',
  'FIELD_ENGINEER',
  'INSPECTOR',
  'MAINTENANCE_MANAGER',
  'FINANCE_OFFICER',
  'PROCUREMENT_OFFICER',
  'VIEWER',
];

const userSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: 'VIEWER',
    },
    department: {
      type: String,
      trim: true,
      default: 'Infrastructure Works',
    },
    profileImage: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
      default: 'ACTIVE',
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
module.exports.USER_ROLES = USER_ROLES;
