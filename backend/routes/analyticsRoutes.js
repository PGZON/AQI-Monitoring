const express = require('express');
const router = express.Router();

// Mock analytics controller for now
const AnalyticsController = {
  // Get historical analytics
  getHistoricalAnalytics: async (req, res) => {
    try {
      const { days = 30, latitude, longitude } = req.query;
      
      // Mock historical data
      const mockData = {
        success: true,
        data: {
          period: `${days} days`,
          averageAQI: Math.round(45 + Math.random() * 30),
          trend: Math.random() > 0.5 ? 'improving' : 'declining',
          dataPoints: Array.from({ length: parseInt(days) }, (_, i) => {
            const date = new Date(Date.now() - (parseInt(days) - i - 1) * 24 * 60 * 60 * 1000);
            return {
              date: date.toISOString().split('T')[0],
              time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              datetime: date.toISOString(),
              aqi: Math.round(30 + Math.random() * 70),
              pm25: Math.round(10 + Math.random() * 40),
              pm10: Math.round(20 + Math.random() * 60),
              no2: Math.round(5 + Math.random() * 30),
              o3: Math.round(10 + Math.random() * 50),
              co: Math.round(1 + Math.random() * 8),
              so2: Math.round(2 + Math.random() * 15)
            };
          }),
          location: latitude && longitude ? `${latitude}, ${longitude}` : 'Default Location'
        }
      };
      
      res.json(mockData);
    } catch (error) {
      console.error('Analytics historical error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch historical analytics' });
    }
  },

  // Get weekly comparison
  getWeeklyComparison: async (req, res) => {
    try {
      const { latitude, longitude } = req.query;
      
      // Mock weekly comparison data
      const mockData = {
        success: true,
        data: {
          thisWeek: {
            average: Math.round(45 + Math.random() * 20),
            bestDay: Math.round(25 + Math.random() * 30),
            worstDay: Math.round(60 + Math.random() * 40),
            data: Array.from({ length: 7 }, (_, i) => ({
              day: i,
              aqi: Math.round(35 + Math.random() * 40),
              date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }))
          },
          lastWeek: {
            average: Math.round(40 + Math.random() * 25),
            bestDay: Math.round(20 + Math.random() * 35),
            worstDay: Math.round(65 + Math.random() * 35),
            data: Array.from({ length: 7 }, (_, i) => ({
              day: i,
              aqi: Math.round(30 + Math.random() * 45),
              date: new Date(Date.now() - (13 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }))
          },
          change: {
            percentage: Math.round((Math.random() - 0.5) * 20),
            direction: Math.random() > 0.5 ? 'better' : 'worse',
            arrow: Math.random() > 0.5 ? '↓' : '↑'
          },
          location: latitude && longitude ? `${latitude}, ${longitude}` : 'Default Location'
        }
      };
      
      res.json(mockData);
    } catch (error) {
      console.error('Analytics weekly comparison error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch weekly comparison' });
    }
  },

  // Get location history
  getLocationHistory: async (req, res) => {
    try {
      const { latitude, longitude, days = 30 } = req.query;
      
      // Mock location history data
      const mockData = {
        success: true,
        data: {
          locations: [
            {
              name: 'Downtown',
              latitude: 40.7128,
              longitude: -74.0060,
              lastAQI: Math.round(45 + Math.random() * 30),
              lastViewed: new Date().toISOString(),
              viewCount: Math.round(1 + Math.random() * 10),
              isFavorite: Math.random() > 0.7
            },
            {
              name: 'Uptown',
              latitude: 40.7589,
              longitude: -73.9851,
              lastAQI: Math.round(40 + Math.random() * 35),
              lastViewed: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              viewCount: Math.round(1 + Math.random() * 8),
              isFavorite: Math.random() > 0.8
            }
          ],
          totalLocations: 2,
          period: `${days} days`
        }
      };
      
      res.json(mockData);
    } catch (error) {
      console.error('Analytics location history error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch location history' });
    }
  },

  // Get insights (Updated version)
  getInsights: async (req, res) => {
    try {
      const { latitude, longitude } = req.query;
      console.log('🔍 [Analytics] Insights endpoint called with params:', { latitude, longitude });
      
      // Mock insights data
      const insights = [
        "You've been tracking air quality for 12 days. Great job staying informed!",
        "Your area shows improving air quality trends over the past week.",
        "Consider checking air quality before outdoor activities during peak hours.",
        "Your saved locations have consistent air quality patterns."
      ];
      
      const mockData = {
        success: true,
        data: {
          primary: insights[Math.floor(Math.random() * insights.length)],
          stats: {
            daysTracked: Math.round(7 + Math.random() * 14),
            locationsVisited: Math.round(2 + Math.random() * 6),
            checksThisWeek: Math.round(10 + Math.random() * 20),
            bestAQIThisWeek: Math.round(20 + Math.random() * 30),
            avgAQIThisWeek: Math.round(45 + Math.random() * 40)
          },
          trend: {
            direction: Math.random() > 0.5 ? 'improving' : 'declining',
            percentage: Math.round(5 + Math.random() * 20)
          },
          recommendations: [
            "Set up alerts for when AQI exceeds 100",
            "Check air quality before morning runs",
            "Consider indoor activities when AQI is high"
          ],
          trends: {
            overall: 'improving',
            confidence: Math.round(70 + Math.random() * 25)
          }
        }
      };
      
      console.log('✅ [Analytics] Returning structured insights data:', JSON.stringify(mockData, null, 2));
      res.json(mockData);
    } catch (error) {
      console.error('Analytics insights error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch insights' });
    }
  }
};

// Analytics routes
router.get('/historical', AnalyticsController.getHistoricalAnalytics);
router.get('/weekly-comparison', AnalyticsController.getWeeklyComparison);
router.get('/location-history', AnalyticsController.getLocationHistory);
router.get('/insights', AnalyticsController.getInsights);

module.exports = router; 