const mongoose = require('mongoose');
const crypto = require('crypto');
const AdImpression = require('../models/AdImpression');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const { calculateLevelProgress } = require('./levelService');

// Core Platform Configuration
const BASE_REWARD_VES = 15;
const MIN_DURATION_SECONDS = 15;
const COOLDOWN_SECONDS = 60;
const DAILY_AD_LIMIT = 20;
const SESSION_TTL_MINUTES = 5;

/**
 * Returns the exact start timestamp (00:00:00.000) of the current UTC calendar day.
 * @returns {Date}
 */
function getStartOfTodayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
}

/**
 * Calculates user's authoritative level multiplier from their wallet XP.
 * 
 * @param {string|mongoose.Types.ObjectId} userId 
 * @param {object} [sessionOption]
 * @returns {Promise<{ multiplier: number, levelInfo: object, wallet: object }>}
 */
async function getUserLevelMultiplier(userId, sessionOption = {}) {
  let query = Wallet.findOne({ user: userId });
  if (sessionOption.session) {
    query = query.session(sessionOption.session);
  }
  const wallet = await query;
  if (!wallet) {
    const err = new Error(`Wallet record not found for user: ${userId}`);
    err.statusCode = 404;
    throw err;
  }

  const levelInfo = calculateLevelProgress(wallet.xpTotal || 0);
  // Level tiers define multiplier as string, e.g. '1.00x', '1.10x', '1.25x'
  const parsedMultiplier = parseFloat(levelInfo.rewardMultiplier) || 1.0;

  return {
    multiplier: parsedMultiplier,
    levelInfo,
    wallet
  };
}

/**
 * Retrieves the ad watching status, daily quota, and active cooldown for a user.
 * 
 * @param {string|mongoose.Types.ObjectId} userId 
 * @returns {Promise<object>}
 */
async function getAdStatus(userId) {
  if (!userId) {
    const err = new Error('User ID is required to retrieve ad status.');
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findById(userId);
  if (!user) {
    const err = new Error(`User not found for ID: ${userId}`);
    err.statusCode = 404;
    throw err;
  }

  const { multiplier, levelInfo } = await getUserLevelMultiplier(userId);
  const startOfToday = getStartOfTodayUTC();

  // 1. Calculate completed ads today (UTC calendar day)
  const dailyCompleted = await AdImpression.countDocuments({
    userId,
    status: { $in: ['COMPLETED', 'CLAIMED'] },
    $or: [
      { completedAt: { $gte: startOfToday } },
      { completedAt: null, updatedAt: { $gte: startOfToday } }
    ]
  });

  const remainingToday = Math.max(0, DAILY_AD_LIMIT - dailyCompleted);

  // 2. Check cooldown from the last completed ad
  const lastCompletedAd = await AdImpression.findOne({
    userId,
    status: { $in: ['COMPLETED', 'CLAIMED'] }
  }).sort({ completedAt: -1, createdAt: -1 });

  let cooldownRemaining = 0;
  if (lastCompletedAd) {
    const refTime = lastCompletedAd.completedAt || lastCompletedAd.updatedAt || lastCompletedAd.createdAt;
    const elapsedSeconds = Math.floor((Date.now() - new Date(refTime).getTime()) / 1000);
    if (elapsedSeconds < COOLDOWN_SECONDS) {
      cooldownRemaining = COOLDOWN_SECONDS - elapsedSeconds;
    }
  }

  const potentialReward = Math.round(BASE_REWARD_VES * multiplier * 100) / 100;
  const isSuspended = user.accountStatus === 'Suspended';
  const canWatch = !isSuspended && remainingToday > 0 && cooldownRemaining === 0;

  return {
    success: true,
    dailyLimit: DAILY_AD_LIMIT,
    dailyCompleted,
    remainingToday,
    cooldownRemaining,
    cooldownSeconds: COOLDOWN_SECONDS,
    durationSeconds: MIN_DURATION_SECONDS,
    canWatch,
    accountStatus: user.accountStatus,
    baseReward: BASE_REWARD_VES,
    levelMultiplier: multiplier,
    potentialReward,
    currentLevel: levelInfo.currentLevel,
    levelName: levelInfo.levelName
  };
}

/**
 * Initializes a new secure ad watching impression session.
 * Generates a single-use cryptographic token, calculates server-authoritative
 * rewards, and enforces cooldown and daily caps.
 * 
 * @param {string|mongoose.Types.ObjectId} userId 
 * @returns {Promise<object>}
 */
async function startAdSession(userId) {
  if (!userId) {
    const err = new Error('User authentication is required to start an ad session.');
    err.statusCode = 401;
    throw err;
  }

  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User account not found.');
    err.statusCode = 404;
    throw err;
  }

  // Account Eligibility check
  if (user.accountStatus === 'Suspended') {
    const err = new Error('Account is suspended. Ad watching rewards are not permitted.');
    err.statusCode = 403;
    throw err;
  }

  // Daily Limit check
  const startOfToday = getStartOfTodayUTC();
  const dailyCompleted = await AdImpression.countDocuments({
    userId,
    status: { $in: ['COMPLETED', 'CLAIMED'] },
    $or: [
      { completedAt: { $gte: startOfToday } },
      { completedAt: null, updatedAt: { $gte: startOfToday } }
    ]
  });

  if (dailyCompleted >= DAILY_AD_LIMIT) {
    const err = new Error(`Daily limit reached: Maximum ${DAILY_AD_LIMIT} rewarded ads permitted per UTC day. Please return tomorrow.`);
    err.statusCode = 400;
    err.dailyLimit = DAILY_AD_LIMIT;
    throw err;
  }

  // Cooldown check
  const lastCompletedAd = await AdImpression.findOne({
    userId,
    status: { $in: ['COMPLETED', 'CLAIMED'] }
  }).sort({ completedAt: -1, createdAt: -1 });

  if (lastCompletedAd) {
    const refTime = lastCompletedAd.completedAt || lastCompletedAd.updatedAt || lastCompletedAd.createdAt;
    const elapsedSeconds = Math.floor((Date.now() - new Date(refTime).getTime()) / 1000);
    if (elapsedSeconds < COOLDOWN_SECONDS) {
      const remaining = COOLDOWN_SECONDS - elapsedSeconds;
      const err = new Error(`Ad cooldown active. Please wait ${remaining} seconds before starting another ad.`);
      err.statusCode = 400;
      err.cooldownRemaining = remaining;
      throw err;
    }
  }

  // Fetch server-authoritative multiplier and potential reward
  const { multiplier, levelInfo } = await getUserLevelMultiplier(userId);
  const earnedReward = Math.round(BASE_REWARD_VES * multiplier * 100) / 100;

  // Generate single-use cryptographic token and 5-minute expiration
  const impressionToken = `ad_${crypto.randomBytes(24).toString('hex')}`;
  const expiresAt = new Date(Date.now() + SESSION_TTL_MINUTES * 60 * 1000);

  const adImpression = await AdImpression.create({
    userId,
    impressionToken,
    status: 'STARTED',
    baseReward: BASE_REWARD_VES,
    levelMultiplier: multiplier,
    earnedReward,
    durationSeconds: MIN_DURATION_SECONDS,
    expiresAt
  });

  return {
    success: true,
    message: 'Ad session started successfully. Please watch for the required duration to claim your reward.',
    impressionToken: adImpression.impressionToken,
    durationSeconds: MIN_DURATION_SECONDS,
    baseReward: BASE_REWARD_VES,
    levelMultiplier: multiplier,
    earnedReward,
    currentLevel: levelInfo.currentLevel,
    levelName: levelInfo.levelName,
    expiresAt: adImpression.expiresAt
  };
}

/**
 * Validates ad watch completion and credits the earned VEs to user's wallet.
 * Enforces server-side elapsed time (>= 15s) and executes an atomic ACID transaction.
 * 
 * @param {string|mongoose.Types.ObjectId} userId 
 * @param {object} payload - { impressionToken }
 * @returns {Promise<object>}
 */
async function claimAdReward(userId, payload = {}) {
  if (!userId) {
    const err = new Error('User authentication is required to claim an ad reward.');
    err.statusCode = 401;
    throw err;
  }

  const { impressionToken } = payload || {};
  if (!impressionToken || typeof impressionToken !== 'string' || !impressionToken.trim()) {
    const err = new Error('Impression token is required to claim ad reward.');
    err.statusCode = 400;
    throw err;
  }

  const cleanToken = impressionToken.trim();

  // Query ad impression record
  const ad = await AdImpression.findOne({
    impressionToken: cleanToken,
    userId
  });

  if (!ad) {
    const err = new Error('Ad session not found or does not belong to the authenticated user.');
    err.statusCode = 404;
    throw err;
  }

  // Status and Replay Prevention
  if (ad.status === 'CLAIMED' || ad.status === 'COMPLETED') {
    const err = new Error('Ad reward has already been claimed for this session (replay rejected).');
    err.statusCode = 400;
    throw err;
  }

  if (ad.status !== 'STARTED') {
    const err = new Error(`Ad session is no longer active (current status: ${ad.status}).`);
    err.statusCode = 400;
    throw err;
  }

  // Expiration check
  if (ad.expiresAt && Date.now() > new Date(ad.expiresAt).getTime()) {
    try {
      if (typeof ad.save === 'function') {
        ad.status = 'EXPIRED';
        await ad.save();
      } else if (typeof AdImpression.updateOne === 'function') {
        await AdImpression.updateOne({ _id: ad._id }, { $set: { status: 'EXPIRED' } });
      }
    } catch {
      // Non-fatal background status update error
    }
    const err = new Error('Ad session has expired. Please initiate a new ad session.');
    err.statusCode = 400;
    throw err;
  }

  // Server-side Elapsed Watch Time Validation
  const elapsedSeconds = (Date.now() - new Date(ad.createdAt).getTime()) / 1000;
  if (elapsedSeconds < ad.durationSeconds) {
    const remainingSeconds = Math.ceil(ad.durationSeconds - elapsedSeconds);
    const err = new Error(
      `Minimum watch duration of ${ad.durationSeconds}s not met (only ${Math.floor(elapsedSeconds)}s elapsed). Please watch the ad for ${remainingSeconds} more seconds.`
    );
    err.statusCode = 400;
    err.remainingSeconds = remainingSeconds;
    throw err;
  }

  // Check user account status
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User account not found.');
    err.statusCode = 404;
    throw err;
  }

  if (user.accountStatus === 'Suspended') {
    const err = new Error('Account is suspended. Payout rewards are disabled.');
    err.statusCode = 403;
    throw err;
  }

  // Multi-Document ACID Transaction
  let session = null;
  let useTransaction = false;

  try {
    if (
      typeof mongoose.startSession === 'function' &&
      mongoose.connection &&
      (mongoose.connection.readyState === 1 || mongoose.connection._hasMockSession)
    ) {
      session = await mongoose.startSession();
      if (session && typeof session.withTransaction === 'function') {
        useTransaction = true;
      }
    }
  } catch {
    session = null;
    useTransaction = false;
  }

  try {
    const executeClaim = async (activeSession) => {
      // 1. Atomically transition AdImpression status from 'STARTED' to 'CLAIMED'
      const updatedAd = await AdImpression.findOneAndUpdate(
        { _id: ad._id, status: 'STARTED' },
        {
          $set: {
            status: 'CLAIMED',
            completedAt: new Date()
          }
        },
        {
          session: activeSession || undefined,
          new: true,
          returnDocument: 'after',
          runValidators: true
        }
      );

      if (!updatedAd) {
        const conflictErr = new Error('Ad reward has already been claimed or is being processed concurrently.');
        conflictErr.statusCode = 400;
        throw conflictErr;
      }

      // 2. Atomically credit user's Wallet.vesBalance
      const updatedWallet = await Wallet.findOneAndUpdate(
        { user: userId },
        { $inc: { vesBalance: ad.earnedReward } },
        {
          session: activeSession || undefined,
          new: true,
          returnDocument: 'after',
          runValidators: true
        }
      );

      if (!updatedWallet) {
        const notFoundErr = new Error(`Wallet record not found for user: ${userId}`);
        notFoundErr.statusCode = 500;
        throw notFoundErr;
      }

      return {
        ad: updatedAd,
        newBalance: updatedWallet.vesBalance
      };
    };

    let result;
    if (useTransaction && session) {
      result = await session.withTransaction(async () => {
        return await executeClaim(session);
      });
    } else {
      result = await executeClaim(null);
    }

    return {
      success: true,
      message: `Reward claimed successfully! +${ad.earnedReward} VEs added to your wallet.`,
      earnedReward: ad.earnedReward,
      baseReward: ad.baseReward,
      levelMultiplier: ad.levelMultiplier,
      newBalance: result.newBalance,
      impressionToken: ad.impressionToken,
      status: 'CLAIMED'
    };
  } finally {
    if (session && typeof session.endSession === 'function') {
      await session.endSession();
    }
  }
}

module.exports = {
  BASE_REWARD_VES,
  MIN_DURATION_SECONDS,
  COOLDOWN_SECONDS,
  DAILY_AD_LIMIT,
  getAdStatus,
  startAdSession,
  claimAdReward
};
