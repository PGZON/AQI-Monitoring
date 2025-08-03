/**
 * Firebase Authentication Routes
 * Handles Firebase authentication with Google OAuth
 */

const express = require('express');
const router = express.Router();
const { getFirebaseClientConfig } = require('../config/firebase');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

/**
 * @route GET /api/auth/config
 * @desc Get Firebase configuration for client-side
 * @access Public
 */
router.get('/config', (req, res) => {
  try {
    const config = getFirebaseClientConfig();
    
    res.json({
      success: true,
      config: config
    });
  } catch (error) {
    console.error('❌ Error getting Firebase config:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting configuration'
    });
  }
});

/**
 * @route POST /api/auth/verify
 * @desc Verify Firebase ID token
 * @access Public (but requires token)
 */
router.post('/verify', authenticateToken, (req, res) => {
  try {
    // If we reach here, the token is valid (verified by middleware)
    res.json({
      success: true,
      user: req.user,
      message: 'Token verified successfully'
    });
  } catch (error) {
    console.error('❌ Error in token verification route:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during verification'
    });
  }
});

/**
 * @route GET /api/auth/user
 * @desc Get current user information
 * @access Private
 */
router.get('/user', authenticateToken, (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('❌ Error getting user info:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting user information'
    });
  }
});

/**
 * @route GET /api/auth/me
 * @desc Get current user information (alias for compatibility)
 * @access Private
 */
router.get('/me', authenticateToken, (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('❌ Error getting user info:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting user information'
    });
  }
});

/**
 * @route POST /api/auth/logout
 * @desc Handle user logout (client-side will handle Firebase signOut)
 * @access Private
 */
router.post('/logout', authenticateToken, (req, res) => {
  try {
    // Server-side logout logic if needed
    // For Firebase, logout is primarily handled on client-side
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('❌ Error during logout:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during logout'
    });
  }
});

/**
 * @route GET /api/auth/profile
 * @desc Get user profile with optional auth
 * @access Public/Private (works with or without authentication)
 */
router.get('/profile', optionalAuth, (req, res) => {
  try {
    if (req.user) {
      // User is authenticated
      res.json({
        success: true,
        authenticated: true,
        user: req.user
      });
    } else {
      // User is not authenticated
      res.json({
        success: true,
        authenticated: false,
        message: 'Not authenticated'
      });
    }
  } catch (error) {
    console.error('❌ Error getting profile:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting profile'
    });
  }
});

/**
 * @route POST /api/auth/refresh
 * @desc Refresh authentication status
 * @access Private
 */
router.post('/refresh', authenticateToken, (req, res) => {
  try {
    // Token is verified by middleware, return fresh user data
    res.json({
      success: true,
      user: req.user,
      message: 'Authentication refreshed'
    });
  } catch (error) {
    console.error('❌ Error refreshing auth:', error);
    res.status(500).json({
      success: false,
      error: 'Server error refreshing authentication'
    });
  }
});

/**
 * @route GET /api/auth/health
 * @desc Health check for auth service
 * @access Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Firebase Auth service is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;
