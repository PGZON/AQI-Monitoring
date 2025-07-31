/**
 * Alert Service - Handles alert settings and notifications
 */

class AlertService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.subscribers = new Set();
  }

  /**
   * Subscribe to alert updates
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notify all subscribers
   */
  notify(alert) {
    this.subscribers.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Alert notification error:', error);
      }
    });
  }

  /**
   * Get user alert settings
   */
  async getAlertSettings() {
    const cacheKey = 'alert-settings';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return { success: true, data: cached.data, source: 'cache' };
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/user/alerts`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        this.cache.set(cacheKey, {
          data: data.data,
          timestamp: Date.now()
        });

        return { success: true, data: data.data, source: 'api' };
      }
      
      // Fallback to default settings
      const defaultSettings = this.getDefaultSettings();
      return { success: true, data: defaultSettings, source: 'default' };
    } catch (error) {
      console.error('Alert Service: Failed to fetch settings:', error);
      
      const defaultSettings = this.getDefaultSettings();
      return { success: false, data: defaultSettings, source: 'default', error: error.message };
    }
  }

  /**
   * Update user alert settings
   */
  async updateAlertSettings(settings) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/user/alerts/update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update cache
        this.cache.set('alert-settings', {
          data: settings,
          timestamp: Date.now()
        });

        return { success: true, data: data.data };
      }
      
      // Still update local cache even if API fails (for development)
      this.cache.set('alert-settings', {
        data: settings,
        timestamp: Date.now()
      });

      return { success: true, data: settings, source: 'local' };
    } catch (error) {
      console.error('Alert Service: Failed to update settings:', error);
      
      // Store locally as fallback
      this.cache.set('alert-settings', {
        data: settings,
        timestamp: Date.now()
      });

      return { success: false, data: settings, source: 'local', error: error.message };
    }
  }

  /**
   * Get current alerts for user
   */
  async getCurrentAlerts(latitude, longitude) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/alerts/current`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ latitude, longitude })
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data: data.data };
      }
      
      // Generate mock alerts for development
      const mockAlerts = this.generateMockAlerts(latitude, longitude);
      return { success: true, data: mockAlerts, source: 'mock' };
    } catch (error) {
      console.error('Alert Service: Failed to fetch current alerts:', error);
      
      const mockAlerts = this.generateMockAlerts(latitude, longitude);
      return { success: false, data: mockAlerts, source: 'mock', error: error.message };
    }
  }

  /**
   * Mark alerts as read
   */
  async markAlertsAsRead(alertIds) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/alerts/mark-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ alertIds })
      });

      if (response.ok) {
        return { success: true };
      }
      
      return { success: true, source: 'local' };
    } catch (error) {
      console.error('Alert Service: Failed to mark alerts as read:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if current AQI should trigger alert
   */
  shouldTriggerAlert(aqiData, settings) {
    if (!settings.enabled || !aqiData) return null;

    const currentAQI = aqiData.aqi?.index || 0;
    
    // Check main AQI threshold
    if (currentAQI >= settings.aqiThreshold) {
      return {
        type: 'aqi',
        severity: this.getAlertSeverity(currentAQI),
        title: `High AQI Alert: ${currentAQI}`,
        message: `Current AQI (${currentAQI}) exceeds your threshold of ${settings.aqiThreshold}`,
        value: currentAQI,
        threshold: settings.aqiThreshold,
        timestamp: new Date().toISOString()
      };
    }

    // Check individual pollutants
    if (settings.pollutantAlerts && aqiData.pollutants) {
      for (const pollutant of Object.keys(settings.pollutantThresholds)) {
        if (settings.pollutantAlerts[pollutant] && aqiData.pollutants[pollutant]) {
          const value = aqiData.pollutants[pollutant].value || 0;
          const threshold = settings.pollutantThresholds[pollutant];
          
          if (value >= threshold) {
            return {
              type: 'pollutant',
              pollutant,
              severity: this.getAlertSeverity(value, pollutant),
              title: `High ${pollutant.toUpperCase()} Alert`,
              message: `${pollutant.toUpperCase()} level (${value}) exceeds threshold of ${threshold}`,
              value,
              threshold,
              timestamp: new Date().toISOString()
            };
          }
        }
      }
    }

    return null;
  }

  /**
   * Get alert severity level
   */
  getAlertSeverity(value, type = 'aqi') {
    if (type === 'aqi') {
      if (value <= 50) return 'good';
      if (value <= 100) return 'moderate';
      if (value <= 150) return 'unhealthy-sensitive';
      if (value <= 200) return 'unhealthy';
      if (value <= 300) return 'very-unhealthy';
      return 'hazardous';
    }
    
    // For pollutants, use simplified thresholds
    if (value < 35) return 'good';
    if (value < 75) return 'moderate';
    if (value < 115) return 'unhealthy-sensitive';
    return 'unhealthy';
  }

  /**
   * Get default alert settings
   */
  getDefaultSettings() {
    return {
      enabled: true,
      aqiThreshold: 150,
      pollutantAlerts: {
        'pm25': true,
        'pm10': true,
        'no2': false,
        'o3': false,
        'co': false,
        'so2': false
      },
      pollutantThresholds: {
        'pm25': 55,
        'pm10': 150,
        'no2': 100,
        'o3': 140,
        'co': 12,
        'so2': 185
      },
      notificationTime: '08:00',
      dailySummary: true,
      soundEnabled: true,
      emailAlerts: false,
      smsAlerts: false
    };
  }

  /**
   * Generate mock alerts for development
   */
  generateMockAlerts(latitude, longitude) {
    const now = new Date();
    const alerts = [];
    
    // Sometimes generate a current alert
    if (Math.random() > 0.7) {
      const severity = ['moderate', 'unhealthy-sensitive', 'unhealthy'][Math.floor(Math.random() * 3)];
      const aqiValue = severity === 'moderate' ? 85 : severity === 'unhealthy-sensitive' ? 135 : 175;
      
      alerts.push({
        id: `alert-${Date.now()}`,
        type: 'aqi',
        severity,
        title: `AQI Alert: ${aqiValue}`,
        message: `Current AQI (${aqiValue}) is in the ${severity.replace('-', ' ')} range`,
        value: aqiValue,
        location: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
        timestamp: now.toISOString(),
        isRead: false,
        isActive: true
      });
    }

    // Add some historical alerts
    for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
      const alertTime = new Date(now.getTime() - (Math.random() * 24 * 60 * 60 * 1000));
      const types = ['aqi', 'pollutant'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      alerts.push({
        id: `alert-${alertTime.getTime()}-${i}`,
        type,
        severity: ['moderate', 'unhealthy-sensitive', 'unhealthy'][Math.floor(Math.random() * 3)],
        title: type === 'aqi' ? `AQI Alert` : `PM2.5 Alert`,
        message: type === 'aqi' 
          ? `AQI exceeded threshold at ${alertTime.toLocaleTimeString()}`
          : `PM2.5 levels were elevated at ${alertTime.toLocaleTimeString()}`,
        value: Math.round(50 + Math.random() * 150),
        location: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
        timestamp: alertTime.toISOString(),
        isRead: Math.random() > 0.3,
        isActive: false
      });
    }

    return {
      active: alerts.filter(alert => alert.isActive),
      recent: alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
      unreadCount: alerts.filter(alert => !alert.isRead).length
    };
  }

  /**
   * Get alert color and icon
   */
  getAlertStyle(severity) {
    const styles = {
      'good': {
        color: '#22c55e',
        bgColor: '#dcfce7',
        borderColor: '#22c55e',
        icon: '🟢',
        textColor: '#166534'
      },
      'moderate': {
        color: '#eab308',
        bgColor: '#fef3c7',
        borderColor: '#eab308',
        icon: '🟡',
        textColor: '#a16207'
      },
      'unhealthy-sensitive': {
        color: '#f97316',
        bgColor: '#fed7aa',
        borderColor: '#f97316',
        icon: '🟠',
        textColor: '#c2410c'
      },
      'unhealthy': {
        color: '#ef4444',
        bgColor: '#fecaca',
        borderColor: '#ef4444',
        icon: '🔴',
        textColor: '#dc2626'
      },
      'very-unhealthy': {
        color: '#8b5cf6',
        bgColor: '#e9d5ff',
        borderColor: '#8b5cf6',
        icon: '🟣',
        textColor: '#7c3aed'
      },
      'hazardous': {
        color: '#7c2d12',
        bgColor: '#fecaca',
        borderColor: '#7c2d12',
        icon: '⚫',
        textColor: '#7c2d12'
      }
    };

    return styles[severity] || styles.moderate;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Export singleton instance
export const alertService = new AlertService();
export default alertService;
