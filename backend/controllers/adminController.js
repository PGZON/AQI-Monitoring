const AdminService = require('../services/adminService');

class AdminController {
  /**
   * Get system overview dashboard
   * GET /api/admin/dashboard
   */
  static async getDashboard(req, res) {
    try {
      const overview = await AdminService.getSystemOverview();
      
      res.json({
        success: true,
        data: overview
      });
    } catch (error) {
      console.error('Error getting admin dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get dashboard data',
        error: error.message
      });
    }
  }

  /**
   * Get all users with pagination and filters
   * GET /api/admin/users
   */
  static async getUsers(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        role,
        isActive,
        search
      } = req.query;

      const filters = {};
      if (role) filters.role = role;
      if (isActive !== undefined) filters.isActive = isActive;
      if (search) filters.search = search;

      const result = await AdminService.getAllUsers(
        parseInt(page),
        parseInt(limit),
        filters
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error getting users:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get users',
        error: error.message
      });
    }
  }

  /**
   * Get user statistics
   * GET /api/admin/users/stats
   */
  static async getUserStats(req, res) {
    try {
      const { period = 30 } = req.query;
      
      const stats = await AdminService.getUserStats(parseInt(period));
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting user stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user statistics',
        error: error.message
      });
    }
  }

  /**
   * Delete user account
   * DELETE /api/admin/users/:id
   */
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const result = await AdminService.deleteUser(id);
      
      res.json({
        success: true,
        message: 'User deleted successfully',
        data: result
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      
      const statusCode = error.message.includes('not found') ? 404 : 
                        error.message.includes('Cannot delete admin') ? 403 : 500;
      
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Update user role
   * PUT /api/admin/users/:id/role
   */
  static async updateUserRole(req, res) {
    try {
      const { id } = req.params;
      const { role } = req.body;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      if (!role) {
        return res.status(400).json({
          success: false,
          message: 'Role is required'
        });
      }

      const user = await AdminService.updateUserRole(id, role);
      
      res.json({
        success: true,
        message: 'User role updated successfully',
        data: user
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      
      const statusCode = error.message.includes('not found') ? 404 : 
                        error.message.includes('Invalid role') ? 400 : 500;
      
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Get all alerts across the system
   * GET /api/admin/alerts
   */
  static async getAlerts(req, res) {
    try {
      const { period = 30 } = req.query;
      
      const stats = await AdminService.getAlertStats(parseInt(period));
      
      res.json({
        success: true,
        data: stats
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
   * Get city-wise AQI statistics
   * GET /api/admin/cities/aqi-stats
   */
  static async getCityAQIStats(req, res) {
    try {
      const { period = 30 } = req.query;
      
      const stats = await AdminService.getCityAQIStats(parseInt(period));
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting city AQI stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get city AQI statistics',
        error: error.message
      });
    }
  }

  /**
   * Get preference statistics
   * GET /api/admin/preferences/stats
   */
  static async getPreferenceStats(req, res) {
    try {
      const stats = await AdminService.getPreferenceStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting preference stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get preference statistics',
        error: error.message
      });
    }
  }

  /**
   * Get system health status
   * GET /api/admin/system/health
   */
  static async getSystemHealth(req, res) {
    try {
      const health = await AdminService.getSystemHealth();
      
      res.json({
        success: true,
        data: health
      });
    } catch (error) {
      console.error('Error getting system health:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get system health',
        error: error.message
      });
    }
  }

  /**
   * Get system logs (basic implementation)
   * GET /api/admin/logs
   */
  static async getSystemLogs(req, res) {
    try {
      const { 
        level = 'info',
        limit = 100,
        startDate,
        endDate
      } = req.query;

      // Basic log information (in production, this would read from log files)
      const logs = [
        {
          timestamp: new Date(),
          level: 'info',
          message: 'System health check completed',
          service: 'admin'
        },
        {
          timestamp: new Date(Date.now() - 60000),
          level: 'info',
          message: 'Alert scheduler running',
          service: 'scheduler'
        },
        {
          timestamp: new Date(Date.now() - 120000),
          level: 'info',
          message: 'User preference updated',
          service: 'preferences'
        }
      ];

      res.json({
        success: true,
        data: {
          logs: logs.slice(0, parseInt(limit)),
          filters: {
            level,
            limit: parseInt(limit),
            startDate,
            endDate
          },
          note: 'This is a basic implementation. In production, implement proper log aggregation.'
        }
      });
    } catch (error) {
      console.error('Error getting system logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get system logs',
        error: error.message
      });
    }
  }

  /**
   * Get analytics trends for charts
   * GET /api/admin/analytics/trends
   */
  static async getAnalyticsTrends(req, res) {
    try {
      const { period = 30, metric = 'all' } = req.query;
      
      const trends = {};
      
      if (metric === 'all' || metric === 'users') {
        const userStats = await AdminService.getUserStats(parseInt(period));
        trends.users = userStats.growth;
      }
      
      if (metric === 'all' || metric === 'alerts') {
        const alertStats = await AdminService.getAlertStats(parseInt(period));
        trends.alerts = alertStats.breakdown.byDay;
      }
      
      res.json({
        success: true,
        data: {
          trends,
          period: `${period} days`,
          metric
        }
      });
    } catch (error) {
      console.error('Error getting analytics trends:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get analytics trends',
        error: error.message
      });
    }
  }

  /**
   * Export data (basic CSV export)
   * GET /api/admin/export/:type
   */
  static async exportData(req, res) {
    try {
      const { type } = req.params;
      const { format = 'json' } = req.query;
      
      let data;
      let filename;
      
      switch (type) {
        case 'users':
          const userResult = await AdminService.getAllUsers(1, 1000);
          data = userResult.users;
          filename = `users_export_${new Date().toISOString().split('T')[0]}`;
          break;
          
        case 'alerts':
          const alertStats = await AdminService.getAlertStats(90);
          data = alertStats;
          filename = `alerts_export_${new Date().toISOString().split('T')[0]}`;
          break;
          
        case 'cities':
          const cityStats = await AdminService.getCityAQIStats(90);
          data = cityStats.cities;
          filename = `cities_export_${new Date().toISOString().split('T')[0]}`;
          break;
          
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid export type. Available: users, alerts, cities'
          });
      }
      
      if (format === 'csv') {
        // Basic CSV conversion (in production, use proper CSV library)
        const csvHeaders = Object.keys(data[0] || {}).join(',');
        const csvRows = data.map(row => Object.values(row).join(','));
        const csvContent = [csvHeaders, ...csvRows].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
        res.send(csvContent);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
        res.json({
          success: true,
          exportType: type,
          exportDate: new Date(),
          data
        });
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export data',
        error: error.message
      });
    }
  }
}

module.exports = AdminController;
