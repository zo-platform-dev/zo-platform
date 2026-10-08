const Queue = require('bull');
const Redis = require('ioredis');
const logger = require('../utils/logger');

let taskQueue = null;
let redisClient = null;

const QUEUE_NAME = 'zo-tasks';

async function connectQueue() {
  try {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: null
    });

    taskQueue = new Queue(QUEUE_NAME, {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD
      },
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      }
    });

    taskQueue.on('error', (error) => {
      logger.error('Queue error:', error);
    });

    taskQueue.on('failed', (job, err) => {
      logger.error(`Job ${job.id} failed:`, err);
    });

    taskQueue.on('stalled', (job) => {
      logger.warn(`Job ${job.id} stalled`);
    });

    logger.info('Task queue connected successfully');
    return taskQueue;
  } catch (error) {
    logger.error('Failed to connect to queue:', error);
    throw error;
  }
}

function getQueue() {
  if (!taskQueue) {
    throw new Error('Queue not initialized. Call connectQueue first.');
  }
  return taskQueue;
}

async function addTask(taskData) {
  const queue = getQueue();

  const job = await queue.add('scrape-task', taskData, {
    priority: getPriority(taskData.priority),
    delay: taskData.delay || 0,
    jobId: taskData.taskId
  });

  logger.info(`Task ${job.id} added to queue`);
  return job;
}

function getPriority(priority) {
  const priorities = {
    'urgent': 1,
    'high': 2,
    'normal': 3,
    'low': 4
  };
  return priorities[priority] || 3;
}

async function getJobStatus(jobId) {
  const queue = getQueue();
  const job = await queue.getJob(jobId);

  if (!job) {
    return null;
  }

  const state = await job.getState();

  return {
    id: job.id,
    state,
    progress: job.progress(),
    returnValue: job.returnvalue,
    failedReason: job.failedReason,
    timestamp: job.timestamp,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn
  };
}

async function cancelJob(jobId) {
  const queue = getQueue();
  const job = await queue.getJob(jobId);

  if (job) {
    await job.remove();
    logger.info(`Job ${jobId} cancelled`);
    return true;
  }

  return false;
}

async function getQueueStats() {
  const queue = getQueue();

  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount()
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed
  };
}

module.exports = {
  connectQueue,
  getQueue,
  addTask,
  getJobStatus,
  cancelJob,
  getQueueStats
};