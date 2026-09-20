const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const healthRoutes = require('./routes/health');
const productRoutes = require('./routes/products');
const trackedProductRoutes = require('./routes/trackedProducts');
const scrapeRoutes = require('./routes/scrape');

const app = express();

// Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(cors());
app.options('*', cors());
app.use(morgan('combined'));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'INE Price Tracker Backend API is running',
    timestamp: new Date().toISOString(),
  });
});
app.use('/health', healthRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/products', productRoutes);
app.use('/api/tracked-products', trackedProductRoutes);
app.use('/api/scrape', scrapeRoutes);

// Error handler
app.use(errorHandler);

module.exports = app;
