const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  type: {
    type: String,
    enum: ['scrape', 'api', 'automation', 'custom'],
    required: true
  },
  method: {
    type: String,
    enum: ['puppeteer', 'playwright', 'cheerio', 'axios'],
    default: 'cheerio'
  },
  config: {
    url: String,
    urls: [String],
    selectors: mongoose.Schema.Types.Mixed,
    customCode: String,
    proxy: {
      enabled: { type: Boolean, default: false },
      host: String,
      port: Number,
      username: String,
      password: String,
      rotation: { type: Boolean, default: false },
      list: [String]
    },
    headers: mongoose.Schema.Types.Mixed,
    userAgent: String,
    waitFor: String,
    timeout: { type: Number, default: 30000 },
    browserPool: {
      maxBrowsers: { type: Number, default: 3 },
      maxPagesPerBrowser: { type: Number, default: 10 },
      reuseEnabled: { type: Boolean, default: true }
    },
    retry: {
      maxRetries: { type: Number, default: 3 },
      strategy: { type: String, default: 'exponential' }
    }
  },
  schedule: {
    enabled: { type: Boolean, default: false },
    cron: String,
    timezone: { type: String, default: 'UTC' }
  },
  status: {
    type: String,
    enum: ['pending', 'queued', 'running', 'completed', 'failed', 'cancelled'],
    default: 'pending',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  retry: {
    enabled: { type: Boolean, default: true },
    maxAttempts: { type: Number, default: 3 },
    attempts: { type: Number, default: 0 },
    lastAttemptAt: Date
  },
  progress: {
    current: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    message: String
  },
  result: {
    data: mongoose.Schema.Types.Mixed,
    itemCount: { type: Number, default: 0 },
    error: String,
    startedAt: Date,
    completedAt: Date,
    duration: Number
  },
  stats: {
    startTime: Date,
    endTime: Date,
    pagesScraped: { type: Number, default: 0 },
    errors: { type: Number, default: 0 },
    avgResponseTime: { type: Number, default: 0 }
  },
  autoRefresh: {
    enabled: { type: Boolean, default: false },
    interval: { type: String, enum: ['hourly', 'daily', 'weekly'], default: 'daily' },
    lastRefresh: Date,
    nextRefresh: Date
  },
  metadata: {
    tags: [String],
    category: String,
    template: { type: mongoose.Schema.Types.ObjectId, ref: 'Template' }
  },
  notifications: {
    onSuccess: { type: Boolean, default: false },
    onFailure: { type: Boolean, default: true },
    webhookUrl: String
  }
}, {
  timestamps: true
});

taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ createdAt: -1 });
taskSchema.index({ 'schedule.cron': 1, 'schedule.enabled': 1 });

taskSchema.methods.canRetry = function() {
  return this.retry.enabled && this.retry.attempts < this.retry.maxAttempts;
};

taskSchema.methods.markAttempt = function() {
  this.retry.attempts += 1;
  this.retry.lastAttemptAt = new Date();
};

module.exports = mongoose.model('Task', taskSchema);