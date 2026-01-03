const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error with full details
  logger.error(`Error: ${err.message}`, {
    name: err.name,
    code: err.code,
    path: req.path,
    method: req.method,
    stack: err.stack
  });
  
  // Also console.error in development for immediate visibility
  if (process.env.NODE_ENV === 'development') {
    console.error('\n=== ERROR CAUGHT ===');
    console.error('Message:', err.message);
    console.error('Name:', err.name);
    console.error('Code:', err.code);
    console.error('Stack:', err.stack);
    console.error('====================\n');
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error = new AppError('Resource not found', 404);
  }

  // Mongoose duplicate key
  if (err.code === 23505) { // PostgreSQL unique violation
    const field = err.detail?.match(/Key \((.*?)\)/)?.[1] || 'field';
    error = new AppError(`${field} already exists`, 409);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new AppError(message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired', 401);
  }

  // Send response
  const statusCode = error.statusCode || err.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // Ensure we don't send if headers already sent
  if (!res.headersSent) {
    res.status(statusCode).json({
      success: false,
      error: message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  } else {
    logger.error('Headers already sent, cannot send error response');
  }
};

module.exports = errorHandler;
