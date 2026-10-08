const EventEmitter = require('events');
const crypto = require('crypto');
const logger = require('../utils/logger');

class RequestQueue extends EventEmitter {
  constructor(options = {}) {
    super();
    this.queue = [];
    this.visited = new Set();
    this.pending = new Map();
    this.failed = new Map();
    this.maxRetries = options.maxRetries || 3;
    this.deduplication = options.deduplication !== false;
  }

  addRequest(url, options = {}) {
    const requestId = this.generateRequestId(url, options);

    // Check if already visited
    if (this.deduplication && this.visited.has(requestId)) {
      logger.debug(`Request already visited: ${url}`);
      return false;
    }

    // Check if already in queue
    if (this.queue.find(r => r.id === requestId)) {
      logger.debug(`Request already in queue: ${url}`);
      return false;
    }

    const request = {
      id: requestId,
      url,
      method: options.method || 'GET',
      headers: options.headers || {},
      data: options.data,
      priority: options.priority || 5,
      retries: 0,
      maxRetries: options.maxRetries || this.maxRetries,
      timestamp: Date.now(),
      metadata: options.metadata || {}
    };

    this.queue.push(request);
    this.sortQueue();

    this.emit('request-added', request);
    logger.debug(`Request added: ${url} (priority: ${request.priority})`);

    return true;
  }

  addRequests(requests) {
    let added = 0;
    requests.forEach(req => {
      if (this.addRequest(req.url, req)) added++;
    });
    return added;
  }

  getNext() {
    if (this.queue.length === 0) return null;

    const request = this.queue.shift();
    this.pending.set(request.id, request);

    this.emit('request-started', request);
    return request;
  }

  markSuccess(requestId) {
    const request = this.pending.get(requestId);
    if (!request) return;

    this.pending.delete(requestId);
    this.visited.add(requestId);

    this.emit('request-completed', request);
    logger.debug(`Request completed: ${request.url}`);
  }

  markFailed(requestId, error) {
    const request = this.pending.get(requestId);
    if (!request) return;

    request.retries++;

    if (request.retries < request.maxRetries) {
      request.priority = Math.max(1, request.priority - 1);
      this.queue.push(request);
      this.sortQueue();
      this.pending.delete(requestId);

      logger.warn(`Request re-queued: ${request.url} (${request.retries}/${request.maxRetries})`);
    } else {
      this.pending.delete(requestId);
      this.failed.set(requestId, { request, error: error.message });

      this.emit('request-failed', request, error);
      logger.error(`Request failed permanently: ${request.url}`);
    }
  }

  sortQueue() {
    this.queue.sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      return a.timestamp - b.timestamp;
    });
  }

  generateRequestId(url, options) {
    const key = `${url}_${options.method || 'GET'}_${JSON.stringify(options.data || {})}`;
    return crypto.createHash('md5').update(key).digest('hex');
  }

  isEmpty() {
    return this.queue.length === 0 && this.pending.size === 0;
  }

  getStats() {
    return {
      queued: this.queue.length,
      pending: this.pending.size,
      visited: this.visited.size,
      failed: this.failed.size,
      total: this.queue.length + this.pending.size + this.visited.size
    };
  }

  clear() {
    this.queue = [];
    this.pending.clear();
    this.visited.clear();
    this.failed.clear();
    this.emit('queue-cleared');
  }
}

module.exports = RequestQueue;