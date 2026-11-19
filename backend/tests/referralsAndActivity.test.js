const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('../server');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const DailyCheckIn = require('../models/DailyCheckIn');
const AdImpression = require('../models/AdImpression');
const Withdrawal = require('../models/Withdrawal');
const UserAchievement = require('../models/UserAchievement');
const { generateToken } = require('../utils/jwt');

describe('Phase 1: Profile Referrals & Recent Activity API Suite', () => {
  let originalUserFind;
  let originalUserFindById;
  let originalDailyCheckInFind;
  let originalAdImpressionFind;
  let originalWithdrawalFind;
  let originalAchievementFind;

  let mockUsers = [];
  let mockCheckIns = [];
  let mockAds = [];
  let mockWithdrawals = [];
  let mockAchievements = [];

  const userA = {
    _id: '507f1f77bcf86cd799439011',
    id: '507f1f77bcf86cd799439011',
    name: 'Alice Referrer',
    fullName: 'Alice Referrer',
    email: 'alice@veloop.io',
    role: 'user',
    accountStatus: 'Active',
    referralCode: 'VEL-ALICE1'
  };

  const userB = {
    _id: '507f1f77bcf86cd799439022',
    id: '507f1f77bcf86cd799439022',
    name: 'Bob Peer',
    fullName: 'Bob Peer',
    email: 'bob@veloop.io',
    role: 'user',
    accountStatus: 'Active',
    referralCode: 'VEL-BOB222'
  };

  const tokenA = generateToken(userA);
  const tokenB = generateToken(userB);

  // Helper for mongoose chained queries
  const createMockChain = (data) => ({
    select: function() { return this; },
    sort: function() { return this; },
    limit: function() { return this; },
    lean: function() { return Promise.resolve(data); },
    then: function(resolve, reject) { return Promise.resolve(data).then(resolve, reject); }
  });

  beforeEach(() => {
    mockUsers = [userA, userB];
    mockCheckIns = [];
    mockAds = [];
    mockWithdrawals = [];
    mockAchievements = [];

    originalUserFind = User.find;
    originalUserFindById = User.findById;
    originalDailyCheckInFind = DailyCheckIn.find;
    originalAdImpressionFind = AdImpression.find;
    originalWithdrawalFind = Withdrawal.find;
    originalAchievementFind = UserAchievement.find;

    User.findById = (id) => {
      const u = mockUsers.find((x) => x._id === id.toString() || x.id === id.toString());
      return {
        select: () => Promise.resolve(u),
        then: (resolve, reject) => Promise.resolve(u).then(resolve, reject)
      };
    };

    User.find = (query) => {
      let filtered = [...mockUsers];
      if (query.referredBy) {
        filtered = filtered.filter((u) => u.referredBy === query.referredBy);
      }
      return createMockChain(filtered);
    };

    DailyCheckIn.find = (query) => {
      const filtered = mockCheckIns.filter((c) => c.user === query.user.toString());
      return createMockChain(filtered);
    };

    AdImpression.find = (query) => {
      const filtered = mockAds.filter((a) => a.userId === query.userId.toString());
      return createMockChain(filtered);
    };

    Withdrawal.find = (query) => {
      const filtered = mockWithdrawals.filter((w) => w.user === query.user.toString());
      return createMockChain(filtered);
    };

    UserAchievement.find = (query) => {
      const filtered = mockAchievements.filter((ach) => ach.user === query.user.toString());
      return createMockChain(filtered);
    };
  });

  afterEach(() => {
    User.find = originalUserFind;
    User.findById = originalUserFindById;
    DailyCheckIn.find = originalDailyCheckInFind;
    AdImpression.find = originalAdImpressionFind;
    Withdrawal.find = originalWithdrawalFind;
    UserAchievement.find = originalAchievementFind;
  });

  // ============================================================================
  // 1. GET /api/profile/referrals
  // ============================================================================
  describe('GET /api/profile/referrals', () => {
    test('rejects unauthenticated request with HTTP 401', async () => {
      const res = await request(app).get('/api/profile/referrals');
      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });

    test('returns zero-state referral metrics for a user with no invited members', async () => {
      const res = await request(app)
        .get('/api/profile/referrals')
        .set('Authorization', `Bearer ${tokenA}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);

      const ref = res.body.referrals || res.body.data;
      assert.equal(ref.referralCode, 'VEL-ALICE1');
      assert.equal(ref.totalReferrals, 0);
      assert.equal(ref.successfulReferrals, 0);
      assert.equal(ref.pendingReferrals, 0);
      assert.equal(ref.referralRewardsVEs, 0);
      assert.equal(ref.referralXPEarned, 0);
      assert.equal(ref.currentMilestoneTarget, 5);
      assert.equal(ref.milestonePercentage, 0);
      assert.ok(Array.isArray(ref.referredUsers));
      assert.equal(ref.referredUsers.length, 0);
    });

    test('calculates accurate referral stats and milestone progression when users are referred', async () => {
      // Simulate two friends joining using Alice's code
      mockUsers.push({
        _id: '507f1f77bcf86cd799439091',
        name: 'Friend One',
        fullName: 'Friend One',
        email: 'friend1@example.com',
        accountStatus: 'Active',
        referredBy: 'VEL-ALICE1',
        createdAt: new Date('2026-11-10T12:00:00Z')
      });
      mockUsers.push({
        _id: '507f1f77bcf86cd799439092',
        name: 'Friend Two',
        fullName: 'Friend Two',
        email: 'friend2@example.com',
        accountStatus: 'Pending',
        referredBy: 'VEL-ALICE1',
        createdAt: new Date('2026-11-12T15:00:00Z')
      });

      const res = await request(app)
        .get('/api/profile/referrals')
        .set('Authorization', `Bearer ${tokenA}`);

      assert.equal(res.status, 200);
      const ref = res.body.referrals;
      assert.equal(ref.totalReferrals, 2);
      assert.equal(ref.successfulReferrals, 1);
      assert.equal(ref.pendingReferrals, 1);
      assert.equal(ref.referralRewardsVEs, 100); // 1 active * 100 VEs
      assert.equal(ref.referralXPEarned, 200);   // 1 active * 200 XP
      assert.equal(ref.currentMilestoneTarget, 5);
      assert.equal(ref.milestonePercentage, 20); // 1/5 = 20%
      assert.equal(ref.referredUsers.length, 2);
    });

    test('multi-tenancy security: User B does not see User A referrals', async () => {
      mockUsers.push({
        _id: '507f1f77bcf86cd799439091',
        name: 'Friend One',
        fullName: 'Friend One',
        email: 'friend1@example.com',
        accountStatus: 'Active',
        referredBy: 'VEL-ALICE1'
      });

      const res = await request(app)
        .get('/api/profile/referrals')
        .set('Authorization', `Bearer ${tokenB}`);

      assert.equal(res.status, 200);
      const ref = res.body.referrals;
      assert.equal(ref.referralCode, 'VEL-BOB222');
      assert.equal(ref.totalReferrals, 0);
      assert.equal(ref.referredUsers.length, 0);
    });
  });

  // ============================================================================
  // 2. GET /api/profile/activity
  // ============================================================================
  describe('GET /api/profile/activity', () => {
    test('rejects unauthenticated request with HTTP 401', async () => {
      const res = await request(app).get('/api/profile/activity');
      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });

    test('returns empty activity ledger when user has no recorded actions', async () => {
      const res = await request(app)
        .get('/api/profile/activity')
        .set('Authorization', `Bearer ${tokenA}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.activities));
      assert.equal(res.body.activities.length, 0);
      assert.equal(res.body.total, 0);
    });

    test('aggregates and chronologically sorts activities across modules', async () => {
      // 1. Check-in event
      mockCheckIns.push({
        _id: 'chk_101',
        user: userA._id,
        streakCount: 3,
        rewardVEs: 25,
        rewardXP: 25,
        createdAt: new Date('2026-11-18T10:00:00Z')
      });

      // 2. Ad watch event (newer)
      mockAds.push({
        _id: 'ad_202',
        userId: userA._id,
        earnedReward: 16.5,
        status: 'CLAIMED',
        completedAt: new Date('2026-11-18T12:00:00Z')
      });

      // 3. Withdrawal event (oldest)
      mockWithdrawals.push({
        _id: 'w_303',
        user: userA._id,
        requestedAmount: 50,
        asset: 'tokens',
        payoutMethod: 'USDC_POLYGON',
        status: 'PENDING',
        createdAt: new Date('2026-11-17T08:00:00Z')
      });

      // 4. Achievement unlock event (newest)
      mockAchievements.push({
        _id: 'ach_404',
        user: userA._id,
        achievementCode: 'STREAK_7',
        xpAwarded: 350,
        unlockedAt: new Date('2026-11-18T14:00:00Z')
      });

      const res = await request(app)
        .get('/api/profile/activity')
        .set('Authorization', `Bearer ${tokenA}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      const acts = res.body.activities;
      assert.equal(acts.length, 4);

      // Verify chronological ordering: newest first
      assert.equal(acts[0].type, 'XP_EARNED');
      assert.equal(acts[0].amount, '+350 XP');
      assert.equal(acts[0].status, 'Completed');

      assert.equal(acts[1].type, 'AD_REWARD');
      assert.equal(acts[1].amount, '+16.5 VEs');

      assert.equal(acts[2].type, 'DAILY_BONUS');
      assert.equal(acts[2].amount, '+25 VEs');

      assert.equal(acts[3].type, 'WITHDRAWAL');
      assert.equal(acts[3].amount, '-50.00 Tokens');
      assert.equal(acts[3].status, 'Pending');
    });

    test('multi-tenancy security: User B cannot see User A activity records', async () => {
      mockCheckIns.push({
        _id: 'chk_101',
        user: userA._id,
        streakCount: 3,
        rewardVEs: 25,
        rewardXP: 25,
        createdAt: new Date('2026-11-18T10:00:00Z')
      });

      const res = await request(app)
        .get('/api/profile/activity')
        .set('Authorization', `Bearer ${tokenB}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.activities.length, 0);
    });
  });
});
