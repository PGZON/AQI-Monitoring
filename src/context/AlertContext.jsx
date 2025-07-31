/**
 * AQI Alert Manager - Coordinates all alert-related components and state
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import useAQIAlert from '../hooks/useAQIAlert';
import AQIAlertToast from '../components/AQIAlertToast';

// Create Alert Context
const AlertContext = createContext();

export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlerts must be used within AlertProvider');
  }
  return context;
};

// Alert Manager Provider Component
export const AlertProvider = ({ children }) => {
  const { preferences } = useUser();
  const [coordinates, setCoordinates] = useState(null);
  const [toastAlerts, setToastAlerts] = useState([]);
  const [alertSettings, setAlertSettings] = useState({
    enabled: true,
    showToasts: true,
    showBanner: true,
    soundEnabled: false,
    position: 'top-right'
  });

  // Get alert threshold from user preferences
  const alertThreshold = preferences?.aqiAlertThreshold || 150;
  const alertsEnabled = preferences?.enableAQIAlerts !== false && alertSettings.enabled;

  // Initialize AQI alert hook
  const alertHook = useAQIAlert({
    coordinates,
    alertThreshold,
    pollInterval: 300000, // 5 minutes
    enabled: alertsEnabled,
    onAlert: handleNewAlert,
    onError: handleAlertError
  });

  // Handle new alerts
  function handleNewAlert(alert) {
    console.log('New AQI Alert:', alert);

    // Add to toast queue if toasts are enabled
    if (alertSettings.showToasts) {
      const toastAlert = {
        id: Date.now() + Math.random(),
        ...alert,
        timestamp: Date.now()
      };
      
      setToastAlerts(prev => [...prev, toastAlert]);
    }

    // Play sound if enabled
    if (alertSettings.soundEnabled) {
      playAlertSound(alert.alertType);
    }

    // Browser notification (if permission granted)
    if ('Notification' in window && Notification.permission === 'granted') {
      showBrowserNotification(alert);
    }
  }

  // Handle alert errors
  function handleAlertError(error) {
    console.error('AQI Alert Error:', error);
    
    // Show error toast
    if (alertSettings.showToasts) {
      const errorAlert = {
        id: Date.now() + Math.random(),
        alertType: 'error',
        alertTitle: 'Alert System Error',
        message: 'Unable to fetch current air quality data',
        aqi: null,
        timestamp: Date.now()
      };
      
      setToastAlerts(prev => [...prev, errorAlert]);
    }
  }

  // Play alert sound based on severity
  const playAlertSound = useCallback((alertType) => {
    try {
      // Different sounds for different alert types
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Set frequency based on alert type
      let frequency = 800; // Default
      if (alertType === 'error') frequency = 1000; // Higher for critical
      if (alertType === 'warning') frequency = 900; // Medium for warning

      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('Could not play alert sound:', error);
    }
  }, []);

  // Show browser notification
  const showBrowserNotification = useCallback((alert) => {
    try {
      const notification = new Notification(alert.alertTitle, {
        body: alert.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'aqi-alert',
        renotify: true
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto-close after 10 seconds
      setTimeout(() => {
        notification.close();
      }, 10000);
    } catch (error) {
      console.warn('Could not show browser notification:', error);
    }
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }, []);

  // Dismiss toast alert
  const dismissToastAlert = useCallback((alertId) => {
    setToastAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  // Snooze all alerts
  const snoozeAlerts = useCallback((minutes = 10) => {
    alertHook.snoozeAlerts(minutes);
    setToastAlerts([]); // Clear all toast alerts
  }, [alertHook]);

  // Update coordinates (called from parent components)
  const updateCoordinates = useCallback((newCoordinates) => {
    setCoordinates(newCoordinates);
  }, []);

  // Update alert settings
  const updateAlertSettings = useCallback((newSettings) => {
    setAlertSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Clear all alerts
  const clearAllAlerts = useCallback(() => {
    setToastAlerts([]);
    alertHook.clearAlertHistory();
  }, [alertHook]);

  // Effect to manage notification permission
  useEffect(() => {
    if (alertsEnabled && 'Notification' in window && Notification.permission === 'default') {
      // Don't auto-request permission, let user choose
      console.log('Browser notifications available but not enabled. User can enable in settings.');
    }
  }, [alertsEnabled]);

  const contextValue = {
    // Alert data
    currentAQI: alertHook.currentAQI,
    previousAQI: alertHook.previousAQI,
    activeAlert: alertHook.activeAlert,
    alertHistory: alertHook.alertHistory,
    toastAlerts,
    
    // Alert state
    isPolling: alertHook.isPolling,
    lastPolled: alertHook.lastPolled,
    snoozedUntil: alertHook.snoozedUntil,
    isAlertSnoozed: alertHook.isAlertSnoozed,
    
    // Settings
    alertThreshold,
    alertsEnabled,
    alertSettings,
    
    // Actions
    updateCoordinates,
    updateAlertSettings,
    dismissToastAlert,
    snoozeAlerts,
    clearAllAlerts,
    refreshAQI: alertHook.refreshAQI,
    requestNotificationPermission,
    
    // Control
    startPolling: alertHook.startPolling,
    stopPolling: alertHook.stopPolling,
    dismissAlert: alertHook.dismissAlert,
    clearSnooze: alertHook.clearSnooze
  };

  return (
    <AlertContext.Provider value={contextValue}>
      {children}
      
      {/* Render Toast Alerts */}
      <div className="fixed inset-0 pointer-events-none z-50">
        {toastAlerts.map((alert, index) => (
          <AQIAlertToast
            key={alert.id}
            alert={alert}
            position={alertSettings.position}
            onDismiss={() => dismissToastAlert(alert.id)}
            onSnooze={() => snoozeAlerts(10)}
            style={{
              top: alertSettings.position.includes('top') ? `${4 + (index * 80)}px` : undefined,
              bottom: alertSettings.position.includes('bottom') ? `${4 + (index * 80)}px` : undefined,
            }}
          />
        ))}
      </div>
    </AlertContext.Provider>
  );
};

export default AlertProvider;
