import { useState, useEffect, useCallback, useRef } from 'react';

// Custom hook for managing geolocation
export const useGeolocation = (options = {}) => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // ✅ BULLETPROOF: Prevent infinite loops with useRef guard
  const initStarted = useRef(false);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError(new Error('Geolocation is not supported by this browser'));
      return;
    }

    setLoading(true);
    setError(null);

    // ✅ FIXED: Use current options directly to avoid dependency issues
    const currentOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // 5 minutes
      ...options // Use options directly from closure
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({
          latitude,
          longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
        setLoading(false);
      },
      (error) => {
        let errorMessage = 'Unknown geolocation error';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
          default:
            errorMessage = 'Unknown geolocation error';
        }
        
        setError(new Error(errorMessage));
        setLoading(false);
      },
      currentOptions
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ INTENTIONAL: Empty deps to prevent infinite loops, options accessed from closure

  // ✅ BULLETPROOF: Auto-fetch location on mount with guard
  useEffect(() => {
    console.log('🔥 [useGeolocation] Effect - initStarted:', initStarted.current);
    
    // Guard against multiple executions
    if (initStarted.current) {
      console.log('⏭️ [useGeolocation] Skipping - already initialized');
      return;
    }

    // Only run if autoFetch is enabled (default true)
    if (options.autoFetch === false) {
      console.log('⏭️ [useGeolocation] Skipping - autoFetch disabled');
      return;
    }

    // Lock to prevent re-runs
    initStarted.current = true;
    console.log('🔒 [useGeolocation] LOCKED - will never run again');

    // Safe to call getCurrentLocation now
    getCurrentLocation();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ INTENTIONAL: Empty deps to prevent infinite loops

  return {
    location,
    error,
    loading,
    getCurrentLocation,
    clearError: () => setError(null)
  };
};

// Default coordinates (New York City) for fallback
export const DEFAULT_COORDINATES = {
  latitude: 40.7128,
  longitude: -74.0060,
  city: 'New York',
  country: 'United States'
};

// Popular city coordinates for quick selection
export const POPULAR_CITIES = [
  { name: 'New York, NY', lat: 40.7128, lon: -74.0060, country: 'US' },
  { name: 'Los Angeles, CA', lat: 34.0522, lon: -118.2437, country: 'US' },
  { name: 'Chicago, IL', lat: 41.8781, lon: -87.6298, country: 'US' },
  { name: 'London, UK', lat: 51.5074, lon: -0.1278, country: 'GB' },
  { name: 'Paris, France', lat: 48.8566, lon: 2.3522, country: 'FR' },
  { name: 'Tokyo, Japan', lat: 35.6762, lon: 139.6503, country: 'JP' },
  { name: 'Sydney, Australia', lat: -33.8688, lon: 151.2093, country: 'AU' },
  { name: 'Mumbai, India', lat: 19.0760, lon: 72.8777, country: 'IN' },
  { name: 'Beijing, China', lat: 39.9042, lon: 116.4074, country: 'CN' },
  { name: 'São Paulo, Brazil', lat: -23.5505, lon: -46.6333, country: 'BR' }
];

export default useGeolocation;
