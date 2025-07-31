const User = require('../models/User');
const Preference = require('../models/Preference');
const AlertLog = require('../models/AlertLog');
const AQIData = require('../models/AQIData');

class AdminService {
  /**
   * Get comprehensive user statistics
   */
  static async getUserStats(period = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - period);

      const [
        totalUsers,
        activeUsers,
        newUsers,
        adminUsers,
        usersWithPreferences,
        userRoleBreakdown
      ] = await Promise.all([
        // Total registered users
        User.countDocuments({}),
        
        // Active users (have logged in recently or have alerts enabled)
        User.countDocuments({ isActive: true }),
        
        // New users in period
        User.countDocuments({ createdAt: { $gte: startDate } }),
        
        // Admin users
        User.countDocuments({ role: 'admin' }),
        
        // Users with configured preferences
        Preference.countDocuments({ isActive: true }),
        
        // User role breakdown
        User.aggregate([
          {
            $group: {
              _id: '$role',
              count: { $sum: 1 }
            }
          }
        ])
      ]);

      // Get user growth over time
      const userGrowth = await User.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
        }
      ]);

      return {
        overview: {
          totalUsers,
          activeUsers,
          newUsers,
          adminUsers,
          usersWithPreferences,
          inactiveUsers: totalUsers - activeUsers
        },
        roleBreakdown: userRoleBreakdown.reduce((acc, role) => {
          acc[role._id] = role.count;
          return acc;
        }, {}),
        growth: userGrowth.map(day => ({
          date: `${day._id.year}-${String(day._id.month).padStart(2, '0')}-${String(day._id.day).padStart(2, '0')}`,
          newUsers: day.count
        })),
        period: `${period} days`
      };
    } catch (error) {
      throw new Error(`Failed to get user stats: ${error.message}`);
    }
  }

  /**
   * Get all users with detailed information
   */
  static async getAllUsers(page = 1, limit = 50, filters = {}) {
    try {
      const query = {};
      
      // Apply filters
      if (filters.role) {
        query.role = filters.role;
      }
      
      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive === 'true';
      }
      
      if (filters.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { email: { $regex: filters.search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;
      
      const [users, totalCount] = await Promise.all([
        User.find(query)
          .select('-password')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments(query)
      ]);

      // Get additional data for each user
      const userIds = users.map(user => user._id);
      
      const [preferences, alertCounts] = await Promise.all([
        Preference.find({ userId: { $in: userIds } })
          .select('userId preferredLocations alertSettings')
          .lean(),
        AlertLog.aggregate([
          {
            $match: { userId: { $in: userIds } }
          },
          {
            $group: {
              _id: '$userId',
              totalAlerts: { $sum: 1 },
              unreadAlerts: {
                $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
              },
              lastAlertDate: { $max: '$createdAt' }
            }
          }
        ])
      ]);

      // Create lookup maps
      const preferencesMap = preferences.reduce((acc, pref) => {
        acc[pref.userId.toString()] = pref;
        return acc;
      }, {});

      const alertCountsMap = alertCounts.reduce((acc, alert) => {
        acc[alert._id.toString()] = alert;
        return acc;
      }, {});

      // Enhance user data
      const enhancedUsers = users.map(user => {
        const userPref = preferencesMap[user._id.toString()];
        const userAlerts = alertCountsMap[user._id.toString()];
        
        return {
          ...user,
          preferences: userPref ? {
            locationCount: userPref.preferredLocations?.length || 0,
            alertsEnabled: userPref.alertSettings?.enabled || false
          } : null,
          alerts: userAlerts ? {
            total: userAlerts.totalAlerts,
            unread: userAlerts.unreadAlerts,
            lastAlert: userAlerts.lastAlertDate
          } : {
            total: 0,
            unread: 0,
            lastAlert: null
          }
        };
      });

      return {
        users: enhancedUsers,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Failed to get users: ${error.message}`);
    }
  }

  /**
   * Get comprehensive alert statistics
   */
  static async getAlertStats(period = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - period);

      const [
        totalAlerts,
        alertsByType,
        alertsByLevel,
        alertsByDay,
        topAlertCities,
        notificationStats
      ] = await Promise.all([
        // Total alerts in period
        AlertLog.countDocuments({ createdAt: { $gte: startDate } }),
        
        // Alerts by type
        AlertLog.aggregate([
          { $match: { createdAt: { $gte: startDate } } },
          {
            $group: {
              _id: '$alertType',
              count: { $sum: 1 }
            }
          }
        ]),
        
        // Alerts by level
        AlertLog.aggregate([
          { $match: { createdAt: { $gte: startDate } } },
          {
            $group: {
              _id: '$alertLevel',
              count: { $sum: 1 }
            }
          }
        ]),
        
        // Alerts by day
        AlertLog.aggregate([
          { $match: { createdAt: { $gte: startDate } } },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                day: { $dayOfMonth: '$createdAt' }
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]),
        
        // Top cities by alert count
        AlertLog.aggregate([
          { $match: { createdAt: { $gte: startDate } } },
          {
            $group: {
              _id: '$location.city',
              alertCount: { $sum: 1 },
              levels: { $push: '$alertLevel' }
            }
          },
          { $sort: { alertCount: -1 } },
          { $limit: 10 }
        ]),
        
        // Notification method statistics
        AlertLog.aggregate([
          { $match: { createdAt: { $gte: startDate } } },
          { $unwind: '$notificationMethods' },
          {
            $group: {
              _id: {
                method: '$notificationMethods.method',
                status: '$notificationMethods.status'
              },
              count: { $sum: 1 }
            }
          }
        ])
      ]);

      return {
        overview: {
          totalAlerts,
          period: `${period} days`
        },
        breakdown: {
          byType: alertsByType.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          byLevel: alertsByLevel.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          byDay: alertsByDay.map(day => ({
            date: `${day._id.year}-${String(day._id.month).padStart(2, '0')}-${String(day._id.day).padStart(2, '0')}`,
            alerts: day.count
          }))
        },
        topCities: topAlertCities.map(city => ({
          city: city._id,
          alertCount: city.alertCount,
          levelBreakdown: city.levels.reduce((acc, level) => {
            acc[level] = (acc[level] || 0) + 1;
            return acc;
          }, {})
        })),
        notifications: notificationStats.reduce((acc, stat) => {
          const method = stat._id.method;
          if (!acc[method]) acc[method] = {};
          acc[method][stat._id.status] = stat.count;
          return acc;
        }, {})
      };
    } catch (error) {
      throw new Error(`Failed to get alert stats: ${error.message}`);
    }
  }

  /**
   * Get city-wise AQI statistics
   */
  static async getCityAQIStats(period = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - period);

      // Get AQI data from stored records
      const cityStats = await AQIData.aggregate([
        {
          $match: {
            timestamp: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$location',
            averageAQI: { $avg: '$aqi' },
            minAQI: { $min: '$aqi' },
            maxAQI: { $max: '$aqi' },
            dataPoints: { $sum: 1 },
            lastUpdate: { $max: '$timestamp' }
          }
        },
        {
          $sort: { averageAQI: -1 }
        }
      ]);

      // Get alert counts per city
      const cityAlerts = await AlertLog.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$location.city',
            alertsTriggered: { $sum: 1 },
            alertLevels: { $push: '$alertLevel' }
          }
        }
      ]);

      // Create alert lookup map
      const alertsMap = cityAlerts.reduce((acc, alert) => {
        acc[alert._id] = {
          alertsTriggered: alert.alertsTriggered,
          levelBreakdown: alert.alertLevels.reduce((levelAcc, level) => {
            levelAcc[level] = (levelAcc[level] || 0) + 1;
            return levelAcc;
          }, {})
        };
        return acc;
      }, {});

      // Get user preferences by city
      const cityPreferences = await Preference.aggregate([
        {
          $unwind: '$preferredLocations'
        },
        {
          $match: {
            'preferredLocations.isActive': true
          }
        },
        {
          $group: {
            _id: '$preferredLocations.city',
            userCount: { $sum: 1 }
          }
        }
      ]);

      const preferencesMap = cityPreferences.reduce((acc, pref) => {
        acc[pref._id] = pref.userCount;
        return acc;
      }, {});

      // Combine all data
      const enhancedCityStats = cityStats.map(city => ({
        city: city._id,
        aqi: {
          average: Math.round(city.averageAQI * 10) / 10,
          min: city.minAQI,
          max: city.maxAQI,
          dataPoints: city.dataPoints,
          lastUpdate: city.lastUpdate
        },
        alerts: alertsMap[city._id] || { alertsTriggered: 0, levelBreakdown: {} },
        users: {
          monitoring: preferencesMap[city._id] || 0
        }
      }));

      return {
        cities: enhancedCityStats,
        summary: {
          totalCities: cityStats.length,
          averageAQI: cityStats.length > 0 ? 
            Math.round((cityStats.reduce((sum, city) => sum + city.averageAQI, 0) / cityStats.length) * 10) / 10 : 0,
          period: `${period} days`
        }
      };
    } catch (error) {
      throw new Error(`Failed to get city AQI stats: ${error.message}`);
    }
  }

  /**
   * Get system overview statistics
   */
  static async getSystemOverview() {
    try {
      const [
        userStats,
        alertStats,
        preferenceStats,
        systemHealth
      ] = await Promise.all([
        this.getUserStats(30),
        this.getAlertStats(30),
        this.getPreferenceStats(),
        this.getSystemHealth()
      ]);

      return {
        users: userStats.overview,
        alerts: alertStats.overview,
        preferences: preferenceStats,
        system: systemHealth,
        timestamp: new Date()
      };
    } catch (error) {
      throw new Error(`Failed to get system overview: ${error.message}`);
    }
  }

  /**
   * Get preference statistics
   */
  static async getPreferenceStats() {
    try {
      const [
        totalPreferences,
        alertsEnabled,
        notificationBreakdown,
        thresholdStats,
        locationStats
      ] = await Promise.all([
        Preference.countDocuments({ isActive: true }),
        
        Preference.countDocuments({ 
          'alertSettings.enabled': true, 
          isActive: true 
        }),
        
        Preference.aggregate([
          { $match: { isActive: true } },
          {
            $project: {
              notifications: { $objectToArray: '$alertSettings.notifications' }
            }
          },
          { $unwind: '$notifications' },
          {
            $group: {
              _id: '$notifications.k',
              enabledCount: {
                $sum: { $cond: [{ $eq: ['$notifications.v', true] }, 1, 0] }
              },
              totalCount: { $sum: 1 }
            }
          }
        ]),
        
        Preference.aggregate([
          { $match: { isActive: true } },
          {
            $group: {
              _id: null,
              avgModerateThreshold: { $avg: '$alertSettings.thresholds.aqi.moderate' },
              avgUnhealthyThreshold: { $avg: '$alertSettings.thresholds.aqi.unhealthy' },
              avgVeryUnhealthyThreshold: { $avg: '$alertSettings.thresholds.aqi.veryUnhealthy' },
              avgHazardousThreshold: { $avg: '$alertSettings.thresholds.aqi.hazardous' }
            }
          }
        ]),
        
        Preference.aggregate([
          { $match: { isActive: true } },
          { $unwind: '$preferredLocations' },
          {
            $group: {
              _id: '$preferredLocations.city',
              userCount: { $sum: 1 }
            }
          },
          { $sort: { userCount: -1 } },
          { $limit: 10 }
        ])
      ]);

      return {
        overview: {
          totalUsers: totalPreferences,
          alertsEnabled,
          alertsDisabled: totalPreferences - alertsEnabled
        },
        notifications: notificationBreakdown.reduce((acc, method) => {
          acc[method._id] = {
            enabled: method.enabledCount,
            total: method.totalCount,
            percentage: Math.round((method.enabledCount / method.totalCount) * 100)
          };
          return acc;
        }, {}),
        thresholds: thresholdStats[0] ? {
          moderate: Math.round(thresholdStats[0].avgModerateThreshold),
          unhealthy: Math.round(thresholdStats[0].avgUnhealthyThreshold),
          veryUnhealthy: Math.round(thresholdStats[0].avgVeryUnhealthyThreshold),
          hazardous: Math.round(thresholdStats[0].avgHazardousThreshold)
        } : {},
        popularCities: locationStats.map(city => ({
          city: city._id,
          users: city.userCount
        }))
      };
    } catch (error) {
      throw new Error(`Failed to get preference stats: ${error.message}`);
    }
  }

  /**
   * Get system health information
   */
  static async getSystemHealth() {
    try {
      const NotificationService = require('../services/notificationService');
      const notificationService = new NotificationService();
      const alertScheduler = require('../jobs/alertScheduler');
      
      const [
        notificationHealth,
        schedulerHealth,
        databaseHealth
      ] = await Promise.all([
        notificationService.checkServiceHealth().catch(() => ({
          email: false,
          sms: false,
          whatsapp: false
        })),
        
        Promise.resolve(alertScheduler.getStatus()).catch(() => ({
          isRunning: false,
          activeJobs: [],
          jobCount: 0
        })),
        
        this.checkDatabaseHealth()
      ]);

      return {
        notifications: notificationHealth,
        scheduler: schedulerHealth,
        database: databaseHealth,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version
      };
    } catch (error) {
      return {
        error: error.message,
        notifications: { email: false, sms: false, whatsapp: false },
        scheduler: { isRunning: false },
        database: { connected: false }
      };
    }
  }

  /**
   * Check database health
   */
  static async checkDatabaseHealth() {
    try {
      const mongoose = require('mongoose');
      
      const [
        connectionState,
        userCount,
        preferenceCount,
        alertCount
      ] = await Promise.all([
        Promise.resolve(mongoose.connection.readyState),
        User.estimatedDocumentCount(),
        Preference.estimatedDocumentCount(),
        AlertLog.estimatedDocumentCount()
      ]);

      return {
        connected: connectionState === 1,
        collections: {
          users: userCount,
          preferences: preferenceCount,
          alerts: alertCount
        }
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }

  /**
   * Delete user and all related data
   */
  static async deleteUser(userId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      if (user.role === 'admin') {
        throw new Error('Cannot delete admin users');
      }

      // Delete user and all related data
      await Promise.all([
        User.findByIdAndDelete(userId),
        Preference.findOneAndDelete({ userId }),
        AlertLog.deleteMany({ userId })
      ]);

      return {
        success: true,
        deletedUser: {
          id: user._id,
          email: user.email,
          name: user.name
        }
      };
    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  /**
   * Update user role (admin only)
   */
  static async updateUserRole(userId, newRole) {
    try {
      const validRoles = ['user', 'admin'];
      
      if (!validRoles.includes(newRole)) {
        throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { role: newRole },
        { new: true, select: '-password' }
      );

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      throw new Error(`Failed to update user role: ${error.message}`);
    }
  }
}

module.exports = AdminService;
