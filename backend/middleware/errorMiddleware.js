const { validationResult } = require('express-validator');
const { logger } = require('./logger');

/**
 * Sanitize request body for error logging (remove sensitive fields)
 */
const sanitizeErrorBody = (body) => {
  if (!body || typeof body !== 'object') return body;
  
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'apiKey'];
  const sanitized = { ...body };
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[HIDDEN]';
    }
  });
  
  return sanitized;
};

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error with full context
  const errorContext = {
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    userId: req.user?.id || 'anonymous',
    userRole: req.user?.role || 'guest',
    headers: {
      contentType: req.get('Content-Type'),
      authorization: req.get('Authorization') ? 'Bearer [HIDDEN]' : undefined
    },
    body: req.method === 'POST' || req.method === 'PUT' ? 
      sanitizeErrorBody(req.body) : undefined,
    query: req.query
  };

  // Log with appropriate level based on error type
  if (err.statusCode && err.statusCode < 500) {
    logger.warn('Client error occurred', errorContext);
  } else {
    logger.error('Server error occurred', errorContext);
  }

  let error = { ...err };
  error.message = err.message;

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
    
    // Log security event
    logger.warn('Invalid JWT token detected', {
      category: 'security',
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl
    });
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
    
    // Log security event
    logger.info('Expired JWT token', {
      category: 'security',
      ip: req.ip || req.connection.remoteAddress,
      url: req.originalUrl
    });
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Handle validation errors from express-validator
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }
  
  next();
};

/**
 * Handle 404 routes
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error);
};

/**
 * Rate limiting middleware setup
 */
const rateLimitHandler = (req, res) => {
  res.status(429).json({
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.round(req.rateLimit.resetTime / 1000) || 1
  });
};

/**
 * Request logging middleware (Legacy - using Winston logger now)
 * @deprecated Use logger.js requestLogger instead
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, url, ip } = req;
    const { statusCode } = res;
    
    // Use Winston logger instead of console.log
    logger.info('Request completed (legacy)', {
      method,
      url,
      statusCode,
      duration: `${duration}ms`,
      ip,
      category: 'request'
    });
  });
  
  next();
};

/**
 * Security headers middleware
 */
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
};

module.exports = {
  errorHandler,
  handleValidationErrors,
  notFound,
  rateLimitHandler,
  requestLogger,
  securityHeaders
};
