/**
 * Custom hook for AQI alert monitoring and management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { shouldTriggerAlert } from '../utils/getAQICategoryColor';
import { aqiAPI } from '../utils/api';

const useAQIAlert = ({
  coordinates,
  alertThreshold = 150,
  pollInterval = 300000, // 5 minutes default
  enabled = true,
  onAlert,
  onError
}) => {
  const [currentAQI, setCurrentAQI] = useState(null);
  const [previousAQI, setPreviousAQI] = useState(null);
  const [alertHistory, setAlertHistory] = useState([]);
  const [activeAlert, setActiveAlert] = useState(null);
  const [snoozedUntil, setSnoozedUntil] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [lastPolled, setLastPolled] = useState(null);
  
  const pollIntervalRef = useRef(null);
  const lastAlertRef = useRef(null);
  const coordinatesRef = useRef(coordinates);

  // Update coordinates ref when coordinates change
  useEffect(() => {
    coordinatesRef.current = coordinates;
  }, [coordinates]);

  // Check if alerts are currently snoozed
  const isAlertSnoozed = useCallback(() => {
    if (!snoozedUntil) return false;
    return Date.now() < snoozedUntil;
  }, [snoozedUntil]);

  // Add alert to history
  const addToAlertHistory = useCallback((alert) => {
    setAlertHistory(prev => {
      const newHistory = [{
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...alert
      }, ...prev];
      
      // Keep only last 10 alerts
      return newHistory.slice(0, 10);
    });
  }, []);

  // Fetch current AQI data
  const fetchAQIData = useCallback(async () => {
    if (!coordinatesRef.current || !coordinatesRef.current.latitude || !coordinatesRef.current.longitude) {
      return null;
    }

    try {
      const response = await aqiAPI.fetchAQI(
        coordinatesRef.current.latitude,
        coordinatesRef.current.longitude,
        true
      );

      if (response.success && response.data && response.data.aqi) {
        return response.data.aqi.index;
      }
      
      return null;
    } catch (error) {
      console.error('AQI Alert: Failed to fetch AQI data:', error);
      if (onError) {
        onError(error);
      }
      return null;
    }
  }, [onError]);

  // Process AQI update and check for alerts
  const processAQIUpdate = useCallback((newAQI) => {
    if (newAQI === null || newAQI === undefined) return;

    setPreviousAQI(currentAQI);
    setCurrentAQI(newAQI);
    setLastPolled(new Date().toISOString());

    // Skip alert processing if snoozed
    if (isAlertSnoozed()) {
      return;
    }

    // Check if we should trigger an alert
    const alertInfo = shouldTriggerAlert(newAQI, alertThreshold, currentAQI);
    
    if (alertInfo.shouldAlert) {
      // Prevent duplicate alerts for the same AQI level within 15 minutes
      const now = Date.now();
      const timeSinceLastAlert = lastAlertRef.current ? now - lastAlertRef.current.timestamp : Infinity;
      const aqiDifference = lastAlertRef.current ? Math.abs(newAQI - lastAlertRef.current.aqi) : Infinity;
      
      // Only trigger if:
      // 1. More than 15 minutes since last alert, OR
      // 2. AQI changed by more than 20 points, OR
      // 3. This is the first alert
      if (timeSinceLastAlert > 900000 || aqiDifference > 20 || !lastAlertRef.current) {
        const alert = {
          ...alertInfo,
          aqi: newAQI,
          threshold: alertThreshold,
          coordinates: coordinatesRef.current,
          timestamp: now
        };

        setActiveAlert(alert);
        addToAlertHistory(alert);
        lastAlertRef.current = { timestamp: now, aqi: newAQI };

        if (onAlert) {
          onAlert(alert);
        }
      }
    }

    // Check for significant changes (even if below threshold)
    if (alertInfo.changeAlert && currentAQI !== null) {
      const changeAlert = {
        ...alertInfo.changeAlert,
        aqi: newAQI,
        previousAQI: currentAQI,
        coordinates: coordinatesRef.current,
        timestamp: Date.now()
      };

      addToAlertHistory(changeAlert);
      
      if (onAlert) {
        onAlert(changeAlert);
      }
    }
  }, [currentAQI, alertThreshold, isAlertSnoozed, addToAlertHistory, onAlert]);

  // Start polling
  const startPolling = useCallback(() => {
    if (!enabled || !coordinates || isPolling) return;

    setIsPolling(true);
    
    // Initial fetch
    fetchAQIData().then(processAQIUpdate);

    // Set up interval
    pollIntervalRef.current = setInterval(async () => {
      const aqiData = await fetchAQIData();
      processAQIUpdate(aqiData);
    }, pollInterval);

  }, [enabled, coordinates, isPolling, pollInterval, fetchAQIData, processAQIUpdate]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Manual refresh
  const refreshAQI = useCallback(async () => {
    const aqiData = await fetchAQIData();
    processAQIUpdate(aqiData);
    return aqiData;
  }, [fetchAQIData, processAQIUpdate]);

  // Dismiss active alert
  const dismissAlert = useCallback(() => {
    setActiveAlert(null);
  }, []);

  // Snooze alerts for specified minutes
  const snoozeAlerts = useCallback((minutes = 10) => {
    setSnoozedUntil(Date.now() + (minutes * 60 * 1000));
    setActiveAlert(null);
  }, []);

  // Clear snooze
  const clearSnooze = useCallback(() => {
    setSnoozedUntil(null);
  }, []);

  // Clear alert history
  const clearAlertHistory = useCallback(() => {
    setAlertHistory([]);
  }, []);

  // Effect to manage polling lifecycle
  useEffect(() => {
    if (enabled && coordinates) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [enabled, coordinates, startPolling, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  return {
    // Current state
    currentAQI,
    previousAQI,
    activeAlert,
    alertHistory,
    isPolling,
    lastPolled,
    
    // Snooze state
    snoozedUntil,
    isAlertSnoozed: isAlertSnoozed(),
    
    // Actions
    startPolling,
    stopPolling,
    refreshAQI,
    dismissAlert,
    snoozeAlerts,
    clearSnooze,
    clearAlertHistory,
    
    // Settings
    alertThreshold,
    pollInterval: pollInterval / 1000, // Return in seconds for display
    enabled
  };
};

export default useAQIAlert;
