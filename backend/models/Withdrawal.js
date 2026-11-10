const mongoose = require('mongoose');

/**
 * ============================================================================
 * VELOOP REWARDS — WITHDRAWAL SCHEMA & MODEL (STEP 11 PHASE 2A)
 * ============================================================================
 * 
 * Represents platform withdrawal requests and token balance reservations.
 * 
 * Key Architectural Decisions & Safeguards:
 * 1. INFRASTRUCTURE & RECORDING ONLY:
 *    Real-money payouts remain strictly disabled. No exchange rates, payout
 *    gateway integrations, or fiat/crypto transfers are performed.
 * 
 * 2. BALANCE RESERVATION:
 *    When a withdrawal request is submitted, Tokens are atomically reserved
 *    from Wallet.tokensBalance using MongoDB multi-document ACID transactions.
 *    If an administrator rejects the request, the reserved Tokens are refunded.
 * 
 * 3. IMMUTABLE STATE TRANSITION RULES:
 *    A withdrawal can ONLY transition:
 *    - from 'PENDING' to 'APPROVED'
 *    - from 'PENDING' to 'REJECTED'
 *    Final states ('APPROVED', 'REJECTED') are immutable and cannot be re-reviewed.
 * 
 * 4. SENSITIVE CREDENTIAL EXCLUSION:
 *    Private keys, seed phrases, card details, or payment credentials are NEVER stored.
 * ============================================================================
 */

const withdrawalSchema = new mongoose.Schema(
  {
    // Unique server-generated business identifier (e.g. W-1001, W-904)
    requestId: {
      type: String,
      required: [true, 'Request ID is required'],
      unique: true,
      trim: true,
      uppercase: true
    },

    // Reference to the authenticated User requesting the withdrawal
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },

    // Authoritative amount of platform tokens requested and reserved
    requestedAmount: {
      type: Number,
      required: [true, 'Requested amount is required'],
      min: [0.01, 'Requested amount must be at least 0.01']
    },

    // Platform asset being withdrawn (strictly 'tokens' in Phase 2A)
    asset: {
      type: String,
      default: 'tokens',
      enum: {
        values: ['tokens'],
        message: '{VALUE} is not a supported withdrawal asset. Only tokens are supported.'
      }
    },

    // Optional fee amount (0 in Phase 2A infrastructure mode)
    feeAmount: {
      type: Number,
      default: 0,
      min: [0, 'Fee amount cannot be negative']
    },

    // Net tokens reserved (requestedAmount - feeAmount)
    netAmount: {
      type: Number,
      default: function () {
        return Math.max(0, (this.requestedAmount || 0) - (this.feeAmount || 0));
      }
    },

    // Optional payout currency (not calculated without an approved exchange rate)
    payoutCurrency: {
      type: String,
      default: null,
      trim: true
    },

    // Payout method selected by user (optional, validated enum based on existing UI)
    payoutMethod: {
      type: String,
      enum: {
        values: ['USDC_POLYGON', 'USDT_TRON', 'PAYPAL', 'BANK_ACH', 'OTHER'],
        message: '{VALUE} is not a recognized payout method'
      },
      default: 'OTHER'
    },

    // Recipient destination address or account (sanitized string)
    destination: {
      type: String,
      trim: true,
      maxlength: [255, 'Destination cannot exceed 255 characters'],
      default: ''
    },

    // Lifecycle status: strictly PENDING, APPROVED, or REJECTED
    status: {
      type: String,
      enum: {
        values: ['PENDING', 'APPROVED', 'REJECTED'],
        message: '{VALUE} is not a valid withdrawal status'
      },
      default: 'PENDING',
      index: true
    },

    // Mandatory rejection reason if rejected by administrator
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Rejection reason cannot exceed 500 characters'],
      default: null
    },

    // Administrator User who reviewed this request
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    // Timestamp when review occurred
    reviewedAt: {
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

// Optimize query performance for user history and status-filtered administration views
withdrawalSchema.index({ user: 1, createdAt: -1 });
withdrawalSchema.index({ status: 1, createdAt: -1 });

// Prevent model overwrite in development/reloading environments
const Withdrawal = mongoose.models.Withdrawal || mongoose.model('Withdrawal', withdrawalSchema);

module.exports = Withdrawal;

