const express = require('express');
const AdminController = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication and admin authorization to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard and overview
router.get('/dashboard', AdminController.getDashboard);

// User management routes
router.get('/users', AdminController.getUsers);
router.get('/users/stats', AdminController.getUserStats);
router.delete('/users/:id', AdminController.deleteUser);
router.put('/users/:id/role', AdminController.updateUserRole);

// Alert management routes
router.get('/alerts', AdminController.getAlerts);

// City and AQI statistics
router.get('/cities/aqi-stats', AdminController.getCityAQIStats);

// Preference statistics
router.get('/preferences/stats', AdminController.getPreferenceStats);

// System health and monitoring
router.get('/system/health', AdminController.getSystemHealth);
router.get('/logs', AdminController.getSystemLogs);

// Analytics and trends
router.get('/analytics/trends', AdminController.getAnalyticsTrends);

// Data export
router.get('/export/:type', AdminController.exportData);

module.exports = router;
