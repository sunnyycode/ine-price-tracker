const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error('SERVER', `Unhandled error: ${err.message}`, { stack: err.stack });
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
}

module.exports = errorHandler;
