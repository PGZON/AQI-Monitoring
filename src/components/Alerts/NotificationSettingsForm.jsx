/**
 * Notification Settings Form Component
 * Allows users to configure their alert preferences
 */

import React, { useState, useEffect } from 'react';
import alertService from '../../services/alertService';

/**
 * AQI Threshold Slider Component
 */
const AQIThresholdSlider = ({ value, onChange, disabled = false }) => {
  const getThresholdColor = (aqi) => {
    if (aqi <= 50) return '#22c55e';
    if (aqi <= 100) return '#eab308';
    if (aqi <= 150) return '#f97316';
    if (aqi <= 200) return '#ef4444';
    if (aqi <= 300) return '#8b5cf6';
    return '#7c2d12';
  };

  const getThresholdLabel = (aqi) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          AQI Alert Threshold
        </label>
        <div className="flex items-center space-x-2">
          <span 
            className="px-3 py-1 rounded-lg text-white text-sm font-medium"
            style={{ backgroundColor: getThresholdColor(value) }}
          >
            {value}
          </span>
          <span className="text-xs text-gray-500">
            {getThresholdLabel(value)}
          </span>
        </div>
      </div>
      
      <div className="relative">
        <input
          type="range"
          min="25"
          max="300"
          step="5"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(to right, 
              #22c55e 0%, #22c55e 16.7%, 
              #eab308 16.7%, #eab308 33.3%, 
              #f97316 33.3%, #f97316 50%, 
              #ef4444 50%, #ef4444 66.7%, 
              #8b5cf6 66.7%, #8b5cf6 83.3%, 
              #7c2d12 83.3%, #7c2d12 100%)`
          }}
        />
        
        {/* Threshold markers */}
        <div className="flex justify-between mt-1 text-xs text-gray-400">
          <span>25</span>
          <span>50</span>
          <span>100</span>
          <span>150</span>
          <span>200</span>
          <span>300</span>
        </div>
      </div>
      
      <p className="text-xs text-gray-500">
        You'll receive alerts when AQI exceeds this threshold
      </p>
    </div>
  );
};

/**
 * Pollutant Settings Component
 */
const PollutantSettings = ({ pollutantAlerts, pollutantThresholds, onChange, disabled = false }) => {
  const pollutants = [
    { key: 'pm25', label: 'PM2.5', unit: 'μg/m³', description: 'Fine Particulate Matter', defaultThreshold: 55 },
    { key: 'pm10', label: 'PM10', unit: 'μg/m³', description: 'Coarse Particulate Matter', defaultThreshold: 150 },
    { key: 'no2', label: 'NO₂', unit: 'μg/m³', description: 'Nitrogen Dioxide', defaultThreshold: 100 },
    { key: 'o3', label: 'O₃', unit: 'μg/m³', description: 'Ozone', defaultThreshold: 140 },
    { key: 'co', label: 'CO', unit: 'ppm', description: 'Carbon Monoxide', defaultThreshold: 12 },
    { key: 'so2', label: 'SO₂', unit: 'μg/m³', description: 'Sulfur Dioxide', defaultThreshold: 185 }
  ];

  const handleToggle = (pollutant) => {
    onChange({
      pollutantAlerts: {
        ...pollutantAlerts,
        [pollutant]: !pollutantAlerts[pollutant]
      },
      pollutantThresholds
    });
  };

  const handleThresholdChange = (pollutant, threshold) => {
    onChange({
      pollutantAlerts,
      pollutantThresholds: {
        ...pollutantThresholds,
        [pollutant]: threshold
      }
    });
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-900">Pollutant-Specific Alerts</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pollutants.map(pollutant => (
          <div key={pollutant.key} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <h5 className="font-medium text-sm text-gray-900">{pollutant.label}</h5>
                  <span className="text-xs text-gray-500">({pollutant.unit})</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{pollutant.description}</p>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={pollutantAlerts[pollutant.key] || false}
                  onChange={() => handleToggle(pollutant.key)}
                  disabled={disabled}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
              </label>
            </div>
            
            {pollutantAlerts[pollutant.key] && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Threshold:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {pollutantThresholds[pollutant.key] || pollutant.defaultThreshold} {pollutant.unit}
                  </span>
                </div>
                
                <input
                  type="range"
                  min={pollutant.key === 'co' ? 1 : 10}
                  max={pollutant.key === 'co' ? 35 : 500}
                  step={pollutant.key === 'co' ? 1 : 5}
                  value={pollutantThresholds[pollutant.key] || pollutant.defaultThreshold}
                  onChange={(e) => handleThresholdChange(pollutant.key, parseInt(e.target.value))}
                  disabled={disabled}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Notification Schedule Component
 */
const NotificationSchedule = ({ settings, onChange, disabled = false }) => {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-900">Notification Schedule</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.dailySummary}
              onChange={(e) => onChange({ ...settings, dailySummary: e.target.checked })}
              disabled={disabled}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">Daily Summary</span>
              <p className="text-xs text-gray-500">Get a daily air quality summary</p>
            </div>
          </label>

          {settings.dailySummary && (
            <div className="ml-6 space-y-2">
              <label className="text-xs text-gray-600">Preferred Time:</label>
              <input
                type="time"
                value={settings.notificationTime || '08:00'}
                onChange={(e) => onChange({ ...settings, notificationTime: e.target.value })}
                disabled={disabled}
                className="block w-full border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              />
            </div>
          )}
        </div>

        <div className="space-y-3">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={(e) => onChange({ ...settings, soundEnabled: e.target.checked })}
              disabled={disabled}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">Sound Alerts</span>
              <p className="text-xs text-gray-500">Play sound for critical alerts</p>
            </div>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.emailAlerts}
              onChange={(e) => onChange({ ...settings, emailAlerts: e.target.checked })}
              disabled={disabled}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">Email Alerts</span>
              <p className="text-xs text-gray-500">Receive alerts via email</p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};

/**
 * Main Notification Settings Form Component
 */
const NotificationSettingsForm = ({
  initialSettings = null,
  onSave,
  loading = false,
  error = null,
  onCancel
}) => {
  const [settings, setSettings] = useState(initialSettings || alertService.getDefaultSettings());
  const [hasChanges, setHasChanges] = useState(false);

  // Update settings when initial settings change
  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
      setHasChanges(false);
    }
  }, [initialSettings]);

  // Track changes
  useEffect(() => {
    if (initialSettings) {
      setHasChanges(JSON.stringify(settings) !== JSON.stringify(initialSettings));
    }
  }, [settings, initialSettings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (onSave) {
      await onSave(settings);
    }
  };

  const handleReset = () => {
    if (initialSettings) {
      setSettings(initialSettings);
    } else {
      setSettings(alertService.getDefaultSettings());
    }
    setHasChanges(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Master Toggle */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
            disabled={loading}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 scale-125"
          />
          <div>
            <span className="text-base font-semibold text-blue-900">Enable AQI Alerts</span>
            <p className="text-sm text-blue-700">
              Turn on to receive air quality notifications and warnings
            </p>
          </div>
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-red-500">⚠️</span>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Settings Sections - Only show if alerts are enabled */}
      {settings.enabled && (
        <>
          {/* AQI Threshold */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <AQIThresholdSlider
              value={settings.aqiThreshold}
              onChange={(value) => setSettings({ ...settings, aqiThreshold: value })}
              disabled={loading}
            />
          </div>

          {/* Pollutant Settings */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <PollutantSettings
              pollutantAlerts={settings.pollutantAlerts}
              pollutantThresholds={settings.pollutantThresholds}
              onChange={(pollutantSettings) => setSettings({ ...settings, ...pollutantSettings })}
              disabled={loading}
            />
          </div>

          {/* Notification Schedule */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <NotificationSchedule
              settings={settings}
              onChange={setSettings}
              disabled={loading}
            />
          </div>
        </>
      )}

      {/* Form Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={handleReset}
            disabled={loading || !hasChanges}
            className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset to Default
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {hasChanges && (
            <span className="text-sm text-gray-500">Unsaved changes</span>
          )}
          
          <button
            type="submit"
            disabled={loading || !hasChanges}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
              loading || !hasChanges
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Saving...</span>
              </div>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default NotificationSettingsForm;
export { AQIThresholdSlider, PollutantSettings, NotificationSchedule };
