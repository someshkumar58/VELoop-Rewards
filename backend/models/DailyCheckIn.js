const mongoose = require('mongoose');

/**
 * ============================================================================
 * VELOOP REWARDS — DAILY CHECK-IN SCHEMA & MODEL (STEP 10)
 * ============================================================================
 * 
 * Persists daily check-in records and maintains user streak history.
 * 
 * Key Architectural Decisions:
 * 1. DATABASE-ENFORCED IDEMPOTENCY:
 *    A compound unique index on `{ user: 1, checkInDate: 1 }` guarantees at
 *    the storage engine level that a user can never check in twice on the
 *    same UTC calendar day.
 * 
 * 2. SERVER-AUTHORITATIVE CALENDAR:
 *    The `checkInDate` is strictly calculated on the backend as a UTC date
 *    string ('YYYY-MM-DD'). Client-supplied dates or times are never trusted.
 * 
 * 3. TRANSACTION INTEGRITY:
 *    Check-in persistence, wallet balance increment (+25 VEs), XP crediting
 *    (+25 XP), and potential milestone achievements ('STREAK_7') execute
 *    within an atomic MongoDB multi-document transaction.
 * ============================================================================
 */

const dailyCheckInSchema = new mongoose.Schema(
  {
    // User reference linking this check-in to its owning user
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required for daily check-in'],
      index: true
    },

    // Authoritative UTC calendar date string (YYYY-MM-DD)
    checkInDate: {
      type: String,
      required: [true, 'Check-in date is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Check-in date must be formatted as YYYY-MM-DD'],
      trim: true
    },

    // Current continuous streak count (1 for first check-in or reset)
    streakCount: {
      type: Number,
      required: [true, 'Streak count is required'],
      min: [1, 'Streak count must be at least 1']
    },

    // Fixed virtual currency reward credited to Wallet.vesBalance
    rewardVEs: {
      type: Number,
      required: [true, 'Reward VEs amount is required'],
      min: [0, 'Reward VEs cannot be negative'],
      default: 25
    },

    // Fixed experience points credited to Wallet.xpTotal
    rewardXP: {
      type: Number,
      required: [true, 'Reward XP amount is required'],
      min: [0, 'Reward XP cannot be negative'],
      default: 25
    }
  },
  {
    timestamps: true
  }
);

// Enforce strictly one check-in per user per UTC calendar day
dailyCheckInSchema.index({ user: 1, checkInDate: 1 }, { unique: true });

// Optimize query performance for retrieving a user's latest check-in records
dailyCheckInSchema.index({ user: 1, createdAt: -1 });
dailyCheckInSchema.index({ user: 1, checkInDate: -1 });

const DailyCheckIn = mongoose.models.DailyCheckIn || mongoose.model('DailyCheckIn', dailyCheckInSchema);

module.exports = DailyCheckIn;

