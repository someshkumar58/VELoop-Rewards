const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const adController = require('../controllers/adController');

// All ad routes require authenticated user JWT
router.use(protect);

// GET /api/ads/status
router.get('/status', adController.getStatus);

// POST /api/ads/start-session
router.post('/start-session', adController.startSession);

// POST /api/ads/claim-reward
router.post('/claim-reward', adController.claimReward);

module.exports = router;

