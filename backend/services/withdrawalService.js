const mongoose = require('mongoose');
const Withdrawal = require('../models/Withdrawal');
const Wallet = require('../models/Wallet');
const User = require('../models/User');

const ALLOWED_PAYOUT_METHODS = ['USDC_POLYGON', 'USDT_TRON', 'PAYPAL', 'BANK_ACH', 'OTHER'];

/**
 * Generates a unique, human-readable withdrawal request identifier (e.g. W-904, W-1002).
 * Verifies against existing database records to prevent collisions.
 * 
 * @param {object} [session] - Optional transaction session
 * @returns {Promise<string>}
 */
async function generateUniqueRequestId(session = null) {
  let uniqueId = '';
  let exists = true;
  let attempts = 0;

  while (exists && attempts < 10) {
    attempts++;
    // Generate a 4-to-6 digit random integer
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    uniqueId = `W-${randomNum}`;

    if (mongoose.connection && (mongoose.connection.readyState === 1 || mongoose.connection._hasMockSession)) {
      const query = Withdrawal.findOne({ requestId: uniqueId });
      if (session && typeof query.session === 'function') query.session(session);
      const existing = await query;
      if (!existing) {
        exists = false;
      }
    } else {
      exists = false;
    }
  }

  // Fallback to high-resolution timestamp if random collisions occur
  if (exists) {
    uniqueId = `W-${Date.now().toString().slice(-6)}`;
  }

  return uniqueId;
}

/**
 * Formats a raw withdrawal Mongoose document for API consumers.
 * Conforms to both frontend profile contracts and admin management views.
 * 
 * @param {object} doc - Mongoose document or lean object
 * @returns {object} Formatted withdrawal representation
 */
function formatWithdrawal(doc) {
  if (!doc) return null;

  const user = doc.user || {};
  const userIdStr = user.userId || (user._id ? `VEL-${user._id.toString().slice(-6).toUpperCase()}` : 'N/A');
  const userNameStr = user.name || user.fullName || 'Member';

  // Format date safely
  let requestedAtStr = 'Recently';
  if (doc.createdAt) {
    try {
      requestedAtStr = new Date(doc.createdAt).toISOString().replace('T', ' ').slice(0, 16);
    } catch {
      requestedAtStr = 'Recently';
    }
  }

  // Frontend display status: 'Pending', 'Approved', 'Rejected'
  const displayStatus =
    doc.status === 'PENDING'
      ? 'Pending'
      : doc.status === 'APPROVED'
      ? 'Approved'
      : 'Rejected';

  return {
    id: doc._id.toString(),
    _id: doc._id.toString(),
    requestId: doc.requestId,
    userId: userIdStr,
    userName: userNameStr,
    amount: doc.requestedAmount,
    requestedAmount: doc.requestedAmount,
    asset: doc.asset || 'tokens',
    feeDeducted: doc.feeAmount || 0,
    netPayout: doc.netAmount !== undefined ? doc.netAmount : doc.requestedAmount,
    currency: doc.payoutCurrency || (doc.payoutMethod ? doc.payoutMethod.replace('_', ' ') : 'Tokens'),
    payoutCurrency: doc.payoutCurrency || null,
    payoutMethod: doc.payoutMethod || 'OTHER',
    payoutAddress: doc.destination || 'N/A',
    destination: doc.destination || '',
    status: displayStatus,
    statusCode: doc.status,
    rejectionReason: doc.rejectionReason || null,
    reviewedBy: doc.reviewedBy ? doc.reviewedBy.toString() : null,
    reviewedAt: doc.reviewedAt || null,
    requestedAt: requestedAtStr,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

/**
 * Creates a persistent withdrawal request and atomically reserves Tokens from the user's wallet.
 * Uses a MongoDB multi-document ACID transaction with session.withTransaction().
 * 
 * @param {string|mongoose.Types.ObjectId} userId - Authenticated user ID
 * @param {object} payload - { amount, payoutMethod, destination }
 * @returns {Promise<object>} Created withdrawal record and updated token balance
 */
async function createWithdrawalRequest(userId, payload = {}) {
  if (!userId) {
    const err = new Error('User authentication is required to request a withdrawal.');
    err.statusCode = 401;
    throw err;
  }

  const { amount, asset, payoutMethod, destination } = payload;

  // Validate asset: reject unsupported client-supplied assets with HTTP 400
  if (asset !== undefined && asset !== null) {
    if (typeof asset !== 'string' || asset.trim().toLowerCase() !== 'tokens') {
      const err = new Error(`Unsupported withdrawal asset '${asset}'. Only 'tokens' are supported in Phase 2A.`);
      err.statusCode = 400;
      throw err;
    }
  }

  // 1. Validate requested amount
  const numAmount = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(numAmount) || !isFinite(numAmount) || numAmount <= 0) {
    const err = new Error('Withdrawal amount must be a valid positive number.');
    err.statusCode = 400;
    throw err;
  }

  // Round to 2 decimal places to prevent floating-point drift
  const roundedAmount = Math.round(numAmount * 100) / 100;
  if (roundedAmount < 0.01) {
    const err = new Error('Minimum withdrawal amount is 0.01 Tokens.');
    err.statusCode = 400;
    throw err;
  }

  // 2. Validate destination
  const sanitizedDestination = typeof destination === 'string' ? destination.trim() : '';
  if (!sanitizedDestination) {
    const err = new Error('Recipient payout destination address or account is required.');
    err.statusCode = 400;
    throw err;
  }
  if (sanitizedDestination.length > 255) {
    const err = new Error('Destination cannot exceed 255 characters.');
    err.statusCode = 400;
    throw err;
  }

  // 3. Validate user account status
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User profile not found.');
    err.statusCode = 404;
    throw err;
  }
  if (user.accountStatus === 'Suspended') {
    const err = new Error('Account is suspended. Payout withdrawals are not permitted.');
    err.statusCode = 403;
    throw err;
  }

  // Validate payout method
  const candidateMethod = typeof payoutMethod === 'string' ? payoutMethod.trim().toUpperCase() : 'OTHER';
  const validMethod = ALLOWED_PAYOUT_METHODS.includes(candidateMethod) ? candidateMethod : 'OTHER';

  // 4. Multi-Document ACID Transaction
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
    const executeCreation = async (activeSession) => {
      // A. Atomically reserve tokens from Wallet using conditional query
      const updatedWallet = await Wallet.findOneAndUpdate(
        { user: userId, tokensBalance: { $gte: roundedAmount } },
        { $inc: { tokensBalance: -roundedAmount } },
        { session: activeSession || undefined, new: true, runValidators: true }
      );

      if (!updatedWallet) {
        // Query to distinguish missing wallet vs insufficient balance
        const checkWallet = Wallet.findOne({ user: userId });
        if (activeSession) checkWallet.session(activeSession);
        const existingWallet = await checkWallet;

        if (!existingWallet) {
          const err = new Error('Wallet record not found for user.');
          err.statusCode = 404;
          throw err;
        }

        const available = existingWallet.tokensBalance || 0;
        const err = new Error(
          `Insufficient tokens balance. Available balance is ${available.toFixed(2)} Tokens, but requested ${roundedAmount.toFixed(2)} Tokens.`
        );
        err.statusCode = 400;
        throw err;
      }

      // B. Generate unique request ID
      const requestId = await generateUniqueRequestId(activeSession);

      // C. Create withdrawal record with status 'PENDING'
      const withdrawalData = {
        requestId,
        user: userId,
        requestedAmount: roundedAmount,
        asset: 'tokens',
        feeAmount: 0, // In Phase 2A infrastructure mode, real-money fees remain uncharged
        netAmount: roundedAmount,
        payoutCurrency: null, // Exchange rate is unapproved in Phase 2A
        payoutMethod: validMethod,
        destination: sanitizedDestination,
        status: 'PENDING'
      };

      let withdrawalDoc;
      if (activeSession) {
        const created = await Withdrawal.create([withdrawalData], { session: activeSession });
        withdrawalDoc = created[0];
      } else {
        withdrawalDoc = await Withdrawal.create(withdrawalData);
      }

      return {
        withdrawal: withdrawalDoc,
        remainingTokensBalance: updatedWallet.tokensBalance
      };
    };

    let result;
    if (useTransaction && session) {
      result = await session.withTransaction(async () => {
        return await executeCreation(session);
      });
    } else {
      result = await executeCreation(null);
    }

    // Populate user metadata for the created record
    let populated = null;
    const findQuery = Withdrawal.findById(result.withdrawal._id);
    if (findQuery && typeof findQuery.populate === 'function') {
      populated = await findQuery.populate('user', 'name fullName email userId');
    } else {
      populated = await findQuery;
    }

    if (!populated) {
      populated = result.withdrawal;
    }
    if (!populated.user || typeof populated.user !== 'object' || !populated.user.name) {
      populated.user = user;
    }

    return {
      success: true,
      message: `Withdrawal request #${populated.requestId} submitted for administrative review. Tokens reserved.`,
      withdrawal: formatWithdrawal(populated),
      remainingTokens: result.remainingTokensBalance
    };
  } finally {
    if (session && typeof session.endSession === 'function') {
      await session.endSession();
    }
  }
}

/**
 * Retrieves paginated withdrawal records for the authenticated user.
 * 
 * @param {string|mongoose.Types.ObjectId} userId
 * @param {object} [options] - { page, limit, status }
 * @returns {Promise<object>}
 */
async function getUserWithdrawals(userId, options = {}) {
  if (!userId) {
    const err = new Error('User ID is required.');
    err.statusCode = 401;
    throw err;
  }

  const page = Math.max(1, parseInt(options.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(options.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const filter = { user: userId };
  if (options.status && options.status !== 'All') {
    filter.status = options.status.toUpperCase();
  }

  const [records, total] = await Promise.all([
    Withdrawal.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name fullName email userId'),
    Withdrawal.countDocuments(filter)
  ]);

  return {
    success: true,
    data: records.map(formatWithdrawal),
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
}

/**
 * Aggregates user withdrawal summary conforming to WithdrawalOverview.jsx.
 * Strict Rule: Pending amounts are strictly excluded from completed/approved totals.
 * 
 * @param {string|mongoose.Types.ObjectId} userId
 * @returns {Promise<object>}
 */
async function getUserWithdrawalSummary(userId) {
  if (!userId) {
    const err = new Error('User ID is required.');
    err.statusCode = 401;
    throw err;
  }

  const records = await Withdrawal.find({ user: userId });

  let totalRequests = 0;
  let pendingCount = 0;
  let pendingAmount = 0;
  let approvedCount = 0;
  let approvedAmount = 0;
  let rejectedCount = 0;
  let rejectedAmount = 0;

  for (const r of records) {
    totalRequests++;
    const amt = Number(r.requestedAmount) || 0;

    if (r.status === 'PENDING') {
      pendingCount++;
      pendingAmount += amt;
    } else if (r.status === 'APPROVED') {
      approvedCount++;
      approvedAmount += amt;
    } else if (r.status === 'REJECTED') {
      rejectedCount++;
      rejectedAmount += amt;
    }
  }

  return {
    success: true,
    totalRequests,
    pendingCount,
    pendingAmount: Math.round(pendingAmount * 100) / 100,
    approvedCount,
    approvedAmount: Math.round(approvedAmount * 100) / 100,
    rejectedCount,
    rejectedAmount: Math.round(rejectedAmount * 100) / 100,
    // Note: Pending requests are strictly excluded from completed total
    successfullyWithdrawnAmount: Math.round(approvedAmount * 100) / 100,
    currency: 'Tokens'
  };
}

/**
 * Retrieves all platform withdrawal requests for administrative oversight.
 * 
 * @param {object} [options] - { status, page, limit, search }
 * @returns {Promise<object>}
 */
async function getAdminWithdrawals(options = {}) {
  const page = Math.max(1, parseInt(options.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(options.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filter = {};
  if (options.status && options.status !== 'All') {
    filter.status = options.status.toUpperCase();
  }

  const [records, total] = await Promise.all([
    Withdrawal.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name fullName email userId'),
    Withdrawal.countDocuments(filter)
  ]);

  return {
    success: true,
    data: records.map(formatWithdrawal),
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
}

/**
 * Administrative action to review a pending withdrawal request.
 * - 'APPROVED': Validates status transition from PENDING -> APPROVED. No real-money payout is dispatched.
 * - 'REJECTED': Validates status transition from PENDING -> REJECTED. Atomically refunds reserved Tokens.
 * 
 * Uses conditional status updates and ACID transactions to prevent duplicate reviews or double refunds.
 * 
 * @param {string} withdrawalId - Withdrawal MongoDB ObjectId
 * @param {string|mongoose.Types.ObjectId} adminId - Reviewing administrator User ID
 * @param {object} payload - { status: 'Approved'|'Rejected', reason: string }
 * @returns {Promise<object>} Updated withdrawal record
 */
async function reviewWithdrawal(withdrawalId, adminId, payload = {}) {
  if (!withdrawalId || !mongoose.Types.ObjectId.isValid(withdrawalId)) {
    const err = new Error('A valid withdrawal ID is required.');
    err.statusCode = 400;
    throw err;
  }

  if (!adminId) {
    const err = new Error('Admin identification is required.');
    err.statusCode = 401;
    throw err;
  }

  const rawDecision = typeof payload.status === 'string' ? payload.status.trim().toUpperCase() : '';
  if (rawDecision !== 'APPROVED' && rawDecision !== 'REJECTED') {
    const err = new Error("Review decision must be either 'Approved' or 'Rejected'.");
    err.statusCode = 400;
    throw err;
  }

  const reason = typeof payload.reason === 'string' ? payload.reason.trim() : '';
  if (rawDecision === 'REJECTED' && (!reason || reason.length < 3)) {
    const err = new Error('A meaningful rejection reason (at least 3 characters) is required when rejecting a withdrawal.');
    err.statusCode = 400;
    throw err;
  }
  if (reason.length > 500) {
    const err = new Error('Rejection reason cannot exceed 500 characters.');
    err.statusCode = 400;
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
    const executeReview = async (activeSession) => {
      // 1. Check if withdrawal exists and is currently in PENDING state
      const query = Withdrawal.findById(withdrawalId);
      if (activeSession) query.session(activeSession);
      const withdrawal = await query;

      if (!withdrawal) {
        const err = new Error(`Withdrawal request '${withdrawalId}' was not found.`);
        err.statusCode = 404;
        throw err;
      }

      if (withdrawal.status !== 'PENDING') {
        const err = new Error(
          `Withdrawal #${withdrawal.requestId} is already ${withdrawal.status} and cannot be modified.`
        );
        err.statusCode = 400;
        throw err;
      }

      // 2. Perform conditional status update to prevent race conditions
      const updateFields = {
        status: rawDecision,
        reviewedBy: adminId,
        reviewedAt: new Date()
      };

      if (rawDecision === 'REJECTED') {
        updateFields.rejectionReason = reason;

        // Atomically refund reserved tokens to user's wallet
        const targetUserId = withdrawal.user && withdrawal.user._id ? withdrawal.user._id : withdrawal.user;
        const refundedWallet = await Wallet.findOneAndUpdate(
          { user: targetUserId },
          { $inc: { tokensBalance: withdrawal.requestedAmount } },
          { session: activeSession || undefined, new: true, runValidators: true }
        );

        if (!refundedWallet) {
          const err = new Error(`Wallet not found for user ${targetUserId} during token refund.`);
          err.statusCode = 500;
          throw err;
        }
      }

      // 3. Update withdrawal record
      const updateQuery = Withdrawal.findOneAndUpdate(
        { _id: withdrawalId, status: 'PENDING' },
        { $set: updateFields },
        { session: activeSession || undefined, new: true, runValidators: true }
      );

      let updatedWithdrawal = null;
      if (updateQuery && typeof updateQuery.populate === 'function') {
        updatedWithdrawal = await updateQuery.populate('user', 'name fullName email userId');
      } else {
        updatedWithdrawal = await updateQuery;
      }

      if (!updatedWithdrawal) {
        const err = new Error('Withdrawal review conflict: request was modified by another concurrent administrator.');
        err.statusCode = 409;
        throw err;
      }

      if (!updatedWithdrawal.user || typeof updatedWithdrawal.user !== 'object' || !updatedWithdrawal.user.name) {
        const targetUserId = withdrawal.user && withdrawal.user._id ? withdrawal.user._id : withdrawal.user;
        const u = await User.findById(targetUserId);
        if (u) updatedWithdrawal.user = u;
      }

      return updatedWithdrawal;
    };

    let updated;
    if (useTransaction && session) {
      updated = await session.withTransaction(async () => {
        return await executeReview(session);
      });
    } else {
      updated = await executeReview(null);
    }

    return {
      success: true,
      message: `Withdrawal #${updated.requestId} marked as ${updated.status === 'APPROVED' ? 'Approved' : 'Rejected'}.`,
      withdrawal: formatWithdrawal(updated)
    };
  } finally {
    if (session && typeof session.endSession === 'function') {
      await session.endSession();
    }
  }
}

module.exports = {
  createWithdrawalRequest,
  getUserWithdrawals,
  getUserWithdrawalSummary,
  getAdminWithdrawals,
  reviewWithdrawal,
  formatWithdrawal,
  generateUniqueRequestId
};
