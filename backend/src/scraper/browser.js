const { chromium } = require('playwright');
const logger = require('../utils/logger');

let browserInstance = null;

async function launchBrowser(options = {}) {
  const { headless = true } = options;
  
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }
  
  logger.info('BROWSER', `Launching browser (headless: ${headless})`);
  
  browserInstance = await chromium.launch({
    headless,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });
  
  return browserInstance;
}

async function createPage(browser, options = {}) {
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 },
    ...options,
  });
  
  const page = await context.newPage();
  
  // Set default navigation timeout
  page.setDefaultNavigationTimeout(15000);
  page.setDefaultTimeout(10000);
  
  return { context, page };
}

async function closeBrowser() {
  if (browserInstance) {
    logger.info('BROWSER', 'Closing browser');
    await browserInstance.close().catch(() => {});
    browserInstance = null;
  }
}

module.exports = { launchBrowser, createPage, closeBrowser };
