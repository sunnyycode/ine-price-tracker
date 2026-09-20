const { chromium } = require('playwright');
const logger = require('../utils/logger');
const { MOCK_STORE_URL } = require('../config/env');

let catalogCache = null;
let cacheTimestamp = 0;

/**
 * Fetch all catalog items from mock store API with in-memory caching (5 mins)
 */
async function getCatalog() {
  if (catalogCache && Date.now() - cacheTimestamp < 5 * 60 * 1000) {
    return catalogCache;
  }

  const baseUrl = MOCK_STORE_URL || 'https://demo.inelabteamdev.com';
  const allItems = [];

  for (let page = 1; page <= 17; page++) {
    try {
      const res = await fetch(`${baseUrl}/api/catalog?page=${page}&pageSize=60`);
      if (!res.ok) break;
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        allItems.push(...data.items);
      }
      if (page >= (data.pages || 17)) break;
    } catch (e) {
      logger.warn('SCRAPER', `Failed to fetch catalog page ${page}: ${e.message}`);
      break;
    }
  }

  if (allItems.length > 0) {
    catalogCache = allItems;
    cacheTimestamp = Date.now();
  }

  return allItems;
}

/**
 * Search products from the mock store by partial or full name, brand, category, or SKU.
 */
async function searchProducts(query) {
  try {
    const q = (query || '').toLowerCase().trim();
    if (!q || q.length < 2) return [];

    logger.info('SCRAPER', `Searching mock store for query: "${q}"`);
    const catalog = await getCatalog();
    const baseUrl = MOCK_STORE_URL || 'https://demo.inelabteamdev.com';

    const matches = catalog.filter(item => {
      return (
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.brand && item.brand.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.sku && item.sku.toLowerCase().includes(q))
      );
    });

    logger.info('SCRAPER', `Found ${matches.length} matches for "${q}"`);

    return matches.map(item => ({
      name: item.name,
      storeProductId: String(item.id),
      url: `${baseUrl}/product/${item.id}`,
      image: null,
      category: item.category,
      brand: item.brand,
      sku: item.sku,
      price: null,
      stock: null,
    }));
  } catch (error) {
    logger.error('SCRAPER', `Search products error: ${error.message}`);
    return [];
  }
}

/**
 * Scrape a single product page using Playwright.
 * Handles the mock store's delayed/asynchronous content and anti-bot challenge:
 * 1. Synchronizes client Date.now with mock store server clock to avoid challenge expiration.
 * 2. Simulates natural mouse movements across the .price-block to satisfy the dwell/move challenge.
 * 3. Clicks "Reveal price" button.
 * 4. Extracts live selling price (stripping zero-width spaces) and stock status.
 */
async function scrapeProductPage(url, options = {}) {
  const { headless = true } = options;
  const baseUrl = MOCK_STORE_URL || 'https://demo.inelabteamdev.com';
  const start = Date.now();

  // Measure server clock skew against mock store challenge endpoint
  let skewMs = 0;
  try {
    const chRes = await fetch(`${baseUrl}/api/challenge`);
    const srvDate = chRes.headers.get('date');
    if (srvDate) {
      skewMs = new Date(srvDate).getTime() - Date.now();
    }
  } catch (e) {
    logger.warn('SCRAPER', `Failed to measure server clock skew: ${e.message}`);
  }

  let browser;
  try {
    browser = await chromium.launch({
      headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
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

    await page.goto(url, { waitUntil: 'networkidle', timeout: 25000 });

    const priceBlock = await page.waitForSelector('.price-block', { timeout: 15000 });
    const box = await priceBlock.boundingBox();

    if (!box) {
      throw new Error('Price block bounding box not found on page');
    }

    // Move mouse across the price block to satisfy minMoves (8) and minDwell (600ms)
    await page.mouse.move(box.x + 15, box.y + 15);
    await page.waitForTimeout(50);

    for (let i = 0; i < 15; i++) {
      await page.mouse.move(box.x + 20 + i * 8, box.y + 20 + (i % 3) * 6);
      await page.waitForTimeout(60);
    }

    // Dwell wait
    await page.waitForTimeout(900);

    // Click reveal button
    const btn = await page.$('.price-block button');
    if (btn) {
      const disabled = await btn.getAttribute('disabled');
      if (disabled === null) {
        await btn.click();
      } else {
        await page.waitForTimeout(500);
        await btn.click({ force: true }).catch(() => {});
      }
    }

    // Wait for price to render
    await page.waitForSelector('.price-block.price-success, .price-block.price-error, .price-main', {
      timeout: 15000,
    }).catch(() => {});

    // Check if error state occurred and retry button is present
    const isError = await page.$('.price-block.price-error');
    if (isError) {
      const retryBtn = await page.$('.price-block.price-error button');
      if (retryBtn) {
        await retryBtn.click().catch(() => {});
        await page.waitForTimeout(3000);
      }
    }

    // Extract text content from price-block
    const textData = await page.evaluate(() => {
      const block = document.querySelector('.price-block');
      if (!block) return null;
      return block.innerText || block.textContent;
    });

    if (!textData) {
      throw new Error('Failed to extract price element text');
    }

    // Strip zero-width space characters (\u200B, \u200C, \u200D, \uFEFF) injected by the mock store
    const cleanText = textData.replace(/[\u200B-\u200D\uFEFF]/g, '');

    let price = null;
    let currency = 'USD';

    if (cleanText.includes('₹')) {
      currency = 'INR';
      const allMatches = Array.from(cleanText.matchAll(/₹\s*([\d,]+(?:\.\d+)?)/g));
      if (allMatches.length >= 2) {
        price = parseFloat(allMatches[1][1].replace(/,/g, ''));
      } else if (allMatches.length === 1) {
        price = parseFloat(allMatches[0][1].replace(/,/g, ''));
      }
    } else if (cleanText.includes('$')) {
      currency = 'USD';
      const allMatches = Array.from(cleanText.matchAll(/\$\s*([\d,]+(?:\.\d+)?)/g));
      if (allMatches.length >= 2) {
        price = parseFloat(allMatches[1][1].replace(/,/g, ''));
      } else if (allMatches.length === 1) {
        price = parseFloat(allMatches[0][1].replace(/,/g, ''));
      }
    } else {
      const numMatch = cleanText.match(/([\d,]+\.?\d*)/);
      if (numMatch) {
        price = parseFloat(numMatch[1].replace(/,/g, ''));
      }
    }

    // Extract stock status
    let stock = 'In Stock';
    if (cleanText.toLowerCase().includes('out of stock')) {
      stock = 'Out of Stock';
    } else {
      const stockMatch = cleanText.match(/(?:only\s+\d+\s+left|\d+\s+in\s+stock|in\s+stock[^\n]*)/i);
      if (stockMatch) {
        stock = stockMatch[0].trim();
      }
    }

    const responseTimeMs = Date.now() - start;
    const validation = validateScrapedData(price, stock);

    if (!validation.isValid) {
      return {
        success: false,
        price: null,
        stock: null,
        currency,
        error: validation.errors.join(', '),
        responseTimeMs,
      };
    }

    return {
      success: true,
      price,
      stock,
      currency,
      error: null,
      responseTimeMs,
    };
  } catch (error) {
    return {
      success: false,
      price: null,
      stock: null,
      currency: 'USD',
      error: error.message,
      responseTimeMs: Date.now() - start,
    };
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

/**
 * Validate scraped data before allowing it into the database.
 */
function validateScrapedData(price, stock) {
  const errors = [];
  if (price === null || price === undefined || isNaN(price)) {
    errors.push('Price is not a valid number');
  } else if (price < 0) {
    errors.push('Price must be greater than or equal to 0');
  }

  if (stock !== null && typeof stock !== 'string') {
    errors.push('Stock must be a string');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Main scrape function for a single product with exponential backoff retry.
 * Attempt 1: immediate
 * Attempt 2: wait 2s
 * Attempt 3: wait 5s
 */
async function retryScrape(product, maxAttempts = 3, options = {}) {
  const logs = [];
  const delays = [0, 2000, 5000];

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (attempt > 1) {
      const delay = delays[attempt - 1] || 5000;
      logger.info('SCRAPER', `[SCRAPER] Waiting ${delay}ms before attempt ${attempt}/${maxAttempts}`);
      await new Promise(r => setTimeout(r, delay));
    }

    logger.info('SCRAPER', `[SCRAPER] Product: ${product.name}, Attempt: ${attempt}/${maxAttempts}, Status: starting`);
    const result = await scrapeProductPage(product.url, options);

    const logEntry = {
      attempt_number: attempt,
      status: result.success ? 'success' : 'failed',
      response_time_ms: result.responseTimeMs,
      error_message: result.error,
      extracted_price: result.price,
      extracted_stock: result.stock,
    };
    logs.push(logEntry);

    logger.info(
      'SCRAPER',
      `[SCRAPER] Product: ${product.name}, Attempt: ${attempt}/${maxAttempts}, Status: ${logEntry.status}` +
      (result.success ? `, Price: ${result.price}, Stock: ${result.stock}` : `, Error: ${result.error}`)
    );

    if (result.success) {
      return {
        success: true,
        price: result.price,
        stock: result.stock,
        currency: result.currency,
        logs,
      };
    }
  }

  return { success: false, logs };
}

module.exports = {
  searchProducts,
  scrapeProduct: (product, options) => scrapeProductPage(product.url, options),
  scrapeProductPage,
  validateScrapedData,
  retryScrape,
};
