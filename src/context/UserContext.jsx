/**
 * User Context for managing user data, locations, and preferences globally
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import userService from '../services/userService';

// Initial state
const initialState = {
  profile: null,
  savedLocations: [],
  preferences: null,
  stats: null,
  loading: {
    profile: false,
    locations: false,
    preferences: false,
    stats: false
  },
  errors: {
    profile: null,
    locations: null,
    preferences: null,
    stats: null
  }
};

// Action types
const actionTypes = {
  // Loading states
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  
  // Profile actions
  SET_PROFILE: 'SET_PROFILE',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  
  // Location actions
  SET_SAVED_LOCATIONS: 'SET_SAVED_LOCATIONS',
  ADD_SAVED_LOCATION: 'ADD_SAVED_LOCATION',
  REMOVE_SAVED_LOCATION: 'REMOVE_SAVED_LOCATION',
  SET_DEFAULT_LOCATION: 'SET_DEFAULT_LOCATION',
  
  // Preferences actions
  SET_PREFERENCES: 'SET_PREFERENCES',
  UPDATE_PREFERENCES: 'UPDATE_PREFERENCES',
  
  // Stats actions
  SET_STATS: 'SET_STATS',
  
  // Reset
  RESET_USER_DATA: 'RESET_USER_DATA'
};

// Reducer function
const userReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_LOADING:
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.key]: action.value
        }
      };
      
    case actionTypes.SET_ERROR:
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.key]: action.error
        }
      };
      
    case actionTypes.CLEAR_ERROR:
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.key]: null
        }
      };
      
    case actionTypes.SET_PROFILE:
      return {
        ...state,
        profile: action.profile
      };
      
    case actionTypes.UPDATE_PROFILE:
      return {
        ...state,
        profile: {
          ...state.profile,
          ...action.updates
        }
      };
      
    case actionTypes.SET_SAVED_LOCATIONS:
      return {
        ...state,
        savedLocations: action.locations
      };
      
    case actionTypes.ADD_SAVED_LOCATION:
      return {
        ...state,
        savedLocations: [...state.savedLocations, action.location]
      };
      
    case actionTypes.REMOVE_SAVED_LOCATION:
      return {
        ...state,
        savedLocations: state.savedLocations.filter(loc => loc.id !== action.locationId)
      };
      
    case actionTypes.SET_DEFAULT_LOCATION:
      return {
        ...state,
        savedLocations: state.savedLocations.map(loc => ({
          ...loc,
          isDefault: loc.id === action.locationId
        }))
      };
      
    case actionTypes.SET_PREFERENCES:
      return {
        ...state,
        preferences: action.preferences
      };
      
    case actionTypes.UPDATE_PREFERENCES:
      return {
        ...state,
        preferences: {
          ...state.preferences,
          ...action.updates
        }
      };
      
    case actionTypes.SET_STATS:
      return {
        ...state,
        stats: action.stats
      };
      
    case actionTypes.RESET_USER_DATA:
      return initialState;
      
    default:
      return state;
  }
};

// Create context
const UserContext = createContext();

// Custom hook to use user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// Provider component
export const UserProvider = ({ children }) => {
  const [state, dispatch] = useReducer(userReducer, initialState);
  
  // Use ref to prevent infinite loops - moved to component level
  const hasInitialized = useRef(false);

  // Helper function to set loading state
  const setLoading = useCallback((key, value) => {
    dispatch({ type: actionTypes.SET_LOADING, key, value });
  }, []);

  // Helper function to set error
  const setError = useCallback((key, error) => {
    dispatch({ type: actionTypes.SET_ERROR, key, error });
  }, []);

  // Helper function to clear error
  const clearError = useCallback((key) => {
    dispatch({ type: actionTypes.CLEAR_ERROR, key });
  }, []);

  /**
   * Load user profile
   */
  const loadProfile = useCallback(async () => {
    setLoading('profile', true);
    clearError('profile');
    
    try {
      const profile = await userService.getProfile();
      dispatch({ type: actionTypes.SET_PROFILE, profile });
    } catch (error) {
      console.error('Failed to load profile:', error);
      setError('profile', error.message);
    } finally {
      setLoading('profile', false);
    }
  }, [setLoading, clearError, setError]);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (updates) => {
    setLoading('profile', true);
    clearError('profile');
    
    try {
      const updatedProfile = await userService.updateProfile(updates);
      dispatch({ type: actionTypes.UPDATE_PROFILE, updates: updatedProfile });
      return updatedProfile;
    } catch (error) {
      console.error('Failed to update profile:', error);
      setError('profile', error.message);
      throw error;
    } finally {
      setLoading('profile', false);
    }
  }, [setLoading, clearError, setError]);

  /**
   * Load saved locations
   */
  const loadSavedLocations = useCallback(async () => {
    setLoading('locations', true);
    clearError('locations');
    
    try {
      const locations = await userService.getSavedLocations();
      dispatch({ type: actionTypes.SET_SAVED_LOCATIONS, locations });
    } catch (error) {
      console.error('Failed to load saved locations:', error);
      setError('locations', error.message);
    } finally {
      setLoading('locations', false);
    }
  }, [setLoading, clearError, setError]);

  /**
   * Add a saved location
   */
  const addSavedLocation = useCallback(async (locationData) => {
    setLoading('locations', true);
    clearError('locations');
    
    try {
      const newLocation = await userService.addSavedLocation(locationData);
      dispatch({ type: actionTypes.ADD_SAVED_LOCATION, location: newLocation });
      return newLocation;
    } catch (error) {
      console.error('Failed to add saved location:', error);
      setError('locations', error.message);
      throw error;
    } finally {
      setLoading('locations', false);
    }
  }, [setLoading, clearError, setError]);

  /**
   * Remove a saved location
   */
  const removeSavedLocation = useCallback(async (locationId) => {
    setLoading('locations', true);
    clearError('locations');
    
    try {
      await userService.removeSavedLocation(locationId);
      dispatch({ type: actionTypes.REMOVE_SAVED_LOCATION, locationId });
    } catch (error) {
      console.error('Failed to remove saved location:', error);
      setError('locations', error.message);
      throw error;
    } finally {
      setLoading('locations', false);
    }
  }, [setLoading, clearError, setError]);

  /**
   * Set default location
   */
  const setDefaultLocation = useCallback(async (locationId) => {
    setLoading('locations', true);
    clearError('locations');
    
    try {
      await userService.setDefaultLocation(locationId);
      dispatch({ type: actionTypes.SET_DEFAULT_LOCATION, locationId });
    } catch (error) {
      console.error('Failed to set default location:', error);
      setError('locations', error.message);
      throw error;
    } finally {
      setLoading('locations', false);
    }
  }, [setLoading, clearError, setError]);

  /**
   * Load user preferences
   */
  const loadPreferences = useCallback(async () => {
    setLoading('preferences', true);
    clearError('preferences');
    
    try {
      const preferences = await userService.getPreferences();
      dispatch({ type: actionTypes.SET_PREFERENCES, preferences });
    } catch (error) {
      console.error('Failed to load preferences:', error);
      setError('preferences', error.message);
    } finally {
      setLoading('preferences', false);
    }
  }, [setLoading, clearError, setError]);

  /**
   * Update user preferences
   */
  const updatePreferences = useCallback(async (updates) => {
    setLoading('preferences', true);
    clearError('preferences');
    
    try {
      const updatedPreferences = await userService.updatePreferences({
        ...state.preferences,
        ...updates
      });
      dispatch({ type: actionTypes.UPDATE_PREFERENCES, updates: updatedPreferences });
      return updatedPreferences;
    } catch (error) {
      console.error('Failed to update preferences:', error);
      setError('preferences', error.message);
      throw error;
    } finally {
      setLoading('preferences', false);
    }
  }, [state.preferences, setLoading, clearError, setError]);

  /**
   * Load user statistics
   */
  const loadStats = useCallback(async () => {
    setLoading('stats', true);
    clearError('stats');
    
    try {
      const stats = await userService.getUserStats();
      dispatch({ type: actionTypes.SET_STATS, stats });
    } catch (error) {
      console.error('Failed to load user stats:', error);
      setError('stats', error.message);
    } finally {
      setLoading('stats', false);
    }
  }, [setLoading, clearError, setError]);

  /**
   * Reset all user data (on logout)
   */
  const resetUserData = useCallback(() => {
    dispatch({ type: actionTypes.RESET_USER_DATA });
  }, []);

  /**
   * Initialize user data on app start
   */
  // Initialize data on mount - FIXED: Remove dependency to prevent infinite loop
  useEffect(() => {
    console.log('🔄 [UserContext] Initializing user data...');
    
    if (hasInitialized.current) {
      console.log('⏭️ [UserContext] Already initialized, skipping');
      return;
    }
    
    hasInitialized.current = true;
    
    // Simple initialization without complex dependencies
    const initializeUserData = async () => {
      try {
        console.log('📊 [UserContext] Loading user profile...');
        await loadProfile();
        
        console.log('📍 [UserContext] Loading saved locations...');
        await loadSavedLocations();
        
        console.log('⚙️ [UserContext] Loading preferences...');
        await loadPreferences();
        
        console.log('📈 [UserContext] Loading stats...');
        await loadStats();
        
        console.log('✅ [UserContext] User data initialization complete');
      } catch (error) {
        console.error('❌ [UserContext] Failed to initialize user data:', error);
      }
    };
    
    // Add a small delay to prevent simultaneous requests with AuthContext
    const timer = setTimeout(() => {
      initializeUserData();
    }, 500); // Increased delay to 500ms
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only once

  // Context value
  const contextValue = {
    // State
    ...state,
    
    // Actions
    loadProfile,
    updateProfile,
    loadSavedLocations,
    addSavedLocation,
    removeSavedLocation,
    setDefaultLocation,
    loadPreferences,
    updatePreferences,
    loadStats,
    resetUserData,
    
    // Utilities
    clearError
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;
