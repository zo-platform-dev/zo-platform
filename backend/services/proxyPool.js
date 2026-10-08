const logger = require('../utils/logger');

class ProxyPool {
  constructor(proxies = []) {
    this.proxies = proxies.map(proxy => ({
      url: proxy,
      successCount: 0,
      failCount: 0,
      lastUsed: null,
      avgResponseTime: 0,
      isActive: true
    }));
    this.currentIndex = 0;
    this.minSuccessRate = 0.7; // 70% minimum
  }

  addProxy(proxyUrl) {
    if (!this.proxies.find(p => p.url === proxyUrl)) {
      this.proxies.push({
        url: proxyUrl,
        successCount: 0,
        failCount: 0,
        lastUsed: null,
        avgResponseTime: 0,
        isActive: true
      });
    }
  }

  getNextProxy() {
    if (this.proxies.length === 0) return null;

    // Filter active proxies with good success rate
    const activeProxies = this.proxies.filter(p => {
      if (!p.isActive) return false;
      const total = p.successCount + p.failCount;
      if (total < 10) return true; // Give new proxies a chance
      return (p.successCount / total) >= this.minSuccessRate;
    });

    if (activeProxies.length === 0) {
      logger.warn('No active proxies available');
      return null;
    }

    // Get proxy with best performance
    const bestProxy = activeProxies.reduce((best, current) => {
      const bestScore = this.calculateProxyScore(best);
      const currentScore = this.calculateProxyScore(current);
      return currentScore > bestScore ? current : best;
    });

    bestProxy.lastUsed = Date.now();
    return bestProxy;
  }

  calculateProxyScore(proxy) {
    const total = proxy.successCount + proxy.failCount;
    if (total === 0) return 1;

    const successRate = proxy.successCount / total;
    const responseTimeFactor = proxy.avgResponseTime > 0
      ? 1 / (proxy.avgResponseTime / 1000)
      : 1;

    return successRate * 0.7 + responseTimeFactor * 0.3;
  }

  recordSuccess(proxyUrl, responseTime) {
    const proxy = this.proxies.find(p => p.url === proxyUrl);
    if (!proxy) return;

    proxy.successCount++;
    proxy.avgResponseTime = proxy.avgResponseTime === 0
      ? responseTime
      : (proxy.avgResponseTime * 0.8 + responseTime * 0.2);

    logger.debug(`Proxy ${proxyUrl} success. Rate: ${this.getSuccessRate(proxy).toFixed(2)}%`);
  }

  recordFailure(proxyUrl, error) {
    const proxy = this.proxies.find(p => p.url === proxyUrl);
    if (!proxy) return;

    proxy.failCount++;

    const total = proxy.successCount + proxy.failCount;
    if (total >= 10 && (proxy.successCount / total) < this.minSuccessRate) {
      proxy.isActive = false;
      logger.warn(`Proxy ${proxyUrl} deactivated. Rate: ${this.getSuccessRate(proxy).toFixed(2)}%`);
    }
  }

  getSuccessRate(proxy) {
    const total = proxy.successCount + proxy.failCount;
    return total === 0 ? 100 : (proxy.successCount / total) * 100;
  }

  getStats() {
    return this.proxies.map(proxy => ({
      url: proxy.url,
      successRate: this.getSuccessRate(proxy),
      totalRequests: proxy.successCount + proxy.failCount,
      avgResponseTime: proxy.avgResponseTime,
      isActive: proxy.isActive
    }));
  }

  resetProxy(proxyUrl) {
    const proxy = this.proxies.find(p => p.url === proxyUrl);
    if (proxy) {
      proxy.successCount = 0;
      proxy.failCount = 0;
      proxy.isActive = true;
      logger.info(`Proxy ${proxyUrl} reset`);
    }
  }
}

module.exports = ProxyPool;