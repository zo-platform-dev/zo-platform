const logger = require('../utils/logger');

class ErrorRecovery {
  constructor() {
    this.checkpoints = new Map();
  }

  async executeWithRetry(fn, options = {}) {
    const {
      maxRetries = 3,
      initialDelay = 1000,
      maxDelay = 30000,
      backoffMultiplier = 2,
      retryableErrors = [],
      onRetry = null
    } = options;

    let lastError;
    let delay = initialDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // Check if error is permanent
        if (this.isPermanentError(error)) {
          logger.error('Permanent error detected, no retry:', error.message);
          throw error;
        }

        // Check if should retry this error
        if (retryableErrors.length > 0) {
          const shouldRetry = retryableErrors.some(errorType =>
            error.message.includes(errorType) || error.code === errorType
          );
          if (!shouldRetry) {
            throw error;
          }
        }

        // Last attempt?
        if (attempt === maxRetries) {
          logger.error(`Max retries (${maxRetries}) reached`);
          throw error;
        }

        // Calculate backoff delay
        const jitter = Math.random() * 0.3 * delay; // 30% jitter
        const waitTime = Math.min(delay + jitter, maxDelay);

        logger.warn(`Attempt ${attempt + 1} failed: ${error.message}. Retrying in ${Math.round(waitTime)}ms...`);

        if (onRetry) {
          await onRetry(attempt + 1, error);
        }

        await this.sleep(waitTime);
        delay *= backoffMultiplier;
      }
    }

    throw lastError;
  }

  isPermanentError(error) {
    const permanentPatterns = [
      'ENOTFOUND', // DNS lookup failed
      'ECONNREFUSED', // Connection refused
      '404', // Not found
      '403', // Forbidden
      '401', // Unauthorized
      'Invalid selector', // Bad selector
      'Navigation failed', // Navigation error
      'Protocol error' // Chrome protocol error
    ];

    return permanentPatterns.some(pattern =>
      error.message.includes(pattern) || error.code === pattern
    );
  }

  createCheckpoint(taskId, data) {
    this.checkpoints.set(taskId, {
      data,
      timestamp: Date.now()
    });
    logger.info(`Checkpoint created for task ${taskId}`);
  }

  getCheckpoint(taskId) {
    const checkpoint = this.checkpoints.get(taskId);
    if (checkpoint) {
      logger.info(`Checkpoint restored for task ${taskId}`);
      return checkpoint.data;
    }
    return null;
  }

  clearCheckpoint(taskId) {
    this.checkpoints.delete(taskId);
    logger.info(`Checkpoint cleared for task ${taskId}`);
  }

  cleanupOldCheckpoints(maxAge = 24 * 60 * 60 * 1000) {
    const now = Date.now();
    let cleaned = 0;

    for (const [taskId, checkpoint] of this.checkpoints.entries()) {
      if (now - checkpoint.timestamp > maxAge) {
        this.checkpoints.delete(taskId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`Cleaned up ${cleaned} old checkpoints`);
    }
  }

  categorizeError(error) {
    if (error.message.includes('timeout') || error.code === 'ETIMEDOUT') {
      return 'TIMEOUT';
    }
    if (error.message.includes('ECONNRESET') || error.message.includes('socket hang up')) {
      return 'NETWORK';
    }
    if (error.message.includes('selector') || error.message.includes('element')) {
      return 'PARSING';
    }
    if (error.message.includes('403') || error.message.includes('blocked')) {
      return 'BLOCKED';
    }
    if (error.message.includes('404')) {
      return 'NOT_FOUND';
    }
    return 'UNKNOWN';
  }

  getRetryStrategy(errorCategory) {
    const strategies = {
      TIMEOUT: {
        maxRetries: 3,
        initialDelay: 2000,
        backoffMultiplier: 2
      },
      NETWORK: {
        maxRetries: 5,
        initialDelay: 1000,
        backoffMultiplier: 2
      },
      PARSING: {
        maxRetries: 1,
        initialDelay: 1000,
        backoffMultiplier: 1
      },
      BLOCKED: {
        maxRetries: 3,
        initialDelay: 5000,
        backoffMultiplier: 3
      },
      NOT_FOUND: {
        maxRetries: 0
      },
      UNKNOWN: {
        maxRetries: 2,
        initialDelay: 1000,
        backoffMultiplier: 2
      }
    };

    return strategies[errorCategory] || strategies.UNKNOWN;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new ErrorRecovery();