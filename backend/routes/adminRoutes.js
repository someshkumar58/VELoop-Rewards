const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// All admin routes strictly enforce authentication and 'admin' role authorization
router.use(protect, authorize('admin'));

// Dashboard Overview & Telemetry
router.get('/dashboard/stats', adminController.getDashboardStats);

// User Account Moderation & Directory
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserDetails);
router.patch('/users/:id/status', adminController.updateUserStatus);

// Rewards & Vault Management
router.get('/rewards', adminController.getRewardsOverview);
router.post('/rewards/adjust', adminController.adjustUserReward);

// Administrative Security Audit Ledger
router.get('/audit-logs', adminController.getAuditLogs);

// Referral Trees & Network Monitoring
router.get('/referrals', adminController.getReferrals);

// Unified Real-Time Activity Streams
router.get('/activity', adminController.getActivities);

// Progression & Level Tier Management
router.get('/levels', adminController.getLevels);
router.put('/levels/:id', adminController.updateLevel);

// Canonical Achievements Management
router.get('/achievements', adminController.getAchievements);
router.put('/achievements/:id', adminController.updateAchievement);

// Platform Configuration Settings
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

module.exports = router;
