/**
 * User Service for profile, locations, and preferences management
 */

import api from '../utils/api';

class UserService {
  /**
   * Get current user profile information
   * @returns {Promise<Object>} User profile data
   */
  async getProfile() {
    try {
      const response = await api.get('/user/me');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // Return mock data for development
      return {
        id: 'user_123',
        name: 'John Doe',
        email: 'john.doe@example.com',
        avatar: null,
        provider: 'email',
        createdAt: '2025-01-15T10:30:00Z',
        lastLogin: new Date().toISOString(),
        isVerified: true
      };
    }
  }

  /**
   * Update user profile information
   * @param {Object} profileData - Updated profile data
   * @returns {Promise<Object>} Updated user profile
   */
  async updateProfile(profileData) {
    try {
      const response = await api.put('/user/update', profileData);
      return response.data;
    } catch (error) {
      console.error('Failed to update user profile:', error);
      throw new Error('Failed to update profile. Please try again.');
    }
  }

  /**
   * Get user's saved locations
   * @returns {Promise<Array>} Array of saved locations
   */
  async getSavedLocations() {
    try {
      const response = await api.get('/user/locations');
      return response.data.locations || [];
    } catch (error) {
      console.warn('Failed to fetch saved locations, using local storage:', error);
      
      // Fallback to localStorage
      const saved = localStorage.getItem('savedLocations');
      if (saved) {
        return JSON.parse(saved);
      }
      
      // Return some default locations
      return [
        {
          id: 'default_1',
          name: 'New York City',
          coordinates: { lat: 40.7128, lng: -74.0060 },
          isDefault: true,
          addedAt: new Date().toISOString()
        },
        {
          id: 'default_2',
          name: 'Los Angeles',
          coordinates: { lat: 34.0522, lng: -118.2437 },
          isDefault: false,
          addedAt: new Date().toISOString()
        }
      ];
    }
  }

  /**
   * Add a new saved location
   * @param {Object} locationData - Location data to save
   * @returns {Promise<Object>} Saved location with ID
   */
  async addSavedLocation(locationData) {
    try {
      const response = await api.post('/user/locations', locationData);
      return response.data;
    } catch (error) {
      console.warn('Failed to save location to backend, using localStorage:', error);
      
      // Fallback to localStorage
      const saved = localStorage.getItem('savedLocations');
      const locations = saved ? JSON.parse(saved) : [];
      
      const newLocation = {
        ...locationData,
        id: `loc_${Date.now()}`,
        addedAt: new Date().toISOString()
      };
      
      locations.push(newLocation);
      localStorage.setItem('savedLocations', JSON.stringify(locations));
      
      return newLocation;
    }
  }

  /**
   * Remove a saved location
   * @param {string} locationId - ID of location to remove
   * @returns {Promise<boolean>} Success status
   */
  async removeSavedLocation(locationId) {
    try {
      await api.delete(`/user/locations/${locationId}`);
      return true;
    } catch (error) {
      console.warn('Failed to remove location from backend, using localStorage:', error);
      
      // Fallback to localStorage
      const saved = localStorage.getItem('savedLocations');
      if (saved) {
        const locations = JSON.parse(saved);
        const filtered = locations.filter(loc => loc.id !== locationId);
        localStorage.setItem('savedLocations', JSON.stringify(filtered));
      }
      
      return true;
    }
  }

  /**
   * Set default location
   * @param {string} locationId - ID of location to set as default
   * @returns {Promise<boolean>} Success status
   */
  async setDefaultLocation(locationId) {
    try {
      await api.put(`/user/locations/${locationId}/default`);
      return true;
    } catch (error) {
      console.warn('Failed to set default location in backend, using localStorage:', error);
      
      // Fallback to localStorage
      const saved = localStorage.getItem('savedLocations');
      if (saved) {
        const locations = JSON.parse(saved);
        const updated = locations.map(loc => ({
          ...loc,
          isDefault: loc.id === locationId
        }));
        localStorage.setItem('savedLocations', JSON.stringify(updated));
      }
      
      return true;
    }
  }

  /**
   * Get user preferences
   * @returns {Promise<Object>} User preferences
   */
  async getPreferences() {
    try {
      const response = await api.get('/user/preferences');
      return response.data;
    } catch (error) {
      console.warn('Failed to fetch preferences from backend, using localStorage:', error);
      
      // Fallback to localStorage
      const saved = localStorage.getItem('userPreferences');
      if (saved) {
        return JSON.parse(saved);
      }
      
      // Return default preferences
      return {
        temperatureUnit: 'celsius', // celsius or fahrenheit
        forecastRange: 5, // days
        aqiAlertThreshold: 150, // AQI value
        enableNotifications: true,
        autoRefresh: true,
        refreshInterval: 60, // seconds
        theme: 'light', // light or dark
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h' // 12h or 24h
      };
    }
  }

  /**
   * Update user preferences
   * @param {Object} preferences - Updated preferences
   * @returns {Promise<Object>} Updated preferences
   */
  async updatePreferences(preferences) {
    try {
      const response = await api.put('/user/preferences', preferences);
      return response.data;
    } catch (error) {
      console.warn('Failed to update preferences in backend, using localStorage:', error);
      
      // Fallback to localStorage
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
      return preferences;
    }
  }

  /**
   * Get user statistics
   * @returns {Promise<Object>} User usage statistics
   */
  async getUserStats() {
    try {
      const response = await api.get('/user/stats');
      return response.data;
    } catch (error) {
      console.warn('Failed to fetch user stats:', error);
      
      // Return mock stats
      return {
        totalApiCalls: Math.floor(Math.random() * 1000) + 100,
        locationsTracked: Math.floor(Math.random() * 10) + 5,
        alertsReceived: Math.floor(Math.random() * 50) + 10,
        accountAge: Math.floor(Math.random() * 365) + 30, // days
        lastActivity: new Date().toISOString(),
        favoriteLocation: 'New York City'
      };
    }
  }

  /**
   * Upload user avatar
   * @param {File} file - Avatar image file
   * @returns {Promise<Object>} Upload result with avatar URL
   */
  async uploadAvatar(file) {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await api.post('/user/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      throw new Error('Failed to upload avatar. Please try again.');
    }
  }

  /**
   * Delete user account
   * @returns {Promise<boolean>} Success status
   */
  async deleteAccount() {
    try {
      await api.delete('/user/account');
      return true;
    } catch (error) {
      console.error('Failed to delete user account:', error);
      throw new Error('Failed to delete account. Please try again.');
    }
  }

  /**
   * Export user data
   * @returns {Promise<Object>} User data export
   */
  async exportData() {
    try {
      const response = await api.get('/user/export');
      return response.data;
    } catch (error) {
      console.error('Failed to export user data:', error);
      throw new Error('Failed to export data. Please try again.');
    }
  }
}

// Create and export singleton instance
const userService = new UserService();
export default userService;
