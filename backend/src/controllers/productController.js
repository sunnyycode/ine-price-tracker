const scraperService = require('../services/scraperService');
const logger = require('../utils/logger');

async function searchProducts(req, res, next) {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.status(400).json({ success: false, error: 'Query parameter "q" must be at least 2 characters long' });
    }

    const results = await scraperService.searchProducts(q);
    res.json({ success: true, data: results });
  } catch (error) {
    logger.error('PRODUCT_CONTROLLER', `Error searching products: ${error.message}`, { error: error.toString() });
    next(error);
  }
}

module.exports = {
  searchProducts,
};
