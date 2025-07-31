const historyService = require('../services/historyService');
const { validationResult } = require('express-validator');

/**
 * Get user's AQI history
 * @route GET /api/history/user
 * @access Private
 */
exports.getUserHistory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const {
      page = 1,
      limit = 50,
      startDate,
      endDate,
      location,
      minAQI,
      maxAQI
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100), // Max 100 records per page
      startDate,
      endDate,
      location,
      minAQI: minAQI ? parseInt(minAQI) : undefined,
      maxAQI: maxAQI ? parseInt(maxAQI) : undefined
    };

    const result = await historyService.getUserHistory(userId, options);

    res.status(200).json({
      success: true,
      message: 'User history retrieved successfully',
      ...result
    });

  } catch (error) {
    console.error('Error in getUserHistory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user history',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get heatmap data for AQI visualization
 * @route GET /api/history/heatmap
 * @access Public
 */
exports.getHeatmapData = async (req, res) => {
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
      range = '7d',
      minLat,
      maxLat,
      minLon,
      maxLon,
      limit = 100
    } = req.query;

    const options = {
      minLat: minLat ? parseFloat(minLat) : undefined,
      maxLat: maxLat ? parseFloat(maxLat) : undefined,
      minLon: minLon ? parseFloat(minLon) : undefined,
      maxLon: maxLon ? parseFloat(maxLon) : undefined,
      limit: Math.min(parseInt(limit), 500) // Max 500 points for heatmap
    };

    const data = await historyService.getHeatmapData(range, options);

    res.status(200).json({
      success: true,
      message: 'Heatmap data retrieved successfully',
      count: data.length,
      range,
      data
    });

  } catch (error) {
    console.error('Error in getHeatmapData:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve heatmap data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get ML-ready time series data
 * @route GET /api/history/ml-data
 * @access Private (for now, can be made public later)
 */
exports.getMLData = async (req, res) => {
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
      userId,
      lat,
      lon,
      radius,
      days = 30,
      interval = 'hourly'
    } = req.query;

    // If no specific user is requested, use authenticated user's data
    const targetUserId = userId || (req.user ? req.user.id : null);

    const params = {
      city,
      userId: targetUserId,
      lat: lat ? parseFloat(lat) : undefined,
      lon: lon ? parseFloat(lon) : undefined,
      radius: radius ? parseFloat(radius) : undefined,
      days: Math.min(parseInt(days), 365), // Max 1 year of data
      interval
    };

    const data = await historyService.getMLData(params);

    res.status(200).json({
      success: true,
      message: 'ML training data retrieved successfully',
      count: data.length,
      params: {
        city,
        days: params.days,
        interval,
        dataPoints: data.length
      },
      data
    });

  } catch (error) {
    console.error('Error in getMLData:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve ML training data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get trend analysis for AQI data
 * @route GET /api/history/trends
 * @access Private
 */
exports.getTrendAnalysis = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const {
      city,
      days = 30
    } = req.query;

    const params = {
      userId,
      city,
      days: Math.min(parseInt(days), 365)
    };

    const result = await historyService.getTrendAnalysis(params);

    res.status(200).json({
      success: true,
      message: 'Trend analysis retrieved successfully',
      params,
      ...result
    });

  } catch (error) {
    console.error('Error in getTrendAnalysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve trend analysis',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get location-specific statistics
 * @route GET /api/history/location-stats
 * @access Public
 */
exports.getLocationStats = async (req, res) => {
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
      location,
      days = 30
    } = req.query;

    if (!location) {
      return res.status(400).json({
        success: false,
        message: 'Location parameter is required'
      });
    }

    const stats = await historyService.getLocationStats(location, parseInt(days));

    res.status(200).json({
      success: true,
      message: 'Location statistics retrieved successfully',
      location,
      days: parseInt(days),
      stats
    });

  } catch (error) {
    console.error('Error in getLocationStats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve location statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get aggregated global AQI statistics
 * @route GET /api/history/global-stats
 * @access Public
 */
exports.getGlobalStats = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    // Get global aggregated data using MongoDB aggregation
    const AQIData = require('../models/AQIData');
    
    const pipeline = [
      {
        $match: {
          requestTimestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          avgGlobalAQI: { $avg: '$aqi.index' },
          maxAQI: { $max: '$aqi.index' },
          minAQI: { $min: '$aqi.index' },
          uniqueLocations: { $addToSet: '$location.formatted' },
          uniqueUsers: { $addToSet: '$userId' },
          countryStats: {
            $push: {
              country: '$location.country',
              aqi: '$aqi.index'
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalRecords: 1,
          avgGlobalAQI: { $round: ['$avgGlobalAQI', 1] },
          maxAQI: 1,
          minAQI: 1,
          uniqueLocations: { $size: '$uniqueLocations' },
          activeUsers: { $size: '$uniqueUsers' }
        }
      }
    ];

    const result = await AQIData.aggregate(pipeline);
    const stats = result[0] || {
      totalRecords: 0,
      avgGlobalAQI: 0,
      maxAQI: 0,
      minAQI: 0,
      uniqueLocations: 0,
      activeUsers: 0
    };

    res.status(200).json({
      success: true,
      message: 'Global statistics retrieved successfully',
      period: `Last ${days} days`,
      stats
    });

  } catch (error) {
    console.error('Error in getGlobalStats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve global statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
