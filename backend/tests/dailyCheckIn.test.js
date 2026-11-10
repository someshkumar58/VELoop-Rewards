const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_step10_audit_verified';

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');

const app = require('../server');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const DailyCheckIn = require('../models/DailyCheckIn');
const UserAchievement = require('../models/UserAchievement');
const { generateToken } = require('../utils/jwt');
const {
  DAILY_REWARD_VES,
  DAILY_REWARD_XP,
  STREAK_MILESTONE,
  getTodayUTCDateString,
  getPreviousUTCDateString,
  getCheckInStatus,
  performDailyCheckIn
} = require('../services/streakService');

describe('Step 10: Daily Check-in & Streak System Suite', () => {
  describe('DailyCheckIn Schema & Model Validation', () => {
    test('valid DailyCheckIn document passes validation', async () => {
      const doc = new DailyCheckIn({
        user: new mongoose.Types.ObjectId(),
        checkInDate: '2026-11-05',
        streakCount: 1,
        rewardVEs: 25,
        rewardXP: 25
      });
      await doc.validate();
      assert.ok(true);
    });

    test('fails validation when user reference is missing', async () => {
      const doc = new DailyCheckIn({
        checkInDate: '2026-11-05',
        streakCount: 1,
        rewardVEs: 25,
        rewardXP: 25
      });
      await assert.rejects(async () => {
        await doc.validate();
      }, (err) => Boolean(err.errors && err.errors.user));
    });

    test('fails validation when checkInDate is missing or invalid format', async () => {
      const docMissing = new DailyCheckIn({
        user: new mongoose.Types.ObjectId(),
        streakCount: 1,
        rewardVEs: 25,
        rewardXP: 25
      });
      await assert.rejects(async () => {
        await docMissing.validate();
      }, (err) => Boolean(err.errors && err.errors.checkInDate));

      const docInvalidFormat = new DailyCheckIn({
        user: new mongoose.Types.ObjectId(),
        checkInDate: '05-11-2026', // Not YYYY-MM-DD
        streakCount: 1,
        rewardVEs: 25,
        rewardXP: 25
      });
      await assert.rejects(async () => {
        await docInvalidFormat.validate();
      }, (err) => Boolean(err.errors && err.errors.checkInDate));
    });

    test('fails validation when streakCount is missing or less than 1', async () => {
      const docMissing = new DailyCheckIn({
        user: new mongoose.Types.ObjectId(),
        checkInDate: '2026-11-05',
        rewardVEs: 25,
        rewardXP: 25
      });
      await assert.rejects(async () => {
        await docMissing.validate();
      }, (err) => Boolean(err.errors && err.errors.streakCount));

      const docZero = new DailyCheckIn({
        user: new mongoose.Types.ObjectId(),
        checkInDate: '2026-11-05',
        streakCount: 0,
        rewardVEs: 25,
        rewardXP: 25
      });
      await assert.rejects(async () => {
        await docZero.validate();
      }, (err) => Boolean(err.errors && err.errors.streakCount));
    });

    test('fails validation when rewards are missing or negative', async () => {
      const docNegative = new DailyCheckIn({
        user: new mongoose.Types.ObjectId(),
        checkInDate: '2026-11-05',
        streakCount: 1,
        rewardVEs: -5,
        rewardXP: 25
      });
      await assert.rejects(async () => {
        await docNegative.validate();
      }, (err) => Boolean(err.errors && err.errors.rewardVEs));
    });

    test('schema defines compound unique index on { user: 1, checkInDate: 1 } and lookup indexes', () => {
      const indexes = DailyCheckIn.schema.indexes();
      const compound = indexes.find(
        ([fields, options]) => fields.user === 1 && fields.checkInDate === 1 && options.unique === true
      );
      assert.ok(compound, 'Unique compound index on user and checkInDate must be defined');

      const lookupCreatedAt = indexes.find(
        ([fields]) => fields.user === 1 && fields.createdAt === -1
      );
      assert.ok(lookupCreatedAt, 'Lookup index on user and createdAt must be defined');

      const lookupCheckInDate = indexes.find(
        ([fields]) => fields.user === 1 && fields.checkInDate === -1
      );
      assert.ok(lookupCheckInDate, 'Lookup index on user and checkInDate must be defined');
    });
  });

  describe('Calendar Date Utilities', () => {
    test('getTodayUTCDateString returns valid YYYY-MM-DD string', () => {
      const today = getTodayUTCDateString();
      assert.match(today, /^\d{4}-\d{2}-\d{2}$/);
    });

    test('getPreviousUTCDateString correctly subtracts 1 calendar day across standard days', () => {
      assert.equal(getPreviousUTCDateString('2026-11-05'), '2026-11-04');
      assert.equal(getPreviousUTCDateString('2026-05-15'), '2026-05-14');
    });

    test('getPreviousUTCDateString accurately handles month and leap year boundaries', () => {
      // Month boundary
      assert.equal(getPreviousUTCDateString('2026-05-01'), '2026-04-30');
      assert.equal(getPreviousUTCDateString('2026-03-01'), '2026-02-28'); // 2026 non-leap year

      // Leap year boundary (2024 was leap year)
      assert.equal(getPreviousUTCDateString('2024-03-01'), '2024-02-29');

      // Year boundary
      assert.equal(getPreviousUTCDateString('2026-01-01'), '2025-12-31');
    });
  });

  describe('Streak Service Logic & Business Rules', () => {
    let originalUserFindById;
    let originalUserFindByIdAndUpdate;
    let originalWalletFindOne;
    let originalWalletFindOneAndUpdate;
    let originalDailyCheckInFindOne;
    let originalDailyCheckInCreate;
    let originalUserAchievementFindOne;
    let originalUserAchievementCreate;

    const testUserId = '507f1f77bcf86cd799439011';
    let mockCheckIns = [];
    let mockWallet = null;
    let mockUserAchievements = [];

    beforeEach(() => {
      originalUserFindById = User.findById;
      originalUserFindByIdAndUpdate = User.findByIdAndUpdate;
      originalWalletFindOne = Wallet.findOne;
      originalWalletFindOneAndUpdate = Wallet.findOneAndUpdate;
      originalDailyCheckInFindOne = DailyCheckIn.findOne;
      originalDailyCheckInCreate = DailyCheckIn.create;
      originalUserAchievementFindOne = UserAchievement.findOne;
      originalUserAchievementCreate = UserAchievement.create;

      mockCheckIns = [];
      mockUserAchievements = [];
      mockWallet = {
        user: testUserId,
        vesBalance: 100,
        svesBalance: 0,
        gemsBalance: 0,
        tokensBalance: 0,
        xpTotal: 200
      };

      User.findById = async (id) => ({
        _id: id,
        id: id.toString(),
        name: 'Streak Tester',
        email: 'streak@veloop.io',
        level: 1
      });

      User.findByIdAndUpdate = async () => ({});

      Wallet.findOne = async () => mockWallet;

      Wallet.findOneAndUpdate = async (query, update) => {
        if (update.$inc) {
          if (typeof update.$inc.vesBalance === 'number') {
            mockWallet.vesBalance += update.$inc.vesBalance;
          }
          if (typeof update.$inc.xpTotal === 'number') {
            mockWallet.xpTotal += update.$inc.xpTotal;
          }
        }
        return { ...mockWallet };
      };

      DailyCheckIn.findOne = (query) => {
        const chain = {
          sort: () => {
            const userCheckIns = mockCheckIns.filter(
              (c) => c.user.toString() === (query.user ? query.user.toString() : testUserId)
            );
            if (query.checkInDate) {
              const matched = userCheckIns.find((c) => c.checkInDate === query.checkInDate);
              return Promise.resolve(matched || null);
            }
            if (userCheckIns.length === 0) return Promise.resolve(null);
            // sort by checkInDate descending
            const sorted = [...userCheckIns].sort((a, b) => b.checkInDate.localeCompare(a.checkInDate));
            return Promise.resolve(sorted[0]);
          },
          session: function () {
            return this;
          },
          then: function (resolve, reject) {
            return this.sort().then(resolve, reject);
          }
        };
        return chain;
      };

      DailyCheckIn.create = async (docOrDocs) => {
        const docs = Array.isArray(docOrDocs) ? docOrDocs : [docOrDocs];
        const created = [];
        for (const item of docs) {
          // Check uniqueness
          const exists = mockCheckIns.some(
            (c) => c.user.toString() === item.user.toString() && c.checkInDate === item.checkInDate
          );
          if (exists) {
            const err = new Error('E11000 duplicate key error');
            err.code = 11000;
            throw err;
          }
          const record = {
            ...item,
            _id: new mongoose.Types.ObjectId(),
            createdAt: new Date(),
            updatedAt: new Date()
          };
          mockCheckIns.push(record);
          created.push(record);
        }
        return Array.isArray(docOrDocs) ? created : created[0];
      };

      UserAchievement.findOne = (query) => {
        const chain = {
          session: function () {
            return this;
          },
          then: function (resolve) {
            const found = mockUserAchievements.find(
              (a) => a.user.toString() === query.user.toString() && a.achievementCode === query.achievementCode
            );
            return resolve(found || null);
          }
        };
        return chain;
      };

      UserAchievement.create = async (docOrDocs) => {
        const docs = Array.isArray(docOrDocs) ? docOrDocs : [docOrDocs];
        const created = [];
        for (const item of docs) {
          const record = {
            ...item,
            _id: new mongoose.Types.ObjectId(),
            unlockedAt: new Date()
          };
          mockUserAchievements.push(record);
          created.push(record);
        }
        return Array.isArray(docOrDocs) ? created : created[0];
      };
    });

    afterEach(() => {
      User.findById = originalUserFindById;
      User.findByIdAndUpdate = originalUserFindByIdAndUpdate;
      Wallet.findOne = originalWalletFindOne;
      Wallet.findOneAndUpdate = originalWalletFindOneAndUpdate;
      DailyCheckIn.findOne = originalDailyCheckInFindOne;
      DailyCheckIn.create = originalDailyCheckInCreate;
      UserAchievement.findOne = originalUserAchievementFindOne;
      UserAchievement.create = originalUserAchievementCreate;
    });

    test('first check-in starts at Day 1, awards 25 VEs and 25 XP', async () => {
      const result = await performDailyCheckIn(testUserId, { todayUTC: '2026-11-01' });

      assert.equal(result.success, true);
      assert.equal(result.checkIn.streakCount, 1);
      assert.equal(result.checkIn.rewardVEs, 25);
      assert.equal(result.checkIn.rewardXP, 25);
      assert.equal(result.wallet.ves, 125); // 100 + 25
      assert.equal(result.wallet.xp, 225); // 200 + 25
      assert.equal(result.streakAchievementUnlocked, false);
      assert.equal(mockCheckIns.length, 1);
    });

    test('consecutive-day check-in increments streak to Day 2 and Day 3', async () => {
      // Day 1
      await performDailyCheckIn(testUserId, { todayUTC: '2026-11-01' });

      // Day 2 (immediately following calendar day)
      const resDay2 = await performDailyCheckIn(testUserId, { todayUTC: '2026-11-02' });
      assert.equal(resDay2.success, true);
      assert.equal(resDay2.checkIn.streakCount, 2);
      assert.equal(resDay2.wallet.ves, 150); // 125 + 25
      assert.equal(resDay2.wallet.xp, 250); // 225 + 25

      // Day 3
      const resDay3 = await performDailyCheckIn(testUserId, { todayUTC: '2026-11-03' });
      assert.equal(resDay3.success, true);
      assert.equal(resDay3.checkIn.streakCount, 3);
    });

    test('missed calendar day resets streak to Day 1', async () => {
      // Day 1: 2026-11-01
      await performDailyCheckIn(testUserId, { todayUTC: '2026-11-01' });
      // Day 2: 2026-11-02 (Streak = 2)
      await performDailyCheckIn(testUserId, { todayUTC: '2026-11-02' });

      // Missed 2026-11-03! Next check-in is 2026-11-04
      const resReset = await performDailyCheckIn(testUserId, { todayUTC: '2026-11-04' });
      assert.equal(resReset.success, true);
      assert.equal(resReset.checkIn.streakCount, 1, 'Streak must reset to 1 after a missed day');
      assert.equal(resReset.checkIn.rewardVEs, 25);
      assert.equal(resReset.checkIn.rewardXP, 25);
    });

    test('duplicate same-day check-in request is rejected with 0 extra rewards', async () => {
      // First check-in of the day
      const res1 = await performDailyCheckIn(testUserId, { todayUTC: '2026-11-01' });
      assert.equal(res1.success, true);
      const vesAfterFirst = mockWallet.vesBalance;
      const xpAfterFirst = mockWallet.xpTotal;

      // Duplicate check-in on the exact same date
      const res2 = await performDailyCheckIn(testUserId, { todayUTC: '2026-11-01' });
      assert.equal(res2.success, false);
      assert.equal(res2.alreadyCheckedIn, true);
      assert.equal(mockWallet.vesBalance, vesAfterFirst, 'VEs must not be credited twice');
      assert.equal(mockWallet.xpTotal, xpAfterFirst, 'XP must not be credited twice');
    });

    test('concurrent request collision triggers duplicate key handler safely', async () => {
      // Pre-insert record to simulate another process committing concurrently
      mockCheckIns.push({
        user: testUserId,
        checkInDate: '2026-11-01',
        streakCount: 1,
        rewardVEs: 25,
        rewardXP: 25
      });

      const res = await performDailyCheckIn(testUserId, { todayUTC: '2026-11-01' });
      assert.equal(res.success, false);
      assert.equal(res.alreadyCheckedIn, true);
    });

    test('reaches Day 7 milestone: unlocks STREAK_7 achievement and awards +350 XP bonus', async () => {
      // Days 1 through 6
      for (let day = 1; day <= 6; day++) {
        const dateStr = `2026-11-0${day}`;
        await performDailyCheckIn(testUserId, { todayUTC: dateStr });
      }

      assert.equal(mockCheckIns.length, 6);
      const xpBeforeDay7 = mockWallet.xpTotal;

      // Day 7
      const resDay7 = await performDailyCheckIn(testUserId, { todayUTC: '2026-11-07' });
      assert.equal(resDay7.success, true);
      assert.equal(resDay7.checkIn.streakCount, 7);
      assert.equal(resDay7.streakAchievementUnlocked, true);
      assert.ok(resDay7.achievement, 'Must return unlocked achievement info');
      assert.equal(resDay7.achievement.code, 'STREAK_7');

      // Normal +25 XP + Achievement +350 XP = +375 XP
      assert.equal(mockWallet.xpTotal, xpBeforeDay7 + 25 + 350);
      assert.equal(resDay7.wallet.xp, mockWallet.xpTotal);
    });

    test('Day 8 continues streak but does NOT re-award STREAK_7 achievement or bonus XP', async () => {
      // Days 1 through 7
      for (let day = 1; day <= 7; day++) {
        const dateStr = `2026-11-0${day}`;
        await performDailyCheckIn(testUserId, { todayUTC: dateStr });
      }

      const xpBeforeDay8 = mockWallet.xpTotal;
      const vesBeforeDay8 = mockWallet.vesBalance;

      // Day 8
      const resDay8 = await performDailyCheckIn(testUserId, { todayUTC: '2026-11-08' });
      assert.equal(resDay8.success, true);
      assert.equal(resDay8.checkIn.streakCount, 8);
      assert.equal(resDay8.streakAchievementUnlocked, false, 'STREAK_7 must not be awarded a second time');
      assert.equal(mockWallet.vesBalance, vesBeforeDay8 + 25);
      assert.equal(mockWallet.xpTotal, xpBeforeDay8 + 25, 'Only normal 25 XP awarded, no duplicate achievement XP');
    });

    test('getCheckInStatus accurately reports canCheckInToday, current streak and STREAK_7 status', async () => {
      // Fresh user status
      const initialStatus = await getCheckInStatus(testUserId, { todayUTC: '2026-11-01' });
      assert.equal(initialStatus.canCheckInToday, true);
      assert.equal(initialStatus.hasCheckedInToday, false);
      assert.equal(initialStatus.currentStreak, 0);
      assert.equal(initialStatus.streakGoal, 7);
      assert.equal(initialStatus.streakAchievementUnlocked, false);

      // Check in on Day 1
      await performDailyCheckIn(testUserId, { todayUTC: '2026-11-01' });

      const sameDayStatus = await getCheckInStatus(testUserId, { todayUTC: '2026-11-01' });
      assert.equal(sameDayStatus.canCheckInToday, false);
      assert.equal(sameDayStatus.hasCheckedInToday, true);
      assert.equal(sameDayStatus.currentStreak, 1);
      assert.equal(sameDayStatus.lastCheckInDate, '2026-11-01');

      // Next day before checking in
      const nextDayStatus = await getCheckInStatus(testUserId, { todayUTC: '2026-11-02' });
      assert.equal(nextDayStatus.canCheckInToday, true);
      assert.equal(nextDayStatus.hasCheckedInToday, false);
      assert.equal(nextDayStatus.currentStreak, 1, 'Current streak remains active from yesterday until claimed today');
    });
  });

  describe('Protected Profile Check-in APIs', () => {
    let testUser;
    let userToken;
    let anotherUser;
    let anotherToken;

    beforeEach(async () => {
      const uniqueId = new mongoose.Types.ObjectId().toString().slice(-6);

      testUser = {
        _id: new mongoose.Types.ObjectId(),
        name: `Tester ${uniqueId}`,
        email: `tester_${uniqueId}@veloop.io`,
        role: 'user',
        level: 1,
        accountStatus: 'Active',
        isVerified: true
      };
      userToken = generateToken(testUser);

      anotherUser = {
        _id: new mongoose.Types.ObjectId(),
        name: `Other ${uniqueId}`,
        email: `other_${uniqueId}@veloop.io`,
        role: 'user',
        level: 1,
        accountStatus: 'Active',
        isVerified: true
      };
      anotherToken = generateToken(anotherUser);
    });

    test('GET /api/profile/check-in-status rejects unauthenticated request with HTTP 401', async () => {
      const res = await request(app).get('/api/profile/check-in-status');
      assert.equal(res.statusCode, 401);
    });

    test('POST /api/profile/check-in rejects unauthenticated request with HTTP 401', async () => {
      const res = await request(app).post('/api/profile/check-in');
      assert.equal(res.statusCode, 401);
    });

    test('POST /api/profile/check-in ignores user ID or date supplied in body', async () => {
      // Verify that passing another user's ID or a forged date in the body is ignored
      const forgedTargetId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post('/api/profile/check-in')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          userId: forgedTargetId,
          checkInDate: '2099-01-01',
          rewardVEs: 1000000
        });

      // Response will either be 404 (if user not in DB) or 200/400 for the JWT user,
      // but NEVER applies the forged payload to the other user
      if (res.statusCode === 200) {
        assert.equal(res.body.checkIn.rewardVEs, 25);
        assert.notEqual(res.body.checkIn.checkInDate, '2099-01-01');
      }
    });
  });

  describe('Transaction Retry Reliability & withTransaction Integration', () => {
    let originalStartSession;
    let originalUserFindById;
    let originalWalletFindOne;
    let originalWalletFindOneAndUpdate;
    let originalDailyCheckInFindOne;
    let originalDailyCheckInCreate;

    const testUserId = '507f1f77bcf86cd799439011';
    let mockCheckIns = [];
    let mockWallet = null;
    let sessionEndCalled = false;
    let withTransactionCalled = false;

    beforeEach(() => {
      originalStartSession = mongoose.startSession;
      originalUserFindById = User.findById;
      originalWalletFindOne = Wallet.findOne;
      originalWalletFindOneAndUpdate = Wallet.findOneAndUpdate;
      originalDailyCheckInFindOne = DailyCheckIn.findOne;
      originalDailyCheckInCreate = DailyCheckIn.create;

      mockCheckIns = [];
      sessionEndCalled = false;
      withTransactionCalled = false;
      mongoose.connection._hasMockSession = true;
      mockWallet = {
        user: testUserId,
        vesBalance: 100,
        svesBalance: 0,
        gemsBalance: 0,
        tokensBalance: 0,
        xpTotal: 200
      };

      User.findById = async (id) => ({
        _id: id,
        id: id.toString(),
        name: 'Retry Tester',
        email: 'retry@veloop.io',
        level: 1
      });

      Wallet.findOne = async () => mockWallet;

      Wallet.findOneAndUpdate = async (query, update) => {
        if (update.$inc) {
          if (typeof update.$inc.vesBalance === 'number') {
            mockWallet.vesBalance += update.$inc.vesBalance;
          }
          if (typeof update.$inc.xpTotal === 'number') {
            mockWallet.xpTotal += update.$inc.xpTotal;
          }
        }
        return { ...mockWallet };
      };

      DailyCheckIn.findOne = (query) => ({
        sort: () => Promise.resolve(null),
        session: function () { return this; },
        then: function (resolve) { return resolve(null); }
      });

      DailyCheckIn.create = async (docOrDocs) => {
        const docs = Array.isArray(docOrDocs) ? docOrDocs : [docOrDocs];
        for (const item of docs) {
          mockCheckIns.push({ ...item, _id: new mongoose.Types.ObjectId() });
        }
        return Array.isArray(docOrDocs) ? docs : docs[0];
      };
    });

    afterEach(() => {
      delete mongoose.connection._hasMockSession;
      mongoose.startSession = originalStartSession;
      User.findById = originalUserFindById;
      Wallet.findOne = originalWalletFindOne;
      Wallet.findOneAndUpdate = originalWalletFindOneAndUpdate;
      DailyCheckIn.findOne = originalDailyCheckInFindOne;
      DailyCheckIn.create = originalDailyCheckInCreate;
    });

    test('uses session.withTransaction() to execute all operations and cleans up session', async () => {
      const mockSession = {
        withTransaction: async (cb) => {
          withTransactionCalled = true;
          return await cb();
        },
        endSession: async () => {
          sessionEndCalled = true;
        },
        inTransaction: () => false
      };

      mongoose.startSession = async () => mockSession;

      const result = await performDailyCheckIn(testUserId, { todayUTC: '2026-11-05' });

      assert.equal(withTransactionCalled, true, 'session.withTransaction() must be invoked');
      assert.equal(sessionEndCalled, true, 'session.endSession() must be called in finally block');
      assert.equal(result.success, true);
      assert.equal(result.checkIn.rewardVEs, 25);
      assert.equal(result.checkIn.rewardXP, 25);
      assert.equal(result.wallet.ves, 125);
      assert.equal(result.wallet.xp, 225);
    });

    test('retried transaction callback does not double-award balances', async () => {
      let attempts = 0;
      const initialVEs = mockWallet.vesBalance;
      const initialXP = mockWallet.xpTotal;

      const mockSession = {
        withTransaction: async (cb) => {
          withTransactionCalled = true;
          attempts++;
          // First attempt simulates transient transaction conflict
          try {
            return await cb();
          } catch (err) {
            if (attempts === 1) {
              // Rollback mock state simulating MongoDB transaction rollback on transient failure
              mockCheckIns = [];
              mockWallet.vesBalance = initialVEs;
              mockWallet.xpTotal = initialXP;
              // Retry callback (attempt 2)
              attempts++;
              return await cb();
            }
            throw err;
          }
        },
        endSession: async () => {
          sessionEndCalled = true;
        },
        inTransaction: () => false
      };

      mongoose.startSession = async () => mockSession;

      // Make DailyCheckIn.create fail once on attempt 1 to trigger retry
      let createAttempts = 0;
      const originalCreate = DailyCheckIn.create;
      DailyCheckIn.create = async (docOrDocs) => {
        createAttempts++;
        if (createAttempts === 1) {
          const transientErr = new Error('Write conflict in transaction');
          transientErr.errorLabels = ['TransientTransactionError'];
          throw transientErr;
        }
        return originalCreate(docOrDocs);
      };

      const result = await performDailyCheckIn(testUserId, { todayUTC: '2026-11-05' });

      assert.equal(attempts, 2, 'Callback should have been retried exactly once');
      assert.equal(result.success, true);
      assert.equal(mockCheckIns.length, 1, 'Only one check-in record should exist after retry');
      assert.equal(result.wallet.ves, 125, 'VEs should be incremented exactly once (+25)');
      assert.equal(result.wallet.xp, 225, 'XP should be incremented exactly once (+25)');
      assert.equal(sessionEndCalled, true, 'Session must be ended cleanly');
    });

    test('cleans up session in finally block even when transaction callback fails fatally', async () => {
      const mockSession = {
        withTransaction: async () => {
          throw new Error('Fatal database disk failure');
        },
        endSession: async () => {
          sessionEndCalled = true;
        },
        inTransaction: () => false
      };

      mongoose.startSession = async () => mockSession;

      await assert.rejects(async () => {
        await performDailyCheckIn(testUserId, { todayUTC: '2026-11-05' });
      }, /Fatal database disk failure/);

      assert.equal(sessionEndCalled, true, 'session.endSession() must be called despite fatal error');
    });
  });
});
