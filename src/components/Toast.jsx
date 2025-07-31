/**
 * Toast Notification Component
 * Provides user feedback for actions like save, delete, etc.
 */

import React, { useState, useEffect, useCallback } from 'react';

/**
 * Individual Toast Component
 */
const Toast = ({ 
  id, 
  type = 'info', 
  title, 
  message, 
  duration = 5000, 
  onDismiss,
  showProgress = true 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => onDismiss(id), 300); // Wait for exit animation
  }, [id, onDismiss]);

  // Animation and auto-dismiss logic
  useEffect(() => {
    // Show animation
    setIsVisible(true);

    // Progress bar animation
    if (showProgress && duration > 0) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - (100 / (duration / 100));
          return newProgress <= 0 ? 0 : newProgress;
        });
      }, 100);

      // Auto dismiss
      const timeout = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [duration, showProgress, handleDismiss]);

  const getToastStyles = () => {
    const baseStyles = "relative max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto overflow-hidden";
    const animations = `transform transition-all duration-300 ease-in-out ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`;
    
    const borderColors = {
      success: 'border-l-4 border-green-500',
      error: 'border-l-4 border-red-500',
      warning: 'border-l-4 border-yellow-500',
      info: 'border-l-4 border-blue-500'
    };

    return `${baseStyles} ${animations} ${borderColors[type]}`;
  };

  const getIconAndColors = () => {
    const configs = {
      success: {
        icon: '✅',
        bgColor: 'bg-green-50',
        textColor: 'text-green-800',
        titleColor: 'text-green-900'
      },
      error: {
        icon: '❌',
        bgColor: 'bg-red-50',
        textColor: 'text-red-800',
        titleColor: 'text-red-900'
      },
      warning: {
        icon: '⚠️',
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-800',
        titleColor: 'text-yellow-900'
      },
      info: {
        icon: 'ℹ️',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-800',
        titleColor: 'text-blue-900'
      }
    };

    return configs[type];
  };

  const config = getIconAndColors();

  return (
    <div className={getToastStyles()}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-lg">{config.icon}</span>
          </div>
          <div className="ml-3 w-0 flex-1">
            {title && (
              <p className={`text-sm font-medium ${config.titleColor}`}>
                {title}
              </p>
            )}
            {message && (
              <p className={`text-sm ${title ? 'mt-1' : ''} ${config.textColor}`}>
                {message}
              </p>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={handleDismiss}
              className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Progress bar */}
      {showProgress && duration > 0 && (
        <div className="h-1 bg-gray-200">
          <div 
            className={`h-full transition-all duration-100 ease-linear ${
              type === 'success' ? 'bg-green-500' :
              type === 'error' ? 'bg-red-500' :
              type === 'warning' ? 'bg-yellow-500' :
              'bg-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Toast Container Component
 */
const ToastContainer = ({ toasts, onDismiss, position = 'top-right' }) => {
  const getPositionClasses = () => {
    const positions = {
      'top-right': 'top-4 right-4',
      'top-left': 'top-4 left-4',
      'bottom-right': 'bottom-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
      'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
    };
    
    return positions[position] || positions['top-right'];
  };

  if (!toasts.length) return null;

  return (
    <div className={`fixed z-50 ${getPositionClasses()}`}>
      <div className="space-y-3">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onDismiss={onDismiss}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Toast Hook for managing toasts
 */
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      type: 'info',
      duration: 5000,
      showProgress: true,
      ...toast
    };
    
    setToasts(prev => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const success = useCallback((title, message, options = {}) => {
    return addToast({ type: 'success', title, message, ...options });
  }, [addToast]);

  const error = useCallback((title, message, options = {}) => {
    return addToast({ type: 'error', title, message, duration: 8000, ...options });
  }, [addToast]);

  const warning = useCallback((title, message, options = {}) => {
    return addToast({ type: 'warning', title, message, ...options });
  }, [addToast]);

  const info = useCallback((title, message, options = {}) => {
    return addToast({ type: 'info', title, message, ...options });
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info
  };
};

/**
 * Toast Provider Component
 */
export const ToastProvider = ({ children, position = 'top-right' }) => {
  const { toasts, removeToast } = useToast();

  return (
    <>
      {children}
      <ToastContainer 
        toasts={toasts} 
        onDismiss={removeToast} 
        position={position} 
      />
    </>
  );
};

export default Toast;
