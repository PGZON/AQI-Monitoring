const express = require('express');
const { query } = require('express-validator');
const historyController = require('../controllers/historyController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation middleware
const validateUserHistoryQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be in valid ISO format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be in valid ISO format'),
  query('minAQI')
    .optional()
    .isInt({ min: 0, max: 500 })
    .withMessage('Minimum AQI must be between 0 and 500'),
  query('maxAQI')
    .optional()
    .isInt({ min: 0, max: 500 })
    .withMessage('Maximum AQI must be between 0 and 500'),
  query('location')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Location must be between 1 and 100 characters')
];

const validateHeatmapQuery = [
  query('range')
    .optional()
    .isIn(['1d', '7d', '30d', '90d'])
    .withMessage('Range must be one of: 1d, 7d, 30d, 90d'),
  query('minLat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Minimum latitude must be between -90 and 90'),
  query('maxLat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Maximum latitude must be between -90 and 90'),
  query('minLon')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Minimum longitude must be between -180 and 180'),
  query('maxLon')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Maximum longitude must be between -180 and 180'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage('Limit must be between 1 and 500')
];

const validateMLDataQuery = [
  query('city')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('City name must be between 1 and 100 characters'),
  query('userId')
    .optional()
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ObjectId'),
  query('lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  query('lon')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  query('radius')
    .optional()
    .isFloat({ min: 0.01, max: 10 })
    .withMessage('Radius must be between 0.01 and 10 degrees'),
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365'),
  query('interval')
    .optional()
    .isIn(['hourly', 'daily'])
    .withMessage('Interval must be either hourly or daily')
];

const validateTrendsQuery = [
  query('city')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('City name must be between 1 and 100 characters'),
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365')
];

const validateLocationStatsQuery = [
  query('location')
    .notEmpty()
    .isLength({ min: 1, max: 100 })
    .withMessage('Location is required and must be between 1 and 100 characters'),
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365')
];

const validateGlobalStatsQuery = [
  query('days')
    .optional()
    .isInt({ min: 1, max: 90 })
    .withMessage('Days must be between 1 and 90')
];

// Routes

/**
 * @route   GET /api/history/user
 * @desc    Get authenticated user's AQI history
 * @access  Private
 * @params  page, limit, startDate, endDate, location, minAQI, maxAQI
 */
router.get('/user', 
  protect, 
  validateUserHistoryQuery, 
  historyController.getUserHistory
);

/**
 * @route   GET /api/history/heatmap
 * @desc    Get heatmap data for AQI visualization
 * @access  Public
 * @params  range (1d|7d|30d|90d), minLat, maxLat, minLon, maxLon, limit
 */
router.get('/heatmap', 
  validateHeatmapQuery, 
  historyController.getHeatmapData
);

/**
 * @route   GET /api/history/ml-data
 * @desc    Get ML-ready time series data
 * @access  Private (can be made public for specific use cases)
 * @params  city, userId, lat, lon, radius, days, interval
 */
router.get('/ml-data', 
  optionalAuth, // Allow both authenticated and public access
  validateMLDataQuery, 
  historyController.getMLData
);

/**
 * @route   GET /api/history/trends
 * @desc    Get trend analysis for user's AQI data
 * @access  Private
 * @params  city, days
 */
router.get('/trends', 
  protect, 
  validateTrendsQuery, 
  historyController.getTrendAnalysis
);

/**
 * @route   GET /api/history/location-stats
 * @desc    Get statistics for a specific location
 * @access  Public
 * @params  location (required), days
 */
router.get('/location-stats', 
  validateLocationStatsQuery, 
  historyController.getLocationStats
);

/**
 * @route   GET /api/history/global-stats
 * @desc    Get global AQI statistics
 * @access  Public
 * @params  days
 */
router.get('/global-stats', 
  validateGlobalStatsQuery, 
  historyController.getGlobalStats
);

/**
 * @route   GET /api/history/health
 * @desc    Health check for history service
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'History service is operational',
    timestamp: new Date().toISOString(),
    endpoints: {
      user: '/api/history/user',
      heatmap: '/api/history/heatmap',
      mlData: '/api/history/ml-data',
      trends: '/api/history/trends',
      locationStats: '/api/history/location-stats',
      globalStats: '/api/history/global-stats'
    },
    features: [
      'User AQI history with pagination',
      'Heatmap data aggregation',
      'ML-ready time series data',
      'Trend analysis and forecasting',
      'Location-specific statistics',
      'Global AQI statistics'
    ]
  });
});

module.exports = router;
