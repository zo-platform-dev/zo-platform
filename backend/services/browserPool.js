const StealthBrowser = require('./scrapers/stealthBrowser');
const logger = require('../utils/logger');

class BrowserPool {
  constructor(options = {}) {
    this.maxBrowsers = options.maxBrowsers || 3;
    this.maxPagesPerBrowser = options.maxPagesPerBrowser || 10;
    this.browserIdleTimeout = options.browserIdleTimeout || 60000;
    this.browsers = new Map();
    this.availableBrowsers = [];
    this.pageCount = new Map();
    this.lastUsed = new Map();
    this.stealthBrowser = new StealthBrowser(options.browserOptions || {});
  }

  async getBrowser() {
    // Check for available browser
    if (this.availableBrowsers.length > 0) {
      const browserId = this.availableBrowsers.pop();
      const browser = this.browsers.get(browserId);

      if (browser && browser.isConnected()) {
        this.lastUsed.set(browserId, Date.now());
        logger.debug(`Reusing browser ${browserId}`);
        return { browser, id: browserId };
      } else {
        this.browsers.delete(browserId);
        this.pageCount.delete(browserId);
        this.lastUsed.delete(browserId);
      }
    }

    // Create new browser if under limit
    if (this.browsers.size < this.maxBrowsers) {
      return await this.createBrowser();
    }

    // Wait for available browser
    return await this.waitForBrowser();
  }

  async createBrowser() {
    const browser = await this.stealthBrowser.launch();
    const browserId = this.generateBrowserId();

    this.browsers.set(browserId, browser);
    this.pageCount.set(browserId, 0);
    this.lastUsed.set(browserId, Date.now());

    logger.info(`Created browser ${browserId}. Total: ${this.browsers.size}`);

    return { browser, id: browserId };
  }

  async releaseBrowser(browserId, shouldRecycle = false) {
    const browser = this.browsers.get(browserId);
    if (!browser) return;

    const pages = this.pageCount.get(browserId) || 0;

    if (shouldRecycle || pages >= this.maxPagesPerBrowser) {
      await this.closeBrowser(browserId);
      logger.info(`Browser ${browserId} recycled after ${pages} pages`);
      return;
    }

    if (!this.availableBrowsers.includes(browserId)) {
      this.availableBrowsers.push(browserId);
      this.lastUsed.set(browserId, Date.now());
      logger.debug(`Browser ${browserId} returned to pool`);
    }
  }

  async newPage(browserId) {
    const browser = this.browsers.get(browserId);
    if (!browser) throw new Error('Browser not found');

    const page = await this.stealthBrowser.newPage(browser);
    const currentCount = this.pageCount.get(browserId) || 0;
    this.pageCount.set(browserId, currentCount + 1);

    return page;
  }

  async closeBrowser(browserId) {
    const browser = this.browsers.get(browserId);
    if (!browser) return;

    try {
      await browser.close();
    } catch (error) {
      logger.error(`Error closing browser ${browserId}:`, error);
    }

    this.browsers.delete(browserId);
    this.pageCount.delete(browserId);
    this.lastUsed.delete(browserId);

    const index = this.availableBrowsers.indexOf(browserId);
    if (index > -1) {
      this.availableBrowsers.splice(index, 1);
    }
  }

  async waitForBrowser(timeout = 30000) {
    const start = Date.now();

    while (Date.now() - start < timeout) {
      if (this.availableBrowsers.length > 0) {
        return await this.getBrowser();
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    throw new Error('Timeout waiting for browser');
  }

  async cleanupIdleBrowsers() {
    const now = Date.now();
    const browsersToClose = [];

    for (const [browserId, lastUsedTime] of this.lastUsed.entries()) {
      if (now - lastUsedTime > this.browserIdleTimeout) {
        browsersToClose.push(browserId);
      }
    }

    for (const browserId of browsersToClose) {
      await this.closeBrowser(browserId);
      logger.info(`Closed idle browser ${browserId}`);
    }
  }

  generateBrowserId() {
    return `browser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getStats() {
    return {
      total: this.browsers.size,
      available: this.availableBrowsers.length,
      busy: this.browsers.size - this.availableBrowsers.length,
      maxBrowsers: this.maxBrowsers
    };
  }

  async closeAll() {
    logger.info('Closing all browsers...');
    const closePromises = Array.from(this.browsers.keys()).map(id =>
      this.closeBrowser(id)
    );
    await Promise.all(closePromises);
    logger.info('All browsers closed');
  }
}

module.exports = BrowserPool;