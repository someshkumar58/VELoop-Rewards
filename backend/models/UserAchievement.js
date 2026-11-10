const mongoose = require('mongoose');

/**
 * ============================================================================
 * VELOOP REWARDS — USER ACHIEVEMENT SCHEMA & MODEL (STEP 9)
 * ============================================================================
 * 
 * Persists unlocked achievements per user.
 * 
 * Key Architectural Decisions:
 * 1. SEPARATION & NORMALIZATION:
 *    User identity and financial balances remain isolated from achievement
 *    unlock history.
 * 
 * 2. DATABASE-ENFORCED IDEMPOTENCY:
 *    A compound unique index on `{ user: 1, achievementCode: 1 }` guarantees
 *    that duplicate unlocks cannot be persisted even under concurrent requests.
 * 
 * 3. TWO-PHASE CRASH SAFETY (xpAwardStatus):
 *    - 'PENDING': Record persisted, XP award in progress.
 *    - 'COMPLETED': XP award verified and committed via awardUserXP.
 *    Enables automated recovery in case of system termination between unlock
 *    persistence and XP crediting.
 * ============================================================================
 */

const userAchievementSchema = new mongoose.Schema(
  {
    // Reference to the user who earned this achievement
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },

    // Canonical achievement code (e.g., 'WHALE_TIER', 'FIRST_STEP')
    achievementCode: {
      type: String,
      required: [true, 'Achievement code is required'],
      uppercase: true,
      trim: true
    },

    // Point in time when the unlock condition was achieved
    unlockedAt: {
      type: Date,
      default: Date.now,
      required: true
    },

    // Snapshot of the XP bonus awarded upon unlock
    xpAwarded: {
      type: Number,
      required: [true, 'XP awarded amount is required'],
      min: [0, 'XP awarded cannot be negative']
    },

    // Crash recovery and idempotency tracking state
    xpAwardStatus: {
      type: String,
      enum: {
        values: ['PENDING', 'COMPLETED'],
        message: '{VALUE} is not a valid xpAwardStatus'
      },
      default: 'PENDING',
      required: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound unique index ensuring each achievement is unlocked at most once per user
userAchievementSchema.index({ user: 1, achievementCode: 1 }, { unique: true });

const UserAchievement =
  mongoose.models.UserAchievement ||
  mongoose.model('UserAchievement', userAchievementSchema);

module.exports = UserAchievement;

