const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const withdrawalController = require('../controllers/withdrawalController');
const { protect } = require('../middleware/auth');

// All profile endpoints require a valid authenticated JWT
router.use(protect);

// GET /api/profile and GET /api/profile/me (Both supported for full frontend contract compatibility)
router.get('/', profileController.getProfile);
router.get('/me', profileController.getProfile);

// PATCH /api/profile and PATCH /api/profile/me
router.patch('/', profileController.updateProfile);
router.patch('/me', profileController.updateProfile);

// GET /api/profile/rewards (Matches frontend API_ENDPOINTS.PROFILE.REWARDS)
router.get('/rewards', profileController.getRewards);

// GET /api/profile/level-progress (Matches frontend API_ENDPOINTS.PROFILE.LEVEL_PROGRESS)
router.get('/level-progress', profileController.getLevelProgress);

// GET /api/profile/achievements (Matches frontend API_ENDPOINTS.PROFILE.ACHIEVEMENTS)
router.get('/achievements', profileController.getAchievements);

// GET /api/profile/check-in-status (Matches frontend API_ENDPOINTS.PROFILE.CHECK_IN_STATUS)
router.get('/check-in-status', profileController.getCheckInStatus);

// POST /api/profile/check-in (Matches frontend API_ENDPOINTS.PROFILE.CHECK_IN)
router.post('/check-in', profileController.performCheckIn);

// GET /api/profile/withdrawals
router.get('/withdrawals', withdrawalController.getUserWithdrawals);

// POST /api/profile/withdrawals
router.post('/withdrawals', withdrawalController.createWithdrawal);

// GET /api/profile/withdrawal-summary
router.get('/withdrawal-summary', withdrawalController.getWithdrawalSummary);

// GET /api/profile/referrals (Matches frontend API_ENDPOINTS.PROFILE.REFERRALS)
router.get('/referrals', profileController.getReferrals);

// GET /api/profile/activity (Matches frontend API_ENDPOINTS.PROFILE.ACTIVITY)
router.get('/activity', profileController.getActivity);

module.exports = router;


