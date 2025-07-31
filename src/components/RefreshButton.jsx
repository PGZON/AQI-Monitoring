import React from 'react';

const RefreshButton = ({ 
  onRefresh, 
  isLoading, 
  lastUpdated, 
  autoRefreshEnabled = true,
  onToggleAutoRefresh 
}) => {
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center justify-between">
        {/* Refresh Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              isLoading ? 'bg-blue-500 animate-pulse' : 'bg-green-500'
            }`}></div>
            <span className="text-sm text-gray-600">
              {isLoading ? 'Updating...' : `Last updated: ${formatTime(lastUpdated)}`}
            </span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-3">
          {/* Auto-refresh toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Auto-refresh:</span>
            <button
              onClick={onToggleAutoRefresh}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                autoRefreshEnabled ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoRefreshEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Manual refresh button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
            }`}
          >
            <div className={`transition-transform duration-500 ${
              isLoading ? 'animate-spin' : 'hover:rotate-180'
            }`}>
              🔄
            </div>
            <span>{isLoading ? 'Refreshing...' : 'Refresh Now'}</span>
          </button>
        </div>
      </div>

      {/* Auto-refresh countdown (when enabled) */}
      {autoRefreshEnabled && !isLoading && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Next auto-refresh in:</span>
            <div className="flex-1 bg-gray-200 rounded-full h-1 overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-linear"
                style={{ 
                  animation: 'countdown 60s linear infinite',
                  animationPlayState: isLoading ? 'paused' : 'running'
                }}
              ></div>
            </div>
            <span className="text-xs text-gray-500">60s</span>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes countdown {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default RefreshButton;
