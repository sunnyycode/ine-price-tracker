const databaseService = require('../services/databaseService');
const scraperService = require('../services/scraperService');
const logger = require('../utils/logger');
const { closeBrowser } = require('../scraper/browser');

/**
 * POST /api/scrape/all
 * Scrape all active tracked products.
 * Protected by CRON_SECRET via cronAuth middleware.
 * Responds early so cron-job.org doesn't timeout, then continues scraping in background.
 */
async function scrapeAll(req, res, next) {
  try {
    const products = await databaseService.getTrackedProducts();
    const activeProducts = products.filter(p => p.is_active);

    if (activeProducts.length === 0) {
      return res.json({
        success: true,
        message: 'No active products to scrape',
        summary: { total: 0, successful: 0, failed: 0 },
      });
    }

    // Respond early so cron-job.org doesn't timeout
    res.json({
      success: true,
      message: `Started scraping ${activeProducts.length} products`,
      summary: { total: activeProducts.length },
    });

    // Continue scraping in background after response
    try {
      const result = await scraperService.scrapeAllProducts(products, 'CRON');
      logger.info('SCRAPE_ALL', `Background scrape completed: ${result.successful} succeeded, ${result.failed} failed`);
    } catch (err) {
      logger.error('SCRAPE_ALL', `Background scrape failed: ${err.message}`);
    } finally {
      await closeBrowser();
    }
  } catch (error) {
    logger.error('SCRAPE_ALL', `Error in scrapeAll: ${error.message}`);
    if (!res.headersSent) {
      next(error);
    }
  }
}

module.exports = {
  scrapeAll,
};
