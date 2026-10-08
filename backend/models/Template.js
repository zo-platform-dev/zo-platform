const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['social-media', 'e-commerce', 'news', 'jobs', 'real-estate', 'travel', 'finance', 'general'],
    default: 'general'
  },
  type: {
    type: String,
    enum: ['scrape', 'api', 'automation'],
    required: true
  },
  method: {
    type: String,
    enum: ['puppeteer', 'playwright', 'cheerio', 'axios'],
    default: 'cheerio'
  },
  config: {
    url: String,
    selectors: mongoose.Schema.Types.Mixed,
    pagination: {
      enabled: { type: Boolean, default: false },
      type: { type: String, enum: ['page', 'scroll', 'button'] },
      maxPages: { type: Number, default: 10 },
      selector: String
    },
    proxy: {
      required: { type: Boolean, default: false },
      recommended: String
    },
    headers: mongoose.Schema.Types.Mixed,
    userAgent: String,
    waitFor: String,
    timeout: { type: Number, default: 30000 }
  },
  dataFields: [{
    name: { type: String, required: true },
    selector: String,
    type: { type: String, enum: ['text', 'attribute', 'html', 'json', 'number', 'boolean'] },
    attribute: String,
    transform: String,
    required: { type: Boolean, default: false }
  }],
  transformations: [{
    name: String,
    type: { type: String, enum: ['map', 'filter', 'rename', 'custom'] },
    config: mongoose.Schema.Types.Mixed
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  isBuiltin: {
    type: Boolean,
    default: false
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  usage: {
    timesUsed: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    ratings: { type: Number, default: 0 }
  },
  version: {
    type: String,
    default: '1.0.0'
  },
  requirements: {
    nodeVersion: String,
    dependencies: [String]
  }
}, {
  timestamps: true
});

templateSchema.index({ category: 1, type: 1 });
templateSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Template', templateSchema);