const adService = require('../services/adService');

/**
 * @route   GET /api/ads/status
 * @desc    Get user's daily ad limits, remaining quota, active cooldown timer, and level multiplier
 * @access  Private (Authenticated User)
 */
const getStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await adService.getAdStatus(userId);
    return res.status(200).json(result);
  } catch (err) {
    console.error('[Get Ad Status Error]:', err.message);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Server error retrieving ad status.'
    });
  }
};

/**
 * @route   POST /api/ads/start-session
 * @desc    Start an ad watching session and generate single-use impression nonce
 * @access  Private (Authenticated User)
 */
const startSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await adService.startAdSession(userId);
    return res.status(201).json(result);
  } catch (err) {
    console.error('[Start Ad Session Error]:', err.message);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Server error starting ad session.',
      cooldownRemaining: err.cooldownRemaining,
      dailyLimit: err.dailyLimit
    });
  }
};

/**
 * @route   POST /api/ads/claim-reward
 * @desc    Verify minimum watch duration (>=15s) and atomically credit wallet VEs
 * @access  Private (Authenticated User)
 */
const claimReward = async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await adService.claimAdReward(userId, req.body);
    return res.status(200).json(result);
  } catch (err) {
    console.error('[Claim Ad Reward Error]:', err.message);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Server error claiming ad reward.',
      remainingSeconds: err.remainingSeconds
    });
  }
};

module.exports = {
  getStatus,
  startSession,
  claimReward
};

