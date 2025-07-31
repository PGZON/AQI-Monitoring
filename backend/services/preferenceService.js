const Preference = require('../models/Preference');
const { ValidationError } = require('../middleware/errorMiddleware');

class PreferenceService {
  /**
   * Get user preferences, create defaults if none exist
   */
  static async getUserPreferences(userId) {
    try {
      let preferences = await Preference.findOne({ userId }).populate('userId', 'name email');
      
      if (!preferences) {
        preferences = await this.createDefaultPreferences(userId);
      }
      
      return preferences;
    } catch (error) {
      throw new Error(`Failed to get user preferences: ${error.message}`);
    }
  }

  /**
   * Create default preferences for a user
   */
  static async createDefaultPreferences(userId) {
    try {
      const defaultPreferences = new Preference({
        userId,
        preferredLocations: [],
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
        language: 'en',
        isActive: true
      });

      return await defaultPreferences.save();
    } catch (error) {
      throw new Error(`Failed to create default preferences: ${error.message}`);
    }
  }

  /**
   * Update user preferences
   */
  static async updateUserPreferences(userId, updateData) {
    try {
      // Validate threshold ordering if updating AQI thresholds
      if (updateData.alertSettings?.thresholds?.aqi) {
        this.validateAQIThresholds(updateData.alertSettings.thresholds.aqi);
      }

      // Validate location data if updating locations
      if (updateData.preferredLocations) {
        this.validateLocations(updateData.preferredLocations);
      }

      const preferences = await Preference.findOneAndUpdate(
        { userId },
        { $set: updateData },
        { 
          new: true, 
          upsert: true,
          runValidators: true 
        }
      ).populate('userId', 'name email');

      return preferences;
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw new ValidationError(`Invalid preference data: ${error.message}`);
      }
      throw new Error(`Failed to update preferences: ${error.message}`);
    }
  }

  /**
   * Add a preferred location
   */
  static async addPreferredLocation(userId, locationData) {
    try {
      this.validateLocationData(locationData);

      const preferences = await this.getUserPreferences(userId);
      
      // Check if location already exists
      const existingLocation = preferences.preferredLocations.find(
        loc => loc.city.toLowerCase() === locationData.city.toLowerCase()
      );

      if (existingLocation) {
        throw new ValidationError('Location already exists in preferences');
      }

      preferences.preferredLocations.push({
        city: locationData.city,
        country: locationData.country || '',
        coordinates: locationData.coordinates || {},
        isActive: locationData.isActive !== false
      });

      return await preferences.save();
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new Error(`Failed to add preferred location: ${error.message}`);
    }
  }

  /**
   * Remove a preferred location
   */
  static async removePreferredLocation(userId, city) {
    try {
      const preferences = await this.getUserPreferences(userId);
      
      preferences.preferredLocations = preferences.preferredLocations.filter(
        loc => loc.city.toLowerCase() !== city.toLowerCase()
      );

      return await preferences.save();
    } catch (error) {
      throw new Error(`Failed to remove preferred location: ${error.message}`);
    }
  }

  /**
   * Update alert thresholds
   */
  static async updateAlertThresholds(userId, thresholds) {
    try {
      if (thresholds.aqi) {
        this.validateAQIThresholds(thresholds.aqi);
      }

      if (thresholds.pollutants) {
        this.validatePollutantThresholds(thresholds.pollutants);
      }

      const updateData = {
        'alertSettings.thresholds': thresholds
      };

      const preferences = await Preference.findOneAndUpdate(
        { userId },
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!preferences) {
        throw new Error('User preferences not found');
      }

      return preferences;
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new Error(`Failed to update alert thresholds: ${error.message}`);
    }
  }

  /**
   * Update notification settings
   */
  static async updateNotificationSettings(userId, notificationSettings) {
    try {
      this.validateNotificationSettings(notificationSettings);

      const updateData = {
        'alertSettings.notifications': notificationSettings.notifications,
        'alertSettings.frequency': notificationSettings.frequency,
        'alertSettings.quiet_hours': notificationSettings.quiet_hours
      };

      // Remove undefined fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const preferences = await Preference.findOneAndUpdate(
        { userId },
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!preferences) {
        throw new Error('User preferences not found');
      }

      return preferences;
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new Error(`Failed to update notification settings: ${error.message}`);
    }
  }

  /**
   * Get all users with alert preferences for a specific city
   */
  static async getUsersForCityAlerts(city) {
    try {
      return await Preference.getUsersForCityAlerts(city);
    } catch (error) {
      throw new Error(`Failed to get users for city alerts: ${error.message}`);
    }
  }

  /**
   * Delete user preferences
   */
  static async deleteUserPreferences(userId) {
    try {
      const result = await Preference.findOneAndDelete({ userId });
      return !!result;
    } catch (error) {
      throw new Error(`Failed to delete user preferences: ${error.message}`);
    }
  }

  // Validation methods
  static validateAQIThresholds(thresholds) {
    const { moderate, unhealthy, veryUnhealthy, hazardous } = thresholds;
    
    if (moderate >= unhealthy || unhealthy >= veryUnhealthy || veryUnhealthy >= hazardous) {
      throw new ValidationError('AQI thresholds must be in ascending order: moderate < unhealthy < very_unhealthy < hazardous');
    }

    const values = [moderate, unhealthy, veryUnhealthy, hazardous];
    if (values.some(val => val < 0 || val > 500)) {
      throw new ValidationError('AQI threshold values must be between 0 and 500');
    }
  }

  static validatePollutantThresholds(pollutants) {
    const allowedPollutants = ['pm2_5', 'pm10', 'co', 'no2', 'o3', 'so2'];
    
    Object.keys(pollutants).forEach(pollutant => {
      if (!allowedPollutants.includes(pollutant)) {
        throw new ValidationError(`Invalid pollutant: ${pollutant}`);
      }
      
      if (pollutants[pollutant] < 0) {
        throw new ValidationError(`Pollutant threshold for ${pollutant} must be non-negative`);
      }
    });
  }

  static validateLocationData(locationData) {
    if (!locationData.city || typeof locationData.city !== 'string') {
      throw new ValidationError('City name is required and must be a string');
    }

    if (locationData.coordinates) {
      const { latitude, longitude } = locationData.coordinates;
      if (latitude !== undefined && (latitude < -90 || latitude > 90)) {
        throw new ValidationError('Latitude must be between -90 and 90');
      }
      if (longitude !== undefined && (longitude < -180 || longitude > 180)) {
        throw new ValidationError('Longitude must be between -180 and 180');
      }
    }
  }

  static validateLocations(locations) {
    if (!Array.isArray(locations)) {
      throw new ValidationError('Preferred locations must be an array');
    }

    locations.forEach((location, index) => {
      try {
        this.validateLocationData(location);
      } catch (error) {
        throw new ValidationError(`Invalid location at index ${index}: ${error.message}`);
      }
    });
  }

  static validateNotificationSettings(settings) {
    if (settings.notifications) {
      const allowedMethods = ['email', 'sms', 'whatsapp', 'push'];
      Object.keys(settings.notifications).forEach(method => {
        if (!allowedMethods.includes(method)) {
          throw new ValidationError(`Invalid notification method: ${method}`);
        }
      });
    }

    if (settings.quiet_hours && settings.quiet_hours.enabled) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      
      if (!timeRegex.test(settings.quiet_hours.start)) {
        throw new ValidationError('Invalid quiet hours start time format (use HH:MM)');
      }
      
      if (!timeRegex.test(settings.quiet_hours.end)) {
        throw new ValidationError('Invalid quiet hours end time format (use HH:MM)');
      }
    }
  }
}

module.exports = PreferenceService;
