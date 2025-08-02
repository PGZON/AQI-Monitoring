const mlService = require('../services/mlService');
const { validationResult } = require('express-validator');

/**
 * Get AQI forecast for a location
 * @route POST /api/forecast/predict
 * @access Private/Public (depending on configuration)
 */
exports.getForecast = async (req, res) => {
  const debugId = `forecast-${Date.now()}`;
  console.log(`🔍 [${debugId}] Starting getForecast controller...`);
  console.log(`🔍 [${debugId}] Request method:`, req.method);
  console.log(`🔍 [${debugId}] Request URL:`, req.originalUrl);
  console.log(`🔍 [${debugId}] Request headers:`, req.headers);
  console.log(`🔍 [${debugId}] Request body:`, req.body);
  console.log(`🔍 [${debugId}] Request query:`, req.query);
  
  try {
    console.log(`🔍 [${debugId}] Running validation...`);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error(`❌ [${debugId}] Validation errors:`, errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }
    console.log(`✅ [${debugId}] Validation passed`);

    const {
      city,
      lat,
      lon,
      days = 3,
      autoTrain = true
    } = req.body;

    console.log(`🔍 [${debugId}] Extracted parameters:`, { city, lat, lon, days, autoTrain });

    // Validate parameters
    console.log(`🔍 [${debugId}] Running mlService validation...`);
    const validation = mlService.validateForecastParams({ city, lat, lon, days });
    if (!validation.isValid) {
      console.error(`❌ [${debugId}] ML service validation failed:`, validation.errors);
      return res.status(400).json({
        success: false,
        message: 'Invalid parameters',
        errors: validation.errors
      });
    }
    console.log(`✅ [${debugId}] ML service validation passed`);

    // Get forecast from ML service
    console.log(`🔍 [${debugId}] Calling mlService.getForecast...`);
    const forecastParams = {
      city,
      lat: lat ? parseFloat(lat) : undefined,
      lon: lon ? parseFloat(lon) : undefined,
      days: parseInt(days),
      autoTrain
    };
    console.log(`🔍 [${debugId}] Forecast params:`, forecastParams);
    
    const forecastResult = await mlService.getForecast(forecastParams);
    console.log(`🔍 [${debugId}] ML service result:`, forecastResult);

    // Format response
    console.log(`🔍 [${debugId}] Formatting response...`);
    const response = await mlService.formatForecastResponse(forecastResult, {
      request_params: {
        city,
        lat,
        lon,
        days: parseInt(days),
        auto_train: autoTrain
      }
    });
    console.log(`🔍 [${debugId}] Formatted response:`, response);

    const statusCode = response.success ? 200 : 500;
    console.log(`✅ [${debugId}] Sending response with status:`, statusCode);
    res.status(statusCode).json(response);

  } catch (error) {
    console.error(`❌ [${debugId}] Error in getForecast:`, error);
    console.error(`❌ [${debugId}] Error stack:`, error.stack);
    console.error(`❌ [${debugId}] Error details:`, {
      name: error.name,
      message: error.message,
      code: error.code,
      errno: error.errno,
      syscall: error.syscall
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to generate forecast',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      debugId
    });
  }
};

/**
 * Get forecast for a specific city
 * @route GET /api/forecast/:city
 * @access Public
 */
exports.getForecastByCity = async (req, res) => {
  try {
    const { city } = req.params;
    const { days = 3 } = req.query;

    if (!city) {
      return res.status(400).json({
        success: false,
        message: 'City parameter is required'
      });
    }

    // Get forecast from ML service
    const forecastResult = await mlService.getForecastByCity(city, parseInt(days));

    // Format response
    const response = mlService.formatForecastResponse(forecastResult, {
      request_params: {
        city,
        days: parseInt(days)
      }
    });

    const statusCode = response.success ? 200 : 500;
    res.status(statusCode).json(response);

  } catch (error) {
    console.error('Error in getForecastByCity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate forecast',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Train ML models for a location
 * @route POST /api/forecast/train
 * @access Private (Admin only)
 */
exports.trainModel = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      city,
      lat,
      lon,
      days = 30,
      forceRetrain = false
    } = req.body;

    // Validate parameters
    const validation = mlService.validateForecastParams({ city, lat, lon, days });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid parameters',
        errors: validation.errors
      });
    }

    // Check ML service availability
    const isMLAvailable = await mlService.checkMLServiceHealth();
    if (!isMLAvailable) {
      return res.status(503).json({
        success: false,
        message: 'ML service is currently unavailable. Please try again later.'
      });
    }

    // Train model
    const trainingResult = await mlService.trainModel({
      city,
      lat: lat ? parseFloat(lat) : undefined,
      lon: lon ? parseFloat(lon) : undefined,
      days: parseInt(days),
      forceRetrain
    });

    const statusCode = trainingResult.success ? 200 : 500;
    res.status(statusCode).json({
      success: trainingResult.success,
      message: trainingResult.success ? 'Model training completed' : 'Model training failed',
      data: trainingResult.data,
      error: trainingResult.error,
      request_params: {
        city,
        lat,
        lon,
        days: parseInt(days),
        force_retrain: forceRetrain
      }
    });

  } catch (error) {
    console.error('Error in trainModel:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to train model',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get ML models information
 * @route GET /api/forecast/models
 * @access Private (Admin only)
 */
exports.getModelsInfo = async (req, res) => {
  try {
    const modelsInfo = await mlService.getModelsInfo();

    const statusCode = modelsInfo.success ? 200 : 503;
    res.status(statusCode).json({
      success: modelsInfo.success,
      message: modelsInfo.success ? 'Models information retrieved' : 'Failed to get models info',
      data: modelsInfo.data,
      error: modelsInfo.error,
      ml_service_status: await mlService.checkMLServiceHealth()
    });

  } catch (error) {
    console.error('Error in getModelsInfo:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve models information',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Retrain all models
 * @route POST /api/forecast/retrain-all
 * @access Private (Admin only)
 */
exports.retrainAllModels = async (req, res) => {
  try {
    // Check ML service availability
    const isMLAvailable = await mlService.checkMLServiceHealth();
    if (!isMLAvailable) {
      return res.status(503).json({
        success: false,
        message: 'ML service is currently unavailable. Please try again later.'
      });
    }

    const retrainResult = await mlService.retrainAllModels();

    const statusCode = retrainResult.success ? 200 : 500;
    res.status(statusCode).json({
      success: retrainResult.success,
      message: retrainResult.success ? 'Bulk retraining completed' : 'Bulk retraining failed',
      data: retrainResult.data,
      error: retrainResult.error,
      initiated_by: req.user ? req.user.id : 'system',
      initiated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in retrainAllModels:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate bulk retraining',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get ML service health status
 * @route GET /api/forecast/health
 * @access Public
 */
exports.getMLHealth = async (req, res) => {
  try {
    const isMLAvailable = await mlService.checkMLServiceHealth();
    
    res.status(200).json({
      success: true,
      message: 'ML service health check completed',
      ml_service: {
        available: isMLAvailable,
        url: process.env.ML_SERVICE_URL || 'http://localhost:5001',
        last_check: new Date().toISOString()
      },
      features: [
        'AQI forecasting (1-7 days)',
        'Multiple ML models (Linear, LSTM)',
        'Auto-training capabilities',
        'Location-based predictions',
        'Fallback forecasting'
      ]
    });

  } catch (error) {
    console.error('Error in getMLHealth:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get AQI prediction using trained LSTM model
 * @route POST /api/forecast/lstm-predict
 * @access Public
 */
exports.getLSTMPrediction = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { lat, lon, currentData = {} } = req.body;

    // Get prediction from ML service
    const predictionResult = await mlService.getPrediction({
      lat: parseFloat(lat),
      lon: parseFloat(lon),
      currentData
    });

    if (!predictionResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Prediction failed',
        error: predictionResult.error
      });
    }

    res.json({
      success: true,
      data: {
        ...predictionResult.data,
        generated_at: new Date().toISOString(),
        coordinates: { lat: parseFloat(lat), lon: parseFloat(lon) }
      },
      source: predictionResult.source,
      request_id: req.headers['x-request-id'] || Date.now().toString()
    });

  } catch (error) {
    console.error('Error in getLSTMPrediction:', error);
    res.status(500).json({
      success: false,
      message: 'LSTM prediction failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get batch AQI predictions using trained LSTM model
 * @route POST /api/forecast/batch-predict
 * @access Public
 */
exports.getBatchPredictions = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { locations } = req.body;

    if (!Array.isArray(locations) || locations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Locations array is required'
      });
    }

    // Get batch predictions from ML service
    const batchResult = await mlService.getBatchPredictions(locations);

    if (!batchResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Batch prediction failed',
        error: batchResult.error
      });
    }

    res.json({
      success: true,
      data: {
        predictions: batchResult.data,
        total_locations: locations.length,
        generated_at: new Date().toISOString()
      },
      source: batchResult.source,
      request_id: req.headers['x-request-id'] || Date.now().toString()
    });

  } catch (error) {
    console.error('Error in getBatchPredictions:', error);
    res.status(500).json({
      success: false,
      message: 'Batch prediction failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
