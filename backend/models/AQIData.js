const mongoose = require('mongoose');

const aqiDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    city: { type: String, default: 'Unknown' },
    country: { type: String, default: 'Unknown' },
    state: { type: String },
    formatted: { type: String }
  },
  coordinates: {
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    }
  },
  aqi: {
    index: {
      type: Number,
      required: true,
      min: 0,
      max: 500
    },
    level: {
      type: String,
      enum: ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'],
      required: true
    },
    category: {
      type: String,
      enum: ['Good', 'Moderate', 'Unhealthy for Sensitive Groups', 'Unhealthy', 'Very Unhealthy', 'Hazardous'],
      required: true
    }
  },
  pollutants: {
    co: {
      value: { type: Number, min: 0 },
      unit: { type: String, default: 'μg/m³' }
    },
    no: {
      value: { type: Number, min: 0 },
      unit: { type: String, default: 'μg/m³' }
    },
    no2: {
      value: { type: Number, min: 0 },
      unit: { type: String, default: 'μg/m³' }
    },
    o3: {
      value: { type: Number, min: 0 },
      unit: { type: String, default: 'μg/m³' }
    },
    so2: {
      value: { type: Number, min: 0 },
      unit: { type: String, default: 'μg/m³' }
    },
    pm2_5: {
      value: { type: Number, min: 0 },
      unit: { type: String, default: 'μg/m³' }
    },
    pm10: {
      value: { type: Number, min: 0 },
      unit: { type: String, default: 'μg/m³' }
    },
    nh3: {
      value: { type: Number, min: 0 },
      unit: { type: String, default: 'μg/m³' }
    }
  },
  weather: {
    temperature: { type: Number },
    humidity: { type: Number },
    pressure: { type: Number },
    windSpeed: { type: Number },
    windDirection: { type: Number }
  },
  source: {
    type: String,
    enum: ['openweathermap', 'manual', 'cached'],
    default: 'openweathermap'
  },
  requestTimestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  dataTimestamp: {
    type: Date,
    required: true
  },
  isBookmarked: {
    type: Boolean,
    default: false
  },
  userNotes: {
    type: String,
    maxlength: 500
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
aqiDataSchema.index({ userId: 1, requestTimestamp: -1 });
aqiDataSchema.index({ 'coordinates.latitude': 1, 'coordinates.longitude': 1 });
aqiDataSchema.index({ requestTimestamp: -1 });
aqiDataSchema.index({ 'aqi.index': 1 });
aqiDataSchema.index({ 'location.city': 1 });
aqiDataSchema.index({ 'location.formatted': 1 });

// Compound index for location-based queries
aqiDataSchema.index({ 
  'coordinates.latitude': 1, 
  'coordinates.longitude': 1, 
  requestTimestamp: -1 
});

// Compound index for heatmap queries
aqiDataSchema.index({
  'location.formatted': 1,
  requestTimestamp: -1,
  'aqi.index': 1
});

// Compound index for ML data queries
aqiDataSchema.index({
  'location.city': 1,
  requestTimestamp: -1
});

// Virtual for readable AQI status
aqiDataSchema.virtual('aqiStatus').get(function() {
  const index = this.aqi.index;
  if (index <= 50) return { level: 'Good', color: '#00e400', emoji: '🟢' };
  if (index <= 100) return { level: 'Moderate', color: '#ffff00', emoji: '🟡' };
  if (index <= 150) return { level: 'Unhealthy for Sensitive Groups', color: '#ff7e00', emoji: '🟠' };
  if (index <= 200) return { level: 'Unhealthy', color: '#ff0000', emoji: '🔴' };
  if (index <= 300) return { level: 'Very Unhealthy', color: '#8f3f97', emoji: '🟣' };
  return { level: 'Hazardous', color: '#7e0023', emoji: '🆘' };
});

// Static method to get user's AQI history
aqiDataSchema.statics.getUserHistory = function(userId, limit = 50, startDate, endDate) {
  const query = { userId };
  
  if (startDate || endDate) {
    query.requestTimestamp = {};
    if (startDate) query.requestTimestamp.$gte = new Date(startDate);
    if (endDate) query.requestTimestamp.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .sort({ requestTimestamp: -1 })
    .limit(limit)
    .populate('userId', 'name email');
};

// Static method to get location-based AQI data
aqiDataSchema.statics.getNearbyData = function(lat, lon, radiusKm = 10, limit = 20) {
  const radiusDegrees = radiusKm / 111; // Approximate conversion from km to degrees
  
  return this.find({
    'coordinates.latitude': {
      $gte: lat - radiusDegrees,
      $lte: lat + radiusDegrees
    },
    'coordinates.longitude': {
      $gte: lon - radiusDegrees,
      $lte: lon + radiusDegrees
    },
    requestTimestamp: {
      $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
    }
  })
  .sort({ requestTimestamp: -1 })
  .limit(limit)
  .populate('userId', 'name');
};

// Static method for analytics
aqiDataSchema.statics.getAnalytics = async function(userId, days = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const analytics = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        requestTimestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalRequests: { $sum: 1 },
        averageAQI: { $avg: '$aqi.index' },
        maxAQI: { $max: '$aqi.index' },
        minAQI: { $min: '$aqi.index' },
        averagePM25: { $avg: '$pollutants.pm2_5.value' },
        averagePM10: { $avg: '$pollutants.pm10.value' },
        uniqueLocations: { $addToSet: '$location.formatted' }
      }
    }
  ]);

  return analytics[0] || {
    totalRequests: 0,
    averageAQI: 0,
    maxAQI: 0,
    minAQI: 0,
    averagePM25: 0,
    averagePM10: 0,
    uniqueLocations: []
  };
};

// Instance method to check if data is recent
aqiDataSchema.methods.isRecent = function(minutesThreshold = 60) {
  const now = new Date();
  const diffInMinutes = (now - this.requestTimestamp) / (1000 * 60);
  return diffInMinutes <= minutesThreshold;
};

// Pre-save middleware to set dataTimestamp if not provided
aqiDataSchema.pre('save', function(next) {
  if (!this.dataTimestamp) {
    this.dataTimestamp = this.requestTimestamp || new Date();
  }
  next();
});

module.exports = mongoose.model('AQIData', aqiDataSchema);
