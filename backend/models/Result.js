const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  version: {
    type: Number,
    default: 1
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  metadata: {
    url: String,
    totalItems: { type: Number, default: 0 },
    pageCount: { type: Number, default: 1 },
    method: String,
    userAgent: String,
    duration: Number,
    timestamp: { type: Date, default: Date.now }
  },
  validation: {
    isValid: { type: Boolean, default: true },
    errors: [{
      field: String,
      message: String,
      severity: { type: String, enum: ['warning', 'error'], default: 'warning' }
    }],
    validatedAt: Date
  },
  exportHistory: [{
    format: { type: String, enum: ['json', 'csv', 'xml', 'excel'] },
    exportedAt: { type: Date, default: Date.now },
    recordCount: Number,
    filePath: String
  }],
  comparison: {
    previousVersion: { type: Number },
    changes: {
      added: { type: Number, default: 0 },
      removed: { type: Number, default: 0 },
      modified: { type: Number, default: 0 }
    }
  }
}, {
  timestamps: true
});

resultSchema.index({ task: 1, version: -1 });
resultSchema.index({ createdAt: -1 });

resultSchema.statics.getLatest = async function(taskId) {
  return this.findOne({ task: taskId }).sort({ version: -1 });
};

resultSchema.statics.compareWithPrevious = async function(taskId, newData) {
  const latest = await this.getLatest(taskId);
  if (!latest) return { isFirst: true };

  const oldItems = Array.isArray(latest.data) ? latest.data : [latest.data];
  const newItems = Array.isArray(newData) ? newData : [newData];

  return {
    isFirst: false,
    changes: {
      added: newItems.length - oldItems.length,
      removed: Math.max(0, oldItems.length - newItems.length),
      modified: Math.min(oldItems.length, newItems.length)
    }
  };
};

module.exports = mongoose.model('Result', resultSchema);