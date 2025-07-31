/**
 * Alert Banner Component
 * Shows real-time alert banners at the top of pages
 */

import React from 'react';
import alertService from '../../services/alertService';

/**
 * Individual Alert Banner Item
 */
const AlertBannerItem = ({ alert, onDismiss, compact = false }) => {
  const style = alertService.getAlertStyle(alert.severity);
  
  return (
    <div 
      className={`border-l-4 p-4 ${compact ? 'py-2' : 'py-4'} transition-all duration-300`}
      style={{ 
        backgroundColor: style.bgColor,
        borderLeftColor: style.color
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="text-xl">{style.icon}</div>
          <div className="flex-1">
            <h4 
              className={`font-semibold ${compact ? 'text-sm' : 'text-base'} mb-1`}
              style={{ color: style.textColor }}
            >
              {alert.title}
            </h4>
            <p 
              className={`${compact ? 'text-xs' : 'text-sm'} mb-2`}
              style={{ color: style.textColor }}
            >
              {alert.message}
            </p>
            
            {!compact && (
              <div className="flex items-center space-x-4 text-xs opacity-75">
                <span>📍 {alert.location}</span>
                <span>🕒 {new Date(alert.timestamp).toLocaleTimeString()}</span>
                {alert.value && (
                  <span>
                    📊 {alert.type === 'aqi' ? 'AQI' : alert.pollutant?.toUpperCase()}: {alert.value}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        
        {onDismiss && (
          <button
            onClick={() => onDismiss(alert.id)}
            className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
            title="Dismiss alert"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Alert Banner Group Component
 */
const AlertBannerGroup = ({ alerts, onDismiss, onDismissAll, maxVisible = 3 }) => {
  const visibleAlerts = alerts.slice(0, maxVisible);
  const hiddenCount = Math.max(0, alerts.length - maxVisible);
  
  if (alerts.length === 0) return null;
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-900">
              🚨 Active Alerts ({alerts.length})
            </span>
            {hiddenCount > 0 && (
              <span className="text-xs text-gray-500">
                +{hiddenCount} more
              </span>
            )}
          </div>
          
          {onDismissAll && alerts.length > 1 && (
            <button
              onClick={onDismissAll}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              Dismiss All
            </button>
          )}
        </div>
      </div>
      
      {/* Alert Items */}
      <div className="divide-y divide-gray-100">
        {visibleAlerts.map((alert, index) => (
          <AlertBannerItem
            key={alert.id || index}
            alert={alert}
            onDismiss={onDismiss}
            compact={alerts.length > 2}
          />
        ))}
      </div>
      
      {/* Show more button */}
      {hiddenCount > 0 && (
        <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
          <button className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
            Show {hiddenCount} more alert{hiddenCount !== 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Floating Alert Banner Component
 */
const FloatingAlertBanner = ({ alerts, onDismiss, position = 'top' }) => {
  if (alerts.length === 0) return null;
  
  const positionClasses = {
    'top': 'top-4',
    'bottom': 'bottom-4'
  };
  
  return (
    <div className={`fixed left-4 right-4 ${positionClasses[position]} z-50 max-w-4xl mx-auto`}>
      <AlertBannerGroup 
        alerts={alerts} 
        onDismiss={onDismiss}
        onDismissAll={() => alerts.forEach(alert => onDismiss(alert.id))}
        maxVisible={2}
      />
    </div>
  );
};

/**
 * Inline Alert Banner Component
 */
const InlineAlertBanner = ({ alerts, onDismiss, className = '' }) => {
  if (alerts.length === 0) return null;
  
  return (
    <div className={`mb-6 ${className}`}>
      <AlertBannerGroup 
        alerts={alerts} 
        onDismiss={onDismiss}
        onDismissAll={() => alerts.forEach(alert => onDismiss(alert.id))}
      />
    </div>
  );
};

/**
 * Compact Alert Indicator
 */
const CompactAlertIndicator = ({ alerts, onClick, className = '' }) => {
  if (alerts.length === 0) return null;
  
  const highestSeverityAlert = alerts.reduce((highest, alert) => {
    const severityOrder = ['good', 'moderate', 'unhealthy-sensitive', 'unhealthy', 'very-unhealthy', 'hazardous'];
    const currentIndex = severityOrder.indexOf(alert.severity);
    const highestIndex = severityOrder.indexOf(highest?.severity || 'good');
    
    return currentIndex > highestIndex ? alert : highest;
  }, null);
  
  const style = alertService.getAlertStyle(highestSeverityAlert?.severity || 'moderate');
  
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium transition-colors hover:opacity-80 ${className}`}
      style={{ 
        backgroundColor: style.bgColor,
        color: style.textColor,
        border: `1px solid ${style.borderColor}`
      }}
    >
      <span>{style.icon}</span>
      <span>{alerts.length} Alert{alerts.length !== 1 ? 's' : ''}</span>
    </button>
  );
};

/**
 * Main Alert Banner Component with multiple display modes
 */
const AlertBanner = ({ 
  alerts = [],
  onDismiss,
  mode = 'inline', // 'inline', 'floating', 'compact'
  position = 'top',
  maxVisible = 3,
  className = '',
  onClick
}) => {
  switch (mode) {
    case 'floating':
      return (
        <FloatingAlertBanner
          alerts={alerts}
          onDismiss={onDismiss}
          position={position}
        />
      );
      
    case 'compact':
      return (
        <CompactAlertIndicator
          alerts={alerts}
          onClick={onClick}
          className={className}
        />
      );
      
    default: // inline
      return (
        <InlineAlertBanner
          alerts={alerts}
          onDismiss={onDismiss}
          className={className}
        />
      );
  }
};

export default AlertBanner;
export { AlertBannerItem, AlertBannerGroup, FloatingAlertBanner, InlineAlertBanner, CompactAlertIndicator };
