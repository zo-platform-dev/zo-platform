const cron = require('node-cron');
const Task = require('../models/Task');
const { addTask } = require('../queue/queue');
const logger = require('../utils/logger');

const cronJobs = [];

function start() {
  logger.info('Starting cron jobs...');

  const scheduleTask = cron.schedule('*/5 * * * *', async () => {
    try {
      const tasks = await Task.find({
        'schedule.enabled': true,
        'schedule.cron': { $exists: true }
      });

      for (const task of tasks) {
        const nextRun = cron.validate(task.schedule.cron);
        if (nextRun) {
          const jobSchedule = cron.schedule(task.schedule.cron, async () => {
            logger.info(`Running scheduled task: ${task.name}`);
            await addTask({
              taskId: task._id.toString(),
              userId: task.user.toString(),
              priority: task.priority
            });

            task.status = 'queued';
            await task.save();
          }, {
            timezone: task.schedule.timezone || 'UTC'
          });

          cronJobs.push(jobSchedule);
        }
      }
    } catch (error) {
      logger.error('Error scheduling tasks:', error);
    }
  });

  const autoRefreshTask = cron.schedule(process.env.AUTO_REFRESH_CRON || '0 0 * * *', async () => {
    if (!process.env.AUTO_REFRESH_ENABLED || process.env.AUTO_REFRESH_ENABLED === 'false') {
      return;
    }

    try {
      logger.info('Starting auto-refresh of tasks...');

      const tasks = await Task.find({
        'autoRefresh.enabled': true,
        status: 'completed'
      });

      for (const task of tasks) {
        logger.info(`Auto-refreshing task: ${task.name}`);

        await addTask({
          taskId: task._id.toString(),
          userId: task.user.toString(),
          priority: 'normal'
        });

        task.status = 'queued';
        task.autoRefresh.lastRefresh = new Date();
        task.autoRefresh.nextRefresh = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await task.save();
      }

      logger.info('Auto-refresh completed');
    } catch (error) {
      logger.error('Error during auto-refresh:', error);
    }
  });

  logger.info('Cron jobs initialized');
}

function stop() {
  cronJobs.forEach(job => job.stop());
  logger.info('All cron jobs stopped');
}

module.exports = { start, stop };