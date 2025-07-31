/**
 * AQI Alert Toast Component - Displays alert notifications for AQI threshold breaches
 */

import React, { useState, useEffect } from 'react';
import { getAQICategoryColor, getAQICategory } from '../utils/getAQICategoryColor';

const AQIAlertToast = ({ 
  alert, 
  onDismiss, 
  onSnooze, 
  position = 'top-right',
  autoHide = true,
  autoHideDelay = 10000,
  showActions = true 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss();
    }, 300);
  };

  useEffect(() => {
    if (alert) {
      setIsVisible(true);
      setIsExiting(false);
      
      if (autoHide && !alert.isEmergency) {
        const timer = setTimeout(() => {
          setIsExiting(true);
          setTimeout(() => {
            setIsVisible(false);
            onDismiss();
          }, 300);
        }, autoHideDelay);
        
        return () => clearTimeout(timer);
      }
    }
  }, [alert, autoHide, autoHideDelay, onDismiss]);

  const handleSnooze = () => {
    handleDismiss();
    if (onSnooze) {
      onSnooze(10); // Snooze for 10 minutes
    }
  };

  if (!alert || !isVisible) return null;

  const colors = getAQICategoryColor(alert.aqi || 0);
  const category = getAQICategory(alert.aqi || 0);

  // Position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
  };

  // Alert type styles
  const getAlertStyles = () => {
    switch (alert.alertType) {
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200',
          icon: '🚨',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          titleColor: 'text-red-800',
          textColor: 'text-red-700',
          buttonColor: 'text-red-600 hover:text-red-800'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          icon: '⚠️',
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          titleColor: 'text-yellow-800',
          textColor: 'text-yellow-700',
          buttonColor: 'text-yellow-600 hover:text-yellow-800'
        };
      case 'info':
        return {
          bg: 'bg-blue-50 border-blue-200',
          icon: '📊',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          titleColor: 'text-blue-800',
          textColor: 'text-blue-700',
          buttonColor: 'text-blue-600 hover:text-blue-800'
        };
      default:
        return {
          bg: 'bg-gray-50 border-gray-200',
          icon: 'ℹ️',
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600',
          titleColor: 'text-gray-800',
          textColor: 'text-gray-700',
          buttonColor: 'text-gray-600 hover:text-gray-800'
        };
    }
  };

  const styles = getAlertStyles();

  return (
    <div className={`fixed ${positionClasses[position]} z-50 max-w-sm w-full`}>
      <div 
        className={`
          ${styles.bg} border rounded-lg shadow-lg p-4 
          transform transition-all duration-300 ease-in-out
          ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
          ${alert.isEmergency ? 'animate-pulse' : ''}
        `}
      >
        {/* Header */}
        <div className="flex items-start">
          <div className={`flex-shrink-0 ${styles.iconBg} rounded-full p-2 mr-3`}>
            <span className="text-lg" role="img" aria-label="alert">
              {styles.icon}
            </span>
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className={`text-sm font-semibold ${styles.titleColor} mb-1`}>
              {alert.alertTitle}
            </h4>
            
            <p className={`text-sm ${styles.textColor} mb-2`}>
              {alert.message}
            </p>
            
            {/* AQI Details */}
            <div className="flex items-center space-x-2 mb-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                {category.emoji} {category.label}
              </span>
              <span className={`text-xs ${styles.textColor}`}>
                AQI: {alert.aqi}
              </span>
            </div>

            {/* Health Recommendation (for critical alerts) */}
            {alert.isCritical && alert.recommendation && (
              <div className={`text-xs ${styles.textColor} bg-white bg-opacity-50 rounded p-2 mb-2`}>
                <p className="font-medium mb-1">Health Advisory:</p>
                <p>{alert.recommendation.message}</p>
              </div>
            )}

            {/* Change Alert */}
            {alert.changeAlert && (
              <div className="text-xs text-gray-600 bg-gray-100 rounded p-2 mb-2">
                <span className="font-medium">{alert.changeAlert.title}:</span> {alert.changeAlert.message}
              </div>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className={`flex-shrink-0 ml-2 ${styles.buttonColor} hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors`}
            aria-label="Dismiss alert"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Action Buttons */}
        {showActions && !alert.isEmergency && (
          <div className="flex justify-end space-x-2 mt-3 pt-2 border-t border-gray-200">
            <button
              onClick={handleSnooze}
              className={`text-xs ${styles.buttonColor} hover:bg-white hover:bg-opacity-20 px-3 py-1 rounded transition-colors`}
            >
              Snooze 10m
            </button>
            <button
              onClick={handleDismiss}
              className={`text-xs ${styles.buttonColor} hover:bg-white hover:bg-opacity-20 px-3 py-1 rounded transition-colors font-medium`}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Emergency Actions */}
        {alert.isEmergency && (
          <div className="mt-3 pt-2 border-t border-red-200">
            <div className="flex justify-between items-center">
              <span className="text-xs text-red-600 font-medium">
                Emergency conditions detected
              </span>
              <button
                onClick={handleDismiss}
                className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
              >
                Acknowledge
              </button>
            </div>
          </div>
        )}

        {/* Progress Bar for Auto-hide */}
        {autoHide && !alert.isEmergency && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-lg overflow-hidden">
            <div 
              className={`h-full ${colors.button.split(' ')[0]} transition-all ease-linear`}
              style={{
                width: '100%',
                animation: `shrink ${autoHideDelay}ms linear forwards`
              }}
            />
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default AQIAlertToast;
