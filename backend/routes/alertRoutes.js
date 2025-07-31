const express = require('express');
const AlertController = require('../controllers/alertController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Alert management
router.post('/send', AlertController.sendManualAlert);
router.post('/check-now', AlertController.triggerAlertCheck);

// User alert history and management
router.get('/history', AlertController.getUserAlertHistory);
router.get('/stats', AlertController.getAlertStats);
router.get('/trends', AlertController.getAlertTrends);
router.get('/unread-count', AlertController.getUnreadAlertsCount);

// Alert actions
router.put('/mark-read', AlertController.markAlertsAsRead);
router.put('/:alertId/action', AlertController.recordUserAction);

// Scheduler management (admin functions)
router.get('/scheduler-status', AlertController.getSchedulerStatus);
router.post('/run-job', AlertController.runSchedulerJob);

module.exports = router;
