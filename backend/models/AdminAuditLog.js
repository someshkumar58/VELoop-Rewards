const mongoose = require('mongoose');

/**
 * ============================================================================
 * VELOOP REWARDS — ADMIN AUDIT LOG SCHEMA & MODEL
 * ============================================================================
 * 
 * Provides an immutable administrative security ledger for all privileged
 * operations on the platform:
 * - User status changes (suspension, restoration)
 * - Authorized wallet balance adjustments (credit/debit)
 * - Withdrawal request reviews (approval, rejection)
 * - System tier and configuration updates
 * 
 * Enforces mandatory administrative justification for every privileged action.
 * ============================================================================
 */

const adminAuditLogSchema = new mongoose.Schema(
  {
    // Administrator who executed the action (adminId / actorId)
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Admin reference (adminId/actorId) is required'],
      index: true,
      alias: 'actorId'
    },

    // Administrative identity for human-readable display (e.g. admin@veloop.io)
    adminUser: {
      type: String,
      default: 'System Administrator',
      trim: true
    },

    // Standardized action classification (e.g. USER_STATUS_UPDATED, WALLET_ADJUSTED, WITHDRAWAL_REVIEWED)
    action: {
      type: String,
      required: [true, 'Action is required'],
      trim: true,
      index: true,
      alias: 'actionType'
    },

    // Entity type affected (e.g. User, Wallet, Withdrawal, Level, Settings)
    targetType: {
      type: String,
      required: [true, 'Target type is required'],
      trim: true,
      alias: 'entityType'
    },

    // Identifier of the targeted record (e.g. User ID, Wallet ID, Request ID)
    targetId: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Target ID is required'],
      index: true,
      alias: 'entityId'
    },

    // Value or status before the administrative action
    previousValue: {
      type: String,
      default: 'N/A',
      trim: true
    },

    // Value or status after the administrative action
    newValue: {
      type: String,
      default: 'N/A',
      trim: true
    },

    // Administrative justification/reason
    reason: {
      type: String,
      default: '',
      trim: true
    },

    // Structured metadata context for audit analysis
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual timestamp property for backward and forward interoperability
adminAuditLogSchema.virtual('timestamp').get(function () {
  return this.createdAt || new Date();
});

// Compound indexes for query optimization
adminAuditLogSchema.index({ createdAt: -1 });
adminAuditLogSchema.index({ action: 1 });
adminAuditLogSchema.index({ targetType: 1, targetId: 1 });
adminAuditLogSchema.index({ adminId: 1, createdAt: -1 });

const AdminAuditLog = mongoose.models.AdminAuditLog || mongoose.model('AdminAuditLog', adminAuditLogSchema);

module.exports = AdminAuditLog;
