const express = require('express');
const { body, query, param } = require('express-validator');
const {
  fetchAQI,
  getAQIHistory,
  getNearbyAQI,
  getAQIAnalytics,
  toggleBookmark,
  updateNote,
  deleteAQIData,
  getServiceHealth
} = require('../controllers/aqiController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/errorMiddleware');

const router = express.Router();

// Validation rules
const coordinateValidation = [
  body('lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be a number between -90 and 90'),
  body('lon')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be a number between -180 and 180'),
  body('saveToHistory')
    .optional()
    .isBoolean()
    .withMessage('saveToHistory must be a boolean')
];

const queryCoordinateValidation = [
  query('lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be a number between -90 and 90'),
  query('lon')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be a number between -180 and 180')
];

const historyValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
];

const nearbyValidation = [
  ...queryCoordinateValidation,
  query('radius')
    .optional()
    .isFloat({ min: 1, max: 100 })
    .withMessage('Radius must be a number between 1 and 100 kilometers'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be an integer between 1 and 50')
];

const analyticsValidation = [
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be an integer between 1 and 365')
];

const noteValidation = [
  body('note')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Note must not exceed 500 characters')
];

const idValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format')
];

// Public routes
router.get('/health', getServiceHealth);

// Protected routes (require authentication)
router.use(authenticateToken);

// Main AQI data fetching endpoint
router.post('/fetch', coordinateValidation, handleValidationErrors, fetchAQI);

// User's AQI history
router.get('/history', historyValidation, handleValidationErrors, getAQIHistory);

// Nearby AQI data
router.get('/nearby', nearbyValidation, handleValidationErrors, getNearbyAQI);

// User analytics
router.get('/analytics', analyticsValidation, handleValidationErrors, getAQIAnalytics);

// Bookmark management
router.patch('/:id/bookmark', idValidation, handleValidationErrors, toggleBookmark);

// Note management
router.patch('/:id/note', [...idValidation, ...noteValidation], handleValidationErrors, updateNote);

// Delete AQI data
router.delete('/:id', idValidation, handleValidationErrors, deleteAQIData);

// Route documentation endpoint
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AQI API Routes',
    version: '1.0.0',
    endpoints: {
      fetch: {
        method: 'POST',
        path: '/api/aqi/fetch',
        description: 'Fetch AQI data for given coordinates',
        authentication: 'required',
        body: {
          lat: 'number (required) - Latitude between -90 and 90',
          lon: 'number (required) - Longitude between -180 and 180',
          saveToHistory: 'boolean (optional) - Save to user history (default: true)'
        }
      },
      history: {
        method: 'GET',
        path: '/api/aqi/history',
        description: 'Get user\'s AQI data history',
        authentication: 'required',
        query: {
          limit: 'number (optional) - Records per page (1-100, default: 50)',
          page: 'number (optional) - Page number (default: 1)',
          startDate: 'string (optional) - ISO 8601 date',
          endDate: 'string (optional) - ISO 8601 date'
        }
      },
      nearby: {
        method: 'GET',
        path: '/api/aqi/nearby',
        description: 'Get nearby AQI data from other users',
        authentication: 'required',
        query: {
          lat: 'number (required) - Latitude',
          lon: 'number (required) - Longitude',
          radius: 'number (optional) - Search radius in km (1-100, default: 10)',
          limit: 'number (optional) - Max results (1-50, default: 20)'
        }
      },
      analytics: {
        method: 'GET',
        path: '/api/aqi/analytics',
        description: 'Get user\'s AQI analytics',
        authentication: 'required',
        query: {
          days: 'number (optional) - Analysis period in days (1-365, default: 30)'
        }
      },
      bookmark: {
        method: 'PATCH',
        path: '/api/aqi/:id/bookmark',
        description: 'Toggle bookmark status of AQI data',
        authentication: 'required'
      },
      note: {
        method: 'PATCH',
        path: '/api/aqi/:id/note',
        description: 'Add/update note for AQI data',
        authentication: 'required',
        body: {
          note: 'string (optional) - User note (max 500 characters)'
        }
      },
      delete: {
        method: 'DELETE',
        path: '/api/aqi/:id',
        description: 'Delete AQI data record',
        authentication: 'required'
      },
      health: {
        method: 'GET',
        path: '/api/aqi/health',
        description: 'Check AQI service health',
        authentication: 'none'
      }
    },
    exampleUsage: {
      fetchAQI: {
        url: 'POST /api/aqi/fetch',
        headers: {
          'Authorization': 'Bearer YOUR_JWT_TOKEN',
          'Content-Type': 'application/json'
        },
        body: {
          lat: 40.7128,
          lon: -74.0060,
          saveToHistory: true
        }
      },
      getHistory: {
        url: 'GET /api/aqi/history?limit=20&page=1',
        headers: {
          'Authorization': 'Bearer YOUR_JWT_TOKEN'
        }
      }
    }
  });
});

module.exports = router;
