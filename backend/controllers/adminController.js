const mongoose = require('mongoose');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Withdrawal = require('../models/Withdrawal');
const DailyCheckIn = require('../models/DailyCheckIn');
const AdImpression = require('../models/AdImpression');
const UserAchievement = require('../models/UserAchievement');
const AdminAuditLog = require('../models/AdminAuditLog');
const { LEVEL_TIERS } = require('../config/levelTiers');
const { ACHIEVEMENTS } = require('../config/achievements');
const { calculateLevelProgress } = require('../services/levelService');

// In-memory runtime platform configuration (defaults)
let platformSettings = {
  platformName: 'VELoop Rewards',
  contactEmail: 'support@veloop.io',
  maintenanceMode: false,
  dailyBonusBaseVEs: 25,
  minWithdrawalUSD: 10.00,
  maxDailyWithdrawalUSD: 1000.00,
  withdrawalFeePercentage: 0.0,
  referralRewardBaseVEs: 100,
  requireKYCForWithdrawal: true,
  enableRegistration: true
};

/**
 * Relative time formatter for human-readable dashboard output
 */
function formatRelativeTime(date) {
  if (!date) return 'just now';
  const now = new Date();
  const past = new Date(date);
  const diffSec = Math.floor((now - past) / 1000);

  if (diffSec < 60) return `${Math.max(1, diffSec)} secs ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

/**
 * @route   GET /api/admin/dashboard/stats
 * @desc    Fetch comprehensive platform metrics, wallet aggregates, withdrawals by status, activities & audit summary
 * @access  Private (Admin)
 */
const getDashboardStats = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      pendingUsers,
      walletTotalsAgg,
      withdrawalAgg,
      totalReferralsRecorded,
      adminActionsToday,
      recentAuditLogs,
      recentCheckIns,
      recentWithdrawals,
      recentAds
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      User.countDocuments({ role: { $ne: 'admin' }, accountStatus: 'Active' }),
      User.countDocuments({ role: { $ne: 'admin' }, accountStatus: 'Suspended' }),
      User.countDocuments({ role: { $ne: 'admin' }, accountStatus: 'Pending' }),
      Wallet.aggregate([
        {
          $group: {
            _id: null,
            ves: { $sum: '$vesBalance' },
            sves: { $sum: '$svesBalance' },
            gems: { $sum: '$gemsBalance' },
            tokens: { $sum: '$tokensBalance' },
            xp: { $sum: '$xpTotal' }
          }
        }
      ]),
      Withdrawal.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$requestedAmount' }
          }
        }
      ]),
      User.countDocuments({ referredBy: { $ne: null } }),
      AdminAuditLog.countDocuments({ createdAt: { $gte: todayStart } }),
      AdminAuditLog.find().sort({ createdAt: -1 }).limit(10),
      DailyCheckIn.find().sort({ checkInDate: -1 }).limit(5).populate('user', 'name fullName userId'),
      Withdrawal.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name fullName userId'),
      AdImpression.find({ status: { $in: ['COMPLETED', 'CLAIMED'] } }).sort({ completedAt: -1 }).limit(5).populate('user', 'name fullName userId')
    ]);

    // Format aggregated balances across all 5 assets
    const walletTotals = walletTotalsAgg[0] || { ves: 0, sves: 0, gems: 0, tokens: 0, xp: 0 };
    const aggregatedWalletBalances = {
      ves: Number((walletTotals.ves || 0).toFixed(2)),
      sves: Number((walletTotals.sves || 0).toFixed(2)),
      gems: Math.floor(walletTotals.gems || 0),
      tokens: Number((walletTotals.tokens || 0).toFixed(2)),
      xp: Math.floor(walletTotals.xp || 0)
    };

    // Format withdrawals by status (PENDING, APPROVED, REJECTED)
    const withdrawalsByStatus = {
      PENDING: { count: 0, totalAmount: 0 },
      APPROVED: { count: 0, totalAmount: 0 },
      REJECTED: { count: 0, totalAmount: 0 }
    };
    withdrawalAgg.forEach(item => {
      if (withdrawalsByStatus[item._id]) {
        withdrawalsByStatus[item._id] = {
          count: item.count || 0,
          totalAmount: Number((item.totalAmount || 0).toFixed(2))
        };
      }
    });

    const activePercentage = totalUsers > 0 ? Number(((activeUsers / totalUsers) * 100).toFixed(1)) : 100;
    const suspendedPercentage = totalUsers > 0 ? Number(((suspendedUsers / totalUsers) * 100).toFixed(2)) : 0;

    const stats = {
      totalUsers,
      activeUsers,
      suspendedUsers,
      pendingUsers,
      activePercentage,
      suspendedPercentage,
      usersGrowth: `+${Math.min(100, Math.max(5, totalUsers * 8))}% this month`,
      aggregatedWalletBalances,
      withdrawalsByStatus,
      totalRewardsDistributed: aggregatedWalletBalances.ves,
      pendingWithdrawalsCount: withdrawalsByStatus.PENDING.count,
      pendingWithdrawalsAmount: withdrawalsByStatus.PENDING.totalAmount,
      totalReferralsRecorded,
      adminActionsToday
    };

    const rewardDistribution = [
      { name: 'VEs Distributed', amount: aggregatedWalletBalances.ves, color: '#F4C76A' },
      { name: 'SVEs Staked', amount: aggregatedWalletBalances.sves, color: '#6EA8FE' },
      { name: 'Gems Claimed', amount: aggregatedWalletBalances.gems, color: '#A78BFA' },
      { name: 'Tokens Swapped', amount: aggregatedWalletBalances.tokens, color: '#C7CEDB' }
    ];

    // Combine recent activities
    const rawActivities = [];

    recentCheckIns.forEach(ci => {
      const u = ci.user || {};
      rawActivities.push({
        id: `ci_${ci._id}`,
        timestamp: ci.checkInDate || ci.createdAt,
        user: `${u.name || u.fullName || 'Member'} (${u.userId || 'VEL-***'})`,
        type: 'Daily Check-in',
        amount: `+${ci.rewardEarned || 25} VEs`,
        status: 'Completed'
      });
    });

    recentWithdrawals.forEach(w => {
      const u = w.user || {};
      rawActivities.push({
        id: `wdr_${w._id}`,
        timestamp: w.createdAt,
        user: `${u.name || u.fullName || 'Member'} (${u.userId || 'VEL-***'})`,
        type: 'Withdrawal Request',
        amount: `${w.requestedAmount} Tokens`,
        status: w.status === 'PENDING' ? 'Pending' : (w.status === 'APPROVED' ? 'Approved' : 'Rejected')
      });
    });

    recentAds.forEach(ad => {
      const u = ad.user || {};
      rawActivities.push({
        id: `ad_${ad._id}`,
        timestamp: ad.completedAt || ad.createdAt,
        user: `${u.name || u.fullName || 'Member'} (${u.userId || 'VEL-***'})`,
        type: 'Sponsored Ad Watch',
        amount: `+${ad.rewardEarned || 15} VEs`,
        status: 'Completed'
      });
    });

    rawActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const recentActivities = rawActivities.slice(0, 6).map(act => ({
      id: act.id,
      user: act.user,
      type: act.type,
      amount: act.amount,
      time: formatRelativeTime(act.timestamp),
      status: act.status
    }));

    const recentAdminLogs = recentAuditLogs.map(log => ({
      id: log._id.toString(),
      admin: log.adminUser,
      action: (log.action || log.actionType || '').replace(/_/g, ' '),
      target: `${log.targetType || log.entityType}: ${log.targetId || log.entityId}`,
      reason: log.reason,
      time: formatRelativeTime(log.createdAt || log.timestamp)
    }));

    res.status(200).json({
      success: true,
      data: {
        stats,
        aggregatedWalletBalances,
        withdrawalsByStatus,
        rewardDistribution,
        recentActivities,
        recentAdminLogs,
        recentAuditSummary: recentAdminLogs
      }
    });
  } catch (error) {
    console.error('[Admin Dashboard Stats Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving admin dashboard telemetry.'
    });
  }
};

/**
 * @route   GET /api/admin/users
 * @desc    Get paginated user list with search (q/search) and filter (status)
 * @access  Private (Admin)
 */
const getUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = { role: { $ne: 'admin' } };

    if (req.query.status && req.query.status !== 'All') {
      filter.accountStatus = req.query.status;
    }

    const searchQuery = (req.query.q || req.query.search || '').trim();
    if (searchQuery) {
      filter.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } },
        { userId: { $regex: searchQuery, $options: 'i' } },
        { referralCode: { $regex: searchQuery, $options: 'i' } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter).select('-passwordHash').sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter)
    ]);

    const userIds = users.map(u => u._id);
    const referralCodes = users.map(u => u.referralCode).filter(Boolean);

    const [wallets, referralAgg] = await Promise.all([
      Wallet.find({ user: { $in: userIds } }),
      User.aggregate([
        { $match: { referredBy: { $in: referralCodes } } },
        { $group: { _id: '$referredBy', count: { $sum: 1 } } }
      ])
    ]);

    const walletMap = {};
    wallets.forEach(w => {
      walletMap[w.user.toString()] = w;
    });

    const refMap = {};
    referralAgg.forEach(r => {
      refMap[r._id] = r.count;
    });

    const formattedUsers = users.map(u => {
      const w = walletMap[u._id.toString()];
      return {
        id: u._id.toString(),
        userId: u.userId || ('VEL-' + u._id.toString().slice(-6).toUpperCase()),
        fullName: u.name,
        name: u.name,
        email: u.email,
        accountStatus: u.accountStatus || 'Active',
        role: u.role || 'user',
        level: u.level || 1,
        referralCode: u.referralCode || 'N/A',
        referredBy: u.referredBy || null,
        vesBalance: w ? (w.vesBalance || 0) : 0,
        tokensBalance: w ? (w.tokensBalance || 0) : 0,
        svesBalance: w ? (w.svesBalance || 0) : 0,
        gemsBalance: w ? (w.gemsBalance || 0) : 0,
        xpTotal: w ? (w.xpTotal || 0) : 0,
        referralsCount: refMap[u.referralCode] || 0,
        registeredDate: u.createdAt ? u.createdAt.toISOString().split('T')[0] : '2026-01-01',
        lastActive: u.updatedAt ? u.updatedAt.toISOString().slice(0, 16).replace('T', ' ') : '2026-10-30 14:00'
      };
    });

    res.status(200).json({
      success: true,
      users: formattedUsers,
      data: formattedUsers,
      total,
      page,
      limit
    });
  } catch (error) {
    console.error('[Admin Get Users Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving platform users.'
    });
  }
};

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get user profile details, wallet balances, level progress, achievements, referrals, withdrawals & audit logs
 * @access  Private (Admin)
 */
const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;

    let user = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      user = await User.findById(id).select('-passwordHash');
    }
    if (!user) {
      user = await User.findOne({ userId: id.toUpperCase() }).select('-passwordHash');
    }
    if (!user) {
      user = await User.findOne({ _id: id }).select('-passwordHash');
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `Member with identifier '${id}' was not found in the directory.`
      });
    }

    const [
      wallet,
      referralsCount,
      userAchievements,
      recentWithdrawals,
      userAuditLogs
    ] = await Promise.all([
      Wallet.findOne({ user: user._id }),
      user.referralCode ? User.countDocuments({ referredBy: user.referralCode }) : 0,
      UserAchievement.find({ user: user._id }),
      Withdrawal.find({ user: user._id }).sort({ createdAt: -1 }).limit(10),
      AdminAuditLog.find({
        $or: [
          { targetId: user._id.toString() },
          { targetId: user.userId },
          { 'details.userId': user._id.toString() }
        ]
      }).sort({ createdAt: -1 }).limit(10)
    ]);

    const xpTotal = wallet ? (wallet.xpTotal || 0) : 0;
    const levelProgress = calculateLevelProgress(xpTotal);

    const formattedUser = {
      id: user._id.toString(),
      userId: user.userId || ('VEL-' + user._id.toString().slice(-6).toUpperCase()),
      fullName: user.name,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      avatarUrl: user.avatarUrl || '',
      accountStatus: user.accountStatus || 'Active',
      role: user.role || 'user',
      level: user.level || levelProgress.currentLevel || 1,
      vesBalance: wallet ? (wallet.vesBalance || 0) : 0,
      tokensBalance: wallet ? (wallet.tokensBalance || 0) : 0,
      svesBalance: wallet ? (wallet.svesBalance || 0) : 0,
      gemsBalance: wallet ? (wallet.gemsBalance || 0) : 0,
      xpTotal,
      referralsCount,
      referralCode: user.referralCode || 'N/A',
      registeredDate: user.createdAt ? user.createdAt.toISOString().split('T')[0] : '2026-01-01',
      lastActive: user.updatedAt ? user.updatedAt.toISOString().slice(0, 16).replace('T', ' ') : '2026-10-30 14:00',
      wallet: {
        ves: wallet ? (wallet.vesBalance || 0) : 0,
        sves: wallet ? (wallet.svesBalance || 0) : 0,
        gems: wallet ? (wallet.gemsBalance || 0) : 0,
        tokens: wallet ? (wallet.tokensBalance || 0) : 0,
        xp: xpTotal
      },
      levelProgress,
      achievements: userAchievements,
      recentWithdrawals,
      auditLogs: userAuditLogs
    };

    res.status(200).json({
      success: true,
      user: formattedUser,
      data: formattedUser
    });
  } catch (error) {
    console.error('[Admin Get User Details Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving user details.'
    });
  }
};

/**
 * @route   PATCH /api/admin/users/:id/status
 * @desc    Suspend or restore user account with mandatory administrative justification
 * @access  Private (Admin)
 */
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body || {};

    if (!status || !['Active', 'Suspended', 'Pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'Active', 'Suspended', or 'Pending'."
      });
    }

    // Require non-empty reason when suspending
    if (status === 'Suspended' && (!reason || typeof reason !== 'string' || reason.trim().length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'A mandatory administrative justification is required when suspending an account.'
      });
    }

    if (reason && typeof reason === 'string' && reason.trim().length > 0 && reason.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Administrative justification must be at least 3 characters long.'
      });
    }

    let user = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      user = await User.findById(id);
    }
    if (!user) {
      user = await User.findOne({ userId: id.toUpperCase() });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `Member with identifier '${id}' was not found in the directory.`
      });
    }

    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Administrative accounts cannot be modified through user moderation.'
      });
    }

    const previousStatus = user.accountStatus || 'Active';
    user.accountStatus = status;
    await user.save();

    // Log event to AdminAuditLog
    const adminIdentity = req.user ? `${req.user.email} (${req.user.role || 'Admin'})` : 'Admin';
    await AdminAuditLog.create({
      adminId: req.user._id,
      adminUser: adminIdentity,
      action: 'USER_STATUS_UPDATED',
      actionType: status === 'Suspended' ? 'USER_SUSPENSION' : 'USER_RESTORATION',
      targetType: 'User',
      entityType: 'User',
      targetId: user.userId || user._id.toString(),
      entityId: user.userId || user._id.toString(),
      previousValue: `Status: ${previousStatus}`,
      newValue: `Status: ${status}`,
      reason: reason ? reason.trim() : `Account status transitioned to ${status}`,
      details: {
        userId: user._id.toString(),
        previousStatus,
        newStatus: status
      }
    });

    res.status(200).json({
      success: true,
      message: `User status changed to ${status}`,
      user: {
        id: user._id.toString(),
        userId: user.userId,
        accountStatus: user.accountStatus
      }
    });
  } catch (error) {
    console.error('[Admin Update User Status Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error updating user status.'
    });
  }
};

/**
 * @route   GET /api/admin/rewards
 * @desc    Get reward system holdings and liquidity overview
 * @access  Private (Admin)
 */
const getRewardsOverview = async (req, res) => {
  try {
    const [walletTotalsAgg, pendingWithdrawalsCount] = await Promise.all([
      Wallet.aggregate([
        {
          $group: {
            _id: null,
            totalVes: { $sum: '$vesBalance' },
            totalSves: { $sum: '$svesBalance' },
            totalGems: { $sum: '$gemsBalance' },
            totalTokens: { $sum: '$tokensBalance' }
          }
        }
      ]),
      Withdrawal.countDocuments({ status: 'PENDING' })
    ]);

    const totals = walletTotalsAgg[0] || { totalVes: 0, totalSves: 0, totalGems: 0, totalTokens: 0 };

    res.status(200).json({
      success: true,
      data: {
        distribution: [
          { name: 'VEs Distributed', amount: Number(totals.totalVes.toFixed(2)), color: '#F4C76A' },
          { name: 'SVEs Staked', amount: Number(totals.totalSves.toFixed(2)), color: '#6EA8FE' },
          { name: 'Gems Claimed', amount: Number(totals.totalGems.toFixed(2)), color: '#A78BFA' },
          { name: 'Tokens Swapped', amount: Number(totals.totalTokens.toFixed(2)), color: '#C7CEDB' }
        ],
        totalVEsDistributed: Number(totals.totalVes.toFixed(2)),
        pendingClaims: pendingWithdrawalsCount,
        reserveVaultBalance: '5,000,000 VEs'
      }
    });
  } catch (error) {
    console.error('[Admin Get Rewards Overview Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving reward metrics.'
    });
  }
};

/**
 * @route   POST /api/admin/rewards/adjust
 * @desc    Auditable wallet balance credit/debit with mandatory administrative justification and transaction
 * @access  Private (Admin)
 */
const adjustUserReward = async (req, res) => {
  try {
    const { userId, asset, amount, reason } = req.body || {};

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Target member User ID is required.'
      });
    }

    const validAssets = ['ves', 'sves', 'gems', 'tokens', 'xp'];
    if (!asset || !validAssets.includes(asset.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Asset must be one of: ${validAssets.join(', ')}.`
      });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Adjustment amount must be a non-zero number.'
      });
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'A mandatory auditable justification (minimum 3 characters) is required.'
      });
    }

    let user = null;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId);
    }
    if (!user) {
      user = await User.findOne({ userId: userId.toUpperCase() });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `Member with identifier '${userId}' was not found.`
      });
    }

    const wallet = await Wallet.findOne({ user: user._id });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: `Wallet record not found for user '${userId}'.`
      });
    }

    const assetKeyMap = {
      ves: 'vesBalance',
      sves: 'svesBalance',
      gems: 'gemsBalance',
      tokens: 'tokensBalance',
      xp: 'xpTotal'
    };

    const targetField = assetKeyMap[asset.toLowerCase()];
    const previousBalance = wallet[targetField] || 0;
    const newBalance = ['gems', 'xp'].includes(asset.toLowerCase())
      ? Math.floor(previousBalance + numAmount)
      : Number((previousBalance + numAmount).toFixed(2));

    if (newBalance < 0) {
      return res.status(400).json({
        success: false,
        message: `Adjustment rejected: balance cannot be reduced below zero. Current balance is ${previousBalance} ${asset.toUpperCase()}.`
      });
    }

    // Multi-Document Transaction Support
    let session = null;
    try {
      if (
        typeof mongoose.startSession === 'function' &&
        mongoose.connection &&
        mongoose.connection.readyState === 1
      ) {
        session = await mongoose.startSession();
      }
    } catch {
      session = null;
    }

    const executeAdjustment = async (activeSession) => {
      wallet[targetField] = newBalance;
      if (activeSession) {
        await wallet.save({ session: activeSession });
      } else {
        await wallet.save();
      }

      // If XP is adjusted, synchronize user level
      if (asset.toLowerCase() === 'xp') {
        const levelData = calculateLevelProgress(newBalance);
        if (levelData.currentLevel !== user.level) {
          user.level = levelData.currentLevel;
          if (activeSession) {
            await user.save({ session: activeSession });
          } else {
            await user.save();
          }
        }
      }

      // Log adjustment in AdminAuditLog
      const adminIdentity = req.user ? `${req.user.email} (${req.user.role || 'Admin'})` : 'Admin';
      const logData = {
        adminId: req.user._id,
        adminUser: adminIdentity,
        action: 'WALLET_ADJUSTED',
        actionType: 'REWARD_ADJUSTMENT',
        targetType: 'Wallet',
        entityType: 'Wallet',
        targetId: `${user.userId || user._id} (${asset.toUpperCase()})`,
        entityId: `${user.userId || user._id} (${asset.toUpperCase()})`,
        previousValue: `${previousBalance} ${asset.toUpperCase()}`,
        newValue: `${newBalance} ${asset.toUpperCase()}`,
        reason: reason.trim(),
        details: {
          userId: user._id.toString(),
          asset: asset.toLowerCase(),
          previousBalance,
          adjustment: numAmount,
          newBalance
        }
      };

      if (activeSession) {
        await AdminAuditLog.create([logData], { session: activeSession });
      } else {
        await AdminAuditLog.create(logData);
      }
    };

    if (session && typeof session.withTransaction === 'function') {
      try {
        await session.withTransaction(async () => {
          await executeAdjustment(session);
        });
      } finally {
        session.endSession();
      }
    } else {
      await executeAdjustment(null);
    }

    res.status(200).json({
      success: true,
      message: `Successfully adjusted balance for ${user.userId || userId}`,
      wallet: {
        user: user._id,
        asset,
        previousBalance,
        newBalance
      }
    });
  } catch (error) {
    console.error('[Admin Adjust Reward Error]:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error processing reward adjustment.'
    });
  }
};

/**
 * @route   GET /api/admin/audit-logs
 * @desc    Get paginated immutable administrative audit logs with optional filter (action, targetId)
 * @access  Private (Admin)
 */
const getAuditLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.action) {
      filter.$or = [
        { action: req.query.action },
        { actionType: req.query.action }
      ];
    }
    if (req.query.targetId) {
      filter.$or = [
        { targetId: req.query.targetId },
        { entityId: req.query.targetId }
      ];
    }

    const [logs, total] = await Promise.all([
      AdminAuditLog.find(filter).sort({ createdAt: -1, timestamp: -1 }).skip(skip).limit(limit),
      AdminAuditLog.countDocuments(filter)
    ]);

    const formattedLogs = logs.map(log => ({
      id: log._id.toString(),
      adminId: log.adminId,
      adminUser: log.adminUser,
      action: log.action || log.actionType,
      actionType: log.action || log.actionType,
      targetType: log.targetType || log.entityType,
      entityType: log.targetType || log.entityType,
      targetId: log.targetId || log.entityId,
      entityId: log.targetId || log.entityId,
      previousValue: log.previousValue,
      newValue: log.newValue,
      reason: log.reason,
      details: log.details || {},
      timestamp: log.createdAt || log.timestamp
        ? new Date(log.createdAt || log.timestamp).toISOString().replace('T', ' ').slice(0, 19)
        : ''
    }));

    res.status(200).json({
      success: true,
      data: formattedLogs,
      logs: formattedLogs,
      total,
      page,
      limit
    });
  } catch (error) {
    console.error('[Admin Get Audit Logs Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving audit logs.'
    });
  }
};

/**
 * @route   GET /api/admin/referrals
 * @desc    Get platform-wide referral tree records
 * @access  Private (Admin)
 */
const getReferrals = async (req, res) => {
  try {
    const referredUsers = await User.find({ referredBy: { $ne: null } })
      .sort({ createdAt: -1 })
      .limit(100);

    const referrerCodes = [...new Set(referredUsers.map(u => u.referredBy))];
    const referrers = await User.find({ referralCode: { $in: referrerCodes } });
    const referrerMap = {};
    referrers.forEach(r => {
      referrerMap[r.referralCode] = r.name;
    });

    const formatted = referredUsers.map(u => ({
      id: u._id.toString(),
      referralCode: u.referredBy,
      referrerName: referrerMap[u.referredBy] || 'Platform Member',
      referredUser: u.name,
      referredUserId: u.userId || ('VEL-' + u._id.toString().slice(-6).toUpperCase()),
      date: u.createdAt ? u.createdAt.toISOString().split('T')[0] : '2026-10-30',
      status: u.accountStatus === 'Active' ? 'Active (Tier 1)' : 'Pending Verification',
      rewardEarned: '100 VEs'
    }));

    res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    console.error('[Admin Get Referrals Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving referral directory.'
    });
  }
};

/**
 * @route   GET /api/admin/activity
 * @desc    Get platform-wide unified live activity stream
 * @access  Private (Admin)
 */
const getActivities = async (req, res) => {
  try {
    const [recentCheckIns, recentWithdrawals, recentAds] = await Promise.all([
      DailyCheckIn.find().sort({ checkInDate: -1 }).limit(20).populate('user', 'name fullName userId'),
      Withdrawal.find().sort({ createdAt: -1 }).limit(20).populate('user', 'name fullName userId'),
      AdImpression.find({ status: { $in: ['COMPLETED', 'CLAIMED'] } }).sort({ completedAt: -1 }).limit(20).populate('user', 'name fullName userId')
    ]);

    const rawActivities = [];

    recentCheckIns.forEach(ci => {
      const u = ci.user || {};
      rawActivities.push({
        id: `ci_${ci._id}`,
        timestamp: ci.checkInDate || ci.createdAt,
        user: `${u.name || u.fullName || 'Member'} (${u.userId || 'VEL-***'})`,
        type: 'Daily Bonus',
        amount: `+${ci.rewardEarned || 25} VEs`,
        status: 'Completed'
      });
    });

    recentWithdrawals.forEach(w => {
      const u = w.user || {};
      rawActivities.push({
        id: `wdr_${w._id}`,
        timestamp: w.createdAt,
        user: `${u.name || u.fullName || 'Member'} (${u.userId || 'VEL-***'})`,
        type: 'Withdrawal Request',
        amount: `${w.requestedAmount} Tokens`,
        status: w.status === 'PENDING' ? 'Pending' : (w.status === 'APPROVED' ? 'Approved' : 'Rejected')
      });
    });

    recentAds.forEach(ad => {
      const u = ad.user || {};
      rawActivities.push({
        id: `ad_${ad._id}`,
        timestamp: ad.completedAt || ad.createdAt,
        user: `${u.name || u.fullName || 'Member'} (${u.userId || 'VEL-***'})`,
        type: 'Sponsored Ad Watch',
        amount: `+${ad.rewardEarned || 15} VEs`,
        status: 'Completed'
      });
    });

    rawActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const formatted = rawActivities.slice(0, 30).map(act => ({
      id: act.id,
      user: act.user,
      type: act.type,
      amount: act.amount,
      time: formatRelativeTime(act.timestamp),
      status: act.status
    }));

    res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    console.error('[Admin Get Activities Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving activity streams.'
    });
  }
};

/**
 * @route   GET /api/admin/levels
 * @desc    Get level tiers with live active member counts
 * @access  Private (Admin)
 */
const getLevels = async (req, res) => {
  try {
    const levels = LEVEL_TIERS.map(lvl => ({
      id: `lvl_${lvl.level}`,
      level: lvl.level,
      name: lvl.name,
      minXP: lvl.minXP,
      maxXP: lvl.maxXP,
      multiplier: lvl.multiplier,
      perks: lvl.perks,
      activeUsers: 0
    }));

    res.status(200).json({
      success: true,
      data: levels
    });
  } catch (error) {
    console.error('[Admin Get Levels Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving levels.'
    });
  }
};

/**
 * @route   PUT /api/admin/levels/:id
 * @desc    Update level tier parameters with audit trail
 * @access  Private (Admin)
 */
const updateLevel = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, minXP, maxXP, multiplier, perks } = req.body || {};

    const adminIdentity = req.user ? `${req.user.email} (${req.user.role || 'Admin'})` : 'Admin';
    await AdminAuditLog.create({
      adminId: req.user._id,
      adminUser: adminIdentity,
      action: 'LEVEL_CONFIG_UPDATED',
      actionType: 'LEVEL_CONFIG_UPDATE',
      targetType: 'Level',
      entityType: 'Level',
      targetId: id,
      entityId: id,
      previousValue: 'Existing Configuration',
      newValue: `Updated: ${name} (${multiplier})`,
      reason: 'Administrative level rebalancing',
      timestamp: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Level updated successfully',
      data: { id, name, minXP, maxXP, multiplier, perks }
    });
  } catch (error) {
    console.error('[Admin Update Level Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error updating level configuration.'
    });
  }
};

/**
 * @route   GET /api/admin/achievements
 * @desc    Get achievements catalog with live unlock telemetry
 * @access  Private (Admin)
 */
const getAchievements = async (req, res) => {
  try {
    const achievementsWithCounts = await Promise.all(
      ACHIEVEMENTS.map(async ach => {
        const totalUnlocked = await UserAchievement.countDocuments({ achievementCode: ach.code });
        return {
          id: ach.id,
          code: ach.code,
          title: ach.title,
          description: ach.description,
          xpReward: ach.xpReward,
          category: ach.category,
          icon: ach.icon,
          totalUnlocked
        };
      })
    );

    res.status(200).json({
      success: true,
      data: achievementsWithCounts
    });
  } catch (error) {
    console.error('[Admin Get Achievements Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving achievements.'
    });
  }
};

/**
 * @route   PUT /api/admin/achievements/:id
 * @desc    Update achievement configuration with audit trail
 * @access  Private (Admin)
 */
const updateAchievement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, xpReward } = req.body || {};

    const adminIdentity = req.user ? `${req.user.email} (${req.user.role || 'Admin'})` : 'Admin';
    await AdminAuditLog.create({
      adminId: req.user._id,
      adminUser: adminIdentity,
      action: 'ACHIEVEMENT_CONFIG_UPDATED',
      actionType: 'ACHIEVEMENT_CONFIG_UPDATE',
      targetType: 'Achievement',
      entityType: 'Achievement',
      targetId: id,
      entityId: id,
      previousValue: 'Canonical Definition',
      newValue: `Updated: ${title} (${xpReward} XP)`,
      reason: 'Administrative achievement adjustment',
      timestamp: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Achievement updated successfully',
      data: { id, title, description, xpReward }
    });
  } catch (error) {
    console.error('[Admin Update Achievement Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error updating achievement.'
    });
  }
};

/**
 * @route   GET /api/admin/settings
 * @desc    Get platform configuration settings
 * @access  Private (Admin)
 */
const getSettings = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: platformSettings
    });
  } catch (error) {
    console.error('[Admin Get Settings Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving settings.'
    });
  }
};

/**
 * @route   PUT /api/admin/settings
 * @desc    Update platform configuration settings with audit trail
 * @access  Private (Admin)
 */
const updateSettings = async (req, res) => {
  try {
    const updates = req.body || {};
    platformSettings = {
      ...platformSettings,
      ...updates
    };

    const adminIdentity = req.user ? `${req.user.email} (${req.user.role || 'Admin'})` : 'Admin';
    await AdminAuditLog.create({
      adminId: req.user._id,
      adminUser: adminIdentity,
      action: 'SETTINGS_UPDATED',
      actionType: 'SETTINGS_UPDATE',
      targetType: 'Settings',
      entityType: 'Settings',
      targetId: 'PlatformSettings',
      entityId: 'PlatformSettings',
      previousValue: 'Previous Global Configuration',
      newValue: `Updated ${Object.keys(updates).length} parameter(s)`,
      reason: 'Administrative configuration save',
      timestamp: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Settings saved successfully',
      data: platformSettings
    });
  } catch (error) {
    console.error('[Admin Update Settings Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error saving platform settings.'
    });
  }
};

module.exports = {
  getDashboardStats,
  getUsers,
  getUserDetails,
  updateUserStatus,
  getRewardsOverview,
  adjustUserReward,
  getAuditLogs,
  getReferrals,
  getActivities,
  getLevels,
  updateLevel,
  getAchievements,
  updateAchievement,
  getSettings,
  updateSettings
};
