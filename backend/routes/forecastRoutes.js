const express = require('express');
const { body, query, param } = require('express-validator');
const forecastController = require('../controllers/forecastController');
const { protect, optionalAuth, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation middleware
const validateForecastRequest = [
  body('city')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('City name must be between 1 and 100 characters'),
  body('lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('lon')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('days')
    .optional()
    .isInt({ min: 1, max: 7 })
    .withMessage('Forecast days must be between 1 and 7'),
  body('autoTrain')
    .optional()
    .isBoolean()
    .withMessage('autoTrain must be a boolean value')
];

const validateTrainingRequest = [
  body('city')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('City name must be between 1 and 100 characters'),
  body('lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('lon')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('days')
    .optional()
    .isInt({ min: 7, max: 90 })
    .withMessage('Training days must be between 7 and 90'),
  body('forceRetrain')
    .optional()
    .isBoolean()
    .withMessage('forceRetrain must be a boolean value')
];

const validateCityParam = [
  param('city')
    .notEmpty()
    .isLength({ min: 1, max: 100 })
    .withMessage('City name is required and must be between 1 and 100 characters')
];

const validateForecastQuery = [
  query('days')
    .optional()
    .isInt({ min: 1, max: 7 })
    .withMessage('Forecast days must be between 1 and 7')
];

// Routes

/**
 * @route   POST /api/forecast/predict
 * @desc    Get AQI forecast for a location using ML models
 * @access  Public (with optional authentication for better features)
 * @body    { city?, lat?, lon?, days?, autoTrain? }
 */
router.post('/predict', 
  optionalAuth,  // Optional authentication - works for both authenticated and public users
  validateForecastRequest, 
  forecastController.getForecast
);

/**
 * @route   POST /api/forecast/lstm-predict
 * @desc    Get AQI prediction using trained LSTM model
 * @access  Public (with optional authentication)
 * @body    { lat, lon, currentData? }
 */
router.post('/lstm-predict', 
  optionalAuth,
  [
    body('lat')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude is required and must be between -90 and 90'),
    body('lon')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude is required and must be between -180 and 180'),
    body('currentData')
      .optional()
      .isObject()
      .withMessage('currentData must be an object')
  ],
  forecastController.getLSTMPrediction
);

/**
 * @route   POST /api/forecast/batch-predict
 * @desc    Get AQI predictions for multiple locations using LSTM model
 * @access  Public (with optional authentication)
 * @body    { locations: [{ lat, lon, currentData? }] }
 */
router.post('/batch-predict', 
  optionalAuth,
  [
    body('locations')
      .isArray({ min: 1, max: 10 })
      .withMessage('Locations must be an array with 1-10 items'),
    body('locations.*.lat')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Each location must have valid latitude'),
    body('locations.*.lon')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Each location must have valid longitude')
  ],
  forecastController.getBatchPredictions
);

/**
 * @route   POST /api/forecast/train
 * @desc    Train ML models for a specific location
 * @access  Private (Admin only - training is resource intensive)
 * @body    { city?, lat?, lon?, days?, forceRetrain? }
 */
router.post('/train', 
  protect,
  authorizeRoles('admin'), 
  validateTrainingRequest, 
  forecastController.trainModel
);

/**
 * @route   GET /api/forecast/models
 * @desc    Get information about available ML models
 * @access  Private (Admin only)
 */
router.get('/models', 
  protect,
  authorizeRoles('admin'), 
  forecastController.getModelsInfo
);

/**
 * @route   POST /api/forecast/retrain-all
 * @desc    Retrain all ML models (bulk operation)
 * @access  Private (Admin only)
 */
router.post('/retrain-all', 
  protect,
  authorizeRoles('admin'), 
  forecastController.retrainAllModels
);

/**
 * @route   GET /api/forecast/health
 * @desc    Check ML service health and capabilities
 * @access  Public
 */
router.get('/health', 
  forecastController.getMLHealth
);

/**
 * @route   GET /api/forecast/
 * @desc    Forecast service documentation and endpoints
 * @access  Public
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AQI ML Forecasting Service',
    version: '1.0.0',
    ml_service_url: process.env.ML_SERVICE_URL || 'http://localhost:5001',
    endpoints: {
      predict: {
        method: 'POST',
        path: '/api/forecast/predict',
        description: 'Get AQI forecast using ML models',
        access: 'Public',
        body: {
          city: 'string (optional)',
          lat: 'number (optional)',
          lon: 'number (optional)', 
          days: 'number (1-7, default: 3)',
          autoTrain: 'boolean (default: true)'
        }
      },
      city_forecast: {
        method: 'GET',
        path: '/api/forecast/:city',
        description: 'Get forecast for specific city',
        access: 'Public',
        params: { city: 'string (required)' },
        query: { days: 'number (1-7, default: 3)' }
      },
      train: {
        method: 'POST',
        path: '/api/forecast/train',
        description: 'Train ML models for location',
        access: 'Admin only'
      },
      models: {
        method: 'GET',
        path: '/api/forecast/models',
        description: 'Get ML models information',
        access: 'Admin only'
      },
      retrain_all: {
        method: 'POST',
        path: '/api/forecast/retrain-all',
        description: 'Retrain all ML models',
        access: 'Admin only'
      },
      health: {
        method: 'GET',
        path: '/api/forecast/health',
        description: 'ML service health check',
        access: 'Public'
      }
    },
    features: [
      'Multi-model ML forecasting (Linear Regression, LSTM)',
      'Automatic model training and retraining',
      'Location-based predictions (city or coordinates)',
      'Fallback forecasting when ML service unavailable',
      'Forecast validation and confidence scoring',
      'Trend analysis and prediction reliability',
      'Support for 1-7 day forecasts'
    ],
    example_requests: {
      predict_by_city: {
        method: 'POST',
        url: '/api/forecast/predict',
        body: {
          city: 'Mumbai',
          days: 3,
          autoTrain: true
        }
      },
      predict_by_coordinates: {
        method: 'POST',
        url: '/api/forecast/predict',
        body: {
          lat: 19.0760,
          lon: 72.8777,
          days: 5
        }
      },
      city_forecast: {
        method: 'GET',
        url: '/api/forecast/Mumbai?days=3'
      }
    }
  });
});

/**
 * @route   GET /api/forecast/:city
 * @desc    Get AQI forecast for a specific city (convenience endpoint)
 * @access  Public
 * @params  city (required), days (optional query param)
 * IMPORTANT: This route MUST be last to avoid conflicts with specific routes above
 */
router.get('/:city', 
  validateCityParam,
  validateForecastQuery,
  forecastController.getForecastByCity
);

/**
 * @route   GET /api/forecast/models
 * @desc    Get information about available ML models
 * @access  Private (Admin only)
 */
router.get('/models', 
  protect,
  authorizeRoles('admin'), 
  forecastController.getModelsInfo
);

/**
 * @route   POST /api/forecast/retrain-all
 * @desc    Retrain all ML models (bulk operation)
 * @access  Private (Admin only)
 */
router.post('/retrain-all', 
  protect,
  authorizeRoles('admin'), 
  forecastController.retrainAllModels
);

/**
 * @route   GET /api/forecast/health
 * @desc    Check ML service health and capabilities
 * @access  Public
 */
router.get('/health', 
  forecastController.getMLHealth
);

/**
 * @route   GET /api/forecast/
 * @desc    Forecast service documentation and endpoints
 * @access  Public
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AQI ML Forecasting Service',
    version: '1.0.0',
    ml_service_url: process.env.ML_SERVICE_URL || 'http://localhost:5001',
    endpoints: {
      predict: {
        method: 'POST',
        path: '/api/forecast/predict',
        description: 'Get AQI forecast using ML models',
        access: 'Public',
        body: {
          city: 'string (optional)',
          lat: 'number (optional)',
          lon: 'number (optional)', 
          days: 'number (1-7, default: 3)',
          autoTrain: 'boolean (default: true)'
        }
      },
      city_forecast: {
        method: 'GET',
        path: '/api/forecast/:city',
        description: 'Get forecast for specific city',
        access: 'Public',
        params: { city: 'string (required)' },
        query: { days: 'number (1-7, default: 3)' }
      },
      train: {
        method: 'POST',
        path: '/api/forecast/train',
        description: 'Train ML models for location',
        access: 'Admin only'
      },
      models: {
        method: 'GET',
        path: '/api/forecast/models',
        description: 'Get ML models information',
        access: 'Admin only'
      },
      retrain_all: {
        method: 'POST',
        path: '/api/forecast/retrain-all',
        description: 'Retrain all ML models',
        access: 'Admin only'
      },
      health: {
        method: 'GET',
        path: '/api/forecast/health',
        description: 'ML service health check',
        access: 'Public'
      }
    },
    features: [
      'Multi-model ML forecasting (Linear Regression, LSTM)',
      'Automatic model training and retraining',
      'Location-based predictions (city or coordinates)',
      'Fallback forecasting when ML service unavailable',
      'Forecast validation and confidence scoring',
      'Trend analysis and prediction reliability',
      'Support for 1-7 day forecasts'
    ],
    example_requests: {
      predict_by_city: {
        method: 'POST',
        url: '/api/forecast/predict',
        body: {
          city: 'Mumbai',
          days: 3,
          autoTrain: true
        }
      },
      predict_by_coordinates: {
        method: 'POST',
        url: '/api/forecast/predict',
        body: {
          lat: 19.0760,
          lon: 72.8777,
          days: 5
        }
      },
      city_forecast: {
        method: 'GET',
        url: '/api/forecast/Mumbai?days=3'
      }
    }
  });
});

module.exports = router;
