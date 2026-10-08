const { getQueue } = require('./queue');
const Task = require('../models/Task');
const Result = require('../models/Result');
const scraper = require('../services/scraper');
const notificationService = require('../services/notification');
const monitoringService = require('../services/monitoringService');
const errorRecovery = require('../services/errorRecovery');
const logger = require('../utils/logger');

async function processTask(job) {
  const { taskId, userId } = job.data;

  const task = await Task.findById(taskId);
  if (!task) {
    throw new Error(`Task ${taskId} not found`);
  }

  try {
    task.status = 'running';
    task.result.startedAt = new Date();
    await task.save();

    // Start task monitoring
    monitoringService.startTaskMonitoring(taskId);

    job.progress(10);

    let data;
    const config = task.config;

    if (config.customCode) {
      data = await scraper.executeCustomCode(config.customCode, {
        url: config.url,
        selectors: config.selectors
      });
    } else if (config.urls && config.urls.length > 1) {
      data = await scraper.scrapeList({
        urls: config.urls,
        method: task.method,
        selectors: config.selectors,
        concurrency: 3
      });
    } else {
      const scrapeConfig = {
        url: config.url,
        selectors: config.selectors,
        waitFor: config.waitFor,
        timeout: config.timeout,
        userAgent: config.userAgent,
        proxy: config.proxy,
        headers: config.headers
      };

      // Wrap scraping with error recovery
      data = await errorRecovery.executeWithRetry(async () => {
        switch (task.method) {
          case 'puppeteer':
            return await scraper.scrapeWithPuppeteer(scrapeConfig);
          case 'axios':
            return await scraper.scrapeWithAxios(scrapeConfig);
          case 'cheerio':
          default:
            return await scraper.scrapeWithCheerio(scrapeConfig);
        }
      }, {
        maxRetries: task.config.retry?.maxRetries || 3,
        initialDelay: 1000,
        onRetry: async (attempt, err) => {
          logger.warn(`Task ${taskId} retry ${attempt}: ${err.message}`);
          monitoringService.updateTaskProgress(taskId, {
            retries: attempt,
            lastError: err.message
          });
        }
      });
    }

    job.progress(80);

    const itemCount = Array.isArray(data) ? data.length : 1;
    const result = await Result.create({
      task: taskId,
      user: userId,
      data,
      metadata: {
        url: config.url,
        totalItems: itemCount,
        method: task.method,
        duration: Date.now() - task.result.startedAt
      }
    });

    task.status = 'completed';
    task.result.data = data;
    task.result.itemCount = itemCount;
    task.result.completedAt = new Date();
    task.result.duration = Date.now() - task.result.startedAt;
    task.retry.attempts = 0;

    // Ensure stats object exists and update
    if (!task.stats) {
      task.stats = {};
    }
    task.stats.pagesScraped = itemCount;
    task.stats.avgResponseTime = Math.round(task.result.duration / itemCount);

    await task.save();

    // Complete task monitoring
    monitoringService.completeTaskMonitoring(taskId, {
      pagesScraped: itemCount,
      status: 'completed'
    });

    job.progress(100);

    if (task.notifications.onSuccess) {
      await notificationService.notifyTaskComplete(task, result);
    }

    logger.info(`Task ${taskId} completed successfully`);

    return { success: true, itemCount, resultId: result._id };

  } catch (error) {
    logger.error(`Task ${taskId} failed:`, error);

    // Fail task monitoring
    monitoringService.failTaskMonitoring(taskId, error);

    task.status = 'failed';
    task.result.error = error.message;
    task.result.completedAt = new Date();
    task.markAttempt();

    await task.save();

    if (task.canRetry()) {
      logger.info(`Task ${taskId} will be retried (attempt ${task.retry.attempts}/${task.retry.maxAttempts})`);
      task.status = 'queued';
      await task.save();

      const queue = getQueue();
      await queue.add('scrape-task', { taskId, userId }, {
        delay: 60000 * task.retry.attempts,
        priority: task.priority === 'urgent' ? 1 : 3
      });
    } else if (task.notifications.onFailure) {
      await notificationService.notifyTaskFailed(task, error);
    }

    throw error;
  }
}

function startProcessor() {
  const queue = getQueue();

  queue.process('scrape-task', processTask);

  logger.info('Task processor started');
}

module.exports = { startProcessor, processTask };