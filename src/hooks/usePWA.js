/**
 * PWA Hook
 * Custom React hook for PWA functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  isPWAInstalled, 
  getPWADisplayMode, 
  installPWA, 
  checkForUpdates,
  getSWVersion,
  cacheAQIData 
} from '../utils/pwaUtils';

/**
 * Custom hook for PWA functionality
 */
export const usePWA = () => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [displayMode, setDisplayMode] = useState('browser');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [swVersion, setSWVersion] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  // Initialize PWA state
  useEffect(() => {
    setIsInstalled(isPWAInstalled());
    setDisplayMode(getPWADisplayMode());
    getSWVersion().then(setSWVersion);
  }, []);

  // Listen for online/offline events
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

  // Listen for PWA events
  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
    };

    const handleServiceWorkerUpdate = () => {
      setUpdateAvailable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_UPDATE_READY') {
          handleServiceWorkerUpdate();
        }
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Install PWA
  const handleInstall = useCallback(async () => {
    try {
      await installPWA();
      setCanInstall(false);
    } catch (error) {
      console.error('PWA installation failed:', error);
    }
  }, []);

  // Check for updates
  const handleCheckUpdates = useCallback(() => {
    checkForUpdates();
  }, []);

  // Cache AQI data for offline use
  const handleCacheData = useCallback((data) => {
    cacheAQIData(data);
  }, []);

  // Get PWA capabilities
  const capabilities = {
    serviceWorker: 'serviceWorker' in navigator,
    pushNotifications: 'PushManager' in window,
    backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
    badging: 'setAppBadge' in navigator,
    webShare: 'share' in navigator,
    fullscreen: 'requestFullscreen' in document.documentElement
  };

  return {
    // State
    isInstalled,
    canInstall,
    displayMode,
    isOnline,
    swVersion,
    updateAvailable,
    capabilities,
    
    // Actions
    install: handleInstall,
    checkForUpdates: handleCheckUpdates,
    cacheData: handleCacheData,
    
    // Utils
    isPWA: isInstalled,
    isStandalone: displayMode === 'standalone'
  };
};

/**
 * Hook for network status
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState('unknown');
  const [effectiveType, setEffectiveType] = useState('unknown');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Get connection info if available
    const updateConnectionInfo = () => {
      if ('connection' in navigator) {
        const conn = navigator.connection;
        setConnectionType(conn.type || 'unknown');
        setEffectiveType(conn.effectiveType || 'unknown');
      }
    };

    updateConnectionInfo();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', updateConnectionInfo);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if ('connection' in navigator) {
        navigator.connection.removeEventListener('change', updateConnectionInfo);
      }
    };
  }, []);

  return {
    isOnline,
    connectionType,
    effectiveType,
    isSlowConnection: effectiveType === 'slow-2g' || effectiveType === '2g'
  };
};

/**
 * Hook for PWA notifications
 */
export const usePWANotifications = () => {
  const [permission, setPermission] = useState(
    'Notification' in window ? Notification.permission : 'denied'
  );
  const [isSupported, setIsSupported] = useState('Notification' in window);

  useEffect(() => {
    setIsSupported('Notification' in window);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Notification permission request failed:', error);
      return false;
    }
  }, [isSupported]);

  const showNotification = useCallback((title, options = {}) => {
    if (permission !== 'granted') return null;

    const notification = new Notification(title, {
      icon: '/logo192.png',
      badge: '/favicon.ico',
      ...options
    });

    return notification;
  }, [permission]);

  return {
    isSupported,
    permission,
    canNotify: permission === 'granted',
    requestPermission,
    showNotification
  };
};

/**
 * Hook for PWA storage management
 */
export const usePWAStorage = () => {
  const [storageEstimate, setStorageEstimate] = useState(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const checkStorage = async () => {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        setIsSupported(true);
        try {
          const estimate = await navigator.storage.estimate();
          setStorageEstimate(estimate);
        } catch (error) {
          console.error('Storage estimation failed:', error);
        }
      }
    };

    checkStorage();
  }, []);

  const clearCache = useCallback(async () => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        
        // Refresh storage estimate
        if (isSupported) {
          const estimate = await navigator.storage.estimate();
          setStorageEstimate(estimate);
        }
        
        return true;
      } catch (error) {
        console.error('Cache clearing failed:', error);
        return false;
      }
    }
    return false;
  }, [isSupported]);

  const formatBytes = useCallback((bytes) => {
    if (!bytes) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  return {
    isSupported,
    storageEstimate,
    usedSpace: storageEstimate?.usage || 0,
    availableSpace: storageEstimate?.quota || 0,
    usedSpaceFormatted: formatBytes(storageEstimate?.usage),
    availableSpaceFormatted: formatBytes(storageEstimate?.quota),
    clearCache
  };
};

export default usePWA;
