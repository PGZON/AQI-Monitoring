const mongoose = require('mongoose');

const alertLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  alertType: {
    type: String,
    enum: ['aqi_threshold', 'pollutant_threshold', 'forecast_alert', 'manual_alert'],
    required: true
  },
  location: {
    city: { type: String, required: true },
    country: { type: String },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number }
    }
  },
  triggerData: {
    currentAQI: { type: Number },
    thresholdExceeded: { type: Number },
    pollutantsExceeded: [{
      pollutant: String,
      value: Number,
      threshold: Number,
      unit: String
    }],
    forecastData: {
      date: Date,
      predictedAQI: Number,
      confidence: String
    }
  },
  alertLevel: {
    type: String,
    enum: ['moderate', 'unhealthy', 'very_unhealthy', 'hazardous'],
    required: true
  },
  notificationMethods: [{
    method: {
      type: String,
      enum: ['email', 'sms', 'whatsapp', 'push'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed', 'bounced'],
      default: 'pending'
    },
    sentAt: { type: Date },
    errorMessage: { type: String },
    deliveryId: { type: String }, // For tracking delivery with external services
    deliveryStatus: {
      type: String,
      enum: ['delivered', 'failed', 'unknown'],
      default: 'unknown'
    }
  }],
  message: {
    subject: { type: String, required: true },
    content: { type: String, required: true },
    language: { type: String, default: 'en' }
  },
  isRead: {
    type: Boolean,
    default: false
  },
  userAction: {
    clicked: { type: Boolean, default: false },
    dismissed: { type: Boolean, default: false },
    actionTakenAt: { type: Date }
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    source: { type: String, default: 'system' }, // 'system', 'manual', 'api'
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    }
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

// Indexes for efficient querying
alertLogSchema.index({ userId: 1, createdAt: -1 });
alertLogSchema.index({ 'location.city': 1, createdAt: -1 });
alertLogSchema.index({ alertType: 1, createdAt: -1 });
alertLogSchema.index({ alertLevel: 1, createdAt: -1 });
alertLogSchema.index({ createdAt: -1 });
alertLogSchema.index({ isRead: 1, userId: 1 });

// Virtual for overall notification status
alertLogSchema.virtual('overallNotificationStatus').get(function() {
  if (this.notificationMethods.length === 0) return 'none';
  
  const statuses = this.notificationMethods.map(nm => nm.status);
  
  if (statuses.every(status => status === 'sent')) return 'all_sent';
  if (statuses.some(status => status === 'sent')) return 'partial_sent';
  if (statuses.every(status => status === 'failed')) return 'all_failed';
  if (statuses.some(status => status === 'pending')) return 'pending';
  
  return 'mixed';
});

// Virtual for successful delivery count
alertLogSchema.virtual('successfulDeliveries').get(function() {
  return this.notificationMethods.filter(nm => nm.status === 'sent').length;
});

// Virtual for failed delivery count
alertLogSchema.virtual('failedDeliveries').get(function() {
  return this.notificationMethods.filter(nm => nm.status === 'failed').length;
});

// Instance method to mark notification as sent
alertLogSchema.methods.markNotificationSent = function(method, deliveryId = null) {
  const notification = this.notificationMethods.find(nm => nm.method === method);
  if (notification) {
    notification.status = 'sent';
    notification.sentAt = new Date();
    if (deliveryId) notification.deliveryId = deliveryId;
  }
  return this.save();
};

// Instance method to mark notification as failed
alertLogSchema.methods.markNotificationFailed = function(method, errorMessage) {
  const notification = this.notificationMethods.find(nm => nm.method === method);
  if (notification) {
    notification.status = 'failed';
    notification.errorMessage = errorMessage;
  }
  return this.save();
};

// Instance method to mark as read
alertLogSchema.methods.markAsRead = function() {
  this.isRead = true;
  return this.save();
};

// Instance method to record user action
alertLogSchema.methods.recordUserAction = function(action) {
  if (action === 'clicked') this.userAction.clicked = true;
  if (action === 'dismissed') this.userAction.dismissed = true;
  this.userAction.actionTakenAt = new Date();
  return this.save();
};

// Static method to get alert statistics for a user
alertLogSchema.statics.getUserAlertStats = function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalAlerts: { $sum: 1 },
        alertsByType: {
          $push: {
            type: '$alertType',
            level: '$alertLevel',
            date: '$createdAt'
          }
        },
        readAlerts: {
          $sum: { $cond: ['$isRead', 1, 0] }
        },
        clickedAlerts: {
          $sum: { $cond: ['$userAction.clicked', 1, 0] }
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalAlerts: 1,
        readRate: {
          $cond: [
            { $eq: ['$totalAlerts', 0] },
            0,
            { $divide: ['$readAlerts', '$totalAlerts'] }
          ]
        },
        clickRate: {
          $cond: [
            { $eq: ['$totalAlerts', 0] },
            0,
            { $divide: ['$clickedAlerts', '$totalAlerts'] }
          ]
        },
        alertsByType: 1
      }
    }
  ]);
};

// Static method to get recent alerts for a user
alertLogSchema.statics.getUserRecentAlerts = function(userId, limit = 10) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('-notificationMethods.errorMessage -metadata.ipAddress -metadata.userAgent');
};

// Static method to get alerts requiring retry
alertLogSchema.statics.getAlertsForRetry = function(maxRetries = 3) {
  return this.find({
    'notificationMethods.status': 'failed',
    'notificationMethods.retryCount': { $lt: maxRetries },
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
  });
};

// Static method to clean up old logs (for maintenance)
alertLogSchema.statics.cleanupOldLogs = function(daysToKeep = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
    isRead: true,
    'userAction.dismissed': true
  });
};

module.exports = mongoose.model('AlertLog', alertLogSchema);
