const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

const { setupSecurity } = require('./config/security');
const { apiLimiter, aiLimiter } = require('./middleware/rateLimiter');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy (needed when behind nginx/reverse proxy)
app.set('trust proxy', 1);

// Security middleware (helmet + CORS)
setupSecurity(app);

// Body parsing middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// HTTP request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Health check (no rate limiting)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Budget Manager API is running',
    timestamp: new Date().toISOString()
  });
});

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const transactionRoutes = require('./routes/transactions');
const budgetRoutes = require('./routes/budgets');
const spendingLimitRoutes = require('./routes/spendingLimits');
const categoryRoutes = require('./routes/categories');
const reportRoutes = require('./routes/reports');
const aiRoutes = require('./routes/ai');
const debtRoutes = require('./routes/debts');
const goalRoutes = require('./routes/goals');
const testRoutes = require('./routes/test'); // Test route

// Apply rate limiters to specific routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/test', testRoutes); // Test route (no rate limit)

// General rate limiter for all other API routes
app.use('/api', apiLimiter);

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/spending-limits', spendingLimitRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/debts', debtRoutes);
app.use('/api/goals', goalRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...');
  logger.error(err.name, err.message);
  logger.error(err.stack);
  console.error('UNCAUGHT EXCEPTION!', err);
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down...');
  logger.error(err.name, err.message);
  logger.error(err.stack);
  console.error('UNHANDLED REJECTION!', err);
  process.exit(1);
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
});

module.exports = app;
