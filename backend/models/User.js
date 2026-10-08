const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  apiKeys: [{
    key: String,
    name: String,
    createdAt: { type: Date, default: Date.now },
    lastUsed: Date,
    expiresAt: Date,
    isActive: { type: Boolean, default: true }
  }],
  preferences: {
    language: { type: String, enum: ['en', 'ar'], default: 'en' },
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
    notifications: {
      email: { type: Boolean, default: true },
      webhook: { type: Boolean, default: false }
    }
  },
  usage: {
    tasksRun: { type: Number, default: 0 },
    dataScraped: { type: Number, default: 0 },
    lastTaskAt: Date
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);