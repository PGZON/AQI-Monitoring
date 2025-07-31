// Simplified logger for initial testing
const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Simple console logger for now
const logger = {
  info: (message, meta = {}) => {
    console.log(`[INFO] ${message}`, meta);
  },
  error: (message, meta = {}) => {
    console.error(`[ERROR] ${message}`, meta);
  },
  warn: (message, meta = {}) => {
    console.warn(`[WARN] ${message}`, meta);
  },
  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, meta);
    }
  }
};

// Simple request logger
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};

// Simple performance logger (no-op for now)
const performanceLogger = (req, res, next) => {
  next();
};

// Simple database logger
const dbLogger = {
  connection: (message, meta = {}) => {
    console.log(`[DB] ${message}`, meta);
  },
  error: (message, error, meta = {}) => {
    console.error(`[DB ERROR] ${message}`, error.message, meta);
  }
};

module.exports = {
  logger,
  requestLogger,
  performanceLogger,
  dbLogger
};
