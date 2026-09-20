const app = require('./app');
const { PORT } = require('./config/env');
const logger = require('./utils/logger');

app.listen(PORT, () => {
  logger.info('SERVER', `INE Price Tracker API running on port ${PORT}`);
});
