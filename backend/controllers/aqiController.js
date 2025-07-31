const AQIData = require('../models/AQIData');
const aqiService = require('../services/aqiService');

/**
 * @desc    Fetch AQI data for given coordinates
 * @route   POST /api/aqi/fetch
 * @access  Private
 */
const fetchAQI = async (req, res, next) => {
  try {
    const { lat, lon, saveToHistory = true } = req.body;
    const userId = req.user.id;

    console.log(`🌍 AQI fetch request from user ${userId} for coordinates: ${lat}, ${lon}`);

    // Validate input
    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    if (!aqiService.isValidCoordinates(lat, lon)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180'
      });
    }

    // Check if we have recent data for this location (within 1 hour)
    const recentData = await AQIData.findOne({
      userId,
      'coordinates.latitude': { $gte: lat - 0.01, $lte: lat + 0.01 },
      'coordinates.longitude': { $gte: lon - 0.01, $lte: lon + 0.01 },
      requestTimestamp: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
    }).sort({ requestTimestamp: -1 });

    if (recentData && recentData.isRecent(60)) {
      console.log('📋 Returning cached recent data');
      return res.status(200).json({
        success: true,
        message: 'AQI data retrieved from recent cache',
        data: {
          ...recentData.toObject(),
          health: aqiService.getHealthRecommendations(recentData.aqi.index),
          cached: true
        }
      });
    }

    // Fetch fresh data from external API
    const aqiData = await aqiService.fetchCompleteAQIData(lat, lon);

    // Save to database if requested
    let savedData = null;
    if (saveToHistory) {
      savedData = await AQIData.create({
        userId,
        ...aqiData
      });
      console.log('💾 AQI data saved to database');
    }

    // Add health recommendations
    const healthRecommendations = aqiService.getHealthRecommendations(aqiData.aqi.index);

    console.log('✅ AQI data fetched and processed successfully');

    res.status(200).json({
      success: true,
      message: 'AQI data fetched successfully',
      data: {
        ...(savedData ? savedData.toObject() : aqiData),
        health: healthRecommendations,
        cached: false
      }
    });

  } catch (error) {
    console.error('❌ Error fetching AQI data:', error.message);
    next(error);
  }
};

/**
 * @desc    Get user's AQI history
 * @route   GET /api/aqi/history
 * @access  Private
 */
const getAQIHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { 
      limit = 50, 
      startDate, 
      endDate, 
      page = 1 
    } = req.query;

    console.log(`📊 Fetching AQI history for user ${userId}`);

    const pageLimit = Math.min(parseInt(limit), 100); // Max 100 records per page
    const skip = (parseInt(page) - 1) * pageLimit;

    const history = await AQIData.getUserHistory(userId, pageLimit, startDate, endDate)
      .skip(skip);

    const totalCount = await AQIData.countDocuments({
      userId,
      ...(startDate || endDate ? {
        requestTimestamp: {
          ...(startDate && { $gte: new Date(startDate) }),
          ...(endDate && { $lte: new Date(endDate) })
        }
      } : {})
    });

    res.status(200).json({
      success: true,
      message: 'AQI history retrieved successfully',
      data: {
        history,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / pageLimit),
          totalRecords: totalCount,
          recordsPerPage: pageLimit
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching AQI history:', error.message);
    next(error);
  }
};

/**
 * @desc    Get nearby AQI data
 * @route   GET /api/aqi/nearby
 * @access  Private
 */
const getNearbyAQI = async (req, res, next) => {
  try {
    const { lat, lon, radius = 10, limit = 20 } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    if (!aqiService.isValidCoordinates(lat, lon)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates provided'
      });
    }

    console.log(`🗺️ Fetching nearby AQI data for: ${lat}, ${lon} (radius: ${radius}km)`);

    const nearbyData = await AQIData.getNearbyData(
      parseFloat(lat), 
      parseFloat(lon), 
      parseInt(radius), 
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      message: 'Nearby AQI data retrieved successfully',
      data: {
        center: {
          latitude: parseFloat(lat),
          longitude: parseFloat(lon)
        },
        radius: parseInt(radius),
        results: nearbyData
      }
    });

  } catch (error) {
    console.error('❌ Error fetching nearby AQI data:', error.message);
    next(error);
  }
};

/**
 * @desc    Get user's AQI analytics
 * @route   GET /api/aqi/analytics
 * @access  Private
 */
const getAQIAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;

    console.log(`📈 Generating AQI analytics for user ${userId} (${days} days)`);

    const analytics = await AQIData.getAnalytics(userId, parseInt(days));

    res.status(200).json({
      success: true,
      message: 'AQI analytics generated successfully',
      data: {
        period: {
          days: parseInt(days),
          startDate: new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000),
          endDate: new Date()
        },
        analytics
      }
    });

  } catch (error) {
    console.error('❌ Error generating AQI analytics:', error.message);
    next(error);
  }
};

/**
 * @desc    Bookmark/unbookmark AQI data
 * @route   PATCH /api/aqi/:id/bookmark
 * @access  Private
 */
const toggleBookmark = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const aqiData = await AQIData.findOne({ _id: id, userId });
    
    if (!aqiData) {
      return res.status(404).json({
        success: false,
        message: 'AQI data not found'
      });
    }

    aqiData.isBookmarked = !aqiData.isBookmarked;
    await aqiData.save();

    console.log(`🔖 AQI data ${aqiData.isBookmarked ? 'bookmarked' : 'unbookmarked'} by user ${userId}`);

    res.status(200).json({
      success: true,
      message: `AQI data ${aqiData.isBookmarked ? 'bookmarked' : 'unbookmarked'} successfully`,
      data: {
        id: aqiData._id,
        isBookmarked: aqiData.isBookmarked
      }
    });

  } catch (error) {
    console.error('❌ Error toggling bookmark:', error.message);
    next(error);
  }
};

/**
 * @desc    Add note to AQI data
 * @route   PATCH /api/aqi/:id/note
 * @access  Private
 */
const updateNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const userId = req.user.id;

    const aqiData = await AQIData.findOneAndUpdate(
      { _id: id, userId },
      { userNotes: note },
      { new: true, runValidators: true }
    );
    
    if (!aqiData) {
      return res.status(404).json({
        success: false,
        message: 'AQI data not found'
      });
    }

    console.log(`📝 Note updated for AQI data by user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Note updated successfully',
      data: {
        id: aqiData._id,
        userNotes: aqiData.userNotes
      }
    });

  } catch (error) {
    console.error('❌ Error updating note:', error.message);
    next(error);
  }
};

/**
 * @desc    Delete AQI data record
 * @route   DELETE /api/aqi/:id
 * @access  Private
 */
const deleteAQIData = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const aqiData = await AQIData.findOneAndDelete({ _id: id, userId });
    
    if (!aqiData) {
      return res.status(404).json({
        success: false,
        message: 'AQI data not found'
      });
    }

    console.log(`🗑️ AQI data deleted by user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'AQI data deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting AQI data:', error.message);
    next(error);
  }
};

/**
 * @desc    Get AQI service health status
 * @route   GET /api/aqi/health
 * @access  Public
 */
const getServiceHealth = async (req, res, next) => {
  try {
    // Test API connectivity
    const testCoords = { lat: 40.7128, lon: -74.0060 }; // New York City
    
    let apiStatus = 'unknown';
    try {
      await aqiService.fetchAQIData(testCoords.lat, testCoords.lon);
      apiStatus = 'operational';
    } catch (error) {
      apiStatus = 'degraded';
    }

    res.status(200).json({
      success: true,
      message: 'AQI service health check',
      data: {
        service: 'aqi-service',
        status: apiStatus,
        timestamp: new Date().toISOString(),
        endpoints: {
          openWeatherMap: aqiService.endpoints.openWeatherAQI,
          openStreetMap: aqiService.endpoints.osmReverse
        }
      }
    });

  } catch (error) {
    console.error('❌ Error checking service health:', error.message);
    next(error);
  }
};

module.exports = {
  fetchAQI,
  getAQIHistory,
  getNearbyAQI,
  getAQIAnalytics,
  toggleBookmark,
  updateNote,
  deleteAQIData,
  getServiceHealth
};
