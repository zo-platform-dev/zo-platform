const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
const AnonymizeUA = require('puppeteer-extra-plugin-anonymize-ua');

// Apply stealth plugins
puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));
puppeteer.use(AnonymizeUA());

class StealthBrowser {
  constructor(options = {}) {
    this.options = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ],
      ignoreHTTPSErrors: true,
      ...options
    };
  }

  async launch() {
    const browser = await puppeteer.launch(this.options);

    // Additional stealth measures
    const pages = await browser.pages();
    if (pages.length > 0) {
      await this.applyStealthMeasures(pages[0]);
    }

    return browser;
  }

  async applyStealthMeasures(page) {
    // Override navigator.webdriver
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
    });

    // Override plugins
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
    });

    // Override languages
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });
    });

    // Set realistic viewport
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });

    // Set extra headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    });
  }

  async newPage(browser) {
    const page = await browser.newPage();
    await this.applyStealthMeasures(page);
    return page;
  }
}

module.exports = StealthBrowser;
