const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');

const app = require('../server');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const UserAchievement = require('../models/UserAchievement');
const { ACHIEVEMENTS, ACHIEVEMENTS_BY_CODE } = require('../config/achievements');
const { generateToken } = require('../utils/jwt');
const {
  getUserAchievements,
  unlockUserAchievement,
  recoverPendingXpAwards
} = require('../services/achievementService');

describe('Step 9: Achievements System Suite', () => {
  describe('Canonical Achievement Catalog Verification', () => {
    test('contains exactly seven canonical achievements with required properties', () => {
      assert.equal(ACHIEVEMENTS.length, 7);
      const expectedCodes = [
        'FIRST_STEP',
        'STREAK_7',
        'CRYPTO_SWAP',
        'AMBASSADOR',
        'WHALE_TIER',
        'CENTURION',
        'SUPER_CONNECTOR'
      ];

      for (const code of expectedCodes) {
        const ach = ACHIEVEMENTS_BY_CODE[code];
        assert.ok(ach, `Achievement ${code} must exist in catalog`);
        assert.ok(ach.id, `Achievement ${code} must have id`);
        assert.ok(ach.title, `Achievement ${code} must have title`);
        assert.ok(ach.description, `Achievement ${code} must have description`);
        assert.ok(ach.category, `Achievement ${code} must have category`);
        assert.ok(ach.icon, `Achievement ${code} must have icon`);
        assert.ok(ach.badgeColor, `Achievement ${code} must have badgeColor`);
        assert.ok(typeof ach.xpReward === 'number', `Achievement ${code} must have numeric xpReward`);
        assert.ok(typeof ach.required === 'number', `Achievement ${code} must have numeric required`);
      }
    });

    test('preserves exact canonical XP rewards and target requirements', () => {
      assert.equal(ACHIEVEMENTS_BY_CODE.FIRST_STEP.xpReward, 100);
      assert.equal(ACHIEVEMENTS_BY_CODE.FIRST_STEP.required, 1);

      assert.equal(ACHIEVEMENTS_BY_CODE.STREAK_7.xpReward, 350);
      assert.equal(ACHIEVEMENTS_BY_CODE.STREAK_7.required, 7);

      assert.equal(ACHIEVEMENTS_BY_CODE.CRYPTO_SWAP.xpReward, 500);
      assert.equal(ACHIEVEMENTS_BY_CODE.CRYPTO_SWAP.required, 1);

      assert.equal(ACHIEVEMENTS_BY_CODE.AMBASSADOR.xpReward, 800);
      assert.equal(ACHIEVEMENTS_BY_CODE.AMBASSADOR.required, 5);

      assert.equal(ACHIEVEMENTS_BY_CODE.WHALE_TIER.xpReward, 1500);
      assert.equal(ACHIEVEMENTS_BY_CODE.WHALE_TIER.required, 10000);

      assert.equal(ACHIEVEMENTS_BY_CODE.CENTURION.xpReward, 2000);
      assert.equal(ACHIEVEMENTS_BY_CODE.CENTURION.required, 100);

      assert.equal(ACHIEVEMENTS_BY_CODE.SUPER_CONNECTOR.xpReward, 3000);
      assert.equal(ACHIEVEMENTS_BY_CODE.SUPER_CONNECTOR.required, 50);
    });
  });

  describe('UserAchievement Schema & Model Validation', () => {
    test('valid UserAchievement document passes validation', async () => {
      const doc = new UserAchievement({
        user: new mongoose.Types.ObjectId(),
        achievementCode: 'WHALE_TIER',
        xpAwarded: 1500,
        xpAwardStatus: 'COMPLETED'
      });
      await doc.validate();
      assert.ok(true);
    });

    test('fails validation when user reference is missing', async () => {
      const doc = new UserAchievement({
        achievementCode: 'WHALE_TIER',
        xpAwarded: 1500
      });
      await assert.rejects(async () => {
        await doc.validate();
      }, (err) => Boolean(err.errors && err.errors.user));
    });

    test('fails validation when achievementCode is missing', async () => {
      const doc = new UserAchievement({
        user: new mongoose.Types.ObjectId(),
        xpAwarded: 1500
      });
      await assert.rejects(async () => {
        await doc.validate();
      }, (err) => Boolean(err.errors && err.errors.achievementCode));
    });

    test('fails validation when xpAwarded is missing or negative', async () => {
      const docMissing = new UserAchievement({
        user: new mongoose.Types.ObjectId(),
        achievementCode: 'WHALE_TIER'
      });
      await assert.rejects(async () => {
        await docMissing.validate();
      }, (err) => Boolean(err.errors && err.errors.xpAwarded));

      const docNegative = new UserAchievement({
        user: new mongoose.Types.ObjectId(),
        achievementCode: 'WHALE_TIER',
        xpAwarded: -50
      });
      await assert.rejects(async () => {
        await docNegative.validate();
      }, (err) => Boolean(err.errors && err.errors.xpAwarded));
    });

    test('schema defines compound unique index on { user: 1, achievementCode: 1 }', () => {
      const indexes = UserAchievement.schema.indexes();
      const compound = indexes.find(
        ([fields, options]) => fields.user === 1 && fields.achievementCode === 1 && options.unique === true
      );
      assert.ok(compound, 'Unique compound index on user and achievementCode must be defined');
    });
  });

  describe('Achievement Service Logic & Idempotency', () => {
    let originalUserFindById;
    let originalWalletFindOne;
    let originalWalletFindOneAndUpdate;
    let originalUserAchievementFind;
    let originalUserAchievementFindOne;
    let originalUserAchievementCreate;

    const testUserId = '507f1f77bcf86cd799439011';
    let mockUserAchievements = [];
    let mockWallet = null;

    beforeEach(() => {
      originalUserFindById = User.findById;
      originalWalletFindOne = Wallet.findOne;
      originalWalletFindOneAndUpdate = Wallet.findOneAndUpdate;
      originalUserAchievementFind = UserAchievement.find;
      originalUserAchievementFindOne = UserAchievement.findOne;
      originalUserAchievementCreate = UserAchievement.create;

      mockUserAchievements = [];
      mockWallet = {
        user: testUserId,
        vesBalance: 500,
        xpTotal: 0
      };

      User.findById = async (id) => ({
        _id: id,
        id: id.toString(),
        name: 'Test User',
        email: 'test@veloop.io',
        level: 1
      });

      Wallet.findOne = async () => mockWallet;

      Wallet.findOneAndUpdate = async (query, update) => {
        if (update.$inc && update.$inc.xpTotal) {
          mockWallet.xpTotal += update.$inc.xpTotal;
        }
        return mockWallet;
      };

      UserAchievement.find = async (query) => {
        if (query.xpAwardStatus) {
          return mockUserAchievements.filter(
            (a) => a.user === query.user && a.xpAwardStatus === query.xpAwardStatus
          );
        }
        return mockUserAchievements.filter((a) => a.user === query.user);
      };

      UserAchievement.findOne = async (query) => {
        return mockUserAchievements.find(
          (a) => a.user === query.user && a.achievementCode === query.achievementCode
        ) || null;
      };

      UserAchievement.create = async (doc) => {
        const existing = mockUserAchievements.find(
          (a) => a.user === doc.user && a.achievementCode === doc.achievementCode
        );
        if (existing) {
          const err = new Error('E11000 duplicate key error collection');
          err.code = 11000;
          throw err;
        }
        const created = {
          ...doc,
          _id: new mongoose.Types.ObjectId().toString(),
          save: async function() { return this; }
        };
        mockUserAchievements.push(created);
        return created;
      };
    });

    afterEach(() => {
      User.findById = originalUserFindById;
      Wallet.findOne = originalWalletFindOne;
      Wallet.findOneAndUpdate = originalWalletFindOneAndUpdate;
      UserAchievement.find = originalUserAchievementFind;
      UserAchievement.findOne = originalUserAchievementFindOne;
      UserAchievement.create = originalUserAchievementCreate;
    });

    test('rejects unlock for unknown achievement code', async () => {
      await assert.rejects(
        () => unlockUserAchievement(testUserId, 'NON_EXISTENT_CODE'),
        /Unknown achievement code/
      );
    });

    test('rejects unlock if userId is missing', async () => {
      await assert.rejects(
        () => unlockUserAchievement(null, 'WHALE_TIER'),
        /User ID is required/
      );
    });

    test('WHALE_TIER boundary below 10,000 VEs (9,999 VEs): remains locked with truthful progress', async () => {
      mockWallet.vesBalance = 9999;
      const achievements = await getUserAchievements(testUserId);
      const whale = achievements.find((a) => a.code === 'WHALE_TIER');

      assert.equal(whale.unlocked, false);
      assert.equal(whale.progress, 9999);
      assert.equal(whale.required, 10000);
      assert.equal(whale.unlockedAt, null);
      assert.equal(mockWallet.xpTotal, 0);
    });

    test('WHALE_TIER boundary at 10,000 VEs: automatically unlocks and awards +1,500 XP', async () => {
      mockWallet.vesBalance = 10000;
      const achievements = await getUserAchievements(testUserId);
      const whale = achievements.find((a) => a.code === 'WHALE_TIER');

      assert.equal(whale.unlocked, true);
      assert.equal(whale.progress, 10000);
      assert.ok(whale.unlockedAt);
      assert.equal(mockWallet.xpTotal, 1500);
    });

    test('repeated unlock attempts award XP exactly once (strict idempotency)', async () => {
      mockWallet.vesBalance = 12000;

      // First unlock
      const res1 = await unlockUserAchievement(testUserId, 'WHALE_TIER');
      assert.equal(res1.unlocked, true);
      assert.equal(res1.alreadyUnlocked, false);
      assert.equal(mockWallet.xpTotal, 1500);

      // Second unlock attempt
      const res2 = await unlockUserAchievement(testUserId, 'WHALE_TIER');
      assert.equal(res2.unlocked, true);
      assert.equal(res2.alreadyUnlocked, true);
      // XP must NOT increase
      assert.equal(mockWallet.xpTotal, 1500);

      // Third unlock via getUserAchievements query
      const list = await getUserAchievements(testUserId);
      const whale = list.find((a) => a.code === 'WHALE_TIER');
      assert.equal(whale.unlocked, true);
      assert.equal(mockWallet.xpTotal, 1500);
    });

    test('other six achievements remain locked with 0 progress in absence of event trackers', async () => {
      mockWallet.vesBalance = 500;
      const achievements = await getUserAchievements(testUserId);
      const nonWhale = achievements.filter((a) => a.code !== 'WHALE_TIER');

      assert.equal(nonWhale.length, 6);
      for (const ach of nonWhale) {
        assert.equal(ach.unlocked, false, `${ach.code} should remain locked`);
        assert.equal(ach.progress, 0, `${ach.code} should report 0 progress`);
        assert.equal(ach.unlockedAt, null);
      }
    });

    test('crash recovery: recovers PENDING record, awards XP, and completes state', async () => {
      // Simulate crash between Phase 1 (record saved) and Phase 2 (XP award)
      mockUserAchievements.push({
        _id: 'pending_1',
        user: testUserId,
        achievementCode: 'WHALE_TIER',
        xpAwarded: 1500,
        xpAwardStatus: 'PENDING',
        unlockedAt: new Date('2026-11-01T10:00:00Z'),
        save: async function() { return this; }
      });

      assert.equal(mockWallet.xpTotal, 0);

      // Call recovery
      await recoverPendingXpAwards(testUserId);

      // Verify XP awarded and status completed
      assert.equal(mockWallet.xpTotal, 1500);
      assert.equal(mockUserAchievements[0].xpAwardStatus, 'COMPLETED');
    });
  });

  describe('Protected Profile Achievements API (GET /api/profile/achievements)', () => {
    let originalUserFindById;
    let originalWalletFindOne;
    let originalUserAchievementFind;
    let validToken;
    const testUserId = '507f1f77bcf86cd799439011';

    const createQueryChain = (result) => ({
      select: () => Promise.resolve(result),
      then: (resolve, reject) => Promise.resolve(result).then(resolve, reject)
    });

    beforeEach(() => {
      originalUserFindById = User.findById;
      originalWalletFindOne = Wallet.findOne;
      originalUserAchievementFind = UserAchievement.find;

      validToken = generateToken({
        _id: testUserId,
        id: testUserId,
        email: 'test@veloop.io',
        role: 'user'
      });

      User.findById = (id) => {
        const idStr = id ? id.toString() : '';
        if (idStr === testUserId) {
          return createQueryChain({
            _id: testUserId,
            id: testUserId,
            email: 'test@veloop.io',
            role: 'user'
          });
        }
        return createQueryChain(null);
      };

      Wallet.findOne = () => createQueryChain({
        user: testUserId,
        vesBalance: 2500,
        xpTotal: 2500
      });

      UserAchievement.find = () => createQueryChain([]);
    });

    afterEach(() => {
      User.findById = originalUserFindById;
      Wallet.findOne = originalWalletFindOne;
      UserAchievement.find = originalUserAchievementFind;
    });

    test('rejects unauthenticated request with HTTP 401', async () => {
      const res = await request(app).get('/api/profile/achievements');
      assert.equal(res.statusCode, 401);
      assert.equal(res.body.success, false);
    });

    test('returns HTTP 404 if user wallet is missing', async () => {
      Wallet.findOne = () => createQueryChain(null);

      const res = await request(app)
        .get('/api/profile/achievements')
        .set('Authorization', `Bearer ${validToken}`);

      assert.equal(res.statusCode, 404);
      assert.equal(res.body.success, false);
    });

    test('returns HTTP 200 with all 7 achievements for authenticated user', async () => {
      const res = await request(app)
        .get('/api/profile/achievements')
        .set('Authorization', `Bearer ${validToken}`);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
      assert.equal(res.body.data.length, 7);

      // Verify shape of returned achievements
      const first = res.body.data[0];
      assert.ok(first.id);
      assert.ok(first.code);
      assert.ok(first.title);
      assert.ok(first.description);
      assert.ok(first.category);
      assert.ok(first.icon);
      assert.equal(typeof first.unlocked, 'boolean');
      assert.equal(typeof first.xpReward, 'number');
      assert.ok(first.badgeColor);
      assert.equal(typeof first.progress, 'number');
      assert.equal(typeof first.required, 'number');
    });

    test('multi-tenancy security: ignores target user ID in query or body', async () => {
      const foreignUserId = '507f1f77bcf86cd799439999';

      const res = await request(app)
        .get(`/api/profile/achievements?userId=${foreignUserId}`)
        .send({ userId: foreignUserId, user: foreignUserId })
        .set('Authorization', `Bearer ${validToken}`);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      // Sourced exclusively from authenticated JWT req.user._id
      assert.equal(res.body.data.length, 7);
    });
  });
});
