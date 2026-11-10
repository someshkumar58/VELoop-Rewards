const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');

const app = require('../server');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const { generateToken } = require('../utils/jwt');

describe('Step 6: User Profile & Wallet Rewards API Suite', () => {
  let originalUserFindOne;
  let originalUserFindById;
  let originalUserFindByIdAndUpdate;
  let originalUserCreate;
  let originalUserFindByIdAndDelete;

  let originalWalletFindOne;
  let originalWalletCreate;

  let mockUsers = [];
  let mockWallets = [];

  const createQueryChain = (result) => ({
    select: () => Promise.resolve(result),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject)
  });

  beforeEach(() => {
    mockUsers = [];
    mockWallets = [];

    // Save originals
    originalUserFindOne = User.findOne;
    originalUserFindById = User.findById;
    originalUserFindByIdAndUpdate = User.findByIdAndUpdate;
    originalUserCreate = User.create;
    originalUserFindByIdAndDelete = User.findByIdAndDelete;

    originalWalletFindOne = Wallet.findOne;
    originalWalletCreate = Wallet.create;

    // Seed mock database with two isolated users: User A and User B
    const userA = {
      _id: '507f1f77bcf86cd799439011',
      id: '507f1f77bcf86cd799439011',
      name: 'Alice User',
      fullName: 'Alice User',
      email: 'alice@veloop.io',
      role: 'user',
      accountStatus: 'Active',
      isVerified: true,
      phone: '+1 555-0101',
      avatarUrl: 'https://example.com/alice.jpg',
      referralCode: 'VEL-ALICE1',
      level: 2,
      createdAt: new Date('2024-03-15T10:00:00Z'),
      updatedAt: new Date('2024-03-15T10:00:00Z')
    };

    const userB = {
      _id: '507f1f77bcf86cd799439022',
      id: '507f1f77bcf86cd799439022',
      name: 'Bob Target',
      fullName: 'Bob Target',
      email: 'bob@veloop.io',
      role: 'user',
      accountStatus: 'Active',
      isVerified: false,
      phone: '+1 555-0202',
      avatarUrl: 'https://example.com/bob.jpg',
      referralCode: 'VEL-BOB222',
      level: 1,
      createdAt: new Date('2024-04-01T10:00:00Z'),
      updatedAt: new Date('2024-04-01T10:00:00Z')
    };

    const walletA = {
      _id: '607f1f77bcf86cd7994390aa',
      user: '507f1f77bcf86cd799439011',
      vesBalance: 1250.75,
      svesBalance: 500.0,
      gemsBalance: 42,
      tokensBalance: 15.5,
      xpTotal: 3400
    };

    const walletB = {
      _id: '607f1f77bcf86cd7994390bb',
      user: '507f1f77bcf86cd799439022',
      vesBalance: 9999.0,
      svesBalance: 8888.0,
      gemsBalance: 777,
      tokensBalance: 666.0,
      xpTotal: 55555
    };

    mockUsers = [userA, userB];
    mockWallets = [walletA, walletB];

    // Mock User methods
    User.findOne = (query) => {
      let user = null;
      if (query.email) {
        const email = query.email.toLowerCase ? query.email.toLowerCase() : query.email;
        user = mockUsers.find((u) => {
          const matchEmail = u.email === email;
          const matchExcludeId = query._id && query._id.$ne ? u._id !== query._id.$ne : true;
          return matchEmail && matchExcludeId;
        }) || null;
      }
      return createQueryChain(user);
    };

    User.findById = (id) => {
      const idStr = id ? id.toString() : '';
      const user = mockUsers.find((u) => u._id === idStr || u.id === idStr) || null;
      return createQueryChain(user);
    };

    User.findByIdAndUpdate = (id, update, options) => {
      const idStr = id ? id.toString() : '';
      const index = mockUsers.findIndex((u) => u._id === idStr || u.id === idStr);
      if (index === -1) return createQueryChain(null);

      const current = mockUsers[index];
      const setFields = update.$set || update;
      const updated = {
        ...current,
        ...setFields,
        fullName: setFields.name !== undefined ? setFields.name : current.fullName,
        updatedAt: new Date()
      };
      mockUsers[index] = updated;
      return createQueryChain(updated);
    };

    User.create = async (doc) => {
      const data = Array.isArray(doc) ? doc[0] : doc;
      const newId = `507f1f77bcf86cd7994390${mockUsers.length + 30}`;
      const newUser = {
        _id: newId,
        id: newId,
        name: data.name,
        fullName: data.name,
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        role: data.role || 'user',
        accountStatus: 'Active',
        isVerified: false,
        phone: '',
        avatarUrl: '',
        referralCode: `VEL-${newId.slice(-6).toUpperCase()}`,
        level: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockUsers.push(newUser);
      return Array.isArray(doc) ? [newUser] : newUser;
    };

    User.findByIdAndDelete = async (id) => {
      const idStr = id ? id.toString() : '';
      const index = mockUsers.findIndex((u) => u._id === idStr || u.id === idStr);
      if (index !== -1) {
        const removed = mockUsers.splice(index, 1);
        return removed[0];
      }
      return null;
    };

    // Mock Wallet methods
    Wallet.findOne = (query) => {
      const userStr = query.user ? query.user.toString() : '';
      const wallet = mockWallets.find((w) => w.user === userStr) || null;
      return createQueryChain(wallet);
    };

    Wallet.create = async (doc) => {
      const data = Array.isArray(doc) ? doc[0] : doc;
      const newId = `607f1f77bcf86cd7994390${mockWallets.length + 30}`;
      const newWallet = {
        _id: newId,
        user: data.user ? data.user.toString() : '',
        vesBalance: data.vesBalance !== undefined ? data.vesBalance : 0,
        svesBalance: data.svesBalance !== undefined ? data.svesBalance : 0,
        gemsBalance: data.gemsBalance !== undefined ? data.gemsBalance : 0,
        tokensBalance: data.tokensBalance !== undefined ? data.tokensBalance : 0,
        xpTotal: data.xpTotal !== undefined ? data.xpTotal : 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockWallets.push(newWallet);
      return Array.isArray(doc) ? [newWallet] : newWallet;
    };
  });

  afterEach(() => {
    User.findOne = originalUserFindOne;
    User.findById = originalUserFindById;
    User.findByIdAndUpdate = originalUserFindByIdAndUpdate;
    User.create = originalUserCreate;
    User.findByIdAndDelete = originalUserFindByIdAndDelete;

    Wallet.findOne = originalWalletFindOne;
    Wallet.create = originalWalletCreate;
  });

  // Helper to generate valid auth token
  const getAuthToken = (user) => generateToken(user);

  // ==========================================================================
  // 1. GET /api/profile and GET /api/profile/me
  // ==========================================================================
  describe('Profile Retrieval (GET /api/profile & GET /api/profile/me)', () => {
    test('returns 200 with safe profile for authenticated user on /api/profile', async () => {
      const token = getAuthToken(mockUsers[0]);

      const res = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${token}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.email, 'alice@veloop.io');
      assert.equal(res.body.fullName, 'Alice User');
      assert.equal(res.body.name, 'Alice User');
      assert.equal(res.body.role, 'user');
      assert.equal(res.body.phone, '+1 555-0101');
      assert.equal(res.body.isVerified, true);
      assert.equal(res.body.level, 2);

      // Embedded rewards snapshot
      assert.ok(res.body.rewards);
      assert.equal(res.body.rewards.ves, 1250.75);
      assert.equal(res.body.rewards.sves, 500.0);
      assert.equal(res.body.rewards.gems, 42);
      assert.equal(res.body.rewards.tokens, 15.5);
      assert.equal(res.body.rewards.xp, 3400);

      // Security: Secrets must never be exposed
      assert.equal(res.body.password, undefined);
      assert.equal(res.body.passwordHash, undefined);
      assert.equal(res.body.token, undefined);
    });

    test('returns 200 with identical safe profile on /api/profile/me (frontend compatibility alias)', async () => {
      const token = getAuthToken(mockUsers[0]);

      const res = await request(app)
        .get('/api/profile/me')
        .set('Authorization', `Bearer ${token}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.email, 'alice@veloop.io');
      assert.equal(res.body.fullName, 'Alice User');
      assert.equal(res.body.rewards.ves, 1250.75);
    });

    test('rejects unauthenticated request with HTTP 401 when no token is provided', async () => {
      const res = await request(app).get('/api/profile');

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /authentication required/i);
    });

    test('rejects request with invalid/tampered token with HTTP 401', async () => {
      const res = await request(app)
        .get('/api/profile')
        .set('Authorization', 'Bearer invalid-token-xyz');

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /invalid authentication token/i);
    });

    test('rejects suspended user account with HTTP 403 Forbidden', async () => {
      mockUsers[0].accountStatus = 'Suspended';
      const token = getAuthToken(mockUsers[0]);

      const res = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${token}`);

      assert.equal(res.status, 403);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /suspended/i);
    });
  });

  // ==========================================================================
  // 2. PATCH /api/profile and PATCH /api/profile/me
  // ==========================================================================
  describe('Profile Update (PATCH /api/profile & PATCH /api/profile/me)', () => {
    test('successfully updates editable fields (fullName, phone, avatarUrl)', async () => {
      const token = getAuthToken(mockUsers[0]);

      const res = await request(app)
        .patch('/api/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          fullName: 'Alice Somesh',
          phone: '+1 555-9999',
          avatarUrl: 'https://example.com/alice-new.png'
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.fullName, 'Alice Somesh');
      assert.equal(res.body.phone, '+1 555-9999');
      assert.equal(res.body.avatarUrl, 'https://example.com/alice-new.png');

      // Verify persistence in mock database
      const stored = mockUsers.find((u) => u._id === mockUsers[0]._id);
      assert.equal(stored.name, 'Alice Somesh');
      assert.equal(stored.phone, '+1 555-9999');
      assert.equal(stored.avatarUrl, 'https://example.com/alice-new.png');
    });

    test('supports name alias and updates on /api/profile/me endpoint', async () => {
      const token = getAuthToken(mockUsers[0]);

      const res = await request(app)
        .patch('/api/profile/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Alice NewName' });

      assert.equal(res.status, 200);
      assert.equal(res.body.name, 'Alice NewName');
    });

    test('updates email address and normalizes to lowercase', async () => {
      const token = getAuthToken(mockUsers[0]);

      const res = await request(app)
        .patch('/api/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'Alice.Updated@Veloop.io ' });

      assert.equal(res.status, 200);
      assert.equal(res.body.email, 'alice.updated@veloop.io');
    });

    test('rejects update with invalid email format with HTTP 400', async () => {
      const token = getAuthToken(mockUsers[0]);

      const res = await request(app)
        .patch('/api/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'not-an-email' });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /valid email/i);
    });

    test('rejects email update if email is already taken by another account', async () => {
      const token = getAuthToken(mockUsers[0]);

      const res = await request(app)
        .patch('/api/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'bob@veloop.io' }); // bob already exists

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /already exists/i);
    });

    test('rejects name shorter than 2 characters with HTTP 400', async () => {
      const token = getAuthToken(mockUsers[0]);

      const res = await request(app)
        .patch('/api/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ fullName: 'A' });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /at least 2 characters/i);
    });

    test('rejects empty payload with no valid editable fields with HTTP 400', async () => {
      const token = getAuthToken(mockUsers[0]);

      const res = await request(app)
        .patch('/api/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /no valid editable profile fields/i);
    });

    test('STRICT SECURITY: Rejects attempts to modify privileged or system-managed fields', async () => {
      const token = getAuthToken(mockUsers[0]);

      const forbiddenPayloads = [
        { role: 'admin' },
        { accountStatus: 'Suspended' },
        { isVerified: true },
        { level: 99 },
        { referralCode: 'HAX-999' },
        { userId: 'VEL-FAKEID' },
        { passwordHash: '$2a$10$attackerhash' }
      ];

      for (const payload of forbiddenPayloads) {
        const res = await request(app)
          .patch('/api/profile')
          .set('Authorization', `Bearer ${token}`)
          .send(payload);

        assert.equal(res.status, 400, `Payload ${JSON.stringify(payload)} should return 400`);
        assert.equal(res.body.success, false);
        assert.match(res.body.message, /privileged field/i);
      }

      // Verify that Alice's role is STILL 'user' in database
      const alice = mockUsers.find((u) => u._id === mockUsers[0]._id);
      assert.equal(alice.role, 'user', 'Role must remain user');
    });
  });

  // ==========================================================================
  // 3. Multi-Tenancy & Cross-Account Isolation
  // ==========================================================================
  describe('Multi-Tenancy & Cross-Account Security Isolation', () => {
    test('User A cannot read User B profile by supplying User B id in params or headers', async () => {
      const tokenA = getAuthToken(mockUsers[0]); // Alice

      // Attempt to access Bob's data
      const res = await request(app)
        .get('/api/profile?userId=507f1f77bcf86cd799439022')
        .set('Authorization', `Bearer ${tokenA}`);

      assert.equal(res.status, 200);
      // Response MUST be Alice's profile, ignoring the client parameter
      assert.equal(res.body.email, 'alice@veloop.io');
      assert.notEqual(res.body.email, 'bob@veloop.io');
    });

    test('User A cannot modify User B profile by injecting User B id into body', async () => {
      const tokenA = getAuthToken(mockUsers[0]); // Alice

      const res = await request(app)
        .patch('/api/profile')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          _id: mockUsers[1]._id,
          id: mockUsers[1]._id,
          fullName: 'Alice Attacking Bob'
        });

      // System rejects privileged fields (_id, id) with 400
      assert.equal(res.status, 400);

      // Verify Bob's profile was not altered
      const bob = mockUsers.find((u) => u._id === mockUsers[1]._id);
      assert.equal(bob.name, 'Bob Target');
    });

    test('User A cannot access User B wallet holdings', async () => {
      const tokenA = getAuthToken(mockUsers[0]); // Alice

      const res = await request(app)
        .get('/api/profile/rewards?walletId=607f1f77bcf86cd7994390bb&user=507f1f77bcf86cd799439022')
        .set('Authorization', `Bearer ${tokenA}`);

      assert.equal(res.status, 200);
      // Balances MUST belong to Alice (1250.75 VEs), never Bob (9999 VEs)
      assert.equal(res.body.ves, 1250.75);
      assert.notEqual(res.body.ves, 9999.0);
    });
  });

  // ==========================================================================
  // 4. GET /api/profile/rewards (Wallet Balances)
  // ==========================================================================
  describe('Wallet Rewards API (GET /api/profile/rewards)', () => {
    test('returns 200 with exact frontend-compatible balances shape', async () => {
      const token = getAuthToken(mockUsers[0]);

      const res = await request(app)
        .get('/api/profile/rewards')
        .set('Authorization', `Bearer ${token}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);

      // Verify exact keys expected by frontend RewardAssets.jsx: { ves, sves, gems, tokens, xp }
      assert.equal(res.body.ves, 1250.75);
      assert.equal(res.body.sves, 500.0);
      assert.equal(res.body.gems, 42);
      assert.equal(res.body.tokens, 15.5);
      assert.equal(res.body.xp, 3400);

      // Verify numeric data types
      assert.equal(typeof res.body.ves, 'number');
      assert.equal(typeof res.body.sves, 'number');
      assert.equal(typeof res.body.gems, 'number');
      assert.equal(typeof res.body.tokens, 'number');
      assert.equal(typeof res.body.xp, 'number');

      // Nested rewards object is also present for universal compatibility
      assert.ok(res.body.rewards);
      assert.equal(res.body.rewards.ves, 1250.75);
    });

    test('rejects unauthenticated rewards request with HTTP 401', async () => {
      const res = await request(app).get('/api/profile/rewards');

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });

    test('Missing-Wallet Behavior: Returns HTTP 404 when wallet record does not exist', async () => {
      // User with no wallet in mockWallets
      const userWithoutWallet = {
        _id: '507f1f77bcf86cd799439099',
        id: '507f1f77bcf86cd799439099',
        name: 'Orphan User',
        email: 'orphan@veloop.io',
        role: 'user',
        accountStatus: 'Active'
      };
      mockUsers.push(userWithoutWallet);

      const token = getAuthToken(userWithoutWallet);

      const res = await request(app)
        .get('/api/profile/rewards')
        .set('Authorization', `Bearer ${token}`);

      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /wallet not found/i);

      // Verify safe GET: no silent mutation occurred in mock database
      const walletCount = mockWallets.length;
      assert.equal(walletCount, 2, 'GET request must not silently create a wallet document');
    });
  });

  // ==========================================================================
  // 5. Registration + Wallet Provisioning Integration
  // ==========================================================================
  describe('Registration & Default Wallet Provisioning Flow', () => {
    test('public registration automatically provisions exactly one default wallet with zero balances', async () => {
      const initialWalletCount = mockWallets.length;
      const initialUserCount = mockUsers.length;

      const payload = {
        name: 'Charlie Newbie',
        email: 'charlie@veloop.io',
        password: 'Password123!'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(payload);

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.ok(res.body.token);

      // Confirm exactly one new user was created
      assert.equal(mockUsers.length, initialUserCount + 1);
      const createdUser = mockUsers.find((u) => u.email === 'charlie@veloop.io');
      assert.ok(createdUser);

      // Confirm exactly one new wallet was created for this user
      assert.equal(mockWallets.length, initialWalletCount + 1);
      const createdWallet = mockWallets.find((w) => w.user === createdUser._id);
      assert.ok(createdWallet);

      // Confirm all balances default to zero
      assert.equal(createdWallet.vesBalance, 0);
      assert.equal(createdWallet.svesBalance, 0);
      assert.equal(createdWallet.gemsBalance, 0);
      assert.equal(createdWallet.tokensBalance, 0);
      assert.equal(createdWallet.xpTotal, 0);
    });

    test('duplicate registration rejection does not create an extra wallet', async () => {
      const initialWalletCount = mockWallets.length;

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Alice Duplicate',
          email: 'alice@veloop.io', // already exists
          password: 'Password123!'
        });

      assert.equal(res.status, 400);
      assert.equal(mockWallets.length, initialWalletCount, 'No wallet created on duplicate registration');
    });

    test('safe rollback: cleans up created user if wallet provisioning throws an error', async () => {
      const initialUserCount = mockUsers.length;

      // Force Wallet.create to fail
      Wallet.create = async () => {
        throw new Error('Database disk full: simulated wallet provisioning failure');
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Doomed User',
          email: 'doomed@veloop.io',
          password: 'Password123!'
        });

      assert.equal(res.status, 500);

      // Verify compensating rollback: Doomed user must NOT remain orphaned in the database
      const orphaned = mockUsers.find((u) => u.email === 'doomed@veloop.io');
      assert.equal(orphaned, undefined, 'User record must be rolled back on wallet provisioning failure');
      assert.equal(mockUsers.length, initialUserCount);
    });
  });

  // ==========================================================================
  // 6. Regression & Administrative Integrity
  // ==========================================================================
  describe('Regression & Admin System Integrity', () => {
    test('existing health check (GET /api/health) continues to respond with 200 OK', async () => {
      const res = await request(app).get('/api/health');
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    });

    test('learning endpoints (/api/learning/users) continue to work properly', async () => {
      const res = await request(app).get('/api/learning/users');
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.data));
    });
  });
});

