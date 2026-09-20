const productScraper = require('../scraper/productScraper');
const logger = require('../utils/logger');
const databaseService = require('./databaseService');
const { closeBrowser } = require('../scraper/browser');

/**
 * Search products from the mock store
 */
async function searchProducts(query) {
  try {
    logger.info('SCRAPER_SERVICE', `Searching products for query: "${query}"`);
    const results = await productScraper.searchProducts(query);
    return results;
  } catch (error) {
    logger.error('SCRAPER_SERVICE', `Error searching products: ${error.message}`);
    throw error;
  } finally {
    await closeBrowser();
  }
}

/**
 * Scrape a single tracked product with retry logic.
 * - If successful: updates DB with new price/stock, inserts price_history
 * - If failed: does NOT update product price, logs FAILED, keeps previous valid data
 * - All attempt logs are inserted into scrape_logs
 */
async function scrapeProduct(trackedProduct) {
  try {
    logger.info('SCRAPER_SERVICE', `Scraping product: ${trackedProduct.name}`);
    const startedAt = new Date().toISOString();
    const result = await productScraper.retryScrape(trackedProduct);

    // Insert all attempt logs into scrape_logs
    for (const log of result.logs) {
      const isLastAttempt = log === result.logs[result.logs.length - 1];
      let status;

      if (log.status === 'success') {
        status = 'SUCCESS';
      } else if (!isLastAttempt) {
        status = 'RETRIED';
      } else {
        status = 'FAILED';
      }

      try {
        await databaseService.insertScrapeLog({
          tracked_product_id: trackedProduct.id,
          started_at: startedAt,
          completed_at: new Date().toISOString(),
          attempt_number: log.attempt_number,
          status,
          price: log.extracted_price,
          stock: log.extracted_stock,
          error_message: log.error_message,
          response_time_ms: log.response_time_ms,
        });
      } catch (dbError) {
        logger.error('SCRAPER_SERVICE', `Failed to insert scrape log: ${dbError.message}`);
      }
    }

    // Only update product and insert price history on SUCCESS
    if (result.success) {
      logger.info('SCRAPER_SERVICE', `Successfully scraped: ${trackedProduct.name} - Price: ${result.price}, Stock: ${result.stock}`);
      try {
        await databaseService.updateProductPrice(trackedProduct.id, result.price, result.stock);
        await databaseService.insertPriceHistory(trackedProduct.id, result.price, result.stock);
      } catch (dbError) {
        logger.error('SCRAPER_SERVICE', `Failed to update DB for ${trackedProduct.name}: ${dbError.message}`);
      }
      return { success: true, price: result.price, stock: result.stock, logs: result.logs };
    } else {
      // NEVER update current_price/current_stock on failure
      // NEVER insert invalid price history
      logger.warn('SCRAPER_SERVICE', `Failed to scrape: ${trackedProduct.name} after all attempts`);
      return { success: false, error: 'All scrape attempts failed', logs: result.logs };
    }
  } catch (error) {
    logger.error('SCRAPER_SERVICE', `Exception scraping ${trackedProduct.name}: ${error.message}`);
    return { success: false, error: error.message, logs: [] };
  }
}

/**
 * Scrape all active tracked products with controlled concurrency.
 * Creates a scrape_run record for tracking.
 */
async function scrapeAllProducts(products, triggerType = 'CRON') {
  const activeProducts = products.filter(p => p.is_active);
  logger.info('SCRAPER_SERVICE', `Starting scrape run for ${activeProducts.length} active products (trigger: ${triggerType})`);

  let runId = null;
  try {
    runId = await databaseService.createScrapeRun(triggerType, activeProducts.length);
  } catch (e) {
    logger.error('SCRAPER_SERVICE', `Failed to create scrape run: ${e.message}`);
  }

  let successCount = 0;
  let failureCount = 0;

  // Process with concurrency limit of 2
  const CONCURRENCY = 2;
  for (let i = 0; i < activeProducts.length; i += CONCURRENCY) {
    const batch = activeProducts.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(product => scrapeProduct(product))
    );

    results.forEach(res => {
      if (res.success) successCount++;
      else failureCount++;
    });
  }

  // Clean up browser after batch run
  await closeBrowser();

  // Update scrape run record
  if (runId) {
    try {
      const status = failureCount === 0 ? 'COMPLETED'
        : successCount === 0 ? 'FAILED'
        : 'PARTIAL';
      await databaseService.updateScrapeRun(runId, {
        status,
        successful: successCount,
        failed: failureCount,
        completed_at: new Date().toISOString(),
      });
    } catch (e) {
      logger.error('SCRAPER_SERVICE', `Failed to update scrape run: ${e.message}`);
    }
  }

  logger.info('SCRAPER_SERVICE', `Scrape run completed: ${successCount} succeeded, ${failureCount} failed`);
  return {
    success: true,
    runId,
    total: activeProducts.length,
    successful: successCount,
    failed: failureCount,
  };
}

module.exports = {
  searchProducts,
  scrapeProduct,
  scrapeAllProducts,
};
