/**
 * Weather Routes - API endpoints for weather data
 */

const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');

// Current weather
router.get('/current', weatherController.getCurrentWeather);

// Weather forecast
router.get('/forecast', weatherController.getWeatherForecast);

// Hourly forecast
router.get('/hourly', weatherController.getHourlyForecast);

// Weather alerts
router.get('/alerts', weatherController.getWeatherAlerts);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Weather API is healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
