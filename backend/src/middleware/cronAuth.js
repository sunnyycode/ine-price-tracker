const { CRON_SECRET } = require('../config/env');
const logger = require('../utils/logger');

function cronAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('CRON_AUTH', 'Missing or invalid authorization header');
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  if (!CRON_SECRET || token !== CRON_SECRET) {
    logger.warn('CRON_AUTH', 'Invalid cron secret');
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }
  next();
}

module.exports = cronAuth;
