// Test script to run the scraper against the actual mock store
// Usage: npm run scraper:test
// OR: node scripts/runScraper.js [search-query]

const { searchProducts, retryScrape } = require('../src/scraper/productScraper');
const { closeBrowser } = require('../src/scraper/browser');
const logger = require('../src/utils/logger');

async function main() {
  const query = process.argv[2] || 'phone';
  
  try {
    logger.info('TEST', `Searching for: "${query}"`);
    const products = await searchProducts(query);
    
    logger.info('TEST', `Found ${products.length} products`);
    products.forEach((p, i) => {
      logger.info('TEST', `Product ${i + 1}: ${p.name} - $${p.price} - ${p.stock}`);
      logger.info('TEST', `  URL: ${p.url}`);
    });
    
    if (products.length > 0) {
      logger.info('TEST', `\nScraping first product: ${products[0].name}`);
      const result = await retryScrape(products[0]);
      logger.info('TEST', 'Scrape result:', result);
    }
  } catch (error) {
    logger.error('TEST', `Error: ${error.message}`);
  } finally {
    await closeBrowser();
    process.exit(0);
  }
}

main();
