const mongoose = require('mongoose');
const DailyCheckIn = require('../models/DailyCheckIn');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const UserAchievement = require('../models/UserAchievement');
const { awardUserXP } = require('./levelService');
const { unlockUserAchievement } = require('./achievementService');

// Canonical daily check-in rewards approved in Step 10 audit
const DAILY_REWARD_VES = 25;
const DAILY_REWARD_XP = 25;
const STREAK_MILESTONE = 7;

/**
 * Returns current UTC calendar date formatted as YYYY-MM-DD.
 * @returns {string}
 */
const getTodayUTCDateString = () => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Calculates the immediately preceding UTC calendar date for a given YYYY-MM-DD string.
 * Accurately handles leap years, month transitions, and year boundaries.
 * 
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @returns {string} - 'YYYY-MM-DD'
 */
const getPreviousUTCDateString = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().split('T')[0];
};

/**
 * Retrieves the check-in and streak status for the authenticated user.
 * 
 * @param {string|mongoose.Types.ObjectId} userId
 * @param {object} [options]
 * @returns {Promise<object>}
 */
async function getCheckInStatus(userId, options = {}) {
  if (!userId) {
    throw new Error('User ID is required to retrieve check-in status.');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error(`User not found for ID: ${userId}`);
  }

  const wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    throw new Error(`Wallet not found for user: ${userId}`);
  }

  const todayUTC = options.todayUTC || getTodayUTCDateString();
  const yesterdayUTC = getPreviousUTCDateString(todayUTC);

  // Retrieve the user's latest check-in record
  const lastRecord = await DailyCheckIn.findOne({ user: userId }).sort({ checkInDate: -1 });

  const lastCheckInDate = lastRecord ? lastRecord.checkInDate : null;
  const hasCheckedInToday = lastCheckInDate === todayUTC;
  const canCheckInToday = !hasCheckedInToday;

  // Streak status evaluation:
  // - If checked in today: active streak is the recorded streakCount.
  // - If checked in yesterday: streak is maintained and will increment upon today's check-in.
  // - If missed yesterday (or never checked in): active streak has lapsed to 0.
  let currentStreak = 0;
  if (hasCheckedInToday) {
    currentStreak = lastRecord.streakCount;
  } else if (lastCheckInDate === yesterdayUTC) {
    currentStreak = lastRecord.streakCount;
  } else {
    currentStreak = 0;
  }

  // Check if STREAK_7 achievement has already been unlocked by user
  const streak7Record = await UserAchievement.findOne({
    user: userId,
    achievementCode: 'STREAK_7',
    xpAwardStatus: 'COMPLETED'
  });

  return {
    success: true,
    currentStreak,
    lastCheckInDate,
    canCheckInToday,
    hasCheckedInToday,
    todayDate: todayUTC,
    todayReward: {
      ves: DAILY_REWARD_VES,
      xp: DAILY_REWARD_XP
    },
    streakGoal: STREAK_MILESTONE,
    streakAchievementUnlocked: Boolean(streak7Record)
  };
}

/**
 * Performs daily check-in for the authenticated user within an atomic MongoDB transaction.
 * 
 * Flow:
 * 1. Derives authoritative today date in UTC.
 * 2. Checks whether user already checked in today.
 * 3. Calculates new streak based on previous day's check-in.
 * 4. Persists DailyCheckIn record.
 * 5. Atomically increments Wallet.vesBalance (+25 VEs).
 * 6. Awards +25 XP via awardUserXP.
 * 7. If streak reaches Day 7, triggers STREAK_7 achievement unlock.
 * 8. Commits all operations atomically.
 * 
 * @param {string|mongoose.Types.ObjectId} userId
 * @param {object} [options]
 * @returns {Promise<object>}
 */
async function performDailyCheckIn(userId, options = {}) {
  if (!userId) {
    throw new Error('User ID is required to perform check-in.');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error(`User not found for ID: ${userId}`);
  }

  const wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    throw new Error(`Wallet not found for user: ${userId}`);
  }

  const todayUTC = options.todayUTC || getTodayUTCDateString();
  const yesterdayUTC = getPreviousUTCDateString(todayUTC);

  // Fast-path duplicate check: query the latest record for today
  const lastRecord = await DailyCheckIn.findOne({ user: userId }).sort({ checkInDate: -1 });

  if (lastRecord && lastRecord.checkInDate === todayUTC) {
    return {
      success: false,
      alreadyCheckedIn: true,
      message: 'You have already checked in today. Please return tomorrow.',
      lastCheckInDate: todayUTC,
      currentStreak: lastRecord.streakCount
    };
  }

  // Streak calculation
  let newStreak = 1;
  if (lastRecord && lastRecord.checkInDate === yesterdayUTC) {
    newStreak = lastRecord.streakCount + 1;
  }

  // Multi-Document Transaction with Retry Reliability:
  // Uses MongoDB driver's session.withTransaction() to guarantee automated retry
  // on TransientTransactionError and commit retry on UnknownTransactionCommitResult.
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
    const executeCheckInWorkflow = async (activeSession) => {
      const sessionOption = activeSession ? { session: activeSession } : {};

      // 1. Create DailyCheckIn document inside the transaction
      let checkInDoc;
      if (activeSession) {
        const created = await DailyCheckIn.create(
          [
            {
              user: userId,
              checkInDate: todayUTC,
              streakCount: newStreak,
              rewardVEs: DAILY_REWARD_VES,
              rewardXP: DAILY_REWARD_XP
            }
          ],
          { session: activeSession }
        );
        checkInDoc = created[0];
      } else {
        checkInDoc = await DailyCheckIn.create({
          user: userId,
          checkInDate: todayUTC,
          streakCount: newStreak,
          rewardVEs: DAILY_REWARD_VES,
          rewardXP: DAILY_REWARD_XP
        });
      }

      // 2. Atomically increment Wallet.vesBalance by 25 VEs
      const updatedWallet = await Wallet.findOneAndUpdate(
        { user: userId },
        { $inc: { vesBalance: DAILY_REWARD_VES } },
        { returnDocument: 'after', runValidators: true, session: activeSession || undefined }
      );

      if (!updatedWallet) {
        throw new Error(`Wallet record not found for user: ${userId}`);
      }

      // 3. Award 25 XP using existing awardUserXP service (participates in same session)
      const xpResult = await awardUserXP(
        userId,
        DAILY_REWARD_XP,
        `Daily check-in (Day ${newStreak})`,
        sessionOption
      );

      // 4. Milestone check: if streak reaches 7 days or more, unlock STREAK_7 achievement (participates in same session)
      let achievementResult = null;
      if (newStreak >= STREAK_MILESTONE) {
        achievementResult = await unlockUserAchievement(
          userId,
          'STREAK_7',
          activeSession ? { session: activeSession, trigger: 'DAILY_CHECKIN' } : { trigger: 'DAILY_CHECKIN' }
        );
      }

      const finalXP = (achievementResult && achievementResult.unlocked && !achievementResult.alreadyUnlocked && achievementResult.xpResult)
        ? achievementResult.xpResult.newTotalXP
        : xpResult.newTotalXP;

      const finalLevelProgress = (achievementResult && achievementResult.unlocked && !achievementResult.alreadyUnlocked && achievementResult.xpResult)
        ? achievementResult.xpResult.progress
        : xpResult.progress;

      const finalAchievement = (achievementResult && achievementResult.unlocked && !achievementResult.alreadyUnlocked)
        ? {
            id: 'ach_02',
            code: 'STREAK_7',
            achievementCode: 'STREAK_7',
            title: 'Streak Master',
            description: 'Maintained a 7-day continuous daily bonus streak.',
            xpReward: 350,
            unlockedAt: achievementResult.achievement ? achievementResult.achievement.unlockedAt : new Date()
          }
        : null;

      return {
        success: true,
        message: `Daily check-in successful! +${DAILY_REWARD_VES} VEs and +${DAILY_REWARD_XP} XP awarded. Current streak: ${newStreak} day${newStreak > 1 ? 's' : ''}.`,
        checkIn: {
          checkInDate: todayUTC,
          streakCount: newStreak,
          rewardVEs: DAILY_REWARD_VES,
          rewardXP: DAILY_REWARD_XP
        },
        wallet: {
          ves: updatedWallet.vesBalance,
          sves: updatedWallet.svesBalance,
          gems: updatedWallet.gemsBalance,
          tokens: updatedWallet.tokensBalance,
          xp: finalXP
        },
        levelProgress: finalLevelProgress,
        streakAchievementUnlocked: Boolean(achievementResult && achievementResult.unlocked && !achievementResult.alreadyUnlocked),
        achievement: finalAchievement
      };
    };

    let result;
    if (useTransaction && session) {
      result = await session.withTransaction(async () => {
        return await executeCheckInWorkflow(session);
      });
    } else {
      result = await executeCheckInWorkflow(null);
    }

    return result;
  } catch (err) {
    if (session && typeof session.inTransaction === 'function' && session.inTransaction()) {
      try {
        await session.abortTransaction();
      } catch {
        // Ignore secondary abort failure
      }
    }

    // Handled race condition: if another concurrent request committed first on the same day,
    // the compound unique index on { user: 1, checkInDate: 1 } throws E11000.
    if (err.code === 11000 || (err.message && err.message.includes('11000'))) {
      const existing = await DailyCheckIn.findOne({ user: userId, checkInDate: todayUTC });
      return {
        success: false,
        alreadyCheckedIn: true,
        message: 'You have already checked in today.',
        lastCheckInDate: todayUTC,
        currentStreak: existing ? existing.streakCount : 1
      };
    }

    throw err;
  } finally {
    if (session && typeof session.endSession === 'function') {
      await session.endSession();
    }
  }
}

module.exports = {
  DAILY_REWARD_VES,
  DAILY_REWARD_XP,
  STREAK_MILESTONE,
  getTodayUTCDateString,
  getPreviousUTCDateString,
  getCheckInStatus,
  performDailyCheckIn
};
