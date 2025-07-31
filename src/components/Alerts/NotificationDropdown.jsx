/**
 * Notification Dropdown Component
 * Shows recent alerts and notifications in a dropdown menu
 */

import React, { useState, useRef, useEffect } from 'react';
import alertService from '../../services/alertService';

/**
 * Individual Notification Item
 */
const NotificationItem = ({ alert, onMarkAsRead, onDismiss }) => {
  const style = alertService.getAlertStyle(alert.severity);
  const isUnread = !alert.isRead;
  
  return (
    <div className={`p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors ${
      isUnread ? 'bg-blue-50' : ''
    }`}>
      <div className="flex items-start space-x-3">
        <div className="text-lg">{style.icon}</div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h4 className={`font-medium text-sm ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
              {alert.title}
            </h4>
            {isUnread && (
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2 mt-1"></div>
            )}
          </div>
          
          <p className={`text-xs mt-1 ${isUnread ? 'text-gray-700' : 'text-gray-500'}`}>
            {alert.message}
          </p>
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-3 text-xs text-gray-500">
              <span>{new Date(alert.timestamp).toLocaleDateString()}</span>
              <span>{new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              {alert.location && (
                <span>📍 {alert.location}</span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {isUnread && onMarkAsRead && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsRead(alert.id);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Mark Read
                </button>
              )}
              
              {onDismiss && alert.isActive && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss(alert.id);
                  }}
                  className="text-xs text-red-600 hover:text-red-800 transition-colors"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Notification Bell Icon with Badge
 */
const NotificationBell = ({ unreadCount, onClick, isOpen }) => {
  return (
    <button
      onClick={onClick}
      className={`relative p-2 rounded-lg transition-colors ${
        isOpen 
          ? 'bg-blue-100 text-blue-600' 
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
      title="Notifications"
    >
      <div className="relative">
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </div>
    </button>
  );
};

/**
 * Empty State Component
 */
const EmptyNotifications = () => {
  return (
    <div className="p-8 text-center">
      <div className="text-gray-400 text-4xl mb-4">🔔</div>
      <h3 className="text-sm font-medium text-gray-600 mb-2">No Notifications</h3>
      <p className="text-xs text-gray-500 max-w-xs mx-auto">
        You'll see air quality alerts and notifications here when they're available.
      </p>
    </div>
  );
};

/**
 * Notification Stats Header
 */
const NotificationStats = ({ stats, onMarkAllAsRead, onClearAll }) => {
  return (
    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
          <p className="text-xs text-gray-600">
            {stats.unread} unread • {stats.total} total
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {stats.unread > 0 && onMarkAllAsRead && (
            <button
              onClick={onMarkAllAsRead}
              className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              Mark All Read
            </button>
          )}
          
          {stats.total > 0 && onClearAll && (
            <button
              onClick={onClearAll}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Main Notification Dropdown Component
 */
const NotificationDropdown = ({
  alerts = { recent: [], unreadCount: 0 },
  onMarkAsRead,
  onDismiss,
  onMarkAllAsRead,
  onClearAll,
  onSettingsClick,
  maxItems = 10,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const recentAlerts = alerts.recent.slice(0, maxItems);
  const stats = {
    total: alerts.recent.length,
    unread: alerts.unreadCount,
    active: alerts.active?.length || 0
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Notification Bell */}
      <NotificationBell
        unreadCount={alerts.unreadCount}
        onClick={() => setIsOpen(!isOpen)}
        isOpen={isOpen}
      />

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <NotificationStats
            stats={stats}
            onMarkAllAsRead={onMarkAllAsRead}
            onClearAll={onClearAll}
          />

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto">
            {recentAlerts.length === 0 ? (
              <EmptyNotifications />
            ) : (
              <div>
                {recentAlerts.map((alert, index) => (
                  <NotificationItem
                    key={alert.id || index}
                    alert={alert}
                    onMarkAsRead={onMarkAsRead}
                    onDismiss={onDismiss}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {recentAlerts.length > 0 && (
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {alerts.recent.length > maxItems && (
                    <span>Showing {maxItems} of {alerts.recent.length} notifications</span>
                  )}
                </div>
                
                {onSettingsClick && (
                  <button
                    onClick={onSettingsClick}
                    className="text-xs text-blue-600 hover:text-blue-800 transition-colors flex items-center space-x-1"
                  >
                    <span>⚙️</span>
                    <span>Settings</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
export { NotificationBell, NotificationItem, NotificationStats };
