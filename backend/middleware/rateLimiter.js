/**
 * Rate Limiting Middleware
 * Prevents excessive requests and protects against infinite loops
 */

const rateLimit = require('express-rate-limit');
const { logger } = require('./logger');

// Store for tracking requests per IP
const requestCounts = new Map();
const blockedIPs = new Set();

/**
 * Create rate limiter for specific endpoints
 */
const createRateLimiter = (windowMs = 60000, max = 100, message = 'Too many requests') => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      retryAfter: Math.round(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      const ip = req.ip || req.connection.remoteAddress;
      logger.warn('Rate limit exceeded', {
        ip,
        url: req.originalUrl,
        userAgent: req.get('User-Agent'),
        category: 'security'
      });
      
      res.status(429).json({
        success: false,
        message,
        retryAfter: Math.round(windowMs / 1000)
      });
    }
  });
};

/**
 * Strict rate limiter for authentication endpoints
 */
const authRateLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  'Too many login attempts. Please try again later.'
);

/**
 * General API rate limiter
 */
const apiRateLimiter = createRateLimiter(
  60000, // 1 minute
  120, // Increased from 60 to 120 requests per minute
  'Too many API requests. Please slow down.'
);

/**
 * Strict rate limiter for user data endpoints
 */
const userDataRateLimiter = createRateLimiter(
  60000, // 1 minute
  60, // Increased from 30 to 60 requests per minute
  'Too many user data requests. Please slow down.'
);

/**
 * Custom rate limiter for infinite loop detection
 */
const infiniteLoopDetector = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const url = req.originalUrl;
  const key = `${ip}:${url}`;
  
  const now = Date.now();
  const windowMs = 10000; // 10 seconds
  const maxRequests = 50; // Increased from 20 to 50 requests per 10 seconds for normal app startup
  
  // Get current request count for this IP and endpoint
  const current = requestCounts.get(key) || { count: 0, firstRequest: now };
  
  // Reset if window has passed
  if (now - current.firstRequest > windowMs) {
    current.count = 1;
    current.firstRequest = now;
  } else {
    current.count++;
  }
  
  requestCounts.set(key, current);
  
  // Check if this looks like an infinite loop (more aggressive threshold)
  if (current.count > maxRequests) {
    // Block this IP for this endpoint temporarily
    const blockKey = `${ip}:${url}:block`;
    const blockTime = now + 60000; // Block for 1 minute
    
    blockedIPs.add(blockKey);
    setTimeout(() => {
      blockedIPs.delete(blockKey);
    }, 60000);
    
    logger.error('Infinite loop detected', {
      ip,
      url,
      count: current.count,
      userAgent: req.get('User-Agent'),
      category: 'security'
    });
    
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Possible infinite loop detected.',
      retryAfter: 60
    });
  }
  
  // Check if IP is blocked for this endpoint
  if (blockedIPs.has(`${ip}:${url}:block`)) {
    return res.status(429).json({
      success: false,
      message: 'Temporarily blocked due to excessive requests.',
      retryAfter: 60
    });
  }
  
  next();
};

/**
 * Cleanup old request counts periodically
 */
setInterval(() => {
  const now = Date.now();
  const cutoff = now - 60000; // Keep last minute
  
  for (const [key, data] of requestCounts.entries()) {
    if (data.firstRequest < cutoff) {
      requestCounts.delete(key);
    }
  }
}, 30000); // Clean up every 30 seconds

/**
 * Get rate limiting stats
 */
const getRateLimitStats = () => {
  const stats = {
    totalRequests: 0,
    blockedIPs: blockedIPs.size,
    activeEndpoints: requestCounts.size
  };
  
  for (const [, data] of requestCounts.entries()) {
    stats.totalRequests += data.count;
  }
  
  return stats;
};

module.exports = {
  authRateLimiter,
  apiRateLimiter,
  userDataRateLimiter,
  infiniteLoopDetector,
  getRateLimitStats
}; 