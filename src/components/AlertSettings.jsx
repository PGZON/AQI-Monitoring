/**
 * Alert Settings Component - Configure AQI alert preferences
 */

import React, { useState } from 'react';
import { useAlerts } from '../context/AlertContext';
import { useUser } from '../context/UserContext';

const AlertSettings = ({ onSave }) => {
  const { 
    alertThreshold, 
    alertsEnabled, 
    alertSettings, 
    updateAlertSettings,
    requestNotificationPermission,
    snoozedUntil,
    clearSnooze,
    isPolling,
    startPolling,
    stopPolling
  } = useAlerts();
  
  const { updatePreferences } = useUser();
  
  const [localSettings, setLocalSettings] = useState({
    enabled: alertsEnabled,
    showToasts: alertSettings.showToasts,
    showBanner: alertSettings.showBanner,
    soundEnabled: alertSettings.soundEnabled,
    position: alertSettings.position,
    threshold: alertThreshold
  });
  
  const [hasNotificationPermission, setHasNotificationPermission] = useState(
    'Notification' in window && Notification.permission === 'granted'
  );

  const handleSettingChange = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      // Update alert settings
      updateAlertSettings({
        enabled: localSettings.enabled,
        showToasts: localSettings.showToasts,
        showBanner: localSettings.showBanner,
        soundEnabled: localSettings.soundEnabled,
        position: localSettings.position
      });

      // Update user preferences for threshold
      if (localSettings.threshold !== alertThreshold) {
        await updatePreferences({
          aqiAlertThreshold: localSettings.threshold,
          enableAQIAlerts: localSettings.enabled
        });
      }

      if (onSave) {
        onSave('Alert settings saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save alert settings:', error);
      if (onSave) {
        onSave('Failed to save alert settings. Please try again.', 'error');
      }
    }
  };

  const handleNotificationPermission = async () => {
    const granted = await requestNotificationPermission();
    setHasNotificationPermission(granted);
    
    if (granted && onSave) {
      onSave('Browser notifications enabled!');
    }
  };

  const formatSnoozedUntil = (timestamp) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.ceil((date - now) / (1000 * 60));
    return diffMinutes > 0 ? `${diffMinutes} minutes` : null;
  };

  const snoozedTimeLeft = formatSnoozedUntil(snoozedUntil);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">AQI Alert Settings</h3>
          <div className="flex items-center space-x-2">
            <span className={`w-3 h-3 rounded-full ${isPolling ? 'bg-green-500' : 'bg-gray-400'}`}></span>
            <span className="text-sm text-gray-600">
              {isPolling ? 'Monitoring active' : 'Monitoring paused'}
            </span>
          </div>
        </div>

        {/* Enable/Disable Alerts */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Enable AQI Alerts</label>
              <p className="text-xs text-gray-500">Monitor air quality and receive notifications</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.enabled}
                onChange={(e) => handleSettingChange('enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* Alert Threshold */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Alert Threshold (AQI Level)
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              min="50"
              max="300"
              step="25"
              value={localSettings.threshold}
              onChange={(e) => handleSettingChange('threshold', parseInt(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              disabled={!localSettings.enabled}
            />
            <div className="text-right min-w-[80px]">
              <span className="text-lg font-semibold text-gray-900">{localSettings.threshold}</span>
              <div className="text-xs text-gray-500">
                {localSettings.threshold <= 100 ? 'Moderate' : 
                 localSettings.threshold <= 150 ? 'Unhealthy*' : 
                 localSettings.threshold <= 200 ? 'Unhealthy' : 'Very Unhealthy'}
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            You'll be notified when AQI exceeds this level
          </p>
        </div>

        {/* Notification Types */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Notification Types</h4>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={localSettings.showToasts}
                onChange={(e) => handleSettingChange('showToasts', e.target.checked)}
                disabled={!localSettings.enabled}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Toast Notifications</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={localSettings.showBanner}
                onChange={(e) => handleSettingChange('showBanner', e.target.checked)}
                disabled={!localSettings.enabled}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Warning Banner</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={localSettings.soundEnabled}
                onChange={(e) => handleSettingChange('soundEnabled', e.target.checked)}
                disabled={!localSettings.enabled}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Sound Alerts</span>
            </label>
          </div>
        </div>

        {/* Toast Position */}
        {localSettings.showToasts && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Toast Position
            </label>
            <select
              value={localSettings.position}
              onChange={(e) => handleSettingChange('position', e.target.value)}
              disabled={!localSettings.enabled}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="top-right">Top Right</option>
              <option value="top-left">Top Left</option>
              <option value="top-center">Top Center</option>
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="bottom-center">Bottom Center</option>
            </select>
          </div>
        )}

        {/* Browser Notifications */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-700">Browser Notifications</h4>
              <p className="text-xs text-gray-500">
                {hasNotificationPermission 
                  ? 'Enabled - you\'ll receive notifications even when the tab is not active'
                  : 'Disabled - click to enable for better alert delivery'
                }
              </p>
            </div>
            {!hasNotificationPermission && (
              <button
                onClick={handleNotificationPermission}
                disabled={!localSettings.enabled}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enable
              </button>
            )}
          </div>
        </div>

        {/* Current Status */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Current Status</h4>
          <div className="space-y-1 text-xs text-blue-800">
            <div className="flex justify-between">
              <span>Monitoring:</span>
              <span className={isPolling ? 'text-green-700' : 'text-red-700'}>
                {isPolling ? 'Active' : 'Paused'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Alert Threshold:</span>
              <span>{alertThreshold} AQI</span>
            </div>
            {snoozedTimeLeft && (
              <div className="flex justify-between">
                <span>Snoozed for:</span>
                <span className="text-yellow-700">{snoozedTimeLeft}</span>
              </div>
            )}
          </div>
          
          {snoozedTimeLeft && (
            <button
              onClick={clearSnooze}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Clear snooze
            </button>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex justify-between items-center">
          <div className="space-x-2">
            {isPolling ? (
              <button
                onClick={stopPolling}
                className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
              >
                Pause Monitoring
              </button>
            ) : (
              <button
                onClick={startPolling}
                disabled={!localSettings.enabled}
                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Monitoring
              </button>
            )}
          </div>
          
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertSettings;
