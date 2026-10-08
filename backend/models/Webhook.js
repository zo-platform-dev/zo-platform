const mongoose = require('mongoose');

const webhookSchema = new mongoose.Schema({
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
  url: {
    type: String,
    required: true
  },
  events: [{
    type: String,
    enum: ['task.started', 'task.completed', 'task.failed', 'task.retry', 'data.refreshed', 'system.error']
  }],
  secret: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  headers: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  lastTriggered: Date,
  lastStatus: {
    type: Number
  },
  triggerCount: {
    type: Number,
    default: 0
  },
  failureCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

webhookSchema.methods.trigger = async function(event, payload) {
  const axios = require('axios');
  const crypto = require('crypto');

  try {
    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    const response = await axios.post(this.url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-ZO-Signature': signature,
        'X-ZO-Event': event,
        ...this.headers
      },
      timeout: 10000
    });

    this.lastTriggered = new Date();
    this.lastStatus = response.status;
    this.triggerCount += 1;
    this.failureCount = 0;
    await this.save();

    return { success: true, status: response.status };
  } catch (error) {
    this.failureCount += 1;
    this.lastStatus = error.response?.status || 0;
    await this.save();

    return { success: false, error: error.message };
  }
};

module.exports = mongoose.model('Webhook', webhookSchema);