const mongoose = require('mongoose');

/**
 * ============================================================================
 * VELOOP REWARDS - WALLET SCHEMA & MODEL (STEP 4B)
 * ============================================================================
 * 
 * Represents authoritative platform reward asset balances for a user.
 * 
 * Key Architecture Decisions:
 * 1. SEPARATION OF CONCERNS:
 *    User identity (name, email, profile settings) is strictly separated
 *    from financial reward holdings (VEs, SVEs, Tokens, Gems, XP).
 *    This ensures that updating profile metadata (e.g. avatar, phone) never
 *    touches or risks corrupting financial balances.
 * 
 * 2. ONE-TO-ONE USER RELATIONSHIP:
 *    Each registered user has exactly one authoritative wallet document,
 *    enforced at the database engine level by a unique index on `user`.
 * 
 * 3. NUMERIC PRECISION & FRONTEND SEMANTICS:
 *    - `vesBalance`, `svesBalance`, and `tokensBalance` represent decimal balances
 *      with up to 2 decimal places (e.g. 4850.50 VEs, 85.00 Tokens).
 *    - `gemsBalance` and `xpTotal` represent whole integer reward quantities (e.g. 345, 12450).
 *    - To strictly preserve existing frontend contract semantics without breaking
 *      visual formatting, values are stored as Numbers. In Step 6+ operations,
 *      arithmetic will be rounded to 2 decimal places to prevent IEEE-754 floating-point drift.
 * 
 * 4. ALIASES FOR FRONTEND INTEROPERABILITY:
 *    Aliases ('ves', 'sves', 'gems', 'tokens', 'xp') allow seamless interoperability
 *    with frontend components expecting shorthand keys (`/api/profile/rewards`).
 * ============================================================================
 */

const walletSchema = new mongoose.Schema(
  {
    // One-to-one reference linking this wallet to its owning User
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true
    },

    // VEs (Virtual Ecosystem) — core engagement currency (2 decimal places)
    vesBalance: {
      type: Number,
      default: 0,
      min: [0, 'VEs balance cannot be negative'],
      alias: 'ves'
    },

    // SVEs (Staked Virtual Ecosystem) — yield-bearing staked reward token (2 decimal places)
    svesBalance: {
      type: Number,
      default: 0,
      min: [0, 'SVEs balance cannot be negative'],
      alias: 'sves'
    },

    // Gems — prestige in-app currency (whole units)
    gemsBalance: {
      type: Number,
      default: 0,
      min: [0, 'Gems balance cannot be negative'],
      alias: 'gems'
    },

    // Platform Tokens — external conversion and cash vouchers (2 decimal places)
    tokensBalance: {
      type: Number,
      default: 0,
      min: [0, 'Tokens balance cannot be negative'],
      alias: 'tokens'
    },

    // Cumulative Experience Points (XP) determining level and perks (whole units)
    xpTotal: {
      type: Number,
      default: 0,
      min: [0, 'XP total cannot be negative'],
      alias: 'xp'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Prevent model overwrite in development/reloading environments
const Wallet = mongoose.models.Wallet || mongoose.model('Wallet', walletSchema);

module.exports = Wallet;

