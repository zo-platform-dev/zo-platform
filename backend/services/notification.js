const nodemailer = require('nodemailer');
const axios = require('axios');
const Webhook = require('../models/Webhook');
const logger = require('../utils/logger');

class NotificationService {
  constructor() {
    this.transporter = null;
    this.initializeEmail();
  }

  initializeEmail() {
    if (process.env.SMTP_HOST) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      });
    }
  }

  async sendEmail(to, subject, html) {
    if (!this.transporter) {
      logger.warn('Email not configured, skipping email notification');
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@zo-platform.com',
        to,
        subject,
        html
      });
      logger.info(`Email sent to ${to}`);
      return true;
    } catch (error) {
      logger.error('Failed to send email:', error);
      return false;
    }
  }

  async notifyTaskComplete(task, result) {
    const user = await task.populate('user');

    if (user.user?.preferences?.notifications?.email && user.user?.email) {
      await this.sendEmail(
        user.user.email,
        `Task Completed: ${task.name}`,
        `
          <h2>Task Completed Successfully</h2>
          <p><strong>Task:</strong> ${task.name}</p>
          <p><strong>Items scraped:</strong> ${result.metadata.totalItems}</p>
          <p><strong>Duration:</strong> ${result.metadata.duration}ms</p>
          <p><a href="${process.env.FRONTEND_URL}/tasks/${task._id}">View Results</a></p>
        `
      );
    }

    const webhooks = await Webhook.find({
      user: task.user,
      events: 'task.completed',
      isActive: true
    });

    for (const webhook of webhooks) {
      await webhook.trigger('task.completed', {
        taskId: task._id,
        name: task.name,
        status: 'completed',
        itemCount: result.metadata.totalItems,
        duration: result.metadata.duration,
        timestamp: new Date().toISOString()
      });
    }
  }

  async notifyTaskFailed(task, error) {
    const user = await task.populate('user');

    if (user.user?.preferences?.notifications?.email && user.user?.email) {
      await this.sendEmail(
        user.user.email,
        `Task Failed: ${task.name}`,
        `
          <h2>Task Failed</h2>
          <p><strong>Task:</strong> ${task.name}</p>
          <p><strong>Error:</strong> ${error.message}</p>
          <p><strong>Attempts:</strong> ${task.retry.attempts}/${task.retry.maxAttempts}</p>
          <p><a href="${process.env.FRONTEND_URL}/tasks/${task._id}">View Details</a></p>
        `
      );
    }

    const webhooks = await Webhook.find({
      user: task.user,
      events: 'task.failed',
      isActive: true
    });

    for (const webhook of webhooks) {
      await webhook.trigger('task.failed', {
        taskId: task._id,
        name: task.name,
        status: 'failed',
        error: error.message,
        attempts: task.retry.attempts,
        timestamp: new Date().toISOString()
      });
    }
  }

  async notifyDataRefreshed(task, changes) {
    const webhooks = await Webhook.find({
      user: task.user,
      events: 'data.refreshed',
      isActive: true
    });

    for (const webhook of webhooks) {
      await webhook.trigger('data.refreshed', {
        taskId: task._id,
        name: task.name,
        changes,
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = new NotificationService();