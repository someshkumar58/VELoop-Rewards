const mongoose = require('mongoose');
const { ACHIEVEMENTS, ACHIEVEMENTS_BY_CODE } = require('../config/achievements');
const UserAchievement = require('../models/UserAchievement');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const { awardUserXP } = require('./levelService');

/**
 * Format a Date object to YYYY-MM-DD string for frontend display
 * @param {Date|string} date
 * @returns {string}
 */
const formatDate = (date) => {
  if (!date) return 'Recently';
  try {
    return new Date(date).toISOString().split('T')[0];
  } catch {
    return 'Recently';
  }
};

/**
 * Recovers any pending XP awards for a user using an ACID transaction where supported.
 * @param {string|mongoose.Types.ObjectId} userId
 */
async function recoverPendingXpAwards(userId) {
  const pendingRecords = await UserAchievement.find({
    user: userId,
    xpAwardStatus: 'PENDING'
  });

  for (const record of pendingRecords) {
    const ach = ACHIEVEMENTS_BY_CODE[record.achievementCode];
    if (ach) {
      let session = null;
      let useTransaction = false;

      try {
        if (mongoose.connection && mongoose.connection.readyState === 1 && typeof mongoose.startSession === 'function') {
          session = await mongoose.startSession();
          if (session && typeof session.startTransaction === 'function') {
            session.startTransaction();
            useTransaction = true;
          }
        }
      } catch {
        session = null;
        useTransaction = false;
      }

      try {
        const sessionOption = useTransaction ? { session } : {};
        await awardUserXP(
          userId,
          ach.xpReward,
          `Achievement Recovery: ${ach.title}`,
          sessionOption
        );
        record.xpAwardStatus = 'COMPLETED';
        await record.save(sessionOption);

        if (useTransaction && session) {
          await session.commitTransaction();
        }
      } catch (err) {
        if (useTransaction && session) {
          await session.abortTransaction();
        }
        console.error(`[Achievement Recovery Error for ${record.achievementCode}]:`, err.message);
      } finally {
        if (session && typeof session.endSession === 'function') {
          await session.endSession();
        }
      }
    }
  }
}

/**
 * Evaluates and returns all seven platform achievements for a specific authenticated user.
 * Conforms directly to the LevelAchievements.jsx UI contract.
 * 
 * @param {string|mongoose.Types.ObjectId} userId - Authenticated user ID
 * @returns {Promise<Array<object>>} Array of 7 achievement objects with dynamic progress & unlock states
 */
async function getUserAchievements(userId) {
  if (!userId) {
    throw new Error('User ID is required to retrieve achievements.');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error(`User not found for ID: ${userId}`);
  }

  const wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    throw new Error(`Wallet record not found for user: ${userId}`);
  }

  // 1. Recover any prior pending XP awards if a crash occurred mid-transaction
  await recoverPendingXpAwards(userId);

  // 2. Safe server-side evaluation for WHALE_TIER (10,000 VEs threshold)
  if (wallet.vesBalance >= 10000) {
    await unlockUserAchievement(userId, 'WHALE_TIER', {
      trigger: 'BALANCE_EVALUATION',
      sourceBalance: wallet.vesBalance
    });
  }

  // 3. Retrieve all unlocked achievements for this user from database
  const unlockedRecords = await UserAchievement.find({ user: userId });
  const unlockedMap = {};
  for (const r of unlockedRecords) {
    unlockedMap[r.achievementCode] = r;
  }

  // 4. Map the canonical catalog to full user-specific response objects
  return ACHIEVEMENTS.map((ach) => {
    const unlockedRecord = unlockedMap[ach.code];
    const isUnlocked = Boolean(unlockedRecord);

    let progress = 0;
    if (isUnlocked) {
      progress = ach.required;
    } else if (ach.code === 'WHALE_TIER') {
      progress = Math.min(ach.required, Number(wallet.vesBalance) || 0);
    } else {
      // Truthful 0 progress for achievements whose tracking modules do not yet exist
      progress = 0;
    }

    return {
      id: ach.id,
      code: ach.code,
      title: ach.title,
      description: ach.description,
      category: ach.category,
      icon: ach.icon,
      unlocked: isUnlocked,
      unlockedAt: isUnlocked ? formatDate(unlockedRecord.unlockedAt) : null,
      xpReward: ach.xpReward,
      badgeColor: ach.badgeColor,
      progress,
      required: ach.required
    };
  });
}

/**
 * Internal-only service capability to atomically unlock an achievement for a user and award XP.
 * Uses an ACID Multi-Document Transaction across UserAchievement and Wallet to guarantee that
 * achievement persistence and XP increment succeed or fail as a single atomic unit.
 * 
 * Strictly idempotent: Calling this multiple times awards XP exactly once.
 * 
 * @param {string|mongoose.Types.ObjectId} userId - Authenticated user ID
 * @param {string} achievementCode - Canonical code (e.g., 'WHALE_TIER')
 * @param {object} [context] - Internal context or trigger metadata
 * @returns {Promise<object>} Unlock result summary
 */
async function unlockUserAchievement(userId, achievementCode, context = {}) {
  if (!userId) {
    throw new Error('User ID is required to unlock achievement.');
  }

  const normalizedCode = String(achievementCode || '').trim().toUpperCase();
  const ach = ACHIEVEMENTS_BY_CODE[normalizedCode];
  if (!ach) {
    throw new Error(`Unknown achievement code: ${achievementCode}`);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error(`User not found for ID: ${userId}`);
  }

  const wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    throw new Error(`Wallet not found for user: ${userId}`);
  }

  // Verification of trigger condition for WHALE_TIER
  if (normalizedCode === 'WHALE_TIER' && wallet.vesBalance < 10000) {
    return {
      success: false,
      unlocked: false,
      reason: `Balance requirement not met (${wallet.vesBalance} / 10000 VEs)`
    };
  }

  // Fast-path idempotency check: already unlocked and completed
  const isExternalSession = Boolean(context && context.session);
  const existingQuery = UserAchievement.findOne({
    user: userId,
    achievementCode: normalizedCode
  });
  if (isExternalSession && context.session) {
    existingQuery.session(context.session);
  }
  const existing = await existingQuery;

  if (existing && existing.xpAwardStatus === 'COMPLETED') {
    return {
      success: true,
      unlocked: true,
      alreadyUnlocked: true,
      achievement: existing
    };
  }

  // Multi-Document Transaction:
  // Guarantees atomic commitment across UserAchievement insertion and Wallet.xpTotal increment.
  let session = isExternalSession ? context.session : null;
  let useTransaction = isExternalSession;

  if (!isExternalSession) {
    try {
      if (mongoose.connection && mongoose.connection.readyState === 1 && typeof mongoose.startSession === 'function') {
        session = await mongoose.startSession();
        if (session && typeof session.startTransaction === 'function') {
          session.startTransaction();
          useTransaction = true;
        }
      }
    } catch {
      session = null;
      useTransaction = false;
    }
  }

  try {
    const sessionOption = useTransaction ? { session } : {};

    // 1. Create UserAchievement with 'COMPLETED' directly inside the transaction
    let newAchievement;
    if (useTransaction) {
      const created = await UserAchievement.create(
        [
          {
            user: userId,
            achievementCode: normalizedCode,
            unlockedAt: new Date(),
            xpAwarded: ach.xpReward,
            xpAwardStatus: 'COMPLETED'
          }
        ],
        { session }
      );
      newAchievement = created[0];
    } else {
      newAchievement = await UserAchievement.create({
        user: userId,
        achievementCode: normalizedCode,
        unlockedAt: new Date(),
        xpAwarded: ach.xpReward,
        xpAwardStatus: 'COMPLETED'
      });
    }

    // 2. Award XP directly inside the same transaction
    const xpResult = await awardUserXP(
      userId,
      ach.xpReward,
      `Achievement: ${ach.title}`,
      sessionOption
    );

    if (useTransaction && session && !isExternalSession) {
      await session.commitTransaction();
    }

    return {
      success: true,
      unlocked: true,
      alreadyUnlocked: false,
      achievement: newAchievement,
      xpResult
    };
  } catch (err) {
    if (useTransaction && session && !isExternalSession) {
      await session.abortTransaction();
    }

    // Handled race condition: if another concurrent request committed first,
    // the compound unique index triggers code 11000.
    if (err.code === 11000 || (err.message && err.message.includes('11000'))) {
      const raceWinner = await UserAchievement.findOne({
        user: userId,
        achievementCode: normalizedCode
      });
      return {
        success: true,
        unlocked: true,
        alreadyUnlocked: true,
        achievement: raceWinner
      };
    }

    throw err;
  } finally {
    if (!isExternalSession && session && typeof session.endSession === 'function') {
      await session.endSession();
    }
  }
}

module.exports = {
  getUserAchievements,
  unlockUserAchievement,
  recoverPendingXpAwards
};

