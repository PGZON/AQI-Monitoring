/**
 * PWA Status Component
 * Shows PWA installation status, offline indicator, and update notifications
 */

import React, { useState, useEffect } from 'react';
import { 
  isPWAInstalled, 
  getPWADisplayMode, 
  installPWA, 
  checkForUpdates,
  getSWVersion 
} from '../utils/pwaUtils';

/**
 * Online/Offline Status Hook
 */
const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

/**
 * PWA Install Button Component
 */
const PWAInstallButton = ({ className = '' }) => {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    setIsInstalled(isPWAInstalled());
    
    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = () => {
    installPWA();
    setCanInstall(false);
  };

  if (isInstalled) {
    return (
      <div className={`flex items-center space-x-2 text-green-600 ${className}`}>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span className="text-sm font-medium">App Installed</span>
      </div>
    );
  }

  if (canInstall) {
    return (
      <button
        onClick={handleInstall}
        className={`flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors ${className}`}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        <span>Install App</span>
      </button>
    );
  }

  return null;
};

/**
 * Network Status Indicator Component
 */
const NetworkStatusIndicator = ({ className = '' }) => {
  const isOnline = useOnlineStatus();
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowOfflineMessage(true);
    } else {
      // Hide offline message after coming back online
      const timer = setTimeout(() => {
        setShowOfflineMessage(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  return (
    <div className={className}>
      {/* Status Indicator */}
      <div className={`flex items-center space-x-2 ${
        isOnline ? 'text-green-600' : 'text-orange-600'
      }`}>
        <div className={`w-2 h-2 rounded-full ${
          isOnline ? 'bg-green-500' : 'bg-orange-500'
        }`} />
        <span className="text-xs font-medium">
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* Offline Message */}
      {showOfflineMessage && !isOnline && (
        <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800">
          <div className="flex items-start space-x-2">
            <svg className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium">You're offline</p>
              <p>Some features may be limited. Cached data will be shown.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * PWA Update Status Component
 */
const PWAUpdateStatus = ({ className = '' }) => {
  const [swVersion, setSWVersion] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  useEffect(() => {
    // Get current service worker version
    getSWVersion().then(version => {
      setSWVersion(version);
    });
  }, []);

  const handleCheckForUpdates = async () => {
    setLastChecked(new Date());
    checkForUpdates();
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-600">
          App Version: {swVersion ? swVersion.split('-v')[1] : 'Unknown'}
        </div>
        <button
          onClick={handleCheckForUpdates}
          className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
        >
          Check for Updates
        </button>
      </div>
      
      {lastChecked && (
        <div className="text-xs text-gray-500">
          Last checked: {lastChecked.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

/**
 * PWA Info Card Component
 */
const PWAInfoCard = ({ className = '' }) => {
  const isInstalled = isPWAInstalled();
  const displayMode = getPWADisplayMode();
  const isOnline = useOnlineStatus();

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">App Status</h3>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          isInstalled 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          {isInstalled ? 'PWA Installed' : 'Web Version'}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Installation Status */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Installation</h4>
          <PWAInstallButton />
          {isInstalled && (
            <div className="text-xs text-gray-600">
              Display Mode: {displayMode}
            </div>
          )}
        </div>

        {/* Network Status */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Connection</h4>
          <NetworkStatusIndicator />
        </div>
      </div>

      {/* Update Status */}
      <div className="pt-4 border-t border-gray-100">
        <PWAUpdateStatus />
      </div>

      {/* PWA Features */}
      <div className="pt-4 border-t border-gray-100">
        <h4 className="text-sm font-medium text-gray-700 mb-3">PWA Features</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className={`flex items-center space-x-2 ${
            isOnline ? 'text-green-600' : 'text-gray-400'
          }`}>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Real-time Data</span>
          </div>
          
          <div className="flex items-center space-x-2 text-green-600">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Offline Support</span>
          </div>
          
          <div className="flex items-center space-x-2 text-green-600">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Fast Loading</span>
          </div>
          
          <div className={`flex items-center space-x-2 ${
            isInstalled ? 'text-green-600' : 'text-gray-400'
          }`}>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Home Screen</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Mini PWA Status Component (for navigation bars)
 */
const MiniPWAStatus = ({ className = '' }) => {
  const isInstalled = isPWAInstalled();

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <NetworkStatusIndicator />
      {!isInstalled && <PWAInstallButton />}
    </div>
  );
};

export default PWAInfoCard;
export { 
  PWAInstallButton, 
  NetworkStatusIndicator, 
  PWAUpdateStatus, 
  MiniPWAStatus,
  useOnlineStatus
};
