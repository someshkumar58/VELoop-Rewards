const mongoose = require('mongoose');

/**
 * ============================================================================
 * VELOOP REWARDS — AD IMPRESSION SCHEMA & MODEL (PHASE 2B.1)
 * ============================================================================
 * 
 * Tracks sponsored video ad impression sessions, elapsed watch time,
 * server-side reward authorization, and anti-replay single-use tokens.
 * 
 * Key Architectural Safeguards:
 * 1. SINGLE-USE CRYPTOGRAPHIC NONCE:
 *    Every ad watch session requires a unique `impressionToken`. Once claimed,
 *    its terminal status prevents replay attacks and double-crediting.
 * 
 * 2. ZERO-TRUST SERVER-SIDE CALCULATION:
 *    `baseReward`, `levelMultiplier`, and `earnedReward` are strictly
 *    calculated by the backend from authoritative `Wallet.xpTotal`.
 *    Client-supplied amounts or multipliers are rejected.
 * 
 * 3. ACID MULTI-DOCUMENT TRANSACTIONS:
 *    Impression state transition ('STARTED' -> 'CLAIMED') and `Wallet.vesBalance`
 *    increments execute inside an atomic MongoDB transaction.
 * ============================================================================
 */

const adImpressionSchema = new mongoose.Schema(
  {
    // User reference linking this impression to the authenticated viewer
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
      alias: 'user'
    },

    // Cryptographic single-use nonce protecting against replay attacks
    impressionToken: {
      type: String,
      required: [true, 'Impression token is required'],
      unique: true,
      index: true,
      trim: true
    },

    // Session lifecycle status
    status: {
      type: String,
      enum: {
        values: ['STARTED', 'COMPLETED', 'EXPIRED', 'CLAIMED'],
        message: '{VALUE} is not a valid ad impression status'
      },
      default: 'STARTED',
      index: true
    },

    // Platform baseline reward for sponsored ad view (default 15 VEs)
    baseReward: {
      type: Number,
      default: 15,
      min: [0, 'Base reward cannot be negative']
    },

    // User's progression level multiplier applied to this impression (e.g. 1.0, 1.25)
    levelMultiplier: {
      type: Number,
      required: [true, 'Level multiplier is required'],
      min: [1.0, 'Level multiplier must be at least 1.0']
    },

    // Final server-calculated VEs credited upon completion (round(baseReward * multiplier, 2))
    earnedReward: {
      type: Number,
      required: [true, 'Earned reward is required'],
      min: [0, 'Earned reward cannot be negative']
    },

    // Server-enforced watch duration (in seconds, minimum 15s)
    durationSeconds: {
      type: Number,
      default: 15,
      min: [1, 'Duration must be at least 1 second']
    },

    // Expiration timestamp (session is invalid if claimed after this date)
    expiresAt: {
      type: Date,
      required: [true, 'Expiration time is required']
    },

    // Exact timestamp when ad reward was successfully claimed
    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound indexes for performant daily limit and cooldown lookups
adImpressionSchema.index({ userId: 1, createdAt: -1 });
adImpressionSchema.index({ userId: 1, status: 1, completedAt: -1 });

const AdImpression = mongoose.models.AdImpression || mongoose.model('AdImpression', adImpressionSchema);

module.exports = AdImpression;

