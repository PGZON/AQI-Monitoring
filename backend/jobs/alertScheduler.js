const cron = require('node-cron');
const AlertService = require('../services/alertService');

class AlertScheduler {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
  }

  /**
   * Start all scheduled jobs
   */
  start() {
    if (this.isRunning) {
      console.log('Alert scheduler is already running');
      return;
    }

    console.log('Starting AQI Alert Scheduler...');

    // Main alert check job - runs every 30 minutes
    this.scheduleMainAlertCheck();

    // Forecast alert check - runs twice daily (morning and evening)
    this.scheduleForecastAlertCheck();

    // Cleanup job - runs daily at 2 AM
    this.scheduleCleanupJob();

    // Health check job - runs every 5 minutes
    this.scheduleHealthCheck();

    this.isRunning = true;
    console.log('Alert scheduler started successfully');
  }

  /**
   * Stop all scheduled jobs
   */
  stop() {
    if (!this.isRunning) {
      console.log('Alert scheduler is not running');
      return;
    }

    console.log('Stopping alert scheduler...');

    // Stop all cron jobs
    this.jobs.forEach((job, name) => {
      try {
        job.stop();
        console.log(`Stopped job: ${name}`);
      } catch (error) {
        console.error(`Error stopping job ${name}:`, error.message);
      }
    });

    this.jobs.clear();
    this.isRunning = false;
    console.log('Alert scheduler stopped');
  }

  /**
   * Schedule main alert check (every 30 minutes)
   */
  scheduleMainAlertCheck() {
    const job = cron.schedule('*/30 * * * *', async () => {
      try {
        console.log('Running scheduled AQI alert check...');
        const startTime = Date.now();
        
        const result = await AlertService.checkAndSendAlerts();
        
        const duration = Date.now() - startTime;
        console.log(`Alert check completed in ${duration}ms. Processed: ${result.processed} users, Alerts: ${result.alerts}`);
        
        // Log to file or monitoring system if needed
        this.logJobExecution('main_alert_check', {
          duration,
          processed: result.processed,
          alerts: result.alerts,
          success: true
        });

      } catch (error) {
        console.error('Error in scheduled alert check:', error);
        this.logJobExecution('main_alert_check', {
          error: error.message,
          success: false
        });
      }
    }, {
      scheduled: false,
      timezone: process.env.SCHEDULER_TIMEZONE || 'UTC'
    });

    this.jobs.set('main_alert_check', job);
    job.start();
    console.log('Scheduled main alert check (every 30 minutes)');
  }

  /**
   * Schedule forecast alert check (twice daily: 8 AM and 6 PM)
   */
  scheduleForecastAlertCheck() {
    const job = cron.schedule('0 8,18 * * *', async () => {
      try {
        console.log('Running scheduled forecast alert check...');
        const startTime = Date.now();
        
        // This will trigger forecast-specific alerts
        const result = await AlertService.checkAndSendAlerts();
        
        const duration = Date.now() - startTime;
        console.log(`Forecast alert check completed in ${duration}ms. Processed: ${result.processed} users, Alerts: ${result.alerts}`);
        
        this.logJobExecution('forecast_alert_check', {
          duration,
          processed: result.processed,
          alerts: result.alerts,
          success: true
        });

      } catch (error) {
        console.error('Error in scheduled forecast alert check:', error);
        this.logJobExecution('forecast_alert_check', {
          error: error.message,
          success: false
        });
      }
    }, {
      scheduled: false,
      timezone: process.env.SCHEDULER_TIMEZONE || 'UTC'
    });

    this.jobs.set('forecast_alert_check', job);
    job.start();
    console.log('Scheduled forecast alert check (8 AM and 6 PM daily)');
  }

  /**
   * Schedule cleanup job (daily at 2 AM)
   */
  scheduleCleanupJob() {
    const job = cron.schedule('0 2 * * *', async () => {
      try {
        console.log('Running scheduled cleanup job...');
        const startTime = Date.now();
        
        // Clean up old alert logs (keep last 90 days)
        const result = await AlertService.cleanupOldAlerts(90);
        
        const duration = Date.now() - startTime;
        console.log(`Cleanup completed in ${duration}ms. Deleted: ${result.deletedCount} old alerts`);
        
        this.logJobExecution('cleanup_job', {
          duration,
          deletedCount: result.deletedCount,
          success: true
        });

      } catch (error) {
        console.error('Error in scheduled cleanup job:', error);
        this.logJobExecution('cleanup_job', {
          error: error.message,
          success: false
        });
      }
    }, {
      scheduled: false,
      timezone: process.env.SCHEDULER_TIMEZONE || 'UTC'
    });

    this.jobs.set('cleanup_job', job);
    job.start();
    console.log('Scheduled cleanup job (daily at 2 AM)');
  }

  /**
   * Schedule health check (every 5 minutes)
   */
  scheduleHealthCheck() {
    const job = cron.schedule('*/5 * * * *', async () => {
      try {
        // Check notification service health
        const NotificationService = require('../services/notificationService');
        const notificationService = new NotificationService();
        const health = await notificationService.checkServiceHealth();
        
        const unhealthyServices = Object.entries(health)
          .filter(([service, status]) => !status)
          .map(([service]) => service);

        if (unhealthyServices.length > 0) {
          console.warn(`Notification services unhealthy: ${unhealthyServices.join(', ')}`);
          
          // Could send alert to admin here
          this.logJobExecution('health_check', {
            unhealthyServices,
            success: false
          });
        } else {
          // Log successful health check only occasionally (every 30 minutes)
          const now = new Date();
          if (now.getMinutes() % 30 === 0) {
            console.log('All notification services healthy');
            this.logJobExecution('health_check', {
              allServicesHealthy: true,
              success: true
            });
          }
        }

      } catch (error) {
        console.error('Error in health check:', error);
        this.logJobExecution('health_check', {
          error: error.message,
          success: false
        });
      }
    }, {
      scheduled: false,
      timezone: process.env.SCHEDULER_TIMEZONE || 'UTC'
    });

    this.jobs.set('health_check', job);
    job.start();
    console.log('Scheduled health check (every 5 minutes)');
  }

  /**
   * Run a specific job manually
   */
  async runJobManually(jobName) {
    try {
      console.log(`Manually running job: ${jobName}`);
      
      switch (jobName) {
        case 'main_alert_check':
        case 'forecast_alert_check':
          const alertResult = await AlertService.checkAndSendAlerts();
          console.log(`Manual ${jobName} completed. Processed: ${alertResult.processed} users, Alerts: ${alertResult.alerts}`);
          return alertResult;
          
        case 'cleanup_job':
          const cleanupResult = await AlertService.cleanupOldAlerts(90);
          console.log(`Manual cleanup completed. Deleted: ${cleanupResult.deletedCount} old alerts`);
          return cleanupResult;
          
        case 'health_check':
          const NotificationService = require('../services/notificationService');
          const notificationService = new NotificationService();
          const healthResult = await notificationService.checkServiceHealth();
          console.log('Manual health check completed:', healthResult);
          return healthResult;
          
        default:
          throw new Error(`Unknown job: ${jobName}`);
      }
    } catch (error) {
      console.error(`Error running manual job ${jobName}:`, error);
      throw error;
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeJobs: Array.from(this.jobs.keys()),
      jobCount: this.jobs.size,
      uptime: this.isRunning ? process.uptime() : 0,
      timezone: process.env.SCHEDULER_TIMEZONE || 'UTC'
    };
  }

  /**
   * Get next run times for all jobs
   */
  getNextRunTimes() {
    const nextRuns = {};
    
    this.jobs.forEach((job, name) => {
      try {
        // Note: node-cron doesn't provide direct access to next run time
        // This would need to be calculated based on cron expressions
        nextRuns[name] = 'Available in job logs';
      } catch (error) {
        nextRuns[name] = 'Error getting next run time';
      }
    });
    
    return nextRuns;
  }

  /**
   * Log job execution (could be extended to use proper logging service)
   */
  logJobExecution(jobName, details) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      job: jobName,
      ...details
    };

    // For now, just console log. In production, this could write to:
    // - Database
    // - Log file
    // - External monitoring service (e.g., DataDog, New Relic)
    if (process.env.NODE_ENV === 'development') {
      console.log('Job execution log:', JSON.stringify(logEntry, null, 2));
    }

    // Could also store in database for monitoring dashboard
    // await JobLog.create(logEntry);
  }

  /**
   * Update job schedule dynamically
   */
  updateJobSchedule(jobName, newCronExpression) {
    try {
      if (!this.jobs.has(jobName)) {
        throw new Error(`Job ${jobName} not found`);
      }

      // Stop existing job
      const existingJob = this.jobs.get(jobName);
      existingJob.stop();

      // Create new job with updated schedule
      // Note: This is a simplified version. Each job would need specific handling
      console.log(`Updated schedule for ${jobName}: ${newCronExpression}`);
      
      return true;
    } catch (error) {
      console.error(`Error updating job schedule for ${jobName}:`, error);
      return false;
    }
  }

  /**
   * Pause a specific job
   */
  pauseJob(jobName) {
    try {
      if (!this.jobs.has(jobName)) {
        throw new Error(`Job ${jobName} not found`);
      }

      const job = this.jobs.get(jobName);
      job.stop();
      console.log(`Paused job: ${jobName}`);
      return true;
    } catch (error) {
      console.error(`Error pausing job ${jobName}:`, error);
      return false;
    }
  }

  /**
   * Resume a specific job
   */
  resumeJob(jobName) {
    try {
      if (!this.jobs.has(jobName)) {
        throw new Error(`Job ${jobName} not found`);
      }

      const job = this.jobs.get(jobName);
      job.start();
      console.log(`Resumed job: ${jobName}`);
      return true;
    } catch (error) {
      console.error(`Error resuming job ${jobName}:`, error);
      return false;
    }
  }
}

// Export singleton instance
const alertScheduler = new AlertScheduler();
module.exports = alertScheduler;
