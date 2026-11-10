const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = require('../server');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const { generateToken } = require('../utils/jwt');

describe('Step 5: Authentication, Password Hashing & Authorization Tests', () => {
  let originalFindOne;
  let originalCreate;
  let originalFindById;
  let originalWalletCreate;

  // In-memory mock user store for isolated unit testing without a live Atlas connection
  let mockUsers = [];

  const createQueryChain = (result) => ({
    select: () => Promise.resolve(result),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject)
  });

  beforeEach(() => {
    mockUsers = [];
    originalFindOne = User.findOne;
    originalCreate = User.create;
    originalFindById = User.findById;

    // Mock User.findOne
    User.findOne = (query) => {
      const email = query.email?.toLowerCase ? query.email.toLowerCase() : query.email;
      const user = mockUsers.find((u) => u.email === email) || null;
      return createQueryChain(user);
    };

    // Mock User.create
    User.create = async (doc) => {
      const newUser = {
        _id: '507f1f77bcf86cd799439011',
        id: '507f1f77bcf86cd799439011',
        name: doc.name,
        fullName: doc.name,
        email: doc.email.toLowerCase(),
        passwordHash: doc.passwordHash,
        role: doc.role || 'user',
        accountStatus: 'Active',
        level: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockUsers.push(newUser);
      return newUser;
    };

    // Mock User.findById
    User.findById = (id) => {
      const user = mockUsers.find((u) => u._id === id || u.id === id) || null;
      return createQueryChain(user);
    };

    // Mock Wallet.create to support Step 6 wallet provisioning during registration
    originalWalletCreate = Wallet.create;
    Wallet.create = async (doc) => {
      const data = Array.isArray(doc) ? doc[0] : doc;
      return {
        _id: '607f1f77bcf86cd799439022',
        user: data.user,
        vesBalance: 0,
        svesBalance: 0,
        gemsBalance: 0,
        tokensBalance: 0,
        xpTotal: 0
      };
    };
  });

  afterEach(() => {
    // Restore original Mongoose methods
    User.findOne = originalFindOne;
    User.create = originalCreate;
    User.findById = originalFindById;
    if (originalWalletCreate) {
      Wallet.create = originalWalletCreate;
    }
  });

  // 1. User Registration
  describe('User Registration (POST /api/auth/register)', () => {
    test('successfully registers a user, stores bcrypt hash (not plaintext password), and returns JWT', async () => {
      const payload = {
        name: 'Sarah Student',
        email: 'sarah@veloop.edu',
        password: 'SecurePassword123!'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(payload);

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.ok(res.body.token, 'Response must include JWT token');
      assert.equal(res.body.user.email, 'sarah@veloop.edu');
      assert.equal(res.body.user.name, 'Sarah Student');
      assert.equal(res.body.user.role, 'user');

      // Security check: Plaintext password or hash must NEVER be in response
      assert.equal(res.body.user.password, undefined);
      assert.equal(res.body.user.passwordHash, undefined);

      // Verify that stored password in mock database is a valid bcrypt hash
      const storedUser = mockUsers.find((u) => u.email === 'sarah@veloop.edu');
      assert.ok(storedUser);
      assert.notEqual(storedUser.passwordHash, payload.password, 'Stored password must NOT be plaintext');
      assert.ok(storedUser.passwordHash.startsWith('$2'), 'Hash must follow bcrypt prefix');

      const isMatch = await bcrypt.compare(payload.password, storedUser.passwordHash);
      assert.equal(isMatch, true, 'Stored bcrypt hash must verify against original password');
    });

    test('rejects registration with missing name', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'sarah@veloop.edu', password: 'Password123' });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /name is required/i);
    });

    test('rejects registration with invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Sarah', email: 'invalid-email', password: 'Password123' });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /valid email address/i);
    });

    test('rejects registration with password shorter than 6 characters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Sarah', email: 'sarah@veloop.edu', password: '123' });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /at least 6 characters/i);
    });

    test('rejects duplicate email registration with HTTP 400', async () => {
      // Seed existing user
      mockUsers.push({
        _id: '1',
        email: 'existing@veloop.edu',
        passwordHash: 'some_hash'
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate User',
          email: 'EXISTING@veloop.edu', // Test case-insensitivity
          password: 'Password123!'
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /already exists/i);
    });

    test('prevents public registration from granting admin role', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Hacker User',
          email: 'hacker@veloop.edu',
          password: 'Password123!',
          role: 'admin' // Attempting privilege escalation
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.user.role, 'user', 'Public registration must force role to "user"');

      const created = mockUsers.find((u) => u.email === 'hacker@veloop.edu');
      assert.equal(created.role, 'user');
    });
  });

  // 2. User & Admin Login
  describe('User & Admin Login', () => {
    let hashedPassword;

    beforeEach(async () => {
      hashedPassword = await bcrypt.hash('CorrectPassword123!', 10);

      // Seed a standard user
      mockUsers.push({
        _id: 'user_101',
        id: 'user_101',
        name: 'Standard User',
        email: 'user@veloop.edu',
        passwordHash: hashedPassword,
        role: 'user',
        accountStatus: 'Active',
        level: 1
      });

      // Seed an admin user
      mockUsers.push({
        _id: 'admin_202',
        id: 'admin_202',
        name: 'System Admin',
        email: 'admin@veloop.io',
        passwordHash: hashedPassword,
        role: 'admin',
        accountStatus: 'Active',
        level: 5
      });
    });

    test('successful user login returns JWT without exposing password hash', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@veloop.edu', password: 'CorrectPassword123!' });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.token);
      assert.equal(res.body.user.email, 'user@veloop.edu');
      assert.equal(res.body.user.passwordHash, undefined);
    });

    test('rejects login with incorrect password with HTTP 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@veloop.edu', password: 'WrongPassword999' });

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /invalid email or password/i);
    });

    test('rejects login with non-existent email with HTTP 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@veloop.edu', password: 'Password123' });

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /invalid email or password/i);
    });

    test('admin login endpoint (POST /api/admin/auth/login) returns admin profile and token', async () => {
      const res = await request(app)
        .post('/api/admin/auth/login')
        .send({ email: 'admin@veloop.io', password: 'CorrectPassword123!' });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.token);
      assert.equal(res.body.admin.role, 'admin');
      assert.equal(res.body.admin.email, 'admin@veloop.io');
    });

    test('admin login endpoint rejects non-admin users with HTTP 401', async () => {
      const res = await request(app)
        .post('/api/admin/auth/login')
        .send({ email: 'user@veloop.edu', password: 'CorrectPassword123!' });

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /invalid administrative credentials/i);
    });
  });

  // 3. Authentication & Authorization Middleware
  describe('Authentication Middleware (protect) & Role Authorization (authorize)', () => {
    let regularUser;
    let adminUser;
    let userToken;
    let adminToken;

    beforeEach(() => {
      regularUser = {
        _id: 'user_regular_1',
        id: 'user_regular_1',
        name: 'Regular Bob',
        email: 'bob@veloop.edu',
        role: 'user',
        accountStatus: 'Active',
        level: 2
      };

      adminUser = {
        _id: 'user_admin_1',
        id: 'user_admin_1',
        name: 'Admin Alice',
        email: 'alice@veloop.io',
        role: 'admin',
        accountStatus: 'Active',
        level: 5
      };

      mockUsers.push(regularUser);
      mockUsers.push(adminUser);

      userToken = generateToken(regularUser);
      adminToken = generateToken(adminUser);
    });

    test('GET /api/auth/me returns authenticated user with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.user.email, 'bob@veloop.edu');
    });

    test('rejects request with missing Authorization header with HTTP 401', async () => {
      const res = await request(app).get('/api/auth/me');

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /no token provided/i);
    });

    test('rejects request with invalid/tampered token with HTTP 401', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.payload');

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /invalid authentication token/i);
    });

    test('rejects request with expired token with HTTP 401', async () => {
      const expiredToken = jwt.sign(
        { id: regularUser.id, role: regularUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '-1s' }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /token has expired/i);
    });

    test('non-admin user cannot access admin route (GET /api/admin/auth/me returns 403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/admin/auth/me')
        .set('Authorization', `Bearer ${userToken}`);

      assert.equal(res.status, 403);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /not authorized to access this resource/i);
    });

    test('administrator can access admin route (GET /api/admin/auth/me returns 200 OK)', async () => {
      const res = await request(app)
        .get('/api/admin/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.user.role, 'admin');
    });
  });
});

