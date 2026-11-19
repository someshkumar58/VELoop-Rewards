const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_phase2b_ads_verified';

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');

const app = require('../server');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const AdImpression = require('../models/AdImpression');
const { generateToken } = require('../utils/jwt');
const adService = require('../services/adService');

describe('Phase 2B.1: Ad Watching & Security Engine Suite', () => {
  // Test User IDs
  const userL1Id = new mongoose.Types.ObjectId(); // Level 1 (0 XP)
  const userL2Id = new mongoose.Types.ObjectId(); // Level 2 (3,000 XP)
  const userL4Id = new mongoose.Types.ObjectId(); // Level 4 (12,000 XP)
  const suspendedUserId = new mongoose.Types.ObjectId(); // Suspended

  let tokenUserL1;
  let tokenUserL2;
  let tokenUserL4;
  let tokenSuspended;

  let originalUserFindById;
  let originalWalletFindOne;
  let originalWalletFindOneAndUpdate;
  let originalAdFind;
  let originalAdFindOne;
  let originalAdFindById;
  let originalAdCreate;
  let originalAdCountDocuments;
  let originalAdFindOneAndUpdate;

  let mockUsers = [];
  let mockWallets = [];
  let mockAds = [];

  const createQueryChain = (result) => ({
    select: function () { return this; },
    sort: function (sortObj) {
      if (Array.isArray(result)) {
        if (sortObj && sortObj.completedAt === -1) {
          result.sort((a, b) => new Date(b.completedAt || b.createdAt || 0) - new Date(a.completedAt || a.createdAt || 0));
        }
      } else if (result) {
        // If single document result, keep it
      }
      return this;
    },
    skip: function () { return this; },
    limit: function () { return this; },
    populate: function () { return Promise.resolve(result); },
    session: function () { return this; },
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject)
  });

  beforeEach(() => {
    // Generate auth tokens
    tokenUserL1 = generateToken({ _id: userL1Id, id: userL1Id.toString(), role: 'user', email: 'l1@veloop.io' });
    tokenUserL2 = generateToken({ _id: userL2Id, id: userL2Id.toString(), role: 'user', email: 'l2@veloop.io' });
    tokenUserL4 = generateToken({ _id: userL4Id, id: userL4Id.toString(), role: 'user', email: 'l4@veloop.io' });
    tokenSuspended = generateToken({ _id: suspendedUserId, id: suspendedUserId.toString(), role: 'user', email: 'suspended@veloop.io' });

    // Save originals
    originalUserFindById = User.findById;
    originalWalletFindOne = Wallet.findOne;
    originalWalletFindOneAndUpdate = Wallet.findOneAndUpdate;
    originalAdFind = AdImpression.find;
    originalAdFindOne = AdImpression.findOne;
    originalAdFindById = AdImpression.findById;
    originalAdCreate = AdImpression.create;
    originalAdCountDocuments = AdImpression.countDocuments;
    originalAdFindOneAndUpdate = AdImpression.findOneAndUpdate;

    // In-memory mock datasets
    mockUsers = [
      {
        _id: userL1Id,
        id: userL1Id.toString(),
        name: 'Level 1 User',
        fullName: 'Level 1 User',
        email: 'l1@veloop.io',
        role: 'user',
        accountStatus: 'Active',
        userId: 'VEL-L01'
      },
      {
        _id: userL2Id,
        id: userL2Id.toString(),
        name: 'Level 2 User',
        fullName: 'Level 2 User',
        email: 'l2@veloop.io',
        role: 'user',
        accountStatus: 'Active',
        userId: 'VEL-L02'
      },
      {
        _id: userL4Id,
        id: userL4Id.toString(),
        name: 'Level 4 User',
        fullName: 'Level 4 User',
        email: 'l4@veloop.io',
        role: 'user',
        accountStatus: 'Active',
        userId: 'VEL-L04'
      },
      {
        _id: suspendedUserId,
        id: suspendedUserId.toString(),
        name: 'Suspended User',
        fullName: 'Suspended User',
        email: 'suspended@veloop.io',
        role: 'user',
        accountStatus: 'Suspended',
        userId: 'VEL-SUS'
      }
    ];

    mockWallets = [
      {
        _id: new mongoose.Types.ObjectId(),
        user: userL1Id,
        vesBalance: 100.00,
        svesBalance: 0,
        gemsBalance: 0,
        tokensBalance: 10.00,
        xpTotal: 0 // Level 1 (1.00x multiplier)
      },
      {
        _id: new mongoose.Types.ObjectId(),
        user: userL2Id,
        vesBalance: 200.00,
        svesBalance: 0,
        gemsBalance: 0,
        tokensBalance: 20.00,
        xpTotal: 3000 // Level 2 (1.10x multiplier -> 16.50 VEs)
      },
      {
        _id: new mongoose.Types.ObjectId(),
        user: userL4Id,
        vesBalance: 500.00,
        svesBalance: 0,
        gemsBalance: 0,
        tokensBalance: 50.00,
        xpTotal: 12000 // Level 4 (1.25x multiplier -> 18.75 VEs)
      },
      {
        _id: new mongoose.Types.ObjectId(),
        user: suspendedUserId,
        vesBalance: 50.00,
        svesBalance: 0,
        gemsBalance: 0,
        tokensBalance: 5.00,
        xpTotal: 500
      }
    ];

    mockAds = [];

    // Setup in-memory mock handlers
    User.findById = (id) => {
      const u = mockUsers.find((x) => x._id.toString() === id.toString());
      return createQueryChain(u);
    };

    Wallet.findOne = (filter) => {
      const targetUserId = filter.user ? filter.user.toString() : null;
      const w = mockWallets.find((x) => x.user.toString() === targetUserId);
      return createQueryChain(w ? { ...w } : null);
    };

    Wallet.findOneAndUpdate = async (filter, update) => {
      const targetUserId = filter.user ? filter.user.toString() : null;
      const w = mockWallets.find((x) => x.user.toString() === targetUserId);
      if (!w) return null;

      if (update.$inc && update.$inc.vesBalance !== undefined) {
        w.vesBalance += update.$inc.vesBalance;
        w.vesBalance = Math.round(w.vesBalance * 100) / 100;
      }
      return { ...w };
    };

    AdImpression.create = async (records) => {
      const list = Array.isArray(records) ? records : [records];
      const created = list.map((d) => {
        const doc = {
          _id: new mongoose.Types.ObjectId(),
          ...d,
          createdAt: d.createdAt || new Date(),
          updatedAt: d.updatedAt || new Date(),
          save: async function () {
            Object.assign(this, { updatedAt: new Date() });
            return this;
          }
        };
        mockAds.push(doc);
        return doc;
      });
      return Array.isArray(records) ? created : created[0];
    };

    AdImpression.findOne = (filter) => {
      let filtered = mockAds.filter((a) => {
        if (filter.impressionToken && a.impressionToken !== filter.impressionToken) return false;
        if (filter.userId && a.userId.toString() !== filter.userId.toString()) return false;
        if (filter.status) {
          if (filter.status.$in) {
            if (!filter.status.$in.includes(a.status)) return false;
          } else if (a.status !== filter.status) {
            return false;
          }
        }
        return true;
      });

      // Sort by completedAt / createdAt desc if requested
      filtered.sort((a, b) => new Date(b.completedAt || b.createdAt || 0) - new Date(a.completedAt || a.createdAt || 0));

      const found = filtered[0] || null;
      if (found && typeof found.save !== 'function') {
        found.save = async function () {
          Object.assign(this, { updatedAt: new Date() });
          return this;
        };
      }
      return createQueryChain(found ? { ...found } : null);
    };

    AdImpression.findById = (id) => {
      const found = mockAds.find((a) => a._id.toString() === id.toString());
      return createQueryChain(found ? { ...found } : null);
    };

    AdImpression.find = (filter) => {
      const results = mockAds.filter((a) => {
        if (filter.userId && a.userId.toString() !== filter.userId.toString()) return false;
        if (filter.status && a.status !== filter.status) return false;
        return true;
      });
      return createQueryChain(results);
    };

    AdImpression.countDocuments = async (filter) => {
      const count = mockAds.filter((a) => {
        if (filter.userId && a.userId.toString() !== filter.userId.toString()) return false;
        if (filter.status) {
          if (filter.status.$in) {
            if (!filter.status.$in.includes(a.status)) return false;
          } else if (a.status !== filter.status) {
            return false;
          }
        }
        return true;
      }).length;
      return count;
    };

    AdImpression.findOneAndUpdate = async (filter, update) => {
      const found = mockAds.find((a) => {
        if (filter._id && a._id.toString() !== filter._id.toString()) return false;
        if (filter.impressionToken && a.impressionToken !== filter.impressionToken) return false;
        if (filter.status && a.status !== filter.status) return false;
        return true;
      });

      if (!found) return null;

      if (update.$set) {
        Object.assign(found, update.$set, { updatedAt: new Date() });
      }
      return { ...found };
    };
  });

  afterEach(() => {
    User.findById = originalUserFindById;
    Wallet.findOne = originalWalletFindOne;
    Wallet.findOneAndUpdate = originalWalletFindOneAndUpdate;
    AdImpression.find = originalAdFind;
    AdImpression.findOne = originalAdFindOne;
    AdImpression.findById = originalAdFindById;
    AdImpression.create = originalAdCreate;
    AdImpression.countDocuments = originalAdCountDocuments;
    AdImpression.findOneAndUpdate = originalAdFindOneAndUpdate;
  });

  // =========================================================================
  // 1. AdImpression Schema & Model Validation
  // =========================================================================
  describe('AdImpression Schema & Model Validation', () => {
    test('valid AdImpression document passes validation', async () => {
      const doc = new AdImpression({
        userId: userL1Id,
        impressionToken: 'ad_tok_sample_valid_001',
        status: 'STARTED',
        baseReward: 15,
        levelMultiplier: 1.0,
        earnedReward: 15.00,
        durationSeconds: 15,
        expiresAt: new Date(Date.now() + 300000)
      });
      await doc.validate();
      assert.equal(doc.status, 'STARTED');
      assert.equal(doc.baseReward, 15);
      assert.equal(doc.durationSeconds, 15);
    });

    test('fails validation when userId is missing', async () => {
      const doc = new AdImpression({
        impressionToken: 'ad_tok_missing_user',
        status: 'STARTED',
        levelMultiplier: 1.0,
        earnedReward: 15.00,
        expiresAt: new Date()
      });
      await assert.rejects(async () => {
        await doc.validate();
      }, (err) => Boolean(err.errors && err.errors.userId));
    });

    test('fails validation when impressionToken is missing', async () => {
      const doc = new AdImpression({
        userId: userL1Id,
        status: 'STARTED',
        levelMultiplier: 1.0,
        earnedReward: 15.00,
        expiresAt: new Date()
      });
      await assert.rejects(async () => {
        await doc.validate();
      }, (err) => Boolean(err.errors && err.errors.impressionToken));
    });

    test('fails validation when status enum is invalid', async () => {
      const doc = new AdImpression({
        userId: userL1Id,
        impressionToken: 'ad_tok_invalid_status',
        status: 'HACKED',
        levelMultiplier: 1.0,
        earnedReward: 15.00,
        expiresAt: new Date()
      });
      await assert.rejects(async () => {
        await doc.validate();
      }, (err) => Boolean(err.errors && err.errors.status));
    });

    test('fails validation when levelMultiplier is less than 1.0', async () => {
      const doc = new AdImpression({
        userId: userL1Id,
        impressionToken: 'ad_tok_invalid_multiplier',
        status: 'STARTED',
        levelMultiplier: 0.5,
        earnedReward: 7.50,
        expiresAt: new Date()
      });
      await assert.rejects(async () => {
        await doc.validate();
      }, (err) => Boolean(err.errors && err.errors.levelMultiplier));
    });
  });

  // =========================================================================
  // 2. Ad Service Engine & Business Rules
  // =========================================================================
  describe('Ad Service Engine & Business Rules', () => {
    test('startAdSession initializes session with single-use token and 15s duration', async () => {
      const session = await adService.startAdSession(userL1Id);

      assert.equal(session.success, true);
      assert.ok(session.impressionToken.startsWith('ad_'));
      assert.equal(session.durationSeconds, 15);
      assert.equal(session.baseReward, 15);
      assert.equal(session.levelMultiplier, 1.0);
      assert.equal(session.earnedReward, 15.00);

      // Verify record was stored in mock database
      const saved = mockAds.find((a) => a.impressionToken === session.impressionToken);
      assert.ok(saved);
      assert.equal(saved.status, 'STARTED');
    });

    test('accurately calculates level multipliers: Level 2 (+10% -> 16.50 VEs)', async () => {
      const session = await adService.startAdSession(userL2Id);

      assert.equal(session.success, true);
      assert.equal(session.levelMultiplier, 1.10);
      assert.equal(session.earnedReward, 16.50); // 15 * 1.10 = 16.50 VEs
    });

    test('accurately calculates level multipliers: Level 4 (+25% -> 18.75 VEs)', async () => {
      const session = await adService.startAdSession(userL4Id);

      assert.equal(session.success, true);
      assert.equal(session.levelMultiplier, 1.25);
      assert.equal(session.earnedReward, 18.75); // 15 * 1.25 = 18.75 VEs
    });

    test('suspended user is strictly forbidden from starting an ad session (HTTP 403)', async () => {
      await assert.rejects(async () => {
        await adService.startAdSession(suspendedUserId);
      }, (err) => {
        assert.equal(err.statusCode, 403);
        assert.match(err.message, /Account is suspended/i);
        return true;
      });
    });

    test('enforces 60-second cooldown between ads', async () => {
      // Seed a recently completed ad for userL1 (completed 20 seconds ago)
      mockAds.push({
        _id: new mongoose.Types.ObjectId(),
        userId: userL1Id,
        impressionToken: 'ad_tok_recent_cd',
        status: 'CLAIMED',
        completedAt: new Date(Date.now() - 20000), // 20s ago
        createdAt: new Date(Date.now() - 40000)
      });

      // Starting another ad session immediately must fail with cooldown error
      await assert.rejects(async () => {
        await adService.startAdSession(userL1Id);
      }, (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /cooldown active/i);
        assert.ok(err.cooldownRemaining >= 39 && err.cooldownRemaining <= 41);
        return true;
      });
    });

    test('allows starting a new session once the 60-second cooldown expires', async () => {
      // Seed an ad completed 65 seconds ago
      mockAds.push({
        _id: new mongoose.Types.ObjectId(),
        userId: userL1Id,
        impressionToken: 'ad_tok_old_cd',
        status: 'CLAIMED',
        completedAt: new Date(Date.now() - 65000), // 65s ago
        createdAt: new Date(Date.now() - 85000)
      });

      const session = await adService.startAdSession(userL1Id);
      assert.equal(session.success, true);
      assert.ok(session.impressionToken);
    });

    test('enforces daily limit of 20 completed ads per UTC day', async () => {
      // Seed 20 completed ads for userL1 today
      for (let i = 1; i <= 20; i++) {
        mockAds.push({
          _id: new mongoose.Types.ObjectId(),
          userId: userL1Id,
          impressionToken: `ad_tok_daily_${i}`,
          status: 'CLAIMED',
          completedAt: new Date(Date.now() - (3600000 * 2)),
          createdAt: new Date(Date.now() - (3600000 * 2))
        });
      }

      // 21st ad must be rejected
      await assert.rejects(async () => {
        await adService.startAdSession(userL1Id);
      }, (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /Daily limit reached/i);
        assert.equal(err.dailyLimit, 20);
        return true;
      });
    });

    test('rejects claim if minimum 15 seconds have not elapsed', async () => {
      // Start session
      const session = await adService.startAdSession(userL1Id);

      // Attempt immediate claim (0s elapsed)
      await assert.rejects(async () => {
        await adService.claimAdReward(userL1Id, { impressionToken: session.impressionToken });
      }, (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /Minimum watch duration of 15s not met/i);
        return true;
      });

      // Wallet balance must NOT be credited
      const wallet = mockWallets.find((w) => w.user === userL1Id);
      assert.equal(wallet.vesBalance, 100.00);
    });

    test('successfully claims reward and credits wallet after 15 seconds have elapsed', async () => {
      // Seed an impression started 16 seconds ago
      const token = 'ad_tok_ready_to_claim';
      mockAds.push({
        _id: new mongoose.Types.ObjectId(),
        userId: userL1Id,
        impressionToken: token,
        status: 'STARTED',
        baseReward: 15,
        levelMultiplier: 1.0,
        earnedReward: 15.00,
        durationSeconds: 15,
        expiresAt: new Date(Date.now() + 200000),
        createdAt: new Date(Date.now() - 16000) // 16s ago
      });

      const res = await adService.claimAdReward(userL1Id, { impressionToken: token });

      assert.equal(res.success, true);
      assert.equal(res.earnedReward, 15.00);
      assert.equal(res.status, 'CLAIMED');

      // Verify wallet was incremented from 100 to 115 VEs
      const wallet = mockWallets.find((w) => w.user === userL1Id);
      assert.equal(wallet.vesBalance, 115.00);
    });

    test('replay attack prevention: duplicate claim of same token fails with HTTP 400', async () => {
      const token = 'ad_tok_replay_test';
      mockAds.push({
        _id: new mongoose.Types.ObjectId(),
        userId: userL1Id,
        impressionToken: token,
        status: 'STARTED',
        baseReward: 15,
        levelMultiplier: 1.0,
        earnedReward: 15.00,
        durationSeconds: 15,
        expiresAt: new Date(Date.now() + 200000),
        createdAt: new Date(Date.now() - 20000)
      });

      // First claim succeeds
      const firstClaim = await adService.claimAdReward(userL1Id, { impressionToken: token });
      assert.equal(firstClaim.success, true);
      const walletAfterFirst = mockWallets.find((w) => w.user === userL1Id);
      assert.equal(walletAfterFirst.vesBalance, 115.00);

      // Second claim attempt MUST fail and MUST NOT credit wallet again
      await assert.rejects(async () => {
        await adService.claimAdReward(userL1Id, { impressionToken: token });
      }, (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /already been claimed/i);
        return true;
      });

      // Wallet remains strictly 115.00 (not 130.00)
      assert.equal(walletAfterFirst.vesBalance, 115.00);
    });

    test('expired ad session cannot be claimed', async () => {
      const token = 'ad_tok_expired';
      mockAds.push({
        _id: new mongoose.Types.ObjectId(),
        userId: userL1Id,
        impressionToken: token,
        status: 'STARTED',
        baseReward: 15,
        levelMultiplier: 1.0,
        earnedReward: 15.00,
        durationSeconds: 15,
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
        createdAt: new Date(Date.now() - 300000)
      });

      await assert.rejects(async () => {
        await adService.claimAdReward(userL1Id, { impressionToken: token });
      }, (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /session has expired/i);
        return true;
      });
    });
  });

  // =========================================================================
  // 3. Protected Ad API Endpoints (Express Router Integration)
  // =========================================================================
  describe('Protected Ad API Endpoints (Express Router)', () => {
    test('rejects unauthenticated requests to all ad endpoints with HTTP 401', async () => {
      const statusRes = await request(app).get('/api/ads/status');
      assert.equal(statusRes.status, 401);

      const startRes = await request(app).post('/api/ads/start-session').send();
      assert.equal(startRes.status, 401);

      const claimRes = await request(app).post('/api/ads/claim-reward').send({ impressionToken: 'ad_tok_x' });
      assert.equal(claimRes.status, 401);
    });

    test('GET /api/ads/status returns quota, cooldown, and level info for authenticated user', async () => {
      const res = await request(app)
        .get('/api/ads/status')
        .set('Authorization', `Bearer ${tokenUserL1}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.dailyLimit, 20);
      assert.equal(res.body.dailyCompleted, 0);
      assert.equal(res.body.remainingToday, 20);
      assert.equal(res.body.cooldownRemaining, 0);
      assert.equal(res.body.canWatch, true);
      assert.equal(res.body.baseReward, 15);
      assert.equal(res.body.levelMultiplier, 1.0);
      assert.equal(res.body.potentialReward, 15.00);
    });

    test('POST /api/ads/start-session returns 201 with impressionToken and duration', async () => {
      const res = await request(app)
        .post('/api/ads/start-session')
        .set('Authorization', `Bearer ${tokenUserL2}`);

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.ok(res.body.impressionToken.startsWith('ad_'));
      assert.equal(res.body.durationSeconds, 15);
      assert.equal(res.body.levelMultiplier, 1.10);
      assert.equal(res.body.earnedReward, 16.50);
    });

    test('POST /api/ads/claim-reward rejects early claim (<15s) with HTTP 400', async () => {
      // 1. Start session
      const startRes = await request(app)
        .post('/api/ads/start-session')
        .set('Authorization', `Bearer ${tokenUserL1}`);

      const token = startRes.body.impressionToken;

      // 2. Immediate claim
      const claimRes = await request(app)
        .post('/api/ads/claim-reward')
        .set('Authorization', `Bearer ${tokenUserL1}`)
        .send({ impressionToken: token });

      assert.equal(claimRes.status, 400);
      assert.equal(claimRes.body.success, false);
      assert.match(claimRes.body.message, /Minimum watch duration of 15s not met/i);
    });

    test('POST /api/ads/claim-reward succeeds when duration is met and ignores client reward overrides', async () => {
      // Seed impression started 18 seconds ago
      const token = 'ad_tok_http_test_claim';
      mockAds.push({
        _id: new mongoose.Types.ObjectId(),
        userId: userL4Id,
        impressionToken: token,
        status: 'STARTED',
        baseReward: 15,
        levelMultiplier: 1.25,
        earnedReward: 18.75, // 15 * 1.25 = 18.75 VEs
        durationSeconds: 15,
        expiresAt: new Date(Date.now() + 300000),
        createdAt: new Date(Date.now() - 18000)
      });

      // Malicious client tries to send custom amount and multiplier
      const claimRes = await request(app)
        .post('/api/ads/claim-reward')
        .set('Authorization', `Bearer ${tokenUserL4}`)
        .send({
          impressionToken: token,
          amount: 99999, // Ignored
          multiplier: 10 // Ignored
        });

      assert.equal(claimRes.status, 200);
      assert.equal(claimRes.body.success, true);
      assert.equal(claimRes.body.earnedReward, 18.75); // Sourced strictly from database

      const wallet = mockWallets.find((w) => w.user === userL4Id);
      assert.equal(wallet.vesBalance, 518.75); // 500 + 18.75
    });

    test('concurrent claim requests for same token prevent race condition and double-crediting', async () => {
      const token = 'ad_tok_concurrent_test';
      mockAds.push({
        _id: new mongoose.Types.ObjectId(),
        userId: userL1Id,
        impressionToken: token,
        status: 'STARTED',
        baseReward: 15,
        levelMultiplier: 1.0,
        earnedReward: 15.00,
        durationSeconds: 15,
        expiresAt: new Date(Date.now() + 300000),
        createdAt: new Date(Date.now() - 20000)
      });

      // Fire 2 simultaneous requests
      const [res1, res2] = await Promise.all([
        request(app).post('/api/ads/claim-reward').set('Authorization', `Bearer ${tokenUserL1}`).send({ impressionToken: token }),
        request(app).post('/api/ads/claim-reward').set('Authorization', `Bearer ${tokenUserL1}`).send({ impressionToken: token })
      ]);

      const statuses = [res1.status, res2.status].sort();
      // Exactly one must succeed (200), and one must fail (400)
      assert.deepEqual(statuses, [200, 400]);

      // Wallet must be incremented by 15.00 only once
      const wallet = mockWallets.find((w) => w.user === userL1Id);
      assert.equal(wallet.vesBalance, 115.00);
    });
  });
});
