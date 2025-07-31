/**
 * Alert Settings Page
 * Full page for managing notification and alert preferences
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAlerts } from '../hooks/useAlerts';
import NotificationSettingsForm from '../components/Alerts/NotificationSettingsForm';
import AlertBanner from '../components/Alerts/AlertBanner';

/**
 * Settings Page Header
 */
const SettingsHeader = ({ onBack }) => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-4">
          {onBack && (
            <button
              onClick={onBack}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back
            </button>
          )}
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Alert Settings</h1>
            <p className="text-gray-600 mt-1">
              Configure your air quality notifications and alert preferences
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Current Status Card
 */
const CurrentStatusCard = ({ alertSettings, currentAlerts, stats }) => {
  const statusColor = alertSettings?.enabled ? 'green' : 'gray';
  const statusText = alertSettings?.enabled ? 'Alerts Enabled' : 'Alerts Disabled';
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Current Status</h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          statusColor === 'green' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          {statusText}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{stats?.active || 0}</div>
          <div className="text-sm text-gray-600">Active Alerts</div>
        </div>
        
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{stats?.unread || 0}</div>
          <div className="text-sm text-gray-600">Unread</div>
        </div>
        
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{stats?.today || 0}</div>
          <div className="text-sm text-gray-600">Today</div>
        </div>
        
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{stats?.thisWeek || 0}</div>
          <div className="text-sm text-gray-600">This Week</div>
        </div>
      </div>

      {alertSettings?.enabled && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Current Configuration</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <span className="font-medium">AQI Threshold:</span> {alertSettings.aqiThreshold}
            </div>
            <div>
              <span className="font-medium">Daily Summary:</span> {alertSettings.dailySummary ? 'Enabled' : 'Disabled'}
            </div>
            <div>
              <span className="font-medium">Active Pollutants:</span> {
                Object.entries(alertSettings.pollutantAlerts || {})
                  .filter(([, enabled]) => enabled)
                  .map(([pollutant]) => pollutant.toUpperCase())
                  .join(', ') || 'None'
              }
            </div>
            <div>
              <span className="font-medium">Notification Time:</span> {alertSettings.notificationTime || '08:00'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Quick Actions Card
 */
const QuickActionsCard = ({ onTestAlert, onClearAlerts, onExportSettings, hasAlerts }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={onTestAlert}
          className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
        >
          <div className="text-2xl mb-2">🧪</div>
          <div className="font-medium text-sm text-gray-900">Test Alert</div>
          <div className="text-xs text-gray-500">Send a sample notification</div>
        </button>
        
        <button
          onClick={onClearAlerts}
          disabled={!hasAlerts}
          className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="text-2xl mb-2">🧹</div>
          <div className="font-medium text-sm text-gray-900">Clear Alerts</div>
          <div className="text-xs text-gray-500">Remove all notifications</div>
        </button>
        
        <button
          onClick={onExportSettings}
          className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
        >
          <div className="text-2xl mb-2">💾</div>
          <div className="font-medium text-sm text-gray-900">Export Settings</div>
          <div className="text-xs text-gray-500">Download preferences</div>
        </button>
      </div>
    </div>
  );
};

/**
 * Main Alert Settings Page Component
 */
const AlertSettingsPage = () => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);
  
  // Use alerts hook (without AQI data since we're just managing settings)
  const {
    alertSettings,
    currentAlerts,
    loading,
    error,
    updateAlertSettings,
    markAlertsAsRead,
    dismissAlert,
    getAlertStats
  } = useAlerts();

  const stats = getAlertStats();

  // Handle settings save
  const handleSaveSettings = async (newSettings) => {
    setSaveError(null);
    
    try {
      const result = await updateAlertSettings(newSettings);
      
      if (result.success) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        setSaveError(result.error || 'Failed to save settings');
      }
    } catch (err) {
      setSaveError(err.message);
    }
  };

  // Test alert
  const handleTestAlert = () => {
    // You could trigger this through the alert service
    alert('Test alert would be sent! (Check your notification settings)');
  };

  // Clear all alerts
  const handleClearAlerts = async () => {
    if (window.confirm('Are you sure you want to clear all alerts? This action cannot be undone.')) {
      const allAlertIds = currentAlerts.recent.map(alert => alert.id);
      await markAlertsAsRead(allAlertIds);
    }
  };

  // Export settings
  const handleExportSettings = () => {
    if (alertSettings) {
      const dataStr = JSON.stringify(alertSettings, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `aqi-alert-settings-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <SettingsHeader onBack={() => window.history.back()} />

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✅</span>
              <p className="text-sm text-green-700 font-medium">
                Alert settings saved successfully!
              </p>
            </div>
          </div>
        )}

        {/* Current Alerts Banner */}
        {currentAlerts.active && currentAlerts.active.length > 0 && (
          <AlertBanner
            alerts={currentAlerts.active}
            onDismiss={dismissAlert}
            mode="inline"
            className="mb-6"
          />
        )}

        {/* Current Status */}
        <CurrentStatusCard
          alertSettings={alertSettings}
          currentAlerts={currentAlerts}
          stats={stats}
        />

        {/* Quick Actions */}
        <QuickActionsCard
          onTestAlert={handleTestAlert}
          onClearAlerts={handleClearAlerts}
          onExportSettings={handleExportSettings}
          hasAlerts={currentAlerts.recent.length > 0}
        />

        {/* Settings Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Alert Configuration</h3>
            <p className="text-gray-600 text-sm">
              Customize when and how you receive air quality alerts and notifications.
            </p>
          </div>

          <NotificationSettingsForm
            initialSettings={alertSettings}
            onSave={handleSaveSettings}
            loading={loading.settings}
            error={saveError || error.settings}
          />
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">💡 Tips & Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">Understanding AQI Levels:</h4>
              <ul className="space-y-1 text-xs">
                <li>• <span className="font-medium">0-50:</span> Good - Safe for everyone</li>
                <li>• <span className="font-medium">51-100:</span> Moderate - Acceptable for most</li>
                <li>• <span className="font-medium">101-150:</span> Unhealthy for sensitive groups</li>
                <li>• <span className="font-medium">151-200:</span> Unhealthy for everyone</li>
                <li>• <span className="font-medium">201+:</span> Very unhealthy or hazardous</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Alert Best Practices:</h4>
              <ul className="space-y-1 text-xs">
                <li>• Set thresholds based on your health sensitivity</li>
                <li>• Enable PM2.5 alerts for most accurate warnings</li>
                <li>• Use daily summaries to plan outdoor activities</li>
                <li>• Test alerts periodically to ensure they work</li>
                <li>• Consider location-specific settings if you travel</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-6 text-sm">
            <Link 
              to="/dashboard" 
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              ← Back to Dashboard
            </Link>
            <Link 
              to="/analytics" 
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              View Analytics →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertSettingsPage;
