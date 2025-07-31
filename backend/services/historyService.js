const AQIData = require('../models/AQIData');
const mongoose = require('mongoose');

class HistoryService {
  /**
   * Get user's AQI history with pagination and filtering
   * @param {string} userId - User ID
   * @param {object} options - Query options
   * @returns {Promise<object>} History data with pagination info
   */
  async getUserHistory(userId, options = {}) {
    const {
      page = 1,
      limit = 50,
      startDate,
      endDate,
      location,
      minAQI,
      maxAQI
    } = options;

    const skip = (page - 1) * limit;
    const query = { userId: new mongoose.Types.ObjectId(userId) };

    // Date range filter
    if (startDate || endDate) {
      query.requestTimestamp = {};
      if (startDate) query.requestTimestamp.$gte = new Date(startDate);
      if (endDate) query.requestTimestamp.$lte = new Date(endDate);
    }

    // Location filter
    if (location) {
      query['location.formatted'] = { $regex: location, $options: 'i' };
    }

    // AQI range filter
    if (minAQI !== undefined || maxAQI !== undefined) {
      query['aqi.index'] = {};
      if (minAQI !== undefined) query['aqi.index'].$gte = minAQI;
      if (maxAQI !== undefined) query['aqi.index'].$lte = maxAQI;
    }

    const [data, total] = await Promise.all([
      AQIData.find(query)
        .sort({ requestTimestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('userId', 'name email')
        .lean(),
      AQIData.countDocuments(query)
    ]);

    return {
      data,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Get heatmap data with aggregated AQI values by location
   * @param {string} range - Time range (1d, 7d, 30d)
   * @param {object} options - Additional options
   * @returns {Promise<Array>} Heatmap data
   */
  async getHeatmapData(range = '7d', options = {}) {
    const {
      minLat,
      maxLat,
      minLon,
      maxLon,
      limit = 100
    } = options;

    // Calculate start date based on range
    const rangeMap = {
      '1d': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90
    };

    const days = rangeMap[range] || 7;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const matchQuery = {
      requestTimestamp: { $gte: startDate }
    };

    // Geographic bounds filter
    if (minLat !== undefined && maxLat !== undefined && 
        minLon !== undefined && maxLon !== undefined) {
      matchQuery['coordinates.latitude'] = { $gte: minLat, $lte: maxLat };
      matchQuery['coordinates.longitude'] = { $gte: minLon, $lte: maxLon };
    }

    const pipeline = [
      { $match: matchQuery },
      {
        $group: {
          _id: {
            location: '$location.formatted',
            city: '$location.city',
            country: '$location.country',
            // Round coordinates to reduce precision for grouping
            lat: { $round: ['$coordinates.latitude', 4] },
            lon: { $round: ['$coordinates.longitude', 4] }
          },
          avgAQI: { $avg: '$aqi.index' },
          maxAQI: { $max: '$aqi.index' },
          minAQI: { $min: '$aqi.index' },
          count: { $sum: 1 },
          lastUpdated: { $max: '$requestTimestamp' },
          avgPM25: { $avg: '$pollutants.pm2_5.value' },
          avgPM10: { $avg: '$pollutants.pm10.value' }
        }
      },
      {
        $project: {
          _id: 0,
          location: '$_id.location',
          city: '$_id.city',
          country: '$_id.country',
          lat: '$_id.lat',
          lon: '$_id.lon',
          avgAQI: { $round: ['$avgAQI', 1] },
          maxAQI: '$maxAQI',
          minAQI: '$minAQI',
          count: '$count',
          lastUpdated: '$lastUpdated',
          avgPM25: { $round: ['$avgPM25', 1] },
          avgPM10: { $round: ['$avgPM10', 1] },
          level: {
            $switch: {
              branches: [
                { case: { $lte: ['$avgAQI', 50] }, then: 'Good' },
                { case: { $lte: ['$avgAQI', 100] }, then: 'Moderate' },
                { case: { $lte: ['$avgAQI', 150] }, then: 'Unhealthy for Sensitive Groups' },
                { case: { $lte: ['$avgAQI', 200] }, then: 'Unhealthy' },
                { case: { $lte: ['$avgAQI', 300] }, then: 'Very Unhealthy' }
              ],
              default: 'Hazardous'
            }
          }
        }
      },
      { $sort: { avgAQI: -1 } },
      { $limit: limit }
    ];

    return await AQIData.aggregate(pipeline);
  }

  /**
   * Get ML-ready time series data for a specific location or user
   * @param {object} params - Query parameters
   * @returns {Promise<Array>} Time series data
   */
  async getMLData(params = {}) {
    const {
      city,
      userId,
      lat,
      lon,
      radius = 0.1, // degrees (~11km)
      days = 30,
      interval = 'hourly' // hourly, daily
    } = params;

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const matchQuery = {
      requestTimestamp: { $gte: startDate }
    };

    // Filter by user
    if (userId) {
      matchQuery.userId = new mongoose.Types.ObjectId(userId);
    }

    // Filter by city
    if (city) {
      matchQuery['location.city'] = { $regex: city, $options: 'i' };
    }

    // Filter by coordinates
    if (lat !== undefined && lon !== undefined) {
      matchQuery['coordinates.latitude'] = {
        $gte: parseFloat(lat) - radius,
        $lte: parseFloat(lat) + radius
      };
      matchQuery['coordinates.longitude'] = {
        $gte: parseFloat(lon) - radius,
        $lte: parseFloat(lon) + radius
      };
    }

    // Group by time interval
    const dateGrouping = interval === 'daily'
      ? {
          year: { $year: '$requestTimestamp' },
          month: { $month: '$requestTimestamp' },
          day: { $dayOfMonth: '$requestTimestamp' }
        }
      : {
          year: { $year: '$requestTimestamp' },
          month: { $month: '$requestTimestamp' },
          day: { $dayOfMonth: '$requestTimestamp' },
          hour: { $hour: '$requestTimestamp' }
        };

    const pipeline = [
      { $match: matchQuery },
      {
        $group: {
          _id: dateGrouping,
          avgAQI: { $avg: '$aqi.index' },
          avgPM25: { $avg: '$pollutants.pm2_5.value' },
          avgPM10: { $avg: '$pollutants.pm10.value' },
          avgCO: { $avg: '$pollutants.co.value' },
          avgNO2: { $avg: '$pollutants.no2.value' },
          avgO3: { $avg: '$pollutants.o3.value' },
          avgSO2: { $avg: '$pollutants.so2.value' },
          avgTemp: { $avg: '$weather.temperature' },
          avgHumidity: { $avg: '$weather.humidity' },
          avgPressure: { $avg: '$weather.pressure' },
          avgWindSpeed: { $avg: '$weather.windSpeed' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          timestamp: {
            $dateFromParts: interval === 'daily'
              ? {
                  year: '$_id.year',
                  month: '$_id.month',
                  day: '$_id.day'
                }
              : {
                  year: '$_id.year',
                  month: '$_id.month',
                  day: '$_id.day',
                  hour: '$_id.hour'
                }
          },
          aqi: { $round: ['$avgAQI', 2] },
          pollutants: {
            pm2_5: { $round: ['$avgPM25', 2] },
            pm10: { $round: ['$avgPM10', 2] },
            co: { $round: ['$avgCO', 2] },
            no2: { $round: ['$avgNO2', 2] },
            o3: { $round: ['$avgO3', 2] },
            so2: { $round: ['$avgSO2', 2] }
          },
          weather: {
            temperature: { $round: ['$avgTemp', 1] },
            humidity: { $round: ['$avgHumidity', 1] },
            pressure: { $round: ['$avgPressure', 1] },
            windSpeed: { $round: ['$avgWindSpeed', 1] }
          },
          dataPoints: '$count'
        }
      },
      { $sort: { timestamp: 1 } }
    ];

    return await AQIData.aggregate(pipeline);
  }

  /**
   * Get time series trend analysis
   * @param {object} params - Query parameters
   * @returns {Promise<object>} Trend analysis data
   */
  async getTrendAnalysis(params = {}) {
    const {
      userId,
      city,
      days = 30
    } = params;

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const matchQuery = {
      requestTimestamp: { $gte: startDate }
    };

    if (userId) {
      matchQuery.userId = new mongoose.Types.ObjectId(userId);
    }

    if (city) {
      matchQuery['location.city'] = { $regex: city, $options: 'i' };
    }

    const pipeline = [
      { $match: matchQuery },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$requestTimestamp'
            }
          },
          avgAQI: { $avg: '$aqi.index' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $group: {
          _id: null,
          data: {
            $push: {
              date: '$_id',
              aqi: { $round: ['$avgAQI', 1] },
              count: '$count'
            }
          },
          avgAQI: { $avg: '$avgAQI' },
          totalDays: { $sum: 1 }
        }
      }
    ];

    const result = await AQIData.aggregate(pipeline);
    
    if (!result.length) {
      return {
        trend: 'stable',
        data: [],
        analysis: {
          avgAQI: 0,
          totalDays: 0,
          direction: 'no data'
        }
      };
    }

    const data = result[0].data;
    const analysis = this.calculateTrend(data);

    return {
      trend: analysis.trend,
      data,
      analysis: {
        avgAQI: Math.round(result[0].avgAQI * 10) / 10,
        totalDays: result[0].totalDays,
        direction: analysis.direction,
        slope: analysis.slope
      }
    };
  }

  /**
   * Calculate trend direction from time series data
   * @param {Array} data - Time series data
   * @returns {object} Trend analysis
   */
  calculateTrend(data) {
    if (data.length < 2) {
      return { trend: 'stable', direction: 'insufficient data', slope: 0 };
    }

    // Simple linear regression to calculate trend
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    data.forEach((point, index) => {
      const x = index;
      const y = point.aqi;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const threshold = 0.5; // AQI points per day

    let trend, direction;
    if (Math.abs(slope) < threshold) {
      trend = 'stable';
      direction = 'stable';
    } else if (slope > 0) {
      trend = 'increasing';
      direction = slope > threshold * 2 ? 'rapidly increasing' : 'slowly increasing';
    } else {
      trend = 'decreasing';
      direction = slope < -threshold * 2 ? 'rapidly decreasing' : 'slowly decreasing';
    }

    return { trend, direction, slope: Math.round(slope * 100) / 100 };
  }

  /**
   * Get location statistics
   * @param {string} location - Location name
   * @param {number} days - Number of days to analyze
   * @returns {Promise<object>} Location statistics
   */
  async getLocationStats(location, days = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const pipeline = [
      {
        $match: {
          'location.formatted': { $regex: location, $options: 'i' },
          requestTimestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          avgAQI: { $avg: '$aqi.index' },
          maxAQI: { $max: '$aqi.index' },
          minAQI: { $min: '$aqi.index' },
          goodDays: {
            $sum: {
              $cond: [{ $lte: ['$aqi.index', 50] }, 1, 0]
            }
          },
          moderateDays: {
            $sum: {
              $cond: [
                { $and: [{ $gt: ['$aqi.index', 50] }, { $lte: ['$aqi.index', 100] }] },
                1, 0
              ]
            }
          },
          unhealthyDays: {
            $sum: {
              $cond: [{ $gt: ['$aqi.index', 100] }, 1, 0]
            }
          }
        }
      }
    ];

    const result = await AQIData.aggregate(pipeline);
    return result[0] || {
      totalRecords: 0,
      avgAQI: 0,
      maxAQI: 0,
      minAQI: 0,
      goodDays: 0,
      moderateDays: 0,
      unhealthyDays: 0
    };
  }
}

module.exports = new HistoryService();
