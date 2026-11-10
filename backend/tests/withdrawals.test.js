const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_step11_withdrawals_verified';

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');

const app = require('../server');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Withdrawal = require('../models/Withdrawal');
const UserAchievement = require('../models/UserAchievement');
const { generateToken } = require('../utils/jwt');
const withdrawalService = require('../services/withdrawalService');

describe('Step 11 Phase 2A: Withdrawals & Redemptions Suite', () => {
  // Test IDs
  const userAId = new mongoose.Types.ObjectId();
  const userBId = new mongoose.Types.ObjectId();
  const adminId = new mongoose.Types.ObjectId();

  let tokenUserA;
  let tokenUserB;
  let tokenAdmin;

  let originalUserFindById;
  let originalWalletFindOne;
  let originalWalletFindOneAndUpdate;
  let originalWithdrawalFind;
  let originalWithdrawalFindOne;
  let originalWithdrawalFindById;
  let originalWithdrawalCreate;
  let originalWithdrawalCountDocuments;
  let originalWithdrawalFindOneAndUpdate;

  let mockUsers = [];
  let mockWallets = [];
  let mockWithdrawals = [];

  const createQueryChain = (result) => ({
    select: () => Promise.resolve(result),
    sort: function () { return this; },
    skip: function () { return this; },
    limit: function () { return this; },
    populate: function () { return Promise.resolve(result); },
    session: function () { return this; },
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject)
  });

  beforeEach(() => {
    // Generate auth tokens
    tokenUserA = generateToken(userAId);
    tokenUserB = generateToken(userBId);
    tokenAdmin = generateToken(adminId);

    // Save originals
    originalUserFindById = User.findById;
    originalWalletFindOne = Wallet.findOne;
    originalWalletFindOneAndUpdate = Wallet.findOneAndUpdate;
    originalWithdrawalFind = Withdrawal.find;
    originalWithdrawalFindOne = Withdrawal.findOne;
    originalWithdrawalFindById = Withdrawal.findById;
    originalWithdrawalCreate = Withdrawal.create;
    originalWithdrawalCountDocuments = Withdrawal.countDocuments;
    originalWithdrawalFindOneAndUpdate = Withdrawal.findOneAndUpdate;

    // In-memory mocks
    mockUsers = [
      {
        _id: userAId,
        id: userAId.toString(),
        name: 'Alice User',
        fullName: 'Alice User',
        email: 'alice@veloop.io',
        role: 'user',
        accountStatus: 'Active',
        userId: 'VEL-100001'
      },
      {
        _id: userBId,
        id: userBId.toString(),
        name: 'Bob User',
        fullName: 'Bob User',
        email: 'bob@veloop.io',
        role: 'user',
        accountStatus: 'Active',
        userId: 'VEL-100002'
      },
      {
        _id: adminId,
        id: adminId.toString(),
        name: 'Admin User',
        fullName: 'Admin User',
        email: 'admin@veloop.io',
        role: 'admin',
        accountStatus: 'Active',
        userId: 'VEL-ADM001'
      }
    ];

    mockWallets = [
      {
        _id: new mongoose.Types.ObjectId(),
        user: userAId,
        vesBalance: 500,
        svesBalance: 100,
        gemsBalance: 20,
        tokensBalance: 100.00,
        xpTotal: 3000
      },
      {
        _id: new mongoose.Types.ObjectId(),
        user: userBId,
        vesBalance: 200,
        svesBalance: 0,
        gemsBalance: 5,
        tokensBalance: 15.00,
        xpTotal: 1000
      }
    ];

    mockWithdrawals = [];
  });

  afterEach(() => {
    User.findById = originalUserFindById;
    Wallet.findOne = originalWalletFindOne;
    Wallet.findOneAndUpdate = originalWalletFindOneAndUpdate;
    Withdrawal.find = originalWithdrawalFind;
    Withdrawal.findOne = originalWithdrawalFindOne;
    Withdrawal.findById = originalWithdrawalFindById;
    Withdrawal.create = originalWithdrawalCreate;
    Withdrawal.countDocuments = originalWithdrawalCountDocuments;
    Withdrawal.findOneAndUpdate = originalWithdrawalFindOneAndUpdate;
  });

  // =========================================================================
  // 1. Withdrawal Schema & Model Validation
  // =========================================================================
  describe('Withdrawal Schema & Model Validation', () => {
    test('valid Withdrawal document passes validation', async () => {
      const doc = new Withdrawal({
        requestId: 'W-9901',
        user: userAId,
        requestedAmount: 50.00,
        asset: 'tokens',
        payoutMethod: 'USDC_POLYGON',
        destination: '0x71C...B492',
        status: 'PENDING'
      });
      await doc.validate();
      assert.equal(doc.status, 'PENDING');
      assert.equal(doc.requestedAmount, 50);
      assert.equal(doc.netAmount, 50);
    });

    test('fails validation when user reference is missing', async () => {
      const doc = new Withdrawal({
        requestId: 'W-9902',
        requestedAmount: 50.00,
        destination: '0x123'
      });
      await assert.rejects(async () => {
        await doc.validate();
      }, (err) => Boolean(err.errors && err.errors.user));
    });

    test('fails validation when requestedAmount is zero or negative', async () => {
      const docZero = new Withdrawal({
        requestId: 'W-9903',
        user: userAId,
        requestedAmount: 0,
        destination: '0x123'
      });
      await assert.rejects(async () => {
        await docZero.validate();
      }, (err) => Boolean(err.errors && err.errors.requestedAmount));

      const docNeg = new Withdrawal({
        requestId: 'W-9904',
        user: userAId,
        requestedAmount: -10,
        destination: '0x123'
      });
      await assert.rejects(async () => {
        await docNeg.validate();
      }, (err) => Boolean(err.errors && err.errors.requestedAmount));
    });

    test('fails validation for invalid status enum', async () => {
      const doc = new Withdrawal({
        requestId: 'W-9905',
        user: userAId,
        requestedAmount: 25.00,
        destination: '0x123',
        status: 'PAID' // Non-existent status; real payouts disabled
      });
      await assert.rejects(async () => {
        await doc.validate();
      }, (err) => Boolean(err.errors && err.errors.status));
    });

    test('fails validation for unsupported asset type', async () => {
      const doc = new Withdrawal({
        requestId: 'W-9906',
        user: userAId,
        requestedAmount: 25.00,
        destination: '0x123',
        asset: 'fiat_usd'
      });
      await assert.rejects(async () => {
        await doc.validate();
      }, (err) => Boolean(err.errors && err.errors.asset));
    });

    test('fails validation when asset is ves (strict tokens enum)', async () => {
      const doc = new Withdrawal({
        requestId: 'W-9907',
        user: userAId,
        requestedAmount: 25.00,
        destination: '0x123',
        asset: 'ves'
      });
      await assert.rejects(async () => {
        await doc.validate();
      }, (err) => Boolean(err.errors && err.errors.asset));
    });

    test('passes validation when asset is explicitly tokens', async () => {
      const doc = new Withdrawal({
        requestId: 'W-9908',
        user: userAId,
        requestedAmount: 25.00,
        destination: '0x123',
        asset: 'tokens'
      });
      await doc.validate();
      assert.equal(doc.asset, 'tokens');
    });
  });

  // =========================================================================
  // 2. Withdrawal Service Logic & Balance Reservation
  // =========================================================================
  describe('Withdrawal Service Logic & Balance Reservation', () => {
    beforeEach(() => {
      // Wire in-memory mock handlers
      User.findById = (id) => {
        const u = mockUsers.find((x) => x._id.toString() === id.toString());
        return createQueryChain(u);
      };

      Wallet.findOne = (filter) => {
        const w = mockWallets.find((x) => x.user.toString() === filter.user.toString());
        return createQueryChain(w);
      };

      Wallet.findOneAndUpdate = async (filter, update) => {
        const w = mockWallets.find((x) => x.user.toString() === filter.user.toString());
        if (!w) return null;

        // Check conditional filter (tokensBalance: { $gte: amount })
        if (filter.tokensBalance && filter.tokensBalance.$gte !== undefined) {
          if (w.tokensBalance < filter.tokensBalance.$gte) {
            return null; // Condition not met (insufficient balance)
          }
        }

        if (update.$inc && update.$inc.tokensBalance !== undefined) {
          w.tokensBalance += update.$inc.tokensBalance;
          w.tokensBalance = Math.round(w.tokensBalance * 100) / 100;
        }
        return { ...w };
      };

      Withdrawal.create = async (records) => {
        const docs = Array.isArray(records) ? records : [records];
        const created = docs.map((d) => {
          const doc = {
            _id: new mongoose.Types.ObjectId(),
            ...d,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          mockWithdrawals.push(doc);
          return doc;
        });
        return Array.isArray(records) ? created : created[0];
      };

      Withdrawal.findOne = (filter) => {
        const found = mockWithdrawals.find((w) => {
          if (filter.requestId && w.requestId !== filter.requestId) return false;
          if (filter.user && w.user.toString() !== filter.user.toString()) return false;
          return true;
        });
        return createQueryChain(found);
      };

      Withdrawal.findById = (id) => {
        const found = mockWithdrawals.find((w) => w._id.toString() === id.toString());
        if (!found) return createQueryChain(null);
        const userObj = mockUsers.find((u) => u._id.toString() === found.user.toString());
        return createQueryChain({ ...found, user: userObj });
      };

      Withdrawal.findOneAndUpdate = async (filter, update) => {
        const found = mockWithdrawals.find((w) => {
          if (filter._id && w._id.toString() !== filter._id.toString()) return false;
          if (filter.status && w.status !== filter.status) return false;
          return true;
        });
        if (!found) return null;

        if (update.$set) {
          Object.assign(found, update.$set);
        }
        const userObj = mockUsers.find((u) => u._id.toString() === found.user.toString());
        return { ...found, user: userObj };
      };

      Withdrawal.find = (filter) => {
        let results = mockWithdrawals.filter((w) => {
          if (filter.user && w.user.toString() !== filter.user.toString()) return false;
          if (filter.status && w.status !== filter.status) return false;
          return true;
        });
        results = results.map((w) => {
          const userObj = mockUsers.find((u) => u._id.toString() === w.user.toString());
          return { ...w, user: userObj };
        });
        return createQueryChain(results);
      };

      Withdrawal.countDocuments = (filter) => {
        const count = mockWithdrawals.filter((w) => {
          if (filter.user && w.user.toString() !== filter.user.toString()) return false;
          if (filter.status && w.status !== filter.status) return false;
          return true;
        }).length;
        return Promise.resolve(count);
      };
    });

    test('creates withdrawal request and atomically reserves Tokens from Wallet', async () => {
      const res = await withdrawalService.createWithdrawalRequest(userAId, {
        amount: 30.00,
        payoutMethod: 'USDC_POLYGON',
        destination: '0x71C...B492'
      });

      assert.equal(res.success, true);
      assert.equal(res.withdrawal.requestedAmount, 30.00);
      assert.equal(res.withdrawal.status, 'Pending');
      assert.equal(res.withdrawal.statusCode, 'PENDING');
      assert.equal(res.remainingTokens, 70.00); // 100 - 30 = 70 Tokens

      // Verify wallet balance in store
      const walletA = mockWallets.find((w) => w.user === userAId);
      assert.equal(walletA.tokensBalance, 70.00);
    });

    test('rejects withdrawal request when user token balance is insufficient', async () => {
      await assert.rejects(async () => {
        await withdrawalService.createWithdrawalRequest(userAId, {
          amount: 250.00, // User A only has 100 Tokens
          payoutMethod: 'USDC_POLYGON',
          destination: '0x71C...B492'
        });
      }, (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /Insufficient tokens balance/i);
        return true;
      });

      // Verify wallet was NOT debited
      const walletA = mockWallets.find((w) => w.user === userAId);
      assert.equal(walletA.tokensBalance, 100.00);
    });

    test('rejects zero or negative requested withdrawal amounts', async () => {
      await assert.rejects(async () => {
        await withdrawalService.createWithdrawalRequest(userAId, {
          amount: 0,
          destination: '0x123'
        });
      }, (err) => err.statusCode === 400);

      await assert.rejects(async () => {
        await withdrawalService.createWithdrawalRequest(userAId, {
          amount: -50,
          destination: '0x123'
        });
      }, (err) => err.statusCode === 400);
    });

    test('rejects unsupported asset (e.g. ves) with HTTP 400', async () => {
      await assert.rejects(async () => {
        await withdrawalService.createWithdrawalRequest(userAId, {
          amount: 25.00,
          asset: 'ves',
          destination: '0x123'
        });
      }, (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /Unsupported withdrawal asset 'ves'/i);
        return true;
      });
    });

    test('accepts explicit asset tokens in createWithdrawalRequest', async () => {
      const res = await withdrawalService.createWithdrawalRequest(userAId, {
        amount: 15.00,
        asset: 'tokens',
        destination: '0x123'
      });
      assert.equal(res.success, true);
      assert.equal(res.withdrawal.asset, 'tokens');
    });

    test('rejects withdrawal request when destination address is missing', async () => {
      await assert.rejects(async () => {
        await withdrawalService.createWithdrawalRequest(userAId, {
          amount: 25.00,
          destination: '   '
        });
      }, (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /destination address or account is required/i);
        return true;
      });
    });

    test('suspended user cannot create withdrawal requests', async () => {
      const suspendedUser = mockUsers.find((u) => u._id === userAId);
      suspendedUser.accountStatus = 'Suspended';

      await assert.rejects(async () => {
        await withdrawalService.createWithdrawalRequest(userAId, {
          amount: 15.00,
          destination: '0x123'
        });
      }, (err) => {
        assert.equal(err.statusCode, 403);
        assert.match(err.message, /suspended/i);
        return true;
      });
    });

    test('admin rejection refunds reserved Tokens exactly once', async () => {
      // 1. User A reserves 40 tokens
      const createRes = await withdrawalService.createWithdrawalRequest(userAId, {
        amount: 40.00,
        destination: '0x123'
      });
      const withdrawalId = createRes.withdrawal.id;

      const walletBefore = mockWallets.find((w) => w.user === userAId);
      assert.equal(walletBefore.tokensBalance, 60.00);

      // 2. Admin rejects request with mandatory reason
      const reviewRes = await withdrawalService.reviewWithdrawal(withdrawalId, adminId, {
        status: 'Rejected',
        reason: 'Invalid wallet address on TRON network.'
      });

      assert.equal(reviewRes.success, true);
      assert.equal(reviewRes.withdrawal.status, 'Rejected');
      assert.equal(reviewRes.withdrawal.statusCode, 'REJECTED');
      assert.equal(reviewRes.withdrawal.rejectionReason, 'Invalid wallet address on TRON network.');

      // 3. Tokens are refunded back to User A's wallet
      const walletAfter = mockWallets.find((w) => w.user === userAId);
      assert.equal(walletAfter.tokensBalance, 100.00); // 60 + 40 refunded = 100
    });

    test('duplicate rejection does not refund tokens twice (idempotency)', async () => {
      // Create request for 25 tokens
      const createRes = await withdrawalService.createWithdrawalRequest(userAId, {
        amount: 25.00,
        destination: '0x123'
      });
      const withdrawalId = createRes.withdrawal.id;

      // First rejection succeeds
      await withdrawalService.reviewWithdrawal(withdrawalId, adminId, {
        status: 'Rejected',
        reason: 'First rejection reason.'
      });

      const walletAfterFirst = mockWallets.find((w) => w.user === userAId);
      assert.equal(walletAfterFirst.tokensBalance, 100.00);

      // Second rejection attempt MUST fail and MUST NOT refund again
      await assert.rejects(async () => {
        await withdrawalService.reviewWithdrawal(withdrawalId, adminId, {
          status: 'Rejected',
          reason: 'Duplicate rejection attempt.'
        });
      }, (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /already REJECTED/i);
        return true;
      });

      // Balance remains strictly 100.00 (not 125.00)
      assert.equal(walletAfterFirst.tokensBalance, 100.00);
    });

    test('admin approval transitions status to APPROVED without initiating actual payout', async () => {
      const createRes = await withdrawalService.createWithdrawalRequest(userAId, {
        amount: 50.00,
        destination: '0xPolygonAddress'
      });
      const withdrawalId = createRes.withdrawal.id;

      const reviewRes = await withdrawalService.reviewWithdrawal(withdrawalId, adminId, {
        status: 'Approved'
      });

      assert.equal(reviewRes.success, true);
      assert.equal(reviewRes.withdrawal.status, 'Approved');
      assert.equal(reviewRes.withdrawal.statusCode, 'APPROVED');

      // Tokens remain deducted (reserved -> confirmed by admin)
      const walletA = mockWallets.find((w) => w.user === userAId);
      assert.equal(walletA.tokensBalance, 50.00);
    });

    test('duplicate approval of an already approved request is rejected', async () => {
      const createRes = await withdrawalService.createWithdrawalRequest(userAId, {
        amount: 20.00,
        destination: '0xAddress'
      });
      const withdrawalId = createRes.withdrawal.id;

      await withdrawalService.reviewWithdrawal(withdrawalId, adminId, { status: 'Approved' });

      // Second approval attempt fails
      await assert.rejects(async () => {
        await withdrawalService.reviewWithdrawal(withdrawalId, adminId, { status: 'Approved' });
      }, (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /already APPROVED/i);
        return true;
      });
    });

    test('rejection without a meaningful reason fails validation', async () => {
      const createRes = await withdrawalService.createWithdrawalRequest(userAId, {
        amount: 20.00,
        destination: '0xAddress'
      });
      const withdrawalId = createRes.withdrawal.id;

      await assert.rejects(async () => {
        await withdrawalService.reviewWithdrawal(withdrawalId, adminId, {
          status: 'Rejected',
          reason: ''
        });
      }, (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /rejection reason/i);
        return true;
      });
    });
  });

  // =========================================================================
  // 3. Protected Profile Endpoints (User API)
  // =========================================================================
  describe('Protected Profile Endpoints (User API)', () => {
    beforeEach(() => {
      User.findById = (id) => {
        const u = mockUsers.find((x) => x._id.toString() === id.toString());
        return createQueryChain(u);
      };
      Wallet.findOne = (filter) => {
        const w = mockWallets.find((x) => x.user.toString() === filter.user.toString());
        return createQueryChain(w);
      };
      Wallet.findOneAndUpdate = async (filter, update) => {
        const w = mockWallets.find((x) => x.user.toString() === filter.user.toString());
        if (!w) return null;
        if (filter.tokensBalance && filter.tokensBalance.$gte !== undefined) {
          if (w.tokensBalance < filter.tokensBalance.$gte) return null;
        }
        if (update.$inc && update.$inc.tokensBalance !== undefined) {
          w.tokensBalance += update.$inc.tokensBalance;
        }
        return { ...w };
      };
      Withdrawal.create = async (records) => {
        const docs = Array.isArray(records) ? records : [records];
        const created = docs.map((d) => {
          const doc = {
            _id: new mongoose.Types.ObjectId(),
            ...d,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          mockWithdrawals.push(doc);
          return doc;
        });
        return Array.isArray(records) ? created : created[0];
      };
      Withdrawal.findOne = (filter) => {
        const found = mockWithdrawals.find((w) => {
          if (filter.requestId && w.requestId !== filter.requestId) return false;
          if (filter.user && w.user.toString() !== filter.user.toString()) return false;
          return true;
        });
        return createQueryChain(found);
      };
      Withdrawal.find = (filter) => {
        let results = mockWithdrawals.filter((w) => {
          if (filter.user && w.user.toString() !== filter.user.toString()) return false;
          if (filter.status && w.status !== filter.status) return false;
          return true;
        });
        results = results.map((w) => {
          const userObj = mockUsers.find((u) => u._id.toString() === w.user.toString());
          return { ...w, user: userObj };
        });
        return createQueryChain(results);
      };
      Withdrawal.findById = (id) => {
        const found = mockWithdrawals.find((w) => w._id.toString() === id.toString());
        if (!found) return createQueryChain(null);
        const userObj = mockUsers.find((u) => u._id.toString() === found.user.toString());
        return createQueryChain({ ...found, user: userObj });
      };
      Withdrawal.countDocuments = (filter) => {
        const count = mockWithdrawals.filter((w) => {
          if (filter.user && w.user.toString() !== filter.user.toString()) return false;
          return true;
        }).length;
        return Promise.resolve(count);
      };
      Withdrawal.findOneAndUpdate = async (filter, update) => {
        const found = mockWithdrawals.find((w) => {
          if (filter._id && w._id.toString() !== filter._id.toString()) return false;
          if (filter.status && w.status !== filter.status) return false;
          return true;
        });
        if (!found) return null;
        if (update.$set) Object.assign(found, update.$set);
        const userObj = mockUsers.find((u) => u._id.toString() === found.user.toString());
        return { ...found, user: userObj };
      };
    });

    test('rejects unauthenticated withdrawal requests with HTTP 401', async () => {
      const res = await request(app)
        .post('/api/profile/withdrawals')
        .send({ amount: 25.00, destination: '0x123' });

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });

    test('POST /api/profile/withdrawals successfully reserves Tokens and returns 201', async () => {
      const res = await request(app)
        .post('/api/profile/withdrawals')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          amount: 35.00,
          payoutMethod: 'USDC_POLYGON',
          destination: '0xPolygonAddress'
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.withdrawal.requestedAmount, 35.00);
      assert.equal(res.body.withdrawal.status, 'Pending');
      assert.equal(res.body.remainingTokens, 65.00);
    });

    test('POST /api/profile/withdrawals rejects unsupported asset with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/profile/withdrawals')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          amount: 25.00,
          asset: 'ves',
          destination: '0xPolygonAddress'
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /Unsupported withdrawal asset 'ves'/i);
    });

    test('POST /api/profile/withdrawals accepts explicit asset tokens', async () => {
      const res = await request(app)
        .post('/api/profile/withdrawals')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          amount: 15.00,
          asset: 'tokens',
          destination: '0xPolygonAddress'
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.withdrawal.asset, 'tokens');
    });

    test('GET /api/profile/withdrawals returns authenticated user withdrawal records', async () => {
      // Seed 1 record for User A and 1 record for User B
      mockWithdrawals.push(
        {
          _id: new mongoose.Types.ObjectId(),
          requestId: 'W-A01',
          user: userAId,
          requestedAmount: 20.00,
          status: 'PENDING',
          createdAt: new Date()
        },
        {
          _id: new mongoose.Types.ObjectId(),
          requestId: 'W-B01',
          user: userBId,
          requestedAmount: 15.00,
          status: 'PENDING',
          createdAt: new Date()
        }
      );

      const res = await request(app)
        .get('/api/profile/withdrawals')
        .set('Authorization', `Bearer ${tokenUserA}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.length, 1);
      assert.equal(res.body.data[0].requestId, 'W-A01');
    });

    test('multi-tenancy security: User A cannot see User B withdrawals', async () => {
      // User B requests withdrawal
      mockWithdrawals.push({
        _id: new mongoose.Types.ObjectId(),
        requestId: 'W-SECRET-B',
        user: userBId,
        requestedAmount: 10.00,
        destination: 'bob_private_wallet',
        status: 'PENDING',
        createdAt: new Date()
      });

      // User A requests their withdrawals
      const res = await request(app)
        .get('/api/profile/withdrawals')
        .set('Authorization', `Bearer ${tokenUserA}`);

      assert.equal(res.status, 200);
      const containsUserBData = res.body.data.some((w) => w.requestId === 'W-SECRET-B');
      assert.equal(containsUserBData, false);
    });

    test('GET /api/profile/withdrawal-summary strictly excludes pending from completed total', async () => {
      mockWithdrawals.push(
        {
          _id: new mongoose.Types.ObjectId(),
          requestId: 'W-P1',
          user: userAId,
          requestedAmount: 45.00,
          status: 'PENDING',
          createdAt: new Date()
        },
        {
          _id: new mongoose.Types.ObjectId(),
          requestId: 'W-A1',
          user: userAId,
          requestedAmount: 120.00,
          status: 'APPROVED',
          createdAt: new Date()
        },
        {
          _id: new mongoose.Types.ObjectId(),
          requestId: 'W-R1',
          user: userAId,
          requestedAmount: 25.00,
          status: 'REJECTED',
          createdAt: new Date()
        }
      );

      const res = await request(app)
        .get('/api/profile/withdrawal-summary')
        .set('Authorization', `Bearer ${tokenUserA}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.totalRequests, 3);
      assert.equal(res.body.pendingCount, 1);
      assert.equal(res.body.pendingAmount, 45.00);
      assert.equal(res.body.approvedCount, 1);
      assert.equal(res.body.approvedAmount, 120.00);
      assert.equal(res.body.rejectedCount, 1);
      assert.equal(res.body.rejectedAmount, 25.00);
      // Strictly 120.00 (Pending $45 is strictly excluded!)
      assert.equal(res.body.successfullyWithdrawnAmount, 120.00);
    });
  });

  // =========================================================================
  // 4. Protected Admin Endpoints
  // =========================================================================
  describe('Protected Admin Endpoints (Admin API)', () => {
    beforeEach(() => {
      User.findById = (id) => {
        const u = mockUsers.find((x) => x._id.toString() === id.toString());
        return createQueryChain(u);
      };
      Withdrawal.find = (filter) => {
        let results = mockWithdrawals.filter((w) => {
          if (filter.status && w.status !== filter.status) return false;
          return true;
        });
        results = results.map((w) => {
          const userObj = mockUsers.find((u) => u._id.toString() === w.user.toString());
          return { ...w, user: userObj };
        });
        return createQueryChain(results);
      };
      Withdrawal.countDocuments = (filter) => {
        const count = mockWithdrawals.filter((w) => {
          if (filter.status && w.status !== filter.status) return false;
          return true;
        }).length;
        return Promise.resolve(count);
      };
      Withdrawal.findById = (id) => {
        const found = mockWithdrawals.find((w) => w._id.toString() === id.toString());
        if (!found) return createQueryChain(null);
        const userObj = mockUsers.find((u) => u._id.toString() === found.user.toString());
        return createQueryChain({ ...found, user: userObj });
      };
      Withdrawal.findOneAndUpdate = async (filter, update) => {
        const found = mockWithdrawals.find((w) => {
          if (filter._id && w._id.toString() !== filter._id.toString()) return false;
          if (filter.status && w.status !== filter.status) return false;
          return true;
        });
        if (!found) return null;
        if (update.$set) Object.assign(found, update.$set);
        const userObj = mockUsers.find((u) => u._id.toString() === found.user.toString());
        return { ...found, user: userObj };
      };
      Wallet.findOneAndUpdate = async (filter, update) => {
        const w = mockWallets.find((x) => x.user.toString() === filter.user.toString());
        if (!w) return null;
        if (update.$inc && update.$inc.tokensBalance !== undefined) {
          w.tokensBalance += update.$inc.tokensBalance;
        }
        return { ...w };
      };
    });

    test('rejects non-admin users attempting to access admin withdrawal routes (HTTP 403)', async () => {
      const res = await request(app)
        .get('/api/admin/withdrawals')
        .set('Authorization', `Bearer ${tokenUserA}`); // User role

      assert.equal(res.status, 403);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /Forbidden/i);
    });

    test('admin can retrieve all platform withdrawal requests', async () => {
      mockWithdrawals.push({
        _id: new mongoose.Types.ObjectId(),
        requestId: 'W-ADMIN-01',
        user: userAId,
        requestedAmount: 50.00,
        status: 'PENDING',
        createdAt: new Date()
      });

      const res = await request(app)
        .get('/api/admin/withdrawals')
        .set('Authorization', `Bearer ${tokenAdmin}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.length >= 1);
    });

    test('admin can approve a pending withdrawal request via PATCH /api/admin/withdrawals/:id', async () => {
      const wId = new mongoose.Types.ObjectId();
      mockWithdrawals.push({
        _id: wId,
        requestId: 'W-APR-01',
        user: userAId,
        requestedAmount: 25.00,
        status: 'PENDING',
        createdAt: new Date()
      });

      const res = await request(app)
        .patch(`/api/admin/withdrawals/${wId.toString()}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ status: 'Approved' });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.withdrawal.status, 'Approved');
      assert.equal(res.body.withdrawal.statusCode, 'APPROVED');
    });

    test('admin can reject a pending withdrawal with reason and refund tokens', async () => {
      const wId = new mongoose.Types.ObjectId();
      mockWithdrawals.push({
        _id: wId,
        requestId: 'W-REJ-01',
        user: userAId,
        requestedAmount: 20.00,
        status: 'PENDING',
        createdAt: new Date()
      });

      const res = await request(app)
        .patch(`/api/admin/withdrawals/${wId.toString()}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          status: 'Rejected',
          reason: 'KYC identity mismatch on external bank account.'
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.withdrawal.status, 'Rejected');
      assert.equal(res.body.withdrawal.rejectionReason, 'KYC identity mismatch on external bank account.');

      // Tokens refunded
      const walletA = mockWallets.find((w) => w.user === userAId);
      assert.equal(walletA.tokensBalance, 120.00); // 100 + 20 = 120
    });
  });
});
