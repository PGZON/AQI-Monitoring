import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * ✅ BULLETPROOF: Custom hook for debouncing values to prevent API spam
 * Prevents infinite API requests on every keystroke
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * ✅ BULLETPROOF: Custom hook for debounced API calls
 * Prevents multiple API requests when user types quickly
 */
export const useDebounceCallback = (callback, delay = 500) => {
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback((...args) => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

/**
 * ✅ BULLETPROOF: Custom hook for search with debouncing and loading states
 * Perfect for city search, user search, etc.
 */
export const useSearchWithDebounce = (searchFunction, delay = 500) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debounce the search term
  const debouncedSearchTerm = useDebounce(searchTerm, delay);

  // Prevent multiple searches for the same term
  const lastSearchRef = useRef('');

  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearchTerm.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }

      // Skip if same search term
      if (lastSearchRef.current === debouncedSearchTerm) {
        return;
      }

      lastSearchRef.current = debouncedSearchTerm;
      setLoading(true);
      setError(null);

      try {
        console.log(`🔍 [Search] Searching for: "${debouncedSearchTerm}"`);
        const searchResults = await searchFunction(debouncedSearchTerm);
        setResults(searchResults || []);
      } catch (err) {
        console.error('❌ [Search] Error:', err);
        setError(err.message || 'Search failed');
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedSearchTerm, searchFunction]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setResults([]);
    setError(null);
    lastSearchRef.current = '';
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    results,
    loading,
    error,
    clearSearch
  };
};

export default useDebounce;
