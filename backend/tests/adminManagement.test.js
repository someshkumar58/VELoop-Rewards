const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_admin_management_verified';

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');

const app = require('../server');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Withdrawal = require('../models/Withdrawal');
const DailyCheckIn = require('../models/DailyCheckIn');
const AdImpression = require('../models/AdImpression');
const UserAchievement = require('../models/UserAchievement');
const AdminAuditLog = require('../models/AdminAuditLog');
const { generateToken } = require('../utils/jwt');

describe('Step 12: Admin Console, Moderation & Security Audit Ledger Suite', () => {
  const adminId = '507f1f77bcf86cd799439001';
  const normalUserId = '507f1f77bcf86cd799439002';
  const targetUserId = '507f1f77bcf86cd799439003';
  const targetWalletId = '507f1f77bcf86cd799439004';

  const adminUser = {
    _id: adminId,
    id: adminId,
    name: 'Admin Supervisor',
    fullName: 'Admin Supervisor',
    email: 'admin@veloop.io',
    role: 'admin',
    accountStatus: 'Active',
    userId: 'VEL-ADM001',
    referralCode: 'VEL-ADMIN1'
  };

  const normalUser = {
    _id: normalUserId,
    id: normalUserId,
    name: 'Normal User',
    fullName: 'Normal User',
    email: 'normal@veloop.io',
    role: 'user',
    accountStatus: 'Active',
    userId: 'VEL-USR002',
    referralCode: 'VEL-NORM2'
  };

  let targetUserObj = {
    _id: targetUserId,
    id: targetUserId,
    name: 'Alexander Wright',
    fullName: 'Alexander Wright',
    email: 'alex.wright@veloop.io',
    role: 'user',
    accountStatus: 'Active',
    userId: 'VEL-894210',
    referralCode: 'VEL-ALEX99',
    level: 4,
    createdAt: new Date('2024-03-15T10:00:00Z'),
    updatedAt: new Date('2026-10-30T14:22:00Z'),
    save: async function () { return this; }
  };

  let targetWalletObj = {
    _id: targetWalletId,
    user: targetUserId,
    vesBalance: 4850.50,
    tokensBalance: 85.00,
    svesBalance: 1220.00,
    gemsBalance: 345,
    xpTotal: 12450,
    save: async function () { return this; }
  };

  const adminToken = generateToken(adminUser);
  const normalToken = generateToken(normalUser);

  let mockAuditLogs = [];

  // Mongoose stubs
  let origUserFindById;
  let origUserFindOne;
  let origUserFind;
  let origUserCountDocuments;
  let origUserAggregate;
  let origWalletFindOne;
  let origWalletFind;
  let origWalletAggregate;
  let origWithdrawalCountDocuments;
  let origWithdrawalAggregate;
  let origWithdrawalFind;
  let origCheckInFind;
  let origAdFind;
  let origAuditCreate;
  let origAuditFind;
  let origAuditCountDocuments;
  let origAchievementCountDocuments;
  let origAchievementFind;

  const createQueryChain = (result) => ({
    select: function () { return this; },
    sort: function () { return this; },
    skip: function () { return this; },
    limit: function () { return this; },
    populate: function () { return Promise.resolve(result); },
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject)
  });

  beforeEach(() => {
    mockAuditLogs = [];

    // Save originals
    origUserFindById = User.findById;
    origUserFindOne = User.findOne;
    origUserFind = User.find;
    origUserCountDocuments = User.countDocuments;
    origUserAggregate = User.aggregate;
    origWalletFindOne = Wallet.findOne;
    origWalletFind = Wallet.find;
    origWalletAggregate = Wallet.aggregate;
    origWithdrawalCountDocuments = Withdrawal.countDocuments;
    origWithdrawalAggregate = Withdrawal.aggregate;
    origWithdrawalFind = Withdrawal.find;
    origCheckInFind = DailyCheckIn.find;
    origAdFind = AdImpression.find;
    origAuditCreate = AdminAuditLog.create;
    origAuditFind = AdminAuditLog.find;
    origAuditCountDocuments = AdminAuditLog.countDocuments;
    origAchievementCountDocuments = UserAchievement.countDocuments;
    origAchievementFind = UserAchievement.find;

    // Default User.findById for auth middleware
    User.findById = function (id) {
      const idStr = String(id);
      let user = null;
      if (idStr === adminId) user = { ...adminUser };
      else if (idStr === normalUserId) user = { ...normalUser };
      else if (idStr === targetUserId) user = targetUserObj;
      return createQueryChain(user);
    };

    User.findOne = function (query) {
      if (query.userId === 'VEL-894210' || query._id === targetUserId) {
        return createQueryChain(targetUserObj);
      }
      return createQueryChain(null);
    };

    User.find = function (query) {
      if (query && query.referredBy) {
        return createQueryChain([]);
      }
      return createQueryChain([targetUserObj]);
    };

    User.countDocuments = async function (query) {
      if (query && query.referredBy) return 5;
      return 1;
    };

    User.aggregate = async function () {
      return [{ _id: 'VEL-ALEX99', count: 5 }];
    };

    Wallet.findOne = async function (query) {
      if (String(query.user) === targetUserId) {
        return targetWalletObj;
      }
      return null;
    };

    Wallet.find = function () {
      return Promise.resolve([targetWalletObj]);
    };

    Wallet.aggregate = async function () {
      return [{
        _id: null,
        ves: 4850.50,
        sves: 1220.00,
        gems: 345,
        tokens: 85.00,
        xp: 12450
      }];
    };

    Withdrawal.countDocuments = async function () {
      return 0;
    };

    Withdrawal.aggregate = async function () {
      return [
        { _id: 'PENDING', count: 2, totalAmount: 50.00 },
        { _id: 'APPROVED', count: 5, totalAmount: 250.00 },
        { _id: 'REJECTED', count: 1, totalAmount: 25.00 }
      ];
    };

    Withdrawal.find = function () {
      return createQueryChain([
        {
          _id: 'wdr_01',
          requestId: 'W-904',
          requestedAmount: 50,
          status: 'PENDING',
          createdAt: new Date()
        }
      ]);
    };

    DailyCheckIn.find = function () {
      return createQueryChain([]);
    };

    AdImpression.find = function () {
      return createQueryChain([]);
    };

    AdminAuditLog.create = async function (doc) {
      const entry = {
        _id: new mongoose.Types.ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...doc
      };
      mockAuditLogs.push(entry);
      return entry;
    };

    AdminAuditLog.find = function (filter = {}) {
      let filtered = [...mockAuditLogs];
      if (filter.$or) {
        const actionMatch = filter.$or.find(c => c.action || c.actionType);
        if (actionMatch) {
          const act = actionMatch.action || actionMatch.actionType;
          filtered = filtered.filter(l => (l.action === act || l.actionType === act));
        }
      }
      return createQueryChain(filtered);
    };

    AdminAuditLog.countDocuments = async function () {
      return mockAuditLogs.length;
    };

    UserAchievement.countDocuments = async function () {
      return 0;
    };

    UserAchievement.find = function () {
      return createQueryChain([
        {
          achievementCode: 'FIRST_STEP',
          unlockedAt: new Date(),
          xpAwarded: 100
        }
      ]);
    };
  });

  afterEach(() => {
    User.findById = origUserFindById;
    User.findOne = origUserFindOne;
    User.find = origUserFind;
    User.countDocuments = origUserCountDocuments;
    User.aggregate = origUserAggregate;
    Wallet.findOne = origWalletFindOne;
    Wallet.find = origWalletFind;
    Wallet.aggregate = origWalletAggregate;
    Withdrawal.countDocuments = origWithdrawalCountDocuments;
    Withdrawal.aggregate = origWithdrawalAggregate;
    Withdrawal.find = origWithdrawalFind;
    DailyCheckIn.find = origCheckInFind;
    AdImpression.find = origAdFind;
    AdminAuditLog.create = origAuditCreate;
    AdminAuditLog.find = origAuditFind;
    AdminAuditLog.countDocuments = origAuditCountDocuments;
    UserAchievement.countDocuments = origAchievementCountDocuments;
    UserAchievement.find = origAchievementFind;
  });

  // 1. AdminAuditLog Model Validation
  test('AdminAuditLog schema validates required fields and sets defaults for reason and details', async () => {
    const validLog = new AdminAuditLog({
      adminId,
      action: 'USER_STATUS_UPDATED',
      targetType: 'User',
      targetId: 'VEL-894210'
    });

    await validLog.validate();
    assert.equal(validLog.action, 'USER_STATUS_UPDATED');
    assert.equal(validLog.targetType, 'User');
    assert.equal(validLog.targetId, 'VEL-894210');
    assert.equal(validLog.reason, '', 'reason must default to empty string');
    assert.deepEqual(validLog.details, {}, 'details must default to empty object');

    // Missing adminId / action / targetType / targetId fails validation
    const missingLog = new AdminAuditLog({});
    let validationErr = null;
    try {
      await missingLog.validate();
    } catch (err) {
      validationErr = err;
    }
    assert.ok(validationErr, 'Validation must fail when required fields are missing');
    assert.ok(validationErr.errors.adminId);
    assert.ok(validationErr.errors.action);
    assert.ok(validationErr.errors.targetType);
    assert.ok(validationErr.errors.targetId);
  });

  // 2. Route Protection & Authorization
  test('Admin endpoints reject unauthenticated access with 401 and non-admin access with 403', async () => {
    // Unauthenticated
    const unauthRes = await request(app).get('/api/admin/dashboard/stats');
    assert.equal(unauthRes.statusCode, 401);
    assert.equal(unauthRes.body.success, false);

    // Non-admin user
    const forbiddenRes = await request(app)
      .get('/api/admin/dashboard/stats')
      .set('Authorization', `Bearer ${normalToken}`);
    assert.equal(forbiddenRes.statusCode, 403);
    assert.equal(forbiddenRes.body.success, false);

    // Authenticated admin
    const adminRes = await request(app)
      .get('/api/admin/dashboard/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(adminRes.statusCode, 200);
    assert.equal(adminRes.body.success, true);
  });

  // 3. Dashboard Telemetry
  test('GET /api/admin/dashboard/stats returns live MongoDB aggregated statistics', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.stats);
    assert.equal(res.body.data.stats.totalUsers, 1);
    assert.equal(res.body.data.stats.totalRewardsDistributed, 4850.50);

    // Verify aggregated wallet balances across all assets
    assert.ok(res.body.data.aggregatedWalletBalances);
    assert.equal(res.body.data.aggregatedWalletBalances.ves, 4850.50);
    assert.equal(res.body.data.aggregatedWalletBalances.sves, 1220.00);
    assert.equal(res.body.data.aggregatedWalletBalances.gems, 345);
    assert.equal(res.body.data.aggregatedWalletBalances.tokens, 85.00);
    assert.equal(res.body.data.aggregatedWalletBalances.xp, 12450);

    // Verify withdrawals by status
    assert.ok(res.body.data.withdrawalsByStatus);
    assert.equal(res.body.data.withdrawalsByStatus.PENDING.count, 2);
    assert.equal(res.body.data.withdrawalsByStatus.PENDING.totalAmount, 50.00);
    assert.equal(res.body.data.withdrawalsByStatus.APPROVED.count, 5);

    // Verify recent activity and audit summaries
    assert.ok(Array.isArray(res.body.data.rewardDistribution));
    assert.ok(Array.isArray(res.body.data.recentActivities));
    assert.ok(Array.isArray(res.body.data.recentAdminLogs));
  });

  // 4. User Directory with Search (q), Filter & Privacy Safeguards
  test('GET /api/admin/users supports pagination, search q, filter and never exposes passwordHash', async () => {
    const res = await request(app)
      .get('/api/admin/users?q=Alexander&status=Active&page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.users));
    assert.equal(res.body.users.length, 1);
    assert.equal(res.body.users[0].fullName, 'Alexander Wright');
    assert.equal(res.body.users[0].vesBalance, 4850.50);
    assert.equal(res.body.users[0].referralsCount, 5);

    // Verify passwordHash is never returned
    assert.equal(res.body.users[0].passwordHash, undefined);
  });

  // 5. User Details by ID with Wallet, LevelProgress, Achievements & Audit Entries
  test('GET /api/admin/users/:id retrieves full details or returns compliant 404 message', async () => {
    // 404 for unknown user
    const notFoundRes = await request(app)
      .get('/api/admin/users/non-existent-user-id')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(notFoundRes.statusCode, 404);
    assert.equal(notFoundRes.body.success, false);
    assert.equal(
      notFoundRes.body.message,
      "Member with identifier 'non-existent-user-id' was not found in the directory."
    );

    // 200 for existing user with complete composite profile
    const foundRes = await request(app)
      .get(`/api/admin/users/${targetUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(foundRes.statusCode, 200);
    assert.equal(foundRes.body.success, true);
    assert.equal(foundRes.body.user.fullName, 'Alexander Wright');
    assert.equal(foundRes.body.user.userId, 'VEL-894210');
    assert.ok(foundRes.body.user.wallet);
    assert.equal(foundRes.body.user.wallet.ves, 4850.50);
    assert.ok(foundRes.body.user.levelProgress);
    assert.equal(foundRes.body.user.levelProgress.currentLevel, 4);
    assert.ok(Array.isArray(foundRes.body.user.achievements));
    assert.ok(Array.isArray(foundRes.body.user.recentWithdrawals));
    assert.ok(Array.isArray(foundRes.body.user.auditLogs));
    assert.equal(foundRes.body.user.referralsCount, 5);
  });

  // 6. User Status Update (Suspension with Mandatory Reason)
  test('PATCH /api/admin/users/:id/status modifies status and commits AdminAuditLog entry', async () => {
    // Missing reason fails when suspending
    const badReq = await request(app)
      .patch(`/api/admin/users/${targetUserId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Suspended' });

    assert.equal(badReq.statusCode, 400);
    assert.equal(badReq.body.success, false);

    // Valid suspension
    const suspendRes = await request(app)
      .patch(`/api/admin/users/${targetUserId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Suspended', reason: 'Violation of Terms: Automated reward scraping' });

    assert.equal(suspendRes.statusCode, 200);
    assert.equal(suspendRes.body.success, true);
    assert.equal(suspendRes.body.user.accountStatus, 'Suspended');

    // Audit log was recorded
    assert.equal(mockAuditLogs.length, 1);
    assert.equal(mockAuditLogs[0].action, 'USER_STATUS_UPDATED');
    assert.equal(mockAuditLogs[0].targetType, 'User');
    assert.equal(mockAuditLogs[0].targetId, 'VEL-894210');
    assert.equal(mockAuditLogs[0].reason, 'Violation of Terms: Automated reward scraping');
  });

  // 7. Auditable Reward Balance Adjustment (Supports XP, Syncs Level, Transactions)
  test('POST /api/admin/rewards/adjust adjusts balances, syncs level on XP, and logs audit record', async () => {
    // 1. Adjust VEs
    const adjustRes = await request(app)
      .post('/api/admin/rewards/adjust')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId: 'VEL-894210',
        asset: 'ves',
        amount: 100,
        reason: 'Promotion Campaign Bonus'
      });

    assert.equal(adjustRes.statusCode, 200);
    assert.equal(adjustRes.body.success, true);
    assert.equal(adjustRes.body.wallet.newBalance, 4950.50);

    // Verify audit log
    const adjustLog = mockAuditLogs.find(l => l.action === 'WALLET_ADJUSTED');
    assert.ok(adjustLog);
    assert.equal(adjustLog.reason, 'Promotion Campaign Bonus');

    // 2. Adjust XP and sync level
    const xpAdjustRes = await request(app)
      .post('/api/admin/rewards/adjust')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId: 'VEL-894210',
        asset: 'xp',
        amount: 3000,
        reason: 'Level Advancement Compensation'
      });

    assert.equal(xpAdjustRes.statusCode, 200);
    assert.equal(xpAdjustRes.body.wallet.newBalance, 15450); // Level 5 Diamond Legend (>15,000)

    // 3. Negative balance adjustment rejection
    const invalidAdjust = await request(app)
      .post('/api/admin/rewards/adjust')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId: 'VEL-894210',
        asset: 'ves',
        amount: -99999,
        reason: 'Excessive debit attempt'
      });

    assert.equal(invalidAdjust.statusCode, 400);
    assert.equal(invalidAdjust.body.success, false);
  });

  // 8. Immutable Administrative Audit Ledger with Optional Filtering
  test('GET /api/admin/audit-logs returns recorded security events and filters by action', async () => {
    mockAuditLogs.push({
      _id: new mongoose.Types.ObjectId(),
      adminId,
      adminUser: 'admin@veloop.io (Admin)',
      action: 'USER_STATUS_UPDATED',
      actionType: 'USER_STATUS_UPDATED',
      targetType: 'User',
      targetId: 'VEL-894210',
      previousValue: 'Status: Active',
      newValue: 'Status: Suspended',
      createdAt: new Date('2026-10-28T09:45:12Z'),
      reason: 'Automated script detection on click fraud'
    });

    const res = await request(app)
      .get('/api/admin/audit-logs?action=USER_STATUS_UPDATED')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.equal(res.body.data.length, 1);
    assert.equal(res.body.data[0].action, 'USER_STATUS_UPDATED');
    assert.equal(res.body.data[0].targetId, 'VEL-894210');
  });

  // 9. Levels, Achievements, Settings Configurations
  test('Levels, achievements, and settings endpoints return canonical definitions and allow audited updates', async () => {
    // Levels
    const levelsRes = await request(app)
      .get('/api/admin/levels')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(levelsRes.statusCode, 200);
    assert.equal(levelsRes.body.data.length, 5);

    const updateLevelRes = await request(app)
      .put('/api/admin/levels/lvl_4')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Gold Pioneer Updated', multiplier: '1.30x' });
    assert.equal(updateLevelRes.statusCode, 200);

    // Achievements
    const achRes = await request(app)
      .get('/api/admin/achievements')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(achRes.statusCode, 200);
    assert.equal(achRes.body.data.length, 7);

    // Settings
    const settingsRes = await request(app)
      .get('/api/admin/settings')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(settingsRes.statusCode, 200);
    assert.equal(settingsRes.body.data.platformName, 'VELoop Rewards');

    const updateSettingsRes = await request(app)
      .put('/api/admin/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ platformName: 'VELoop Rewards Global' });
    assert.equal(updateSettingsRes.statusCode, 200);
    assert.equal(updateSettingsRes.body.data.platformName, 'VELoop Rewards Global');
  });
});
