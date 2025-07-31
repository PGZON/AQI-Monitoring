const express = require('express');
const PreferenceController = require('../controllers/preferenceController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Basic preference operations
router.get('/', PreferenceController.getUserPreferences);
router.put('/', PreferenceController.updateUserPreferences);
router.delete('/', PreferenceController.resetPreferences);

// Location management
router.post('/locations', PreferenceController.addPreferredLocation);
router.delete('/locations/:city', PreferenceController.removePreferredLocation);

// Alert threshold management
router.put('/thresholds', PreferenceController.updateAlertThresholds);

// Notification settings
router.put('/notifications', PreferenceController.updateNotificationSettings);

// Contact information
router.put('/contact', PreferenceController.updateContactInfo);

// Utility routes
router.get('/defaults', PreferenceController.getPreferenceDefaults);
router.post('/test-notification', PreferenceController.testNotification);

module.exports = router;
