const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('../server');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const { generateToken } = require('../utils/jwt');
const { calculateLevelProgress, awardUserXP } = require('../services/levelService');
const { LEVEL_TIERS } = require('../config/levelTiers');

describe('Step 8: Level & XP Progression Suite', () => {
  describe('Pure Calculation Logic (calculateLevelProgress)', () => {
    test('XP = 0 gives Level 1 Bronze Initiate at 0% progress with 2,500 XP remaining', () => {
      const res = calculateLevelProgress(0);
      assert.equal(res.currentLevel, 1);
      assert.equal(res.levelName, 'Bronze Initiate');
      assert.equal(res.totalXP, 0);
      assert.equal(res.currentLevelXPRequirement, 0);
      assert.equal(res.nextLevelXPRequirement, 2500);
      assert.equal(res.remainingXP, 2500);
      assert.equal(res.progressPercentage, 0);
      assert.equal(res.rewardMultiplier, '1.00x');
      assert.ok(typeof res.perks === 'string');
    });

    test('XP = 1,250 gives Level 1 at exactly 50% progress with 1,250 XP remaining', () => {
      const res = calculateLevelProgress(1250);
      assert.equal(res.currentLevel, 1);
      assert.equal(res.totalXP, 1250);
      assert.equal(res.remainingXP, 1250);
      assert.equal(res.progressPercentage, 50);
    });

    test('XP = 2,499 gives Level 1 capped at 99% progress with 1 XP remaining', () => {
      const res = calculateLevelProgress(2499);
      assert.equal(res.currentLevel, 1);
      assert.equal(res.totalXP, 2499);
      assert.equal(res.remainingXP, 1);
      assert.equal(res.progressPercentage, 99);
    });

    test('XP = 2,500 graduates to Level 2 Silver Explorer at 0% tier progress', () => {
      const res = calculateLevelProgress(2500);
      assert.equal(res.currentLevel, 2);
      assert.equal(res.levelName, 'Silver Explorer');
      assert.equal(res.totalXP, 2500);
      assert.equal(res.currentLevelXPRequirement, 2500);
      assert.equal(res.nextLevelXPRequirement, 6000);
      assert.equal(res.remainingXP, 3500);
      assert.equal(res.progressPercentage, 0);
      assert.equal(res.rewardMultiplier, '1.10x');
    });

    test('XP = 5,999 gives Level 2 capped at 99% progress with 1 XP remaining', () => {
      const res = calculateLevelProgress(5999);
      assert.equal(res.currentLevel, 2);
      assert.equal(res.remainingXP, 1);
      assert.equal(res.progressPercentage, 99);
    });

    test('XP = 6,000 graduates to Level 3 Titanium Voyager at 0% tier progress', () => {
      const res = calculateLevelProgress(6000);
      assert.equal(res.currentLevel, 3);
      assert.equal(res.levelName, 'Titanium Voyager');
      assert.equal(res.totalXP, 6000);
      assert.equal(res.currentLevelXPRequirement, 6000);
      assert.equal(res.nextLevelXPRequirement, 10000);
      assert.equal(res.remainingXP, 4000);
      assert.equal(res.progressPercentage, 0);
      assert.equal(res.rewardMultiplier, '1.15x');
    });

    test('XP = 9,999 gives Level 3 capped at 99% progress with 1 XP remaining', () => {
      const res = calculateLevelProgress(9999);
      assert.equal(res.currentLevel, 3);
      assert.equal(res.remainingXP, 1);
      assert.equal(res.progressPercentage, 99);
    });

    test('XP = 10,000 graduates to Level 4 Gold Pioneer at 0% tier progress', () => {
      const res = calculateLevelProgress(10000);
      assert.equal(res.currentLevel, 4);
      assert.equal(res.levelName, 'Gold Pioneer');
      assert.equal(res.totalXP, 10000);
      assert.equal(res.currentLevelXPRequirement, 10000);
      assert.equal(res.nextLevelXPRequirement, 15000);
      assert.equal(res.remainingXP, 5000);
      assert.equal(res.progressPercentage, 0);
      assert.equal(res.rewardMultiplier, '1.25x');
    });

    test('XP = 14,999 gives Level 4 capped at 99% progress with 1 XP remaining', () => {
      const res = calculateLevelProgress(14999);
      assert.equal(res.currentLevel, 4);
      assert.equal(res.remainingXP, 1);
      assert.equal(res.progressPercentage, 99);
    });

    test('XP = 15,000 graduates to Level 5 Diamond Legend with 100% progress and 0 remaining XP', () => {
      const res = calculateLevelProgress(15000);
      assert.equal(res.currentLevel, 5);
      assert.equal(res.levelName, 'Diamond Legend');
      assert.equal(res.totalXP, 15000);
      assert.equal(res.currentLevelXPRequirement, 15000);
      assert.equal(res.nextLevelXPRequirement, 15000);
      assert.equal(res.remainingXP, 0);
      assert.equal(res.progressPercentage, 100);
      assert.equal(res.rewardMultiplier, '1.50x');
    });

    test('XP = 50,000 stays at Level 5 Diamond Legend with 100% progress and 0 remaining XP', () => {
      const res = calculateLevelProgress(50000);
      assert.equal(res.currentLevel, 5);
      assert.equal(res.totalXP, 50000);
      assert.equal(res.remainingXP, 0);
      assert.equal(res.progressPercentage, 100);
    });

    test('handles negative, non-numeric, or null XP defensively by treating as 0', () => {
      assert.equal(calculateLevelProgress(-50).totalXP, 0);
      assert.equal(calculateLevelProgress(null).totalXP, 0);
      assert.equal(calculateLevelProgress('invalid').totalXP, 0);
      assert.equal(calculateLevelProgress(undefined).totalXP, 0);
    });
  });

  describe('awardUserXP Internal Service', () => {
    let originalWalletFindOneAndUpdate;
    let originalUserFindById;
    let originalUserFindByIdAndUpdate;

    beforeEach(() => {
      originalWalletFindOneAndUpdate = Wallet.findOneAndUpdate;
      originalUserFindById = User.findById;
      originalUserFindByIdAndUpdate = User.findByIdAndUpdate;
    });

    afterEach(() => {
      Wallet.findOneAndUpdate = originalWalletFindOneAndUpdate;
      User.findById = originalUserFindById;
      User.findByIdAndUpdate = originalUserFindByIdAndUpdate;
    });

    test('rejects negative or zero XP award amounts', async () => {
      await assert.rejects(
        () => awardUserXP('507f1f77bcf86cd799439011', 0),
        /XP award amount must be a positive integer/
      );
      await assert.rejects(
        () => awardUserXP('507f1f77bcf86cd799439011', -100),
        /XP award amount must be a positive integer/
      );
    });

    test('rejects non-integer XP award amounts', async () => {
      await assert.rejects(
        () => awardUserXP('507f1f77bcf86cd799439011', 12.5),
        /XP award amount must be a positive integer/
      );
      await assert.rejects(
        () => awardUserXP('507f1f77bcf86cd799439011', '100'),
        /XP award amount must be a positive integer/
      );
    });

    test('rejects missing or invalid userId', async () => {
      await assert.rejects(
        () => awardUserXP(null, 500),
        /User ID is required to award XP/
      );
    });

    test('throws error if user wallet is not found', async () => {
      Wallet.findOneAndUpdate = async () => null;
      await assert.rejects(
        () => awardUserXP('507f1f77bcf86cd799439011', 500),
        /Wallet not found for user/
      );
    });

    test('successfully increments wallet XP and updates user level when graduating', async () => {
      const mockUserId = '507f1f77bcf86cd799439011';
      let updatedUserLevel = null;

      Wallet.findOneAndUpdate = async (query, update, options) => {
        assert.equal(query.user, mockUserId);
        assert.equal(update.$inc.xpTotal, 3000);
        return {
          user: mockUserId,
          xpTotal: 3000
        };
      };

      User.findById = async (id) => ({
        _id: id,
        level: 1
      });

      User.findByIdAndUpdate = async (id, update) => {
        updatedUserLevel = update.level;
        return { _id: id, level: update.level };
      };

      const result = await awardUserXP(mockUserId, 3000, 'Quest Completion');
      assert.equal(result.amountAwarded, 3000);
      assert.equal(result.newTotalXP, 3000);
      assert.equal(result.currentLevel, 2);
      assert.equal(result.didLevelUp, true);
      assert.equal(updatedUserLevel, 2);
    });
  });

  describe('Level Progress API Endpoint (GET /api/profile/level-progress)', () => {
    let originalUserFindById;
    let originalWalletFindOne;
    const testUserId = '507f1f77bcf86cd799439011';
    let validUserToken;

    const createQueryChain = (result) => ({
      select: () => Promise.resolve(result),
      then: (resolve, reject) => Promise.resolve(result).then(resolve, reject)
    });

    beforeEach(() => {
      originalUserFindById = User.findById;
      originalWalletFindOne = Wallet.findOne;
      validUserToken = generateToken({
        _id: testUserId,
        id: testUserId,
        email: 'testuser@veloop.io',
        role: 'user'
      });

      // Default User mock for protect middleware
      User.findById = (id) => {
        const idStr = id ? id.toString() : '';
        if (idStr === testUserId) {
          return createQueryChain({
            _id: testUserId,
            id: testUserId,
            email: 'testuser@veloop.io',
            role: 'user',
            level: 1
          });
        }
        return createQueryChain(null);
      };
    });

    afterEach(() => {
      User.findById = originalUserFindById;
      Wallet.findOne = originalWalletFindOne;
    });

    test('rejects unauthenticated request with HTTP 401', async () => {
      const res = await request(app).get('/api/profile/level-progress');
      assert.equal(res.statusCode, 401);
      assert.equal(res.body.success, false);
    });

    test('returns HTTP 404 if user wallet is missing', async () => {
      Wallet.findOne = () => createQueryChain(null);

      const res = await request(app)
        .get('/api/profile/level-progress')
        .set('Authorization', `Bearer ${validUserToken}`);

      assert.equal(res.statusCode, 404);
      assert.equal(res.body.success, false);
      assert.ok(res.body.message.includes('Wallet not found'));
    });

    test('returns HTTP 200 with level progress data matching wallet xpTotal', async () => {
      Wallet.findOne = () => createQueryChain({
        user: testUserId,
        xpTotal: 2500
      });

      const res = await request(app)
        .get('/api/profile/level-progress')
        .set('Authorization', `Bearer ${validUserToken}`);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.currentLevel, 2);
      assert.equal(res.body.data.levelName, 'Silver Explorer');
      assert.equal(res.body.data.totalXP, 2500);
      assert.equal(res.body.data.currentLevelXPRequirement, 2500);
      assert.equal(res.body.data.nextLevelXPRequirement, 6000);
      assert.equal(res.body.data.remainingXP, 3500);
      assert.equal(res.body.data.progressPercentage, 0);
      assert.equal(res.body.data.rewardMultiplier, '1.10x');
    });

    test('GET /api/profile embeds levelProgress in user profile response', async () => {
      Wallet.findOne = () => createQueryChain({
        user: testUserId,
        vesBalance: 100,
        svesBalance: 50,
        gemsBalance: 25,
        tokensBalance: 10,
        xpTotal: 6000
      });

      const res = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${validUserToken}`);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.levelProgress);
      assert.equal(res.body.data.levelProgress.currentLevel, 3);
      assert.equal(res.body.data.levelProgress.levelName, 'Titanium Voyager');
      assert.equal(res.body.data.level, 3);
    });
  });
});
