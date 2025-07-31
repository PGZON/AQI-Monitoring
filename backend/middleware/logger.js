const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');

// Custom format for log entries
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta
    });
  })
);

// Development format for console
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Create Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { 
    service: 'aqi-monitoring-api',
    version: process.env.npm_package_version || '1.0.0'
  },
  transports: [
    // Error log file with daily rotation
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
      auditFile: path.join(logsDir, 'error-audit.json'),
      zippedArchive: true
    }),
    
    // Combined log file with daily rotation
    new DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      auditFile: path.join(logsDir, 'combined-audit.json'),
      zippedArchive: true
    }),
    
    // Warning and above to separate file
    new DailyRotateFile({
      filename: path.join(logsDir, 'warnings-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'warn',
      maxSize: '20m',
      maxFiles: '7d',
      auditFile: path.join(logsDir, 'warnings-audit.json'),
      zippedArchive: true
    })
  ],
  
  // Handle unhandled promise rejections and exceptions
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'rejections.log') 
    })
  ],
  
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'exceptions.log') 
    })
  ]
});

// Add console transport for development
if (process.env.NODE_ENV === 'development') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: 'debug'
  }));
} else {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
    level: 'info'
  }));
}

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Extract user info if available
  const userId = req.user?.id || 'anonymous';
  const userRole = req.user?.role || 'guest';
  
  // Log incoming request
  logger.info('Incoming request', {
    method: req.method,
    url: req.originalUrl,
    path: req.path,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    userId,
    userRole,
    headers: {
      contentType: req.get('Content-Type'),
      authorization: req.get('Authorization') ? 'Bearer [HIDDEN]' : undefined
    },
    query: req.query,
    body: req.method === 'POST' || req.method === 'PUT' ? 
      sanitizeBody(req.body) : undefined
  });
  
  // Track response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    
    const logLevel = statusCode >= 500 ? 'error' : 
                    statusCode >= 400 ? 'warn' : 'info';
    
    logger[logLevel]('Request completed', {
      method: req.method,
      url: req.originalUrl,
      statusCode,
      duration: `${duration}ms`,
      userId,
      userRole,
      ip: req.ip || req.connection.remoteAddress,
      responseSize: res.get('Content-Length') || 0
    });
  });
  
  next();
};

/**
 * Sanitize request body for logging (remove sensitive fields)
 */
const sanitizeBody = (body) => {
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
 * Performance monitoring middleware
 */
const performanceLogger = (req, res, next) => {
  const start = process.hrtime.bigint();
  
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds
    
    // Log slow requests (over 1 second)
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.originalUrl,
        duration: `${duration.toFixed(2)}ms`,
        userId: req.user?.id || 'anonymous',
        statusCode: res.statusCode
      });
    }
    
    // Log performance metrics
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Request performance', {
        method: req.method,
        url: req.originalUrl,
        duration: `${duration.toFixed(2)}ms`,
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      });
    }
  });
  
  next();
};

/**
 * Database operation logger
 */
const dbLogger = {
  connection: (message, meta = {}) => {
    logger.info(`Database: ${message}`, { category: 'database', ...meta });
  },
  
  query: (operation, collection, duration, meta = {}) => {
    logger.debug('Database query', {
      category: 'database',
      operation,
      collection,
      duration: `${duration}ms`,
      ...meta
    });
  },
  
  error: (message, error, meta = {}) => {
    logger.error(`Database error: ${message}`, {
      category: 'database',
      error: error.message,
      stack: error.stack,
      ...meta
    });
  }
};

/**
 * Security event logger
 */
const securityLogger = {
  authAttempt: (email, success, ip, meta = {}) => {
    logger.info('Authentication attempt', {
      category: 'security',
      email,
      success,
      ip,
      ...meta
    });
  },
  
  authFailure: (email, reason, ip, meta = {}) => {
    logger.warn('Authentication failure', {
      category: 'security',
      email,
      reason,
      ip,
      ...meta
    });
  },
  
  suspiciousActivity: (activity, userId, ip, meta = {}) => {
    logger.warn('Suspicious activity detected', {
      category: 'security',
      activity,
      userId,
      ip,
      ...meta
    });
  },
  
  rateLimitExceeded: (ip, endpoint, meta = {}) => {
    logger.warn('Rate limit exceeded', {
      category: 'security',
      ip,
      endpoint,
      ...meta
    });
  }
};

/**
 * Business logic logger
 */
const businessLogger = {
  alertSent: (userId, alertType, city, aqiValue, method) => {
    logger.info('Alert sent to user', {
      category: 'business',
      userId,
      alertType,
      city,
      aqiValue,
      method
    });
  },
  
  dataFetch: (source, city, dataPoints, duration) => {
    logger.info('AQI data fetched', {
      category: 'business',
      source,
      city,
      dataPoints,
      duration
    });
  },
  
  mlPrediction: (city, algorithm, accuracy, duration) => {
    logger.info('ML prediction generated', {
      category: 'business',
      city,
      algorithm,
      accuracy,
      duration
    });
  }
};

module.exports = {
  logger,
  requestLogger,
  performanceLogger,
  dbLogger,
  securityLogger,
  businessLogger,
  sanitizeBody
};
