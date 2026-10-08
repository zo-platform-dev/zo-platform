const puppeteer = require('puppeteer-extra');
const StealthBrowser = require('./scrapers/stealthBrowser');
const BrowserPool = require('./browserPool');
const ProxyPool = require('./proxyPool');
const RequestQueue = require('./requestQueue');
const ErrorRecovery = require('./errorRecovery');
const DataProcessor = require('./dataProcessor');
const cheerio = require('cheerio');
const axios = require('axios');
const logger = require('../utils/logger');

class ScraperService {
  constructor() {
    this.activeBrowsers = new Map();
    this.browserPool = new BrowserPool({
      maxBrowsers: 3,
      maxPagesPerBrowser: 10
    });
    this.proxyPool = new ProxyPool([]);
    this.requestQueue = new RequestQueue();
  }

  async scrapeWithPuppeteer(config) {
    const {
      url,
      selectors,
      waitFor = 'body',
      timeout = 30000,
      userAgent,
      proxy,
      headers,
      usePool = true,
      useProxy = true
    } = config;

    const startTime = Date.now();
    let browserInstance = null;
    let page = null;
    let browserId = null;
    let usedProxy = null;

    try {
      // Get proxy if enabled
      if (useProxy && proxy && proxy.enabled) {
        const proxyInfo = this.proxyPool.getNextProxy();
        if (proxyInfo) {
          usedProxy = proxyInfo.url;
          logger.debug(`Using proxy: ${usedProxy}`);
        }
      }

      // Use browser pool or create individual browser
      if (usePool) {
        const poolResult = await this.browserPool.getBrowser();
        browserInstance = poolResult.browser;
        browserId = poolResult.id;
        page = await this.browserPool.newPage(browserId);
      } else {
        const stealthOptions = {
          executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
        };

        if (proxy && proxy.enabled) {
          stealthOptions.args = [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-blink-features=AutomationControlled',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            `--proxy-server=${proxy.host}:${proxy.port}`
          ];
        }

        const stealthBrowser = new StealthBrowser(stealthOptions);
        browserInstance = await stealthBrowser.launch();
        page = await stealthBrowser.newPage(browserInstance);
      }

      await page.setUserAgent(userAgent || process.env.DEFAULT_USER_AGENT ||
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

      await page.setDefaultTimeout(timeout);

      if (headers) {
        await page.setExtraHTTPHeaders(headers);
      }

      if (proxy && proxy.enabled && proxy.username && proxy.password) {
        await page.authenticate({
          username: proxy.username,
          password: proxy.password
        });
      }

      await page.goto(url, { waitUntil: 'networkidle2', timeout });

      await page.waitForSelector(waitFor, { timeout });

      let results;
      if (selectors) {
        results = await page.evaluate((sels) => {
          const data = {};
          for (const [key, selector] of Object.entries(sels)) {
            const elements = document.querySelectorAll(selector);
            if (elements.length === 0) {
              data[key] = null;
            } else if (elements.length === 1) {
              data[key] = elements[0].textContent.trim();
            } else {
              data[key] = Array.from(elements).map(el => el.textContent.trim());
            }
          }
          return data;
        }, selectors);

        // Apply data cleaning
        results = DataProcessor.cleanData(results);
      } else {
        const content = await page.content();
        results = { html: content };
      }

      // Record proxy success
      if (usedProxy) {
        this.proxyPool.recordSuccess(usedProxy, Date.now() - startTime);
      }

      return results;

    } catch (error) {
      // Record proxy failure
      if (usedProxy) {
        this.proxyPool.recordFailure(usedProxy, error);
      }

      logger.error('Puppeteer scraping error:', error);
      throw error;
    } finally {
      // Release browser back to pool or close
      if (browserId && usePool) {
        await this.browserPool.releaseBrowser(browserId);
      } else if (browserInstance) {
        await browserInstance.close();
      }
    }
  }

  async scrapeWithCheerio(config) {
    const {
      url,
      selectors,
      headers,
      timeout = 30000
    } = config;

    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': process.env.DEFAULT_USER_AGENT ||
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ...headers
        },
        timeout
      });

      const $ = cheerio.load(response.data);

      if (selectors) {
        const results = {};
        for (const [key, selector] of Object.entries(selectors)) {
          const elements = $(selector);
          if (elements.length === 0) {
            results[key] = null;
          } else if (elements.length === 1) {
            results[key] = elements.text().trim();
          } else {
            results[key] = elements.map((i, el) => $(el).text().trim()).get();
          }
        }
        return results;
      } else {
        return { html: response.data };
      }
    } catch (error) {
      logger.error('Cheerio scraping error:', error);
      throw error;
    }
  }

  async scrapeWithAxios(config) {
    const {
      url,
      method = 'GET',
      data,
      headers,
      timeout = 30000
    } = config;

    try {
      const response = await axios({
        method,
        url,
        data,
        headers: {
          'User-Agent': process.env.DEFAULT_USER_AGENT ||
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ...headers
        },
        timeout
      });

      return response.data;
    } catch (error) {
      logger.error('Axios request error:', error);
      throw error;
    }
  }

  async scrapeList(config) {
    const {
      urls,
      method = 'cheerio',
      selectors,
      concurrency = 3,
      useQueue = true
    } = config;

    // Use request queue for deduplication and priority
    if (useQueue) {
      this.requestQueue.clear();
      this.requestQueue.addRequests(urls.map(url => ({ url, selectors })));

      const results = [];
      const total = this.requestQueue.getStats().queued;

      while (!this.requestQueue.isEmpty()) {
        const request = this.requestQueue.getNext();
        if (!request) break;

        try {
          let data;
          if (method === 'puppeteer') {
            data = await this.scrapeWithPuppeteer({ url: request.url, selectors });
          } else if (method === 'axios') {
            data = await this.scrapeWithAxios({ url: request.url });
          } else {
            data = await this.scrapeWithCheerio({ url: request.url, selectors });
          }

          this.requestQueue.markSuccess(request.id);
          results.push({ url: request.url, data, success: true });

          // Update progress
          const stats = this.requestQueue.getStats();
          logger.info(`Progress: ${stats.visited}/${total} URLs processed`);
        } catch (error) {
          this.requestQueue.markFailed(request.id, error);
          results.push({ url: request.url, error: error.message, success: false });
        }
      }

      return results;
    }

    // Original implementation without queue
    const results = [];

    for (let i = 0; i < urls.length; i += concurrency) {
      const batch = urls.slice(i, i + concurrency);
      const batchPromises = batch.map(async (url) => {
        try {
          let data;
          if (method === 'puppeteer') {
            data = await this.scrapeWithPuppeteer({ url, selectors });
          } else if (method === 'axios') {
            data = await this.scrapeWithAxios({ url });
          } else {
            data = await this.scrapeWithCheerio({ url, selectors });
          }
          return { url, data, success: true };
        } catch (error) {
          return { url, error: error.message, success: false };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  async executeCustomCode(code, context) {
    const vm = require('vm');
    const sandbox = {
      console,
      axios,
      cheerio,
      ...context,
      result: null
    };

    try {
      const script = new vm.Script(`
        (async () => {
          ${code}
        })()
      `);

      const contextifiedSandbox = vm.createContext(sandbox);
      await script.runInContext(contextifiedSandbox);

      return sandbox.result;
    } catch (error) {
      logger.error('Custom code execution error:', error);
      throw new Error(`Custom code execution failed: ${error.message}`);
    }
  }

  // Initialize proxies from list
  initializeProxies(proxyList) {
    if (!Array.isArray(proxyList)) return;

    proxyList.forEach(proxy => {
      this.proxyPool.addProxy(proxy);
    });
    logger.info(`Initialized ${proxyList.length} proxies`);
  }

  // Get system statistics
  getStats() {
    return {
      browserPool: this.browserPool.getStats(),
      proxyPool: this.proxyPool.getStats(),
      requestQueue: this.requestQueue.getStats()
    };
  }

  // Clean shutdown
  async shutdown() {
    logger.info('Shutting down scraper service...');
    await this.browserPool.closeAll();
    this.requestQueue.clear();
    logger.info('Scraper service shutdown complete');
  }
}

module.exports = new ScraperService();