const mongoose = require('mongoose');

const preferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  preferredLocations: [{
    city: { type: String, required: true },
    country: { type: String },
    coordinates: {
      latitude: { type: Number, min: -90, max: 90 },
      longitude: { type: Number, min: -180, max: 180 }
    },
    isActive: { type: Boolean, default: true }
  }],
  alertSettings: {
    enabled: { type: Boolean, default: true },
    thresholds: {
      aqi: {
        moderate: { type: Number, default: 100, min: 0, max: 500 },
        unhealthy: { type: Number, default: 150, min: 0, max: 500 },
        veryUnhealthy: { type: Number, default: 200, min: 0, max: 500 },
        hazardous: { type: Number, default: 300, min: 0, max: 500 }
      },
      pollutants: {
        pm2_5: { type: Number, default: 35.4, min: 0 }, // WHO guideline
        pm10: { type: Number, default: 50, min: 0 },
        co: { type: Number, default: 10000, min: 0 }, // μg/m³
        no2: { type: Number, default: 40, min: 0 },
        o3: { type: Number, default: 100, min: 0 },
        so2: { type: Number, default: 20, min: 0 }
      }
    },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      whatsapp: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    },
    frequency: {
      immediate: { type: Boolean, default: true },
      daily_summary: { type: Boolean, default: true },
      weekly_report: { type: Boolean, default: false }
    },
    quiet_hours: {
      enabled: { type: Boolean, default: false },
      start: { type: String, default: '22:00' }, // 24-hour format
      end: { type: String, default: '07:00' },
      timezone: { type: String, default: 'UTC' }
    }
  },
  forecastAlerts: {
    enabled: { type: Boolean, default: true },
    daysAhead: { type: Number, default: 1, min: 1, max: 7 },
    threshold: { type: Number, default: 150, min: 0, max: 500 }
  },
  contactInfo: {
    phoneNumber: { 
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^\+?[\d\s\-()]+$/.test(v);
        },
        message: 'Invalid phone number format'
      }
    },
    whatsappNumber: { 
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^\+?[\d\s\-()]+$/.test(v);
        },
        message: 'Invalid WhatsApp number format'
      }
    }
  },
  language: {
    type: String,
    enum: ['en', 'es', 'fr', 'de', 'hi', 'zh'],
    default: 'en'
  },
  lastAlertSent: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for better query performance
preferenceSchema.index({ 'preferredLocations.city': 1 });
preferenceSchema.index({ 'alertSettings.enabled': 1 });
preferenceSchema.index({ isActive: 1 });

// Virtual for user's primary location
preferenceSchema.virtual('primaryLocation').get(function() {
  const activeLocations = this.preferredLocations.filter(loc => loc.isActive);
  return activeLocations.length > 0 ? activeLocations[0] : null;
});

// Instance method to check if user should receive alerts
preferenceSchema.methods.shouldReceiveAlert = function(currentTime = new Date()) {
  if (!this.alertSettings.enabled || !this.isActive) {
    return false;
  }

  // Check quiet hours
  if (this.alertSettings.quiet_hours.enabled) {
    const now = new Date(currentTime);
    const startTime = this.alertSettings.quiet_hours.start;
    const endTime = this.alertSettings.quiet_hours.end;
    
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();
    const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    
    // Handle quiet hours that span midnight
    if (startTime > endTime) {
      if (currentTimeStr >= startTime || currentTimeStr <= endTime) {
        return false;
      }
    } else {
      if (currentTimeStr >= startTime && currentTimeStr <= endTime) {
        return false;
      }
    }
  }

  return true;
};

// Instance method to check if AQI exceeds threshold
preferenceSchema.methods.checkAQIThreshold = function(aqiValue) {
  const thresholds = this.alertSettings.thresholds.aqi;
  
  if (aqiValue >= thresholds.hazardous) {
    return { level: 'hazardous', threshold: thresholds.hazardous, exceeded: true };
  } else if (aqiValue >= thresholds.veryUnhealthy) {
    return { level: 'very_unhealthy', threshold: thresholds.veryUnhealthy, exceeded: true };
  } else if (aqiValue >= thresholds.unhealthy) {
    return { level: 'unhealthy', threshold: thresholds.unhealthy, exceeded: true };
  } else if (aqiValue >= thresholds.moderate) {
    return { level: 'moderate', threshold: thresholds.moderate, exceeded: true };
  }
  
  return { level: 'good', threshold: 0, exceeded: false };
};

// Instance method to check pollutant thresholds
preferenceSchema.methods.checkPollutantThresholds = function(pollutants) {
  const exceededPollutants = [];
  const thresholds = this.alertSettings.thresholds.pollutants;
  
  for (const [pollutant, value] of Object.entries(pollutants)) {
    if (thresholds[pollutant] && value.value > thresholds[pollutant]) {
      exceededPollutants.push({
        pollutant,
        value: value.value,
        threshold: thresholds[pollutant],
        unit: value.unit || 'μg/m³'
      });
    }
  }
  
  return exceededPollutants;
};

// Static method to get user preferences with defaults
preferenceSchema.statics.getOrCreateUserPreferences = async function(userId) {
  let preferences = await this.findOne({ userId });
  
  if (!preferences) {
    preferences = new this({ userId });
    await preferences.save();
  }
  
  return preferences;
};

// Static method to get all users who should receive alerts for a city
preferenceSchema.statics.getUsersForCityAlerts = function(city) {
  return this.find({
    'alertSettings.enabled': true,
    'preferredLocations.city': { $regex: city, $options: 'i' },
    'preferredLocations.isActive': true,
    isActive: true
  }).populate('userId', 'name email isActive');
};

// Pre-save middleware to validate threshold ordering
preferenceSchema.pre('save', function(next) {
  const thresholds = this.alertSettings.thresholds.aqi;
  
  // Ensure thresholds are in ascending order
  if (thresholds.moderate >= thresholds.unhealthy ||
      thresholds.unhealthy >= thresholds.veryUnhealthy ||
      thresholds.veryUnhealthy >= thresholds.hazardous) {
    next(new Error('AQI thresholds must be in ascending order: moderate < unhealthy < very_unhealthy < hazardous'));
  }
  
  next();
});

module.exports = mongoose.model('Preference', preferenceSchema);
