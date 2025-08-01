const express = require('express');
const { body } = require('express-validator');
const {
  getMe,
  updateProfile,
  getUserStats,
  getSavedLocations,
  addSavedLocation,
  removeSavedLocation,
  setDefaultLocation,
  getPreferences,
  updatePreferences,
  uploadAvatar,
  deleteAccount,
  exportData
} = require('../controllers/authController'); // Reusing auth controller functions
const { 
  authenticateToken, 
  authorizeRoles 
} = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/errorMiddleware');

const router = express.Router();

// Validation rules
const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('preferences.notifications.email')
    .optional()
    .isBoolean()
    .withMessage('Email notification preference must be a boolean'),
  
  body('preferences.notifications.push')
    .optional()
    .isBoolean()
    .withMessage('Push notification preference must be a boolean'),
  
  body('preferences.units')
    .optional()
    .isIn(['metric', 'imperial'])
    .withMessage('Units must be either metric or imperial'),
  
  body('preferences.aqiThreshold')
    .optional()
    .isNumeric()
    .withMessage('AQI threshold must be a number')
    .isFloat({ min: 0, max: 500 })
    .withMessage('AQI threshold must be between 0 and 500')
];

const locationValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Location name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Location name must be between 1 and 100 characters'),
  
  body('coordinates.lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  body('coordinates.lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180')
];

const preferencesValidation = [
  body('notifications.email')
    .optional()
    .isBoolean()
    .withMessage('Email notification preference must be a boolean'),
  
  body('notifications.push')
    .optional()
    .isBoolean()
    .withMessage('Push notification preference must be a boolean'),
  
  body('units')
    .optional()
    .isIn(['metric', 'imperial'])
    .withMessage('Units must be either metric or imperial'),
  
  body('aqiThreshold')
    .optional()
    .isNumeric()
    .withMessage('AQI threshold must be a number')
    .isFloat({ min: 0, max: 500 })
    .withMessage('AQI threshold must be between 0 and 500')
];

// User profile routes
router.get('/me', authenticateToken, getMe);
router.put('/update', authenticateToken, updateProfileValidation, handleValidationErrors, updateProfile);

// User locations routes
router.get('/locations', authenticateToken, getSavedLocations);
router.post('/locations', authenticateToken, locationValidation, handleValidationErrors, addSavedLocation);
router.delete('/locations/:locationId', authenticateToken, removeSavedLocation);
router.put('/locations/:locationId/default', authenticateToken, setDefaultLocation);

// User preferences routes
router.get('/preferences', authenticateToken, getPreferences);
router.put('/preferences', authenticateToken, preferencesValidation, handleValidationErrors, updatePreferences);

// User stats routes
router.get('/stats', authenticateToken, getUserStats);

// User avatar routes
router.post('/avatar', authenticateToken, uploadAvatar);

// User account management routes
router.delete('/account', authenticateToken, deleteAccount);
router.get('/export', authenticateToken, exportData);

// Health check route for this user module
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User service is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router; 