const express = require('express');
const router = express.Router();
const trackedProductController = require('../controllers/trackedProductController');

router.get('/', trackedProductController.getTrackedProducts);
router.post('/', trackedProductController.trackProduct);
router.get('/:id', trackedProductController.getTrackedProduct);
router.get('/:id/history', trackedProductController.getPriceHistory);
router.get('/:id/logs', trackedProductController.getScrapeLogs);
router.post('/:id/scrape', trackedProductController.manualScrape);

module.exports = router;
