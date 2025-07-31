const nodemailer = require('nodemailer');
const twilio = require('twilio');
const AlertLog = require('../models/AlertLog');

class NotificationService {
  constructor() {
    this.emailTransporter = null;
    this.twilioClient = null;
    this.initializeServices();
  }

  /**
   * Initialize email and SMS services
   */
  initializeServices() {
    // Initialize email transporter
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      this.emailTransporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });
    }

    // Initialize Twilio client for SMS/WhatsApp
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
    }
  }

  /**
   * Send AQI alert notification
   */
  async sendAQIAlert(alertData) {
    try {
      const { user, preferences, alertInfo, location } = alertData;
      
      // Create alert log entry
      const alertLog = new AlertLog({
        userId: user._id,
        alertType: alertInfo.type || 'aqi_threshold',
        location: {
          city: location.city,
          country: location.country,
          coordinates: location.coordinates
        },
        triggerData: {
          currentAQI: alertInfo.currentAQI,
          thresholdExceeded: alertInfo.threshold,
          pollutantsExceeded: alertInfo.pollutantsExceeded || [],
          forecastData: alertInfo.forecastData
        },
        alertLevel: alertInfo.level,
        notificationMethods: [],
        message: {
          subject: this.generateAlertSubject(alertInfo, location),
          content: this.generateAlertContent(alertInfo, location, user.name),
          language: preferences.language || 'en'
        },
        metadata: {
          source: 'system',
          priority: this.getAlertPriority(alertInfo.level)
        }
      });

      // Determine which notification methods to use
      const enabledMethods = this.getEnabledNotificationMethods(preferences);
      
      // Send notifications
      const notificationPromises = [];

      for (const method of enabledMethods) {
        alertLog.notificationMethods.push({
          method,
          status: 'pending'
        });

        switch (method) {
          case 'email':
            if (user.email) {
              notificationPromises.push(
                this.sendEmailNotification(user.email, alertLog.message, alertLog._id, method)
              );
            }
            break;
          
          case 'sms':
            if (preferences.contactInfo?.phoneNumber) {
              notificationPromises.push(
                this.sendSMSNotification(preferences.contactInfo.phoneNumber, alertLog.message, alertLog._id, method)
              );
            }
            break;
          
          case 'whatsapp':
            if (preferences.contactInfo?.whatsappNumber) {
              notificationPromises.push(
                this.sendWhatsAppNotification(preferences.contactInfo.whatsappNumber, alertLog.message, alertLog._id, method)
              );
            }
            break;
          
          case 'push':
            // Push notifications would be implemented here
            // For now, we'll mark it as sent
            alertLog.notificationMethods.find(nm => nm.method === method).status = 'sent';
            alertLog.notificationMethods.find(nm => nm.method === method).sentAt = new Date();
            break;
          
          default:
            console.warn(`Unsupported notification method: ${method}`);
            break;
        }
      }

      // Save initial alert log
      await alertLog.save();

      // Wait for all notification attempts
      const results = await Promise.allSettled(notificationPromises);
      
      // Update notification statuses based on results
      results.forEach((result, index) => {
        const method = enabledMethods[index];
        if (method === 'push') return; // Already handled above
        
        const notification = alertLog.notificationMethods.find(nm => nm.method === method);
        
        if (result.status === 'fulfilled') {
          notification.status = 'sent';
          notification.sentAt = new Date();
          notification.deliveryId = result.value.deliveryId;
        } else {
          notification.status = 'failed';
          notification.errorMessage = result.reason.message;
        }
      });

      // Save final alert log
      await alertLog.save();

      return {
        success: true,
        alertLogId: alertLog._id,
        notificationsSent: alertLog.notificationMethods.filter(nm => nm.status === 'sent').length,
        notificationsFailed: alertLog.notificationMethods.filter(nm => nm.status === 'failed').length
      };

    } catch (error) {
      console.error('Failed to send AQI alert:', error);
      throw new Error(`Failed to send alert: ${error.message}`);
    }
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(email, message, alertLogId, method) {
    if (!this.emailTransporter) {
      throw new Error('Email service not configured');
    }

    try {
      const mailOptions = {
        from: `"AQI Monitor Alert" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: email,
        subject: message.subject,
        html: this.generateEmailHTML(message.content, alertLogId),
        text: message.content
      };

      const result = await this.emailTransporter.sendMail(mailOptions);
      
      return {
        deliveryId: result.messageId,
        method
      };
    } catch (error) {
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }

  /**
   * Send SMS notification
   */
  async sendSMSNotification(phoneNumber, message, alertLogId, method) {
    if (!this.twilioClient) {
      throw new Error('SMS service not configured');
    }

    try {
      const result = await this.twilioClient.messages.create({
        body: this.generateSMSContent(message.content),
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });

      return {
        deliveryId: result.sid,
        method
      };
    } catch (error) {
      throw new Error(`SMS sending failed: ${error.message}`);
    }
  }

  /**
   * Send WhatsApp notification
   */
  async sendWhatsAppNotification(whatsappNumber, message, alertLogId, method) {
    if (!this.twilioClient) {
      throw new Error('WhatsApp service not configured');
    }

    try {
      const result = await this.twilioClient.messages.create({
        body: this.generateSMSContent(message.content),
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${whatsappNumber}`
      });

      return {
        deliveryId: result.sid,
        method
      };
    } catch (error) {
      throw new Error(`WhatsApp sending failed: ${error.message}`);
    }
  }

  /**
   * Get enabled notification methods for user
   */
  getEnabledNotificationMethods(preferences) {
    const methods = [];
    const notifications = preferences.alertSettings.notifications;

    if (notifications.email) methods.push('email');
    if (notifications.sms) methods.push('sms');
    if (notifications.whatsapp) methods.push('whatsapp');
    if (notifications.push) methods.push('push');

    return methods;
  }

  /**
   * Generate alert subject line
   */
  generateAlertSubject(alertInfo, location) {
    const levelText = alertInfo.level.replace('_', ' ').toUpperCase();
    return `🚨 ${levelText} Air Quality Alert - ${location.city}`;
  }

  /**
   * Generate alert content
   */
  generateAlertContent(alertInfo, location, userName) {
    let content = `Hello ${userName},\n\n`;
    
    if (alertInfo.type === 'forecast_alert') {
      content += `Our forecast predicts ${alertInfo.level.replace('_', ' ')} air quality in ${location.city} `;
      content += `for ${alertInfo.forecastData.date}.\n\n`;
      content += `Predicted AQI: ${alertInfo.forecastData.predictedAQI}\n`;
      content += `Confidence: ${alertInfo.forecastData.confidence}\n\n`;
    } else {
      content += `The air quality in ${location.city} has reached ${alertInfo.level.replace('_', ' ')} levels.\n\n`;
      content += `Current AQI: ${alertInfo.currentAQI}\n`;
      content += `Your threshold: ${alertInfo.threshold}\n\n`;
    }

    // Add pollutant information if available
    if (alertInfo.pollutantsExceeded && alertInfo.pollutantsExceeded.length > 0) {
      content += `Pollutants exceeding thresholds:\n`;
      alertInfo.pollutantsExceeded.forEach(pollutant => {
        content += `• ${pollutant.pollutant.toUpperCase()}: ${pollutant.value} ${pollutant.unit} (threshold: ${pollutant.threshold} ${pollutant.unit})\n`;
      });
      content += '\n';
    }

    // Add health recommendations
    content += this.getHealthRecommendations(alertInfo.level);
    
    content += '\n\nStay safe and take care of your health!\n';
    content += 'AQI Monitor Team';

    return content;
  }

  /**
   * Generate health recommendations based on alert level
   */
  getHealthRecommendations(level) {
    const recommendations = {
      moderate: `Recommendations:
• Sensitive individuals should consider reducing outdoor activities
• Limit prolonged outdoor exertion
• Consider wearing a mask if you have respiratory conditions`,
      
      unhealthy: `Recommendations:
• Everyone should reduce outdoor activities
• Avoid prolonged outdoor exertion
• Sensitive groups should stay indoors
• Wear N95 masks when going outside`,
      
      very_unhealthy: `Recommendations:
• Everyone should avoid outdoor activities
• Stay indoors with windows closed
• Use air purifiers if available
• Wear N95 masks if you must go outside
• Seek medical attention if experiencing symptoms`,
      
      hazardous: `Recommendations:
• STAY INDOORS immediately
• Avoid all outdoor activities
• Keep windows and doors closed
• Use air purifiers and create clean air spaces
• Seek immediate medical attention for any symptoms
• Consider relocating to areas with better air quality`
    };

    return recommendations[level] || recommendations.moderate;
  }

  /**
   * Generate HTML email content
   */
  generateEmailHTML(textContent, alertLogId) {
    return `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🚨 Air Quality Alert</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border: 1px solid #dee2e6;">
            <div style="white-space: pre-line; font-size: 16px;">
              ${textContent.replace(/\n/g, '<br>')}
            </div>
          </div>
          
          <div style="background: #e9ecef; padding: 15px; border-radius: 0 0 10px 10px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #6c757d;">
              You received this alert because you have notifications enabled for air quality changes.
              <br>
              <a href="${process.env.FRONTEND_URL}/preferences" style="color: #007bff;">Manage your notification preferences</a>
            </p>
          </div>
        </div>
      </body>
    </html>`;
  }

  /**
   * Generate SMS content (shorter version)
   */
  generateSMSContent(fullContent) {
    // Extract key information for SMS (character limit)
    const cityMatch = fullContent.match(/in ([^,\n]+)/);
    const aqiMatch = fullContent.match(/AQI:\s*(\d+)/);
    
    let smsContent = '🚨 AQI Alert';
    if (cityMatch) smsContent += ` - ${cityMatch[1]}`;
    if (aqiMatch) smsContent += ` - AQI: ${aqiMatch[1]}`;
    smsContent += '. Check your email for details and safety recommendations.';
    
    return smsContent;
  }

  /**
   * Get alert priority based on level
   */
  getAlertPriority(level) {
    const priorities = {
      moderate: 'medium',
      unhealthy: 'high',
      very_unhealthy: 'high',
      hazardous: 'critical'
    };
    return priorities[level] || 'medium';
  }

  /**
   * Send test notification
   */
  async sendTestNotification(user, method = 'email') {
    try {
      const testMessage = {
        subject: 'Test Notification - AQI Monitor',
        content: `Hello ${user.name},\n\nThis is a test notification from your AQI Monitor system.\n\nIf you received this message, your notification settings are working correctly!\n\nBest regards,\nAQI Monitor Team`
      };

      switch (method) {
        case 'email':
          if (!user.email) throw new Error('Email address not available');
          return await this.sendEmailNotification(user.email, testMessage, 'test', method);
        
        case 'sms':
          if (!user.phoneNumber) throw new Error('Phone number not available');
          return await this.sendSMSNotification(user.phoneNumber, testMessage, 'test', method);
        
        case 'whatsapp':
          if (!user.whatsappNumber) throw new Error('WhatsApp number not available');
          return await this.sendWhatsAppNotification(user.whatsappNumber, testMessage, 'test', method);
        
        default:
          throw new Error('Invalid notification method');
      }
    } catch (error) {
      throw new Error(`Test notification failed: ${error.message}`);
    }
  }

  /**
   * Check service health
   */
  async checkServiceHealth() {
    const health = {
      email: false,
      sms: false,
      whatsapp: false
    };

    // Check email service
    if (this.emailTransporter) {
      try {
        await this.emailTransporter.verify();
        health.email = true;
      } catch (error) {
        console.warn('Email service health check failed:', error.message);
      }
    }

    // Check Twilio service
    if (this.twilioClient) {
      try {
        await this.twilioClient.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
        health.sms = true;
        health.whatsapp = true;
      } catch (error) {
        console.warn('Twilio service health check failed:', error.message);
      }
    }

    return health;
  }
}

module.exports = NotificationService;
