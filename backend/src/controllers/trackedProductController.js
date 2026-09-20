const databaseService = require('../services/databaseService');
const scraperService = require('../services/scraperService');
const logger = require('../utils/logger');

async function trackProduct(req, res, next) {
  try {
    const { storeProductId, name, url, imageUrl } = req.body;
    if (!storeProductId || !name || !url) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const existing = await databaseService.getTrackedProductByStoreId(storeProductId);
    if (existing) {
      return res.status(409).json({ success: false, error: 'Product already tracked', data: existing });
    }

    const newProduct = await databaseService.insertTrackedProduct({ storeProductId, name, url, imageUrl });
    res.status(201).json({ success: true, data: newProduct });
  } catch (error) {
    next(error);
  }
}

async function getTrackedProducts(req, res, next) {
  try {
    const products = await databaseService.getTrackedProducts();
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
}

async function getTrackedProduct(req, res, next) {
  try {
    const { id } = req.params;
    const product = await databaseService.getTrackedProductById(id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
}

async function getPriceHistory(req, res, next) {
  try {
    const { id } = req.params;
    const history = await databaseService.getPriceHistory(id);
    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
}

async function getScrapeLogs(req, res, next) {
  try {
    const { id } = req.params;
    const logs = await databaseService.getScrapeLogs(id, 50);
    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
}

async function manualScrape(req, res, next) {
  try {
    const { id } = req.params;
    const product = await databaseService.getTrackedProductById(id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const result = await scraperService.scrapeProduct(product);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  trackProduct,
  getTrackedProducts,
  getTrackedProduct,
  getPriceHistory,
  getScrapeLogs,
  manualScrape,
};
