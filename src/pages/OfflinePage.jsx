/**
 * Offline Page Component
 * Shown when the user is offline and no cached content is available
 */

import React, { useEffect, useState } from 'react';
import { useOnlineStatus } from '../components/PWAStatus';

const OfflinePage = () => {
  const isOnline = useOnlineStatus();
  const [lastAttempt, setLastAttempt] = useState(null);

  useEffect(() => {
    // Redirect to dashboard when back online
    if (isOnline) {
      window.location.href = '/dashboard';
    }
  }, [isOnline]);

  const handleRetry = () => {
    setLastAttempt(new Date());
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Offline Icon */}
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            🌬️ AQI Monitor
          </h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            You're Offline
          </h2>
          <p className="text-gray-600 mb-2">
            It looks like you've lost your internet connection.
          </p>
          <p className="text-gray-600">
            Some cached air quality data may still be available.
          </p>
        </div>

        {/* Status */}
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-orange-800">
              Waiting for connection...
            </span>
          </div>
          {lastAttempt && (
            <p className="text-xs text-orange-600 mt-2">
              Last attempt: {lastAttempt.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Try Again
          </button>
          
          <button
            onClick={handleGoHome}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Go to Home
          </button>
        </div>

        {/* Tips */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            💡 While Offline
          </h3>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex items-center space-x-2">
              <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Previously viewed data is cached</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>App will sync when back online</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Settings and preferences are saved</span>
            </div>
          </div>
        </div>

        {/* PWA Installation Tip */}
        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2 text-xs text-blue-800">
            <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium">Tip: Install the App</p>
              <p>Install AQI Monitor on your device for better offline support and faster loading.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfflinePage;
