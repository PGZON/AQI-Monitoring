const PreferenceService = require('../services/preferenceService');
const { ValidationError } = require('../middleware/errorMiddleware');

class PreferenceController {
  /**
   * Get user preferences
   * GET /api/preferences
   */
  static async getUserPreferences(req, res) {
    try {
      const userId = req.user.id;
      
      const preferences = await PreferenceService.getUserPreferences(userId);
      
      res.json({
        success: true,
        data: preferences
      });
    } catch (error) {
      console.error('Error getting user preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user preferences',
        error: error.message
      });
    }
  }

  /**
   * Update user preferences
   * PUT /api/preferences
   */
  static async updateUserPreferences(req, res) {
    try {
      const userId = req.user.id;
      const updateData = req.body;

      // Validate required fields if provided
      if (updateData.alertSettings?.thresholds?.aqi) {
        const { moderate, unhealthy, veryUnhealthy, hazardous } = updateData.alertSettings.thresholds.aqi;
        if (moderate >= unhealthy || unhealthy >= veryUnhealthy || veryUnhealthy >= hazardous) {
          return res.status(400).json({
            success: false,
            message: 'AQI thresholds must be in ascending order'
          });
        }
      }

      const preferences = await PreferenceService.updateUserPreferences(userId, updateData);
      
      res.json({
        success: true,
        message: 'Preferences updated successfully',
        data: preferences
      });
    } catch (error) {
      console.error('Error updating user preferences:', error);
      
      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to update user preferences',
        error: error.message
      });
    }
  }

  /**
   * Add preferred location
   * POST /api/preferences/locations
   */
  static async addPreferredLocation(req, res) {
    try {
      const userId = req.user.id;
      const { city, country, coordinates, isActive = true } = req.body;

      if (!city) {
        return res.status(400).json({
          success: false,
          message: 'City name is required'
        });
      }

      const locationData = {
        city: city.trim(),
        country: country?.trim() || '',
        coordinates: coordinates || {},
        isActive
      };

      const preferences = await PreferenceService.addPreferredLocation(userId, locationData);
      
      res.status(201).json({
        success: true,
        message: 'Location added successfully',
        data: preferences
      });
    } catch (error) {
      console.error('Error adding preferred location:', error);
      
      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to add preferred location',
        error: error.message
      });
    }
  }

  /**
   * Remove preferred location
   * DELETE /api/preferences/locations/:city
   */
  static async removePreferredLocation(req, res) {
    try {
      const userId = req.user.id;
      const { city } = req.params;

      if (!city) {
        return res.status(400).json({
          success: false,
          message: 'City name is required'
        });
      }

      const preferences = await PreferenceService.removePreferredLocation(userId, city);
      
      res.json({
        success: true,
        message: 'Location removed successfully',
        data: preferences
      });
    } catch (error) {
      console.error('Error removing preferred location:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove preferred location',
        error: error.message
      });
    }
  }

  /**
   * Update alert thresholds
   * PUT /api/preferences/thresholds
   */
  static async updateAlertThresholds(req, res) {
    try {
      const userId = req.user.id;
      const { aqi, pollutants } = req.body;

      if (!aqi && !pollutants) {
        return res.status(400).json({
          success: false,
          message: 'At least one threshold type (aqi or pollutants) is required'
        });
      }

      const thresholds = {};
      if (aqi) thresholds.aqi = aqi;
      if (pollutants) thresholds.pollutants = pollutants;

      const preferences = await PreferenceService.updateAlertThresholds(userId, thresholds);
      
      res.json({
        success: true,
        message: 'Alert thresholds updated successfully',
        data: preferences
      });
    } catch (error) {
      console.error('Error updating alert thresholds:', error);
      
      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to update alert thresholds',
        error: error.message
      });
    }
  }

  /**
   * Update notification settings
   * PUT /api/preferences/notifications
   */
  static async updateNotificationSettings(req, res) {
    try {
      const userId = req.user.id;
      const notificationSettings = req.body;

      // Validate notification settings structure
      const validMethods = ['email', 'sms', 'whatsapp', 'push'];
      const validFrequencies = ['immediate', 'daily_summary', 'weekly_report'];

      if (notificationSettings.notifications) {
        const invalidMethods = Object.keys(notificationSettings.notifications)
          .filter(method => !validMethods.includes(method));
        
        if (invalidMethods.length > 0) {
          return res.status(400).json({
            success: false,
            message: `Invalid notification methods: ${invalidMethods.join(', ')}`
          });
        }
      }

      if (notificationSettings.frequency) {
        const invalidFrequencies = Object.keys(notificationSettings.frequency)
          .filter(freq => !validFrequencies.includes(freq));
        
        if (invalidFrequencies.length > 0) {
          return res.status(400).json({
            success: false,
            message: `Invalid frequency settings: ${invalidFrequencies.join(', ')}`
          });
        }
      }

      const preferences = await PreferenceService.updateNotificationSettings(userId, notificationSettings);
      
      res.json({
        success: true,
        message: 'Notification settings updated successfully',
        data: preferences
      });
    } catch (error) {
      console.error('Error updating notification settings:', error);
      
      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to update notification settings',
        error: error.message
      });
    }
  }

  /**
   * Update contact information
   * PUT /api/preferences/contact
   */
  static async updateContactInfo(req, res) {
    try {
      const userId = req.user.id;
      const { phoneNumber, whatsappNumber } = req.body;

      // Basic phone number validation
      const phoneRegex = /^\+?[\d\s\-()]+$/;
      
      if (phoneNumber && !phoneRegex.test(phoneNumber)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number format'
        });
      }

      if (whatsappNumber && !phoneRegex.test(whatsappNumber)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid WhatsApp number format'
        });
      }

      const updateData = {
        'contactInfo.phoneNumber': phoneNumber,
        'contactInfo.whatsappNumber': whatsappNumber
      };

      // Remove undefined fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const preferences = await PreferenceService.updateUserPreferences(userId, updateData);
      
      res.json({
        success: true,
        message: 'Contact information updated successfully',
        data: preferences
      });
    } catch (error) {
      console.error('Error updating contact info:', error);
      
      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to update contact information',
        error: error.message
      });
    }
  }

  /**
   * Reset preferences to defaults
   * DELETE /api/preferences
   */
  static async resetPreferences(req, res) {
    try {
      const userId = req.user.id;
      
      // Delete existing preferences and create new defaults
      await PreferenceService.deleteUserPreferences(userId);
      const preferences = await PreferenceService.createDefaultPreferences(userId);
      
      res.json({
        success: true,
        message: 'Preferences reset to defaults successfully',
        data: preferences
      });
    } catch (error) {
      console.error('Error resetting preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reset preferences',
        error: error.message
      });
    }
  }

  /**
   * Get preference defaults (for UI reference)
   * GET /api/preferences/defaults
   */
  static async getPreferenceDefaults(req, res) {
    try {
      const defaults = {
        alertSettings: {
          enabled: true,
          thresholds: {
            aqi: {
              moderate: 100,
              unhealthy: 150,
              veryUnhealthy: 200,
              hazardous: 300
            },
            pollutants: {
              pm2_5: 35.4,
              pm10: 50,
              co: 10000,
              no2: 40,
              o3: 100,
              so2: 20
            }
          },
          notifications: {
            email: true,
            sms: false,
            whatsapp: false,
            push: true
          },
          frequency: {
            immediate: true,
            daily_summary: true,
            weekly_report: false
          },
          quiet_hours: {
            enabled: false,
            start: '22:00',
            end: '07:00',
            timezone: 'UTC'
          }
        },
        forecastAlerts: {
          enabled: true,
          daysAhead: 1,
          threshold: 150
        },
        language: 'en'
      };

      res.json({
        success: true,
        data: defaults
      });
    } catch (error) {
      console.error('Error getting preference defaults:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get preference defaults',
        error: error.message
      });
    }
  }

  /**
   * Test notification
   * POST /api/preferences/test-notification
   */
  static async testNotification(req, res) {
    try {
      const userId = req.user.id;
      const { method = 'email' } = req.body;

      const validMethods = ['email', 'sms', 'whatsapp'];
      if (!validMethods.includes(method)) {
        return res.status(400).json({
          success: false,
          message: `Invalid notification method. Must be one of: ${validMethods.join(', ')}`
        });
      }

      // Get user preferences for contact info
      const preferences = await PreferenceService.getUserPreferences(userId);
      
      // Prepare user data for notification
      const userData = {
        name: req.user.name,
        email: req.user.email,
        phoneNumber: preferences.contactInfo?.phoneNumber,
        whatsappNumber: preferences.contactInfo?.whatsappNumber
      };

      // Send test notification
      const NotificationService = require('../services/notificationService');
      const notificationService = new NotificationService();
      const result = await notificationService.sendTestNotification(userData, method);
      
      res.json({
        success: true,
        message: `Test ${method} notification sent successfully`,
        data: {
          method,
          deliveryId: result.deliveryId
        }
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      res.status(400).json({
        success: false,
        message: `Failed to send test notification: ${error.message}`
      });
    }
  }
}

module.exports = PreferenceController;
