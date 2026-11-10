const { LEVEL_TIERS } = require('../config/levelTiers');
const User = require('../models/User');
const Wallet = require('../models/Wallet');

/**
 * Calculates complete server-authoritative level and progression status from cumulative XP.
 * 
 * @param {number} rawXP - Cumulative experience points from authoritative Wallet record.
 * @returns {object} Calculated level progress object conforming to the frontend contract.
 */
function calculateLevelProgress(rawXP) {
  const xp = typeof rawXP === 'number' && !isNaN(rawXP) && rawXP >= 0
    ? Math.floor(rawXP)
    : 0;

  // Find corresponding tier based on minXP / maxXP ranges
  let tier = LEVEL_TIERS.find((t) => xp >= t.minXP && xp <= t.maxXP);
  if (!tier) {
    // If xp exceeds all defined boundaries, default to max tier (Level 5)
    tier = LEVEL_TIERS[LEVEL_TIERS.length - 1];
  }

  const isMaxTier = tier.level === 5 || tier.nextLevelThreshold === null;

  let remainingXP = 0;
  let progressPercentage = 100;
  let nextLevelXPRequirement = tier.minXP;

  if (!isMaxTier && tier.nextLevelThreshold !== null) {
    nextLevelXPRequirement = tier.nextLevelThreshold;
    remainingXP = Math.max(0, tier.nextLevelThreshold - xp);

    const span = tier.nextLevelThreshold - tier.minXP;
    const gainedInTier = xp - tier.minXP;
    // Calculate percentage within current tier; clamp between 0 and 99 before graduation
    const calculated = span > 0 ? Math.floor((gainedInTier / span) * 100) : 0;
    progressPercentage = Math.min(99, Math.max(0, calculated));
  }

  return {
    currentLevel: tier.level,
    levelName: tier.name,
    totalXP: xp,
    currentLevelXPRequirement: tier.minXP,
    nextLevelXPRequirement,
    remainingXP,
    progressPercentage,
    rewardMultiplier: tier.multiplier,
    perks: tier.perks
  };
}

/**
 * Internal backend service capability to atomically award XP to a user and synchronize level.
 * Supports participating in parent database transactions via options.session.
 * Never exposed as an unrestricted public user endpoint.
 * 
 * @param {string|mongoose.Types.ObjectId} userId - User ID to award XP.
 * @param {number} amount - Positive integer XP points to add.
 * @param {string} [reason] - Audit reason or trigger description.
 * @param {object} [options] - Optional execution options (e.g. { session }).
 * @returns {Promise<object>} Result containing updated XP, level status, and level-up flag.
 */
async function awardUserXP(userId, amount, reason = 'Platform XP award', options = {}) {
  if (!userId) {
    throw new Error('User ID is required to award XP.');
  }

  if (typeof amount !== 'number' || !Number.isInteger(amount) || amount <= 0) {
    throw new Error('XP award amount must be a positive integer.');
  }

  const session = options && options.session ? options.session : undefined;

  // Atomically increment Wallet.xpTotal (participates in session transaction if provided)
  const updatedWallet = await Wallet.findOneAndUpdate(
    { user: userId },
    { $inc: { xpTotal: amount } },
    { returnDocument: 'after', runValidators: true, session }
  );

  if (!updatedWallet) {
    throw new Error(`Wallet not found for user ${userId}.`);
  }

  const userQuery = User.findById(userId);
  if (session && typeof userQuery.session === 'function') {
    userQuery.session(session);
  }
  const user = await userQuery;

  if (!user) {
    throw new Error(`User not found for ID ${userId}.`);
  }

  const previousLevel = user.level || 1;
  const progress = calculateLevelProgress(updatedWallet.xpTotal);
  const currentLevel = progress.currentLevel;
  const didLevelUp = currentLevel > previousLevel;

  // If user graduated to a higher level, atomically synchronize User.level
  if (currentLevel !== user.level) {
    await User.findByIdAndUpdate(userId, { level: currentLevel }, { session });
  }

  return {
    success: true,
    userId,
    amountAwarded: amount,
    newTotalXP: updatedWallet.xpTotal,
    previousLevel,
    currentLevel,
    didLevelUp,
    reason,
    progress
  };
}

module.exports = {
  calculateLevelProgress,
  awardUserXP
};

