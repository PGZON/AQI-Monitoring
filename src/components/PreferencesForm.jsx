/**
 * Preferences Form Component
 * Allows users to customize their experience with units, alerts, and settings
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import LoadingSpinner from './LoadingSpinner';

/**
 * Toggle Switch Component
 */
const ToggleSwitch = ({ enabled, onToggle, disabled = false, label, description }) => {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1 min-w-0">
        <label className="text-sm font-medium text-gray-900">{label}</label>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
          enabled ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};

/**
 * Slider Component
 */
const Slider = ({ value, onChange, min, max, step = 1, label, description, suffix = '' }) => {
  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-900">{label}</label>
        <span className="text-sm font-semibold text-blue-600">
          {value}{suffix}
        </span>
      </div>
      {description && (
        <p className="text-xs text-gray-500 mb-3">{description}</p>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        style={{
          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((value - min) / (max - min)) * 100}%, #e5e7eb ${((value - min) / (max - min)) * 100}%, #e5e7eb 100%)`
        }}
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{min}{suffix}</span>
        <span>{max}{suffix}</span>
      </div>
    </div>
  );
};

/**
 * Select Dropdown Component
 */
const SelectDropdown = ({ value, onChange, options, label, description }) => {
  return (
    <div className="py-2">
      <label className="block text-sm font-medium text-gray-900 mb-1">{label}</label>
      {description && (
        <p className="text-xs text-gray-500 mb-2">{description}</p>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

/**
 * Preferences Section Component
 */
const PreferencesSection = ({ title, icon, children, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center mb-4">
        <span className="text-2xl mr-3">{icon}</span>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

/**
 * Main Preferences Form Component
 */
const PreferencesForm = ({ className = '' }) => {
  const { 
    preferences, 
    loading, 
    errors, 
    updatePreferences, 
    clearError 
  } = useUser();
  
  const [localPreferences, setLocalPreferences] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Initialize local preferences when context preferences load
  useEffect(() => {
    if (preferences && !localPreferences) {
      setLocalPreferences({ ...preferences });
    }
  }, [preferences, localPreferences]);

  // Check for changes
  useEffect(() => {
    if (preferences && localPreferences) {
      const changed = JSON.stringify(preferences) !== JSON.stringify(localPreferences);
      setHasChanges(changed);
    }
  }, [preferences, localPreferences]);

  /**
   * Update local preference value
   */
  const updateLocalPreference = useCallback((key, value) => {
    setLocalPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  /**
   * Save preferences
   */
  const handleSave = useCallback(async () => {
    if (!hasChanges || !localPreferences) return;
    
    setSaving(true);
    setSuccessMessage('');
    
    try {
      await updatePreferences(localPreferences);
      setSuccessMessage('Preferences saved successfully!');
      setHasChanges(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      // Error is handled by context
    } finally {
      setSaving(false);
    }
  }, [hasChanges, localPreferences, updatePreferences]);

  /**
   * Reset to default preferences
   */
  const handleReset = useCallback(() => {
    const defaultPreferences = {
      temperatureUnit: 'celsius',
      forecastRange: 5,
      aqiAlertThreshold: 150,
      enableNotifications: true,
      autoRefresh: true,
      refreshInterval: 60,
      theme: 'light',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h'
    };
    
    setLocalPreferences(defaultPreferences);
  }, []);

  /**
   * Cancel changes
   */
  const handleCancel = useCallback(() => {
    if (preferences) {
      setLocalPreferences({ ...preferences });
      setHasChanges(false);
    }
  }, [preferences]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => clearError('preferences');
  }, [clearError]);

  if (loading.preferences && !localPreferences) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading preferences..." />
      </div>
    );
  }

  if (!localPreferences) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load preferences</p>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Preferences</h2>
          <p className="text-sm text-gray-600 mt-1">
            Customize your air quality monitoring experience
          </p>
        </div>
        
        {hasChanges && (
          <div className="flex items-center space-x-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving && <LoadingSpinner size="sm" />}
              <span>Save Changes</span>
            </button>
          </div>
        )}
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-600">✅ {successMessage}</p>
        </div>
      )}

      {errors.preferences && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">❌ {errors.preferences}</p>
          <button
            onClick={() => clearError('preferences')}
            className="text-xs text-red-500 hover:text-red-700 underline mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Display Preferences */}
        <PreferencesSection title="Display Settings" icon="🎨">
          <SelectDropdown
            value={localPreferences.temperatureUnit}
            onChange={(value) => updateLocalPreference('temperatureUnit', value)}
            options={[
              { value: 'celsius', label: '°C (Celsius)' },
              { value: 'fahrenheit', label: '°F (Fahrenheit)' }
            ]}
            label="Temperature Unit"
            description="Choose your preferred temperature display"
          />

          <SelectDropdown
            value={localPreferences.theme}
            onChange={(value) => updateLocalPreference('theme', value)}
            options={[
              { value: 'light', label: 'Light Theme' },
              { value: 'dark', label: 'Dark Theme' },
              { value: 'auto', label: 'Auto (System)' }
            ]}
            label="Theme"
            description="Choose your preferred color scheme"
          />

          <SelectDropdown
            value={localPreferences.dateFormat}
            onChange={(value) => updateLocalPreference('dateFormat', value)}
            options={[
              { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)' },
              { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (EU)' },
              { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' }
            ]}
            label="Date Format"
            description="Choose how dates are displayed"
          />

          <SelectDropdown
            value={localPreferences.timeFormat}
            onChange={(value) => updateLocalPreference('timeFormat', value)}
            options={[
              { value: '12h', label: '12-hour (AM/PM)' },
              { value: '24h', label: '24-hour' }
            ]}
            label="Time Format"
            description="Choose your preferred time display"
          />
        </PreferencesSection>

        {/* Forecast Preferences */}
        <PreferencesSection title="Forecast Settings" icon="🔮">
          <Slider
            value={localPreferences.forecastRange}
            onChange={(value) => updateLocalPreference('forecastRange', value)}
            min={1}
            max={7}
            step={1}
            label="Forecast Range"
            description="Number of days to show in ML forecasts"
            suffix=" days"
          />

          <ToggleSwitch
            enabled={localPreferences.autoRefresh}
            onToggle={() => updateLocalPreference('autoRefresh', !localPreferences.autoRefresh)}
            label="Auto Refresh"
            description="Automatically update data at regular intervals"
          />

          <Slider
            value={localPreferences.refreshInterval}
            onChange={(value) => updateLocalPreference('refreshInterval', value)}
            min={30}
            max={300}
            step={30}
            label="Refresh Interval"
            description="How often to automatically refresh data"
            suffix=" seconds"
          />
        </PreferencesSection>

        {/* Alert Preferences */}
        <PreferencesSection title="Alert Settings" icon="🚨">
          <ToggleSwitch
            enabled={localPreferences.enableNotifications}
            onToggle={() => updateLocalPreference('enableNotifications', !localPreferences.enableNotifications)}
            label="Enable Notifications"
            description="Receive alerts when AQI reaches unhealthy levels"
          />

          <Slider
            value={localPreferences.aqiAlertThreshold}
            onChange={(value) => updateLocalPreference('aqiAlertThreshold', value)}
            min={50}
            max={300}
            step={10}
            label="AQI Alert Threshold"
            description="Get notified when AQI exceeds this value"
            suffix=" AQI"
          />

          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center mb-2">
              <span className="text-yellow-600 mr-2">⚠️</span>
              <span className="text-sm font-medium text-yellow-800">Alert Levels</span>
            </div>
            <div className="text-xs text-yellow-700 space-y-1">
              <div>• 51-100: Moderate (Sensitive groups)</div>
              <div>• 101-150: Unhealthy for sensitive</div>
              <div>• 151-200: Unhealthy (Everyone)</div>
              <div>• 201+: Very unhealthy/Hazardous</div>
            </div>
          </div>
        </PreferencesSection>

        {/* Data Preferences */}
        <PreferencesSection title="Data Settings" icon="📊">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center mb-2">
              <span className="text-blue-600 mr-2">ℹ️</span>
              <span className="text-sm font-medium text-blue-800">Data Sources</span>
            </div>
            <div className="text-xs text-blue-700">
              We use multiple data sources including EPA, OpenWeatherMap, and ML predictions 
              to provide the most accurate air quality information.
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">Export Data</div>
              <div className="text-xs text-gray-500">Download your preferences and saved locations</div>
            </div>
            <button className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Export
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">Reset to Defaults</div>
              <div className="text-xs text-gray-500">Restore all settings to their default values</div>
            </div>
            <button 
              onClick={handleReset}
              className="px-3 py-2 text-sm border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
            >
              Reset
            </button>
          </div>
        </PreferencesSection>
      </div>

      {/* Save Bar (Mobile) */}
      {hasChanges && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="flex space-x-3">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving && <LoadingSpinner size="sm" />}
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreferencesForm;
