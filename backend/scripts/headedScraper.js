// Headed scraper for visual demonstration
// Usage: npm run scraper:headed [search-query]
// Example: npm run scraper:headed "laptop"
// Opens a visible browser window to demonstrate the scraping process for a video demo.

const { chromium } = require('playwright');
const logger = require('../src/utils/logger');
const { searchProducts } = require('../src/scraper/productScraper');
const { MOCK_STORE_URL } = require('../src/config/env');

async function headedDemo() {
  const query = process.argv[2] || 'watch';
  const baseUrl = MOCK_STORE_URL || 'https://demo.inelabteamdev.com';

  logger.info('HEADED', '==================================================');
  logger.info('HEADED', '  INE Price Tracker - Headed Scraper Visual Demo  ');
  logger.info('HEADED', '==================================================');
  logger.info('HEADED', `Search query: "${query}"`);

  // Step 1: Search products from store catalog
  logger.info('HEADED', 'Step 1: Searching products from INE mock store...');
  const products = await searchProducts(query);

  if (products.length === 0) {
    logger.warn('HEADED', `No products found for query "${query}". Try "watch", "laptop", "sleeve", or "camera".`);
    process.exit(1);
  }

  const targetProduct = products[0];
  logger.info('HEADED', `Found ${products.length} matching products.`);
  logger.info('HEADED', `Selected target: "${targetProduct.name}" (${targetProduct.url})`);

  // Measure server clock skew against mock store challenge endpoint
  let skewMs = 0;
  try {
    const chRes = await fetch(`${baseUrl}/api/challenge`);
    const srvDate = chRes.headers.get('date');
    if (srvDate) {
      skewMs = new Date(srvDate).getTime() - Date.now();
      logger.info('HEADED', `Server clock skew calibrated: ${(skewMs / 1000).toFixed(1)}s offset`);
    }
  } catch (e) {
    logger.warn('HEADED', `Clock skew measurement failed: ${e.message}`);
  }

  logger.info('HEADED', 'Step 2: Launching VISIBLE browser (headed mode)...');
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300, // Slow down operations so actions are clearly visible in video
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();

  // Patch Date.now in page context if clock skew exists
  if (Math.abs(skewMs) > 2000) {
    await page.addInitScript((offset) => {
      const origNow = Date.now.bind(Date);
      Date.now = () => origNow() + offset;
      const origDate = Date;
      window.Date = class extends origDate {
        constructor(...args) {
          if (args.length === 0) super(origNow() + offset);
          else super(...args);
        }
        static now() {
          return origNow() + offset;
        }
      };
    }, skewMs);
  }

  try {
    // Step 3: Navigate to product page
    logger.info('HEADED', `Step 3: Navigating to ${targetProduct.url}...`);
    await page.goto(targetProduct.url, { waitUntil: 'networkidle', timeout: 30000 });
    logger.info('HEADED', 'Product page loaded successfully.');
    await page.waitForTimeout(1500);

    // Step 4: Locate price block
    logger.info('HEADED', 'Step 4: Locating price area...');
    const priceBlock = await page.waitForSelector('.price-block', { timeout: 15000 });
    const box = await priceBlock.boundingBox();

    if (!box) {
      throw new Error('Price block bounding box not found');
    }

    // Step 5: Simulate human mouse movements to unlock price reveal
    logger.info('HEADED', 'Step 5: Simulating user hover and interaction over price area...');
    await page.mouse.move(box.x + 20, box.y + 20);
    await page.waitForTimeout(200);

    for (let i = 0; i < 15; i++) {
      await page.mouse.move(box.x + 25 + i * 10, box.y + 25 + (i % 3) * 6);
      await page.waitForTimeout(80);
    }

    logger.info('HEADED', 'Dwell time requirement met. Waiting for button activation...');
    await page.waitForTimeout(1000);

    // Step 6: Click "Reveal price"
    logger.info('HEADED', 'Step 6: Clicking "Reveal price" button...');
    const btn = await page.$('.price-block button');
    if (btn) {
      await btn.click({ force: true }).catch(() => {});
    }

    // Step 7: Wait for live price & stock
    logger.info('HEADED', 'Step 7: Waiting for server quote response...');
    await page.waitForSelector('.price-block.price-success, .price-main', { timeout: 15000 }).catch(() => {});

    // Step 8: Extract and display result
    const textData = await page.evaluate(() => {
      const block = document.querySelector('.price-block');
      return block ? block.innerText : '';
    });

    const cleanText = textData.replace(/[\u200B-\u200D\uFEFF]/g, '');

    logger.info('HEADED', '==================================================');
    logger.info('HEADED', '               SCRAPED RESULTS                    ');
    logger.info('HEADED', '==================================================');

    let price = null;
    let currency = 'USD';

    if (cleanText.includes('₹')) {
      currency = 'INR';
      const allMatches = Array.from(cleanText.matchAll(/₹\s*([\d,]+(?:\.\d+)?)/g));
      if (allMatches.length >= 2) {
        price = allMatches[1][1];
      } else if (allMatches.length === 1) {
        price = allMatches[0][1];
      }
    } else if (cleanText.includes('$')) {
      currency = 'USD';
      const allMatches = Array.from(cleanText.matchAll(/\$\s*([\d,]+(?:\.\d+)?)/g));
      if (allMatches.length >= 2) {
        price = allMatches[1][1];
      } else if (allMatches.length === 1) {
        price = allMatches[0][1];
      }
    }

    let stock = 'In Stock';
    const stockMatch = cleanText.match(/(?:only\s+\d+\s+left|\d+\s+in\s+stock|in\s+stock[^\n]*)/i);
    if (stockMatch) {
      stock = stockMatch[0].trim();
    }

    logger.info('HEADED', `Product:  ${targetProduct.name}`);
    logger.info('HEADED', `Price:    ${currency === 'INR' ? '₹' : '$'}${price || 'N/A'}`);
    logger.info('HEADED', `Stock:    ${stock}`);
    logger.info('HEADED', `Currency: ${currency}`);
    logger.info('HEADED', '==================================================');

    logger.info('HEADED', 'Keeping browser open for 10 seconds for video observation...');
    await page.waitForTimeout(10000);
  } catch (error) {
    logger.error('HEADED', `Headed scraper error: ${error.message}`);
    await page.waitForTimeout(4000);
  } finally {
    await browser.close();
    logger.info('HEADED', 'Browser closed. Demo complete.');
  }
}

headedDemo();
