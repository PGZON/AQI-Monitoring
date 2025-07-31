/**
 * Custom Hook for Alert Management
 * Handles alert settings, notifications, and real-time alerts
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import alertService from '../services/alertService';

/**
 * Hook for managing user alerts and notifications
 */
export const useAlerts = (aqiData, location) => {
  const [alertSettings, setAlertSettings] = useState(null);
  const [currentAlerts, setCurrentAlerts] = useState({ active: [], recent: [], unreadCount: 0 });
  const [loading, setLoading] = useState({ settings: false, alerts: false });
  const [error, setError] = useState({ settings: null, alerts: null });
  const [lastChecked, setLastChecked] = useState(null);
  
  // Refs to avoid stale closures
  const aqiDataRef = useRef(aqiData);
  const locationRef = useRef(location);
  const alertSettingsRef = useRef(alertSettings);

  // Update refs when props change
  useEffect(() => {
    aqiDataRef.current = aqiData;
  }, [aqiData]);

  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  useEffect(() => {
    alertSettingsRef.current = alertSettings;
  }, [alertSettings]);

  /**
   * Fetch alert settings
   */
  const fetchAlertSettings = useCallback(async () => {
    setLoading(prev => ({ ...prev, settings: true }));
    setError(prev => ({ ...prev, settings: null }));

    try {
      const result = await alertService.getAlertSettings();
      
      if (result.success) {
        setAlertSettings(result.data);
      } else {
        setError(prev => ({ ...prev, settings: result.error || 'Failed to fetch alert settings' }));
        setAlertSettings(result.data); // Still set default data
      }
    } catch (err) {
      setError(prev => ({ ...prev, settings: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, settings: false }));
    }
  }, []);

  /**
   * Update alert settings
   */
  const updateAlertSettings = useCallback(async (newSettings) => {
    setLoading(prev => ({ ...prev, settings: true }));
    setError(prev => ({ ...prev, settings: null }));

    try {
      const result = await alertService.updateAlertSettings(newSettings);
      
      if (result.success) {
        setAlertSettings(newSettings);
        return { success: true };
      } else {
        setError(prev => ({ ...prev, settings: result.error || 'Failed to update alert settings' }));
        // Still update local state for better UX
        setAlertSettings(newSettings);
        return { success: false, error: result.error };
      }
    } catch (err) {
      setError(prev => ({ ...prev, settings: err.message }));
      return { success: false, error: err.message };
    } finally {
      setLoading(prev => ({ ...prev, settings: false }));
    }
  }, []);

  /**
   * Fetch current alerts
   */
  const fetchCurrentAlerts = useCallback(async () => {
    if (!location?.latitude || !location?.longitude) return;

    setLoading(prev => ({ ...prev, alerts: true }));
    setError(prev => ({ ...prev, alerts: null }));

    try {
      const result = await alertService.getCurrentAlerts(location.latitude, location.longitude);
      
      if (result.success) {
        setCurrentAlerts(result.data);
        setLastChecked(new Date());
      } else {
        setError(prev => ({ ...prev, alerts: result.error || 'Failed to fetch current alerts' }));
        setCurrentAlerts(result.data); // Still set mock data
      }
    } catch (err) {
      setError(prev => ({ ...prev, alerts: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, alerts: false }));
    }
  }, [location?.latitude, location?.longitude]);

  /**
   * Check if current conditions should trigger an alert
   */
  const checkForAlerts = useCallback(() => {
    const currentAqiData = aqiDataRef.current;
    const currentSettings = alertSettingsRef.current;
    
    if (!currentAqiData || !currentSettings) return;

    const alert = alertService.shouldTriggerAlert(currentAqiData, currentSettings);
    
    if (alert) {
      // Add to current alerts
      setCurrentAlerts(prev => ({
        ...prev,
        active: [alert, ...prev.active.filter(a => a.type !== alert.type)],
        recent: [alert, ...prev.recent],
        unreadCount: prev.unreadCount + 1
      }));

      // Notify subscribers (for toast notifications, etc.)
      alertService.notify(alert);
      
      return alert;
    }
    
    return null;
  }, []);

  /**
   * Mark alerts as read
   */
  const markAlertsAsRead = useCallback(async (alertIds = null) => {
    // If no specific alerts, mark all as read
    const idsToMark = alertIds || currentAlerts.recent.filter(a => !a.isRead).map(a => a.id);
    
    if (idsToMark.length === 0) return;

    try {
      await alertService.markAlertsAsRead(idsToMark);
      
      setCurrentAlerts(prev => ({
        ...prev,
        recent: prev.recent.map(alert => 
          idsToMark.includes(alert.id) ? { ...alert, isRead: true } : alert
        ),
        unreadCount: Math.max(0, prev.unreadCount - idsToMark.length)
      }));
    } catch (err) {
      console.error('Failed to mark alerts as read:', err);
    }
  }, [currentAlerts.recent]);

  /**
   * Dismiss active alert
   */
  const dismissAlert = useCallback((alertId) => {
    setCurrentAlerts(prev => ({
      ...prev,
      active: prev.active.filter(alert => alert.id !== alertId)
    }));
  }, []);

  /**
   * Get alert statistics
   */
  const getAlertStats = useCallback(() => {
    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const todayAlerts = currentAlerts.recent.filter(alert => 
      new Date(alert.timestamp) >= oneDayAgo
    );

    const weekAlerts = currentAlerts.recent.filter(alert => 
      new Date(alert.timestamp) >= oneWeekAgo
    );

    return {
      total: currentAlerts.recent.length,
      unread: currentAlerts.unreadCount,
      active: currentAlerts.active.length,
      today: todayAlerts.length,
      thisWeek: weekAlerts.length,
      severityBreakdown: currentAlerts.recent.reduce((acc, alert) => {
        acc[alert.severity] = (acc[alert.severity] || 0) + 1;
        return acc;
      }, {})
    };
  }, [currentAlerts]);

  // Initial data fetch
  useEffect(() => {
    fetchAlertSettings();
  }, [fetchAlertSettings]);

  // Fetch alerts when location changes
  useEffect(() => {
    if (location?.latitude && location?.longitude) {
      fetchCurrentAlerts();
    }
  }, [location?.latitude, location?.longitude, fetchCurrentAlerts]);

  // Check for alerts when AQI data changes
  useEffect(() => {
    if (aqiData && alertSettings) {
      checkForAlerts();
    }
  }, [aqiData, alertSettings, checkForAlerts]);

  // Auto-refresh alerts
  useEffect(() => {
    if (!location?.latitude || !location?.longitude) return;

    const interval = setInterval(() => {
      fetchCurrentAlerts();
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(interval);
  }, [location?.latitude, location?.longitude, fetchCurrentAlerts]);

  return {
    // Data
    alertSettings,
    currentAlerts,
    lastChecked,
    
    // States
    loading,
    error,
    isLoading: Object.values(loading).some(Boolean),
    hasErrors: Object.values(error).some(Boolean),
    
    // Actions
    fetchAlertSettings,
    updateAlertSettings,
    fetchCurrentAlerts,
    checkForAlerts,
    markAlertsAsRead,
    dismissAlert,
    
    // Utilities
    getAlertStats,
    alertService: alertService // Expose service for advanced usage
  };
};

/**
 * Hook for subscribing to real-time alert notifications
 */
export const useAlertNotifications = (onAlert) => {
  useEffect(() => {
    if (!onAlert) return;

    const unsubscribe = alertService.subscribe(onAlert);
    return unsubscribe;
  }, [onAlert]);
};

export default useAlerts;
