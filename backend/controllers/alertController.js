const AlertService = require('../services/alertService');
const AlertLog = require('../models/AlertLog');
const alertScheduler = require('../jobs/alertScheduler');

class AlertController {
  /**
   * Send manual alert
   * POST /api/alerts/send
   */
  static async sendManualAlert(req, res) {
    try {
      const { userIds, location, message, alertLevel = 'medium' } = req.body;
      
      if (!userIds && !location) {
        return res.status(400).json({
          success: false,
          message: 'Either userIds or location must be specified'
        });
      }

      if (!message) {
        return res.status(400).json({
          success: false,
          message: 'Alert message is required'
        });
      }

      const validLevels = ['moderate', 'unhealthy', 'very_unhealthy', 'hazardous'];
      if (!validLevels.includes(alertLevel)) {
        return res.status(400).json({
          success: false,
          message: `Invalid alert level. Must be one of: ${validLevels.join(', ')}`
        });
      }

      const result = await AlertService.sendManualAlert({
        userIds,
        location,
        message,
        alertLevel,
        adminUserId: req.user.id
      });

      res.json({
        success: true,
        message: 'Manual alert sent successfully',
        data: result
      });
    } catch (error) {
      console.error('Error sending manual alert:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send manual alert',
        error: error.message
      });
    }
  }

  /**
   * Get user's alert history
   * GET /api/alerts/history
   */
  static async getUserAlertHistory(req, res) {
    try {
      const userId = req.user.id;
      const { 
        page = 1, 
        limit = 20, 
        alertType, 
        alertLevel, 
        startDate, 
        endDate,
        isRead
      } = req.query;

      // Build query
      const query = { userId };
      
      if (alertType) {
        query.alertType = alertType;
      }
      
      if (alertLevel) {
        query.alertLevel = alertLevel;
      }
      
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      if (isRead !== undefined) {
        query.isRead = isRead === 'true';
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Get alerts
      const [alerts, totalCount] = await Promise.all([
        AlertLog.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .select('-notificationMethods.errorMessage -metadata.ipAddress -metadata.userAgent'),
        AlertLog.countDocuments(query)
      ]);

      // Calculate pagination info
      const totalPages = Math.ceil(totalCount / parseInt(limit));
      const hasNextPage = parseInt(page) < totalPages;
      const hasPrevPage = parseInt(page) > 1;

      res.json({
        success: true,
        data: {
          alerts,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            totalCount,
            totalPages,
            hasNextPage,
            hasPrevPage
          }
        }
      });
    } catch (error) {
      console.error('Error getting user alert history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get alert history',
        error: error.message
      });
    }
  }

  /**
   * Get alert statistics
   * GET /api/alerts/stats
   */
  static async getAlertStats(req, res) {
    try {
      const userId = req.user.id;
      const { days = 30 } = req.query;

      const stats = await AlertService.getAlertStats(userId, parseInt(days));

      res.json({
        success: true,
        data: {
          ...stats,
          period: `${days} days`
        }
      });
    } catch (error) {
      console.error('Error getting alert stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get alert statistics',
        error: error.message
      });
    }
  }

  /**
   * Mark alerts as read
   * PUT /api/alerts/mark-read
   */
  static async markAlertsAsRead(req, res) {
    try {
      const userId = req.user.id;
      const { alertIds } = req.body;

      // Validate alertIds if provided
      if (alertIds && (!Array.isArray(alertIds) || alertIds.length === 0)) {
        return res.status(400).json({
          success: false,
          message: 'alertIds must be a non-empty array if provided'
        });
      }

      const result = await AlertService.markAlertsAsRead(userId, alertIds);

      res.json({
        success: true,
        message: `${result.modifiedCount} alerts marked as read`,
        data: {
          modifiedCount: result.modifiedCount
        }
      });
    } catch (error) {
      console.error('Error marking alerts as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark alerts as read',
        error: error.message
      });
    }
  }

  /**
   * Record user action on alert (clicked, dismissed)
   * PUT /api/alerts/:alertId/action
   */
  static async recordUserAction(req, res) {
    try {
      const { alertId } = req.params;
      const { action } = req.body;
      const userId = req.user.id;

      const validActions = ['clicked', 'dismissed'];
      if (!validActions.includes(action)) {
        return res.status(400).json({
          success: false,
          message: `Invalid action. Must be one of: ${validActions.join(', ')}`
        });
      }

      // Find alert and verify ownership
      const alert = await AlertLog.findOne({ _id: alertId, userId });
      
      if (!alert) {
        return res.status(404).json({
          success: false,
          message: 'Alert not found'
        });
      }

      // Record user action
      await alert.recordUserAction(action);

      res.json({
        success: true,
        message: `Alert ${action} recorded successfully`,
        data: {
          alertId,
          action,
          actionTakenAt: alert.userAction.actionTakenAt
        }
      });
    } catch (error) {
      console.error('Error recording user action:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to record user action',
        error: error.message
      });
    }
  }

  /**
   * Get unread alerts count
   * GET /api/alerts/unread-count
   */
  static async getUnreadAlertsCount(req, res) {
    try {
      const userId = req.user.id;

      const count = await AlertLog.countDocuments({
        userId,
        isRead: false
      });

      res.json({
        success: true,
        data: {
          unreadCount: count
        }
      });
    } catch (error) {
      console.error('Error getting unread alerts count:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get unread alerts count',
        error: error.message
      });
    }
  }

  /**
   * Trigger immediate alert check (admin only)
   * POST /api/alerts/check-now
   */
  static async triggerAlertCheck(req, res) {
    try {
      // This would typically require admin permissions
      // For now, we'll allow any authenticated user
      
      const result = await AlertService.checkAndSendAlerts();

      res.json({
        success: true,
        message: 'Alert check triggered successfully',
        data: result
      });
    } catch (error) {
      console.error('Error triggering alert check:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to trigger alert check',
        error: error.message
      });
    }
  }

  /**
   * Get scheduler status (admin only)
   * GET /api/alerts/scheduler-status
   */
  static async getSchedulerStatus(req, res) {
    try {
      const status = alertScheduler.getStatus();
      const nextRuns = alertScheduler.getNextRunTimes();

      res.json({
        success: true,
        data: {
          ...status,
          nextRunTimes: nextRuns
        }
      });
    } catch (error) {
      console.error('Error getting scheduler status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get scheduler status',
        error: error.message
      });
    }
  }

  /**
   * Run scheduler job manually (admin only)
   * POST /api/alerts/run-job
   */
  static async runSchedulerJob(req, res) {
    try {
      const { jobName } = req.body;

      if (!jobName) {
        return res.status(400).json({
          success: false,
          message: 'Job name is required'
        });
      }

      const validJobs = ['main_alert_check', 'forecast_alert_check', 'cleanup_job', 'health_check'];
      if (!validJobs.includes(jobName)) {
        return res.status(400).json({
          success: false,
          message: `Invalid job name. Must be one of: ${validJobs.join(', ')}`
        });
      }

      const result = await alertScheduler.runJobManually(jobName);

      res.json({
        success: true,
        message: `Job ${jobName} executed successfully`,
        data: result
      });
    } catch (error) {
      console.error('Error running scheduler job:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to run scheduler job',
        error: error.message
      });
    }
  }

  /**
   * Get alert trends (for analytics)
   * GET /api/alerts/trends
   */
  static async getAlertTrends(req, res) {
    try {
      const { days = 30, groupBy = 'day' } = req.query;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      let groupByFormat;
      switch (groupBy) {
        case 'hour':
          groupByFormat = '%Y-%m-%d %H:00';
          break;
        case 'day':
          groupByFormat = '%Y-%m-%d';
          break;
        case 'week':
          groupByFormat = '%Y-%u';
          break;
        case 'month':
          groupByFormat = '%Y-%m';
          break;
        default:
          groupByFormat = '%Y-%m-%d';
      }

      const trends = await AlertLog.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: groupByFormat, date: '$createdAt' } },
              alertType: '$alertType',
              alertLevel: '$alertLevel'
            },
            count: { $sum: 1 },
            locations: { $addToSet: '$location.city' }
          }
        },
        {
          $sort: { '_id.date': 1 }
        }
      ]);

      res.json({
        success: true,
        data: {
          trends,
          period: `${days} days`,
          groupBy
        }
      });
    } catch (error) {
      console.error('Error getting alert trends:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get alert trends',
        error: error.message
      });
    }
  }
}

module.exports = AlertController;
