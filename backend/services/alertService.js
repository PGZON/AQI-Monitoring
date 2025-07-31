const mongoose = require('mongoose');
const Preference = require('../models/Preference');
const AlertLog = require('../models/AlertLog');
const aqiService = require('./aqiService');
const mlService = require('./mlService');
const NotificationService = require('./notificationService');

const notificationService = new NotificationService();

class AlertService {
  /**
   * Check AQI thresholds for all users and send alerts
   */
  static async checkAndSendAlerts() {
    console.log('Starting AQI threshold check for all users...');
    
    try {
      // Get all active users with alert preferences
      const activePreferences = await Preference.find({
        'alertSettings.enabled': true,
        isActive: true
      }).populate('userId', 'name email isActive');

      if (activePreferences.length === 0) {
        console.log('No active users with alert preferences found');
        return { processed: 0, alerts: 0 };
      }

      console.log(`Found ${activePreferences.length} users with active alert preferences`);

      let totalProcessed = 0;
      let totalAlerts = 0;

      // Process each user's preferences
      for (const preference of activePreferences) {
        if (!preference.userId || !preference.userId.isActive) {
          continue;
        }

        try {
          const alertsForUser = await this.checkUserAlerts(preference);
          totalProcessed++;
          totalAlerts += alertsForUser;
        } catch (error) {
          console.error(`Error processing alerts for user ${preference.userId._id}:`, error.message);
        }
      }

      console.log(`Alert check completed. Processed: ${totalProcessed} users, Sent: ${totalAlerts} alerts`);
      
      return {
        processed: totalProcessed,
        alerts: totalAlerts,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('Error in checkAndSendAlerts:', error);
      throw new Error(`Alert check failed: ${error.message}`);
    }
  }

  /**
   * Check alerts for a specific user
   */
  static async checkUserAlerts(preference) {
    let alertsSent = 0;
    
    try {
      // Check if user should receive alerts right now
      if (!preference.shouldReceiveAlert()) {
        return alertsSent;
      }

      // Check rate limiting (don't send alerts too frequently)
      if (await this.isRateLimited(preference.userId._id)) {
        return alertsSent;
      }

      // Process each preferred location
      for (const location of preference.preferredLocations) {
        if (!location.isActive) continue;

        try {
          // Get current AQI data for location
          const aqiData = await aqiService.getAQIData(location.city);
          
          if (!aqiData || !aqiData.aqi) {
            console.warn(`No AQI data available for ${location.city}`);
            continue;
          }

          // Check AQI threshold
          const aqiCheck = preference.checkAQIThreshold(aqiData.aqi);
          
          if (aqiCheck.exceeded) {
            // Check pollutant thresholds
            const pollutantsExceeded = preference.checkPollutantThresholds(aqiData.pollutants || {});
            
            // Send alert
            await this.sendThresholdAlert({
              user: preference.userId,
              preferences: preference,
              location,
              aqiData,
              aqiCheck,
              pollutantsExceeded
            });
            
            alertsSent++;
          }

          // Check forecast alerts if enabled
          if (preference.forecastAlerts.enabled) {
            const forecastAlert = await this.checkForecastAlert(preference, location);
            if (forecastAlert) {
              alertsSent++;
            }
          }

        } catch (error) {
          console.error(`Error checking alerts for ${location.city}:`, error.message);
        }
      }

      return alertsSent;

    } catch (error) {
      console.error(`Error in checkUserAlerts for user ${preference.userId._id}:`, error);
      return alertsSent;
    }
  }

  /**
   * Check forecast alerts for a location
   */
  static async checkForecastAlert(preference, location) {
    try {
      // Get recent historical data for ML prediction
      const historicalData = await aqiService.getHistoricalData(
        location.city,
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        new Date()
      );

      if (!historicalData || historicalData.length < 7) {
        console.warn(`Insufficient historical data for forecast alert in ${location.city}`);
        return false;
      }

      // Get forecast from ML service
      const forecast = await mlService.getForecast(location.city, preference.forecastAlerts.daysAhead);
      
      if (!forecast || !forecast.forecast) {
        console.warn(`No forecast data available for ${location.city}`);
        return false;
      }

      // Check if any forecast day exceeds threshold
      for (const forecastDay of forecast.forecast) {
        if (forecastDay.aqi >= preference.forecastAlerts.threshold) {
          // Send forecast alert
          await this.sendForecastAlert({
            user: preference.userId,
            preferences: preference,
            location,
            forecastData: {
              date: forecastDay.date,
              predictedAQI: forecastDay.aqi,
              confidence: forecastDay.confidence
            },
            threshold: preference.forecastAlerts.threshold,
            modelUsed: forecast.model_used
          });
          
          return true;
        }
      }

      return false;

    } catch (error) {
      console.error(`Error checking forecast alert for ${location.city}:`, error.message);
      return false;
    }
  }

  /**
   * Send threshold alert
   */
  static async sendThresholdAlert(alertData) {
    const { user, preferences, location, aqiData, aqiCheck, pollutantsExceeded } = alertData;

    try {
      const alertInfo = {
        type: 'aqi_threshold',
        currentAQI: aqiData.aqi,
        threshold: aqiCheck.threshold,
        level: aqiCheck.level,
        pollutantsExceeded
      };

      const result = await notificationService.sendAQIAlert({
        user,
        preferences,
        alertInfo,
        location: {
          city: location.city,
          country: location.country,
          coordinates: location.coordinates
        }
      });

      console.log(`Threshold alert sent to ${user.email} for ${location.city} (AQI: ${aqiData.aqi})`);
      
      return result;

    } catch (error) {
      console.error(`Failed to send threshold alert to ${user.email}:`, error.message);
      throw error;
    }
  }

  /**
   * Send forecast alert
   */
  static async sendForecastAlert(alertData) {
    const { user, preferences, location, forecastData, threshold } = alertData;

    try {
      const alertInfo = {
        type: 'forecast_alert',
        threshold,
        level: this.getAQILevel(forecastData.predictedAQI),
        forecastData
      };

      const result = await notificationService.sendAQIAlert({
        user,
        preferences,
        alertInfo,
        location: {
          city: location.city,
          country: location.country,
          coordinates: location.coordinates
        }
      });

      console.log(`Forecast alert sent to ${user.email} for ${location.city} (Predicted AQI: ${forecastData.predictedAQI})`);
      
      return result;

    } catch (error) {
      console.error(`Failed to send forecast alert to ${user.email}:`, error.message);
      throw error;
    }
  }

  /**
   * Send manual alert to specific users or locations
   */
  static async sendManualAlert(alertData) {
    const { userIds, location, message, alertLevel = 'medium', adminUserId } = alertData;

    try {
      let targetUsers = [];

      if (userIds && userIds.length > 0) {
        // Send to specific users
        const preferences = await Preference.find({
          userId: { $in: userIds },
          'alertSettings.enabled': true,
          isActive: true
        }).populate('userId', 'name email');

        targetUsers = preferences.filter(p => p.userId && p.userId.isActive);
      } else if (location) {
        // Send to all users in a location
        const preferences = await Preference.getUsersForCityAlerts(location);
        targetUsers = preferences.filter(p => p.userId && p.userId.isActive);
      } else {
        throw new Error('Either userIds or location must be specified');
      }

      if (targetUsers.length === 0) {
        throw new Error('No valid target users found');
      }

      const results = [];

      for (const preference of targetUsers) {
        try {
          const alertInfo = {
            type: 'manual_alert',
            level: alertLevel,
            customMessage: message
          };

          const result = await notificationService.sendAQIAlert({
            user: preference.userId,
            preferences: preference,
            alertInfo,
            location: location ? { city: location } : { city: 'Multiple Locations' }
          });

          results.push({
            userId: preference.userId._id,
            email: preference.userId.email,
            success: true,
            alertLogId: result.alertLogId
          });

        } catch (error) {
          results.push({
            userId: preference.userId._id,
            email: preference.userId.email,
            success: false,
            error: error.message
          });
        }
      }

      // Log manual alert action
      console.log(`Manual alert sent by admin ${adminUserId} to ${results.length} users`);

      return {
        targetUsers: targetUsers.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      };

    } catch (error) {
      console.error('Error sending manual alert:', error);
      throw new Error(`Manual alert failed: ${error.message}`);
    }
  }

  /**
   * Check if user is rate limited for alerts
   */
  static async isRateLimited(userId, cooldownMinutes = 60) {
    try {
      const recentAlert = await AlertLog.findOne({
        userId,
        createdAt: { $gte: new Date(Date.now() - cooldownMinutes * 60 * 1000) }
      });

      return !!recentAlert;
    } catch (error) {
      console.error('Error checking rate limit:', error);
      return false;
    }
  }

  /**
   * Get AQI level from numeric value
   */
  static getAQILevel(aqi) {
    if (aqi >= 300) return 'hazardous';
    if (aqi >= 200) return 'very_unhealthy';
    if (aqi >= 150) return 'unhealthy';
    if (aqi >= 100) return 'moderate';
    return 'good';
  }

  /**
   * Get alert statistics
   */
  static async getAlertStats(userId = null, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const matchStage = {
        createdAt: { $gte: startDate }
      };

      if (userId) {
        matchStage.userId = new mongoose.Types.ObjectId(userId);
      }

      const stats = await AlertLog.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalAlerts: { $sum: 1 },
            alertsByType: {
              $push: {
                type: '$alertType',
                level: '$alertLevel',
                date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
              }
            },
            alertsByLevel: {
              $push: '$alertLevel'
            },
            notificationStats: {
              $push: {
                methods: '$notificationMethods',
                status: '$overallNotificationStatus'
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            totalAlerts: 1,
            alertsByType: 1,
            levelCounts: {
              moderate: {
                $size: {
                  $filter: {
                    input: '$alertsByLevel',
                    cond: { $eq: ['$$this', 'moderate'] }
                  }
                }
              },
              unhealthy: {
                $size: {
                  $filter: {
                    input: '$alertsByLevel',
                    cond: { $eq: ['$$this', 'unhealthy'] }
                  }
                }
              },
              very_unhealthy: {
                $size: {
                  $filter: {
                    input: '$alertsByLevel',
                    cond: { $eq: ['$$this', 'very_unhealthy'] }
                  }
                }
              },
              hazardous: {
                $size: {
                  $filter: {
                    input: '$alertsByLevel',
                    cond: { $eq: ['$$this', 'hazardous'] }
                  }
                }
              }
            }
          }
        }
      ]);

      return stats[0] || {
        totalAlerts: 0,
        alertsByType: [],
        levelCounts: {
          moderate: 0,
          unhealthy: 0,
          very_unhealthy: 0,
          hazardous: 0
        }
      };

    } catch (error) {
      console.error('Error getting alert stats:', error);
      throw new Error(`Failed to get alert statistics: ${error.message}`);
    }
  }

  /**
   * Mark alerts as read for a user
   */
  static async markAlertsAsRead(userId, alertIds = null) {
    try {
      const query = { userId, isRead: false };
      
      if (alertIds && alertIds.length > 0) {
        query._id = { $in: alertIds };
      }

      const result = await AlertLog.updateMany(
        query,
        { 
          $set: { 
            isRead: true,
            'userAction.actionTakenAt': new Date()
          }
        }
      );

      return {
        modifiedCount: result.modifiedCount,
        success: true
      };

    } catch (error) {
      console.error('Error marking alerts as read:', error);
      throw new Error(`Failed to mark alerts as read: ${error.message}`);
    }
  }

  /**
   * Delete old alert logs (maintenance function)
   */
  static async cleanupOldAlerts(daysToKeep = 90) {
    try {
      const result = await AlertLog.cleanupOldLogs(daysToKeep);
      
      console.log(`Cleaned up ${result.deletedCount} old alert logs`);
      
      return {
        deletedCount: result.deletedCount,
        success: true
      };

    } catch (error) {
      console.error('Error cleaning up old alerts:', error);
      throw new Error(`Failed to cleanup old alerts: ${error.message}`);
    }
  }
}

module.exports = AlertService;
