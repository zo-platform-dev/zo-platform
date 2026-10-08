const logger = require('../utils/logger');
const os = require('os');

class MonitoringService {
  constructor() {
    this.metrics = {
      tasks: new Map(),
      system: {
        startTime: Date.now(),
        requestsProcessed: 0,
        errors: 0
      }
    };
  }

  startTaskMonitoring(taskId) {
    this.metrics.tasks.set(taskId, {
      startTime: Date.now(),
      pagesScraped: 0,
      errors: 0,
      status: 'running'
    });
    logger.debug(`Started monitoring task: ${taskId}`);
  }

  updateTaskProgress(taskId, data) {
    const task = this.metrics.tasks.get(taskId);
    if (task) {
      Object.assign(task, data);
    }
  }

  getTaskStats(taskId) {
    return this.metrics.tasks.get(taskId);
  }

  getSystemStats() {
    return {
      uptime: Date.now() - this.metrics.system.startTime,
      memory: process.memoryUsage(),
      cpu: os.loadavg(),
      activeTasks: Array.from(this.metrics.tasks.values())
        .filter(t => t.status === 'running').length,
      totalRequests: this.metrics.system.requestsProcessed,
      totalErrors: this.metrics.system.errors
    };
  }

  incrementRequests() {
    this.metrics.system.requestsProcessed++;
  }

  incrementErrors() {
    this.metrics.system.errors++;
  }

  completeTaskMonitoring(taskId, stats = {}) {
    const task = this.metrics.tasks.get(taskId);
    if (task) {
      task.status = 'completed';
      task.endTime = Date.now();
      task.duration = task.endTime - task.startTime;
      Object.assign(task, stats);
      logger.debug(`Completed monitoring task: ${taskId}`);
    }
  }

  failTaskMonitoring(taskId, error) {
    const task = this.metrics.tasks.get(taskId);
    if (task) {
      task.status = 'failed';
      task.endTime = Date.now();
      task.error = error.message;
      task.errors = (task.errors || 0) + 1;
      logger.debug(`Failed monitoring task: ${taskId}`);
    }
  }

  clearTask(taskId) {
    this.metrics.tasks.delete(taskId);
  }

  clearOldTasks(maxAge = 24 * 60 * 60 * 1000) {
    const now = Date.now();
    let cleaned = 0;

    for (const [taskId, task] of this.metrics.tasks.entries()) {
      if (task.endTime && (now - task.endTime > maxAge)) {
        this.metrics.tasks.delete(taskId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`Cleared ${cleaned} old task monitoring records`);
    }
  }
}

module.exports = new MonitoringService();