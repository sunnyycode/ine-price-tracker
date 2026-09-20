const express = require('express');
const router = express.Router();
const scrapeController = require('../controllers/scrapeController');
const cronAuth = require('../middleware/cronAuth');

router.post('/all', cronAuth, scrapeController.scrapeAll);

module.exports = router;
