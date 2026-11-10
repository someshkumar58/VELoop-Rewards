const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const request = require('supertest');

const app = require('../server');
const User = require('../models/User');
const { provisionAdmin, validateAdminPassword } = require('../scripts/createAdmin');
const { generateToken } = require('../utils/jwt');

describe('Initial Administrator Setup & Security Tests', () => {
  let originalFindOne;
  let originalCreate;
  let originalFindById;

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
      let user = null;
      if (query.role) {
        user = mockUsers.find((u) => u.role === query.role) || null;
      } else if (query.email) {
        const email = query.email.toLowerCase();
        user = mockUsers.find((u) => u.email === email) || null;
      }
      return createQueryChain(user);
    };

    // Mock User.create
    User.create = async (doc) => {
      const newUser = {
        _id: '507f1f77bcf86cd799439099',
        id: '507f1f77bcf86cd799439099',
        name: doc.name,
        fullName: doc.name,
        email: doc.email.toLowerCase(),
        passwordHash: doc.passwordHash,
        role: doc.role,
        accountStatus: doc.accountStatus || 'Active',
        isVerified: doc.isVerified || false,
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
  });

  afterEach(() => {
    User.findOne = originalFindOne;
    User.create = originalCreate;
    User.findById = originalFindById;
  });

  // 1. Password Policy Validation
  describe('Administrator Password Policy Verification', () => {
    test('rejects passwords shorter than 12 characters', () => {
      const res = validateAdminPassword('Short1@pass');
      assert.equal(res.valid, false);
      assert.match(res.message, /at least 12 characters/i);
    });

    test('rejects passwords missing uppercase letters', () => {
      const res = validateAdminPassword('all_lowercase_123!@#');
      assert.equal(res.valid, false);
      assert.match(res.message, /uppercase letter/i);
    });

    test('rejects passwords missing lowercase letters', () => {
      const res = validateAdminPassword('ALL_UPPERCASE_123!@#');
      assert.equal(res.valid, false);
      assert.match(res.message, /lowercase letter/i);
    });

    test('rejects passwords missing numeric digits', () => {
      const res = validateAdminPassword('NoDigitsHere!@#Pass');
      assert.equal(res.valid, false);
      assert.match(res.message, /numeric digit/i);
    });

    test('rejects passwords missing special characters', () => {
      const res = validateAdminPassword('NoSpecialChar123456');
      assert.equal(res.valid, false);
      assert.match(res.message, /special character/i);
    });

    test('accepts strong compliant passwords', () => {
      const res = validateAdminPassword('SuperAdmin@2026#Secure');
      assert.equal(res.valid, true);
    });
  });

  // 2. Input & Policy Validation in provisionAdmin
  describe('Input validation in provisionAdmin', () => {
    test('rejects invalid or short admin name', async () => {
      const result = await provisionAdmin({
        name: 'A',
        email: 'admin@veloop.io',
        password: 'SuperAdmin@2026#Secure',
        confirmPassword: 'SuperAdmin@2026#Secure'
      });
      assert.equal(result.success, false);
      assert.equal(result.code, 'INVALID_NAME');
    });

    test('rejects invalid email address format', async () => {
      const result = await provisionAdmin({
        name: 'Admin Name',
        email: 'invalid-email',
        password: 'SuperAdmin@2026#Secure',
        confirmPassword: 'SuperAdmin@2026#Secure'
      });
      assert.equal(result.success, false);
      assert.equal(result.code, 'INVALID_EMAIL');
    });

    test('rejects mismatched password confirmation', async () => {
      const result = await provisionAdmin({
        name: 'Admin Name',
        email: 'admin@veloop.io',
        password: 'SuperAdmin@2026#Secure',
        confirmPassword: 'DifferentPassword123!'
      });
      assert.equal(result.success, false);
      assert.equal(result.code, 'PASSWORD_MISMATCH');
    });

    test('rejects weak admin password', async () => {
      const result = await provisionAdmin({
        name: 'Admin Name',
        email: 'admin@veloop.io',
        password: 'weak',
        confirmPassword: 'weak'
      });
      assert.equal(result.success, false);
      assert.equal(result.code, 'WEAK_PASSWORD');
    });
  });

  // 3. Safety & Idempotency Rules
  describe('Safety & Idempotency Rules', () => {
    test('refuses setup if an administrator already exists in the system', async () => {
      // Seed an existing admin
      mockUsers.push({
        _id: 'existing_admin_1',
        email: 'prior.admin@veloop.io',
        role: 'admin'
      });

      const result = await provisionAdmin({
        name: 'Second Admin',
        email: 'second.admin@veloop.io',
        password: 'SuperAdmin@2026#Secure',
        confirmPassword: 'SuperAdmin@2026#Secure'
      });

      assert.equal(result.success, false);
      assert.equal(result.code, 'ADMIN_ALREADY_EXISTS');
      assert.match(result.message, /administrator account already exists/i);
    });

    test('refuses to silently promote an existing ordinary user account to admin', async () => {
      // Seed an ordinary user with role 'user'
      mockUsers.push({
        _id: 'user_1',
        name: 'Existing Member',
        email: 'member@veloop.edu',
        role: 'user'
      });

      const result = await provisionAdmin({
        name: 'Existing Member',
        email: 'member@veloop.edu',
        password: 'SuperAdmin@2026#Secure',
        confirmPassword: 'SuperAdmin@2026#Secure'
      });

      assert.equal(result.success, false);
      assert.equal(result.code, 'EMAIL_ALREADY_EXISTS');
      assert.match(result.message, /ordinary user accounts will not be silently promoted/i);

      // Verify that user record remained unmodified as role 'user'
      const checkUser = mockUsers.find((u) => u.email === 'member@veloop.edu');
      assert.equal(checkUser.role, 'user');
    });
  });

  // 4. Successful Admin Provisioning & Credential Security
  describe('Successful Admin Provisioning', () => {
    test('provisions initial admin with hashed password and role "admin"', async () => {
      const rawPassword = 'SuperAdmin@2026#Secure';
      const result = await provisionAdmin({
        name: 'Master Admin',
        email: 'lead.admin@veloop.io',
        password: rawPassword,
        confirmPassword: rawPassword
      });

      assert.equal(result.success, true);
      assert.equal(result.admin.role, 'admin');
      assert.equal(result.admin.email, 'lead.admin@veloop.io');
      assert.equal(result.admin.password, undefined);
      assert.equal(result.admin.passwordHash, undefined);

      // Verify that password in database is a bcrypt hash and matches original password
      const stored = mockUsers.find((u) => u.email === 'lead.admin@veloop.io');
      assert.ok(stored);
      assert.notEqual(stored.passwordHash, rawPassword);
      assert.ok(stored.passwordHash.startsWith('$2'));

      const isMatch = await bcrypt.compare(rawPassword, stored.passwordHash);
      assert.equal(isMatch, true);
    });
  });

  // 5. Authentication & RBAC Verification with Provisioned Admin
  describe('API Authentication with Provisioned Admin', () => {
    let adminUser;
    let normalUser;
    const adminPassword = 'SuperAdmin@2026#Secure';
    const userPassword = 'UserPassword123!';

    beforeEach(async () => {
      const adminHash = await bcrypt.hash(adminPassword, 10);
      const userHash = await bcrypt.hash(userPassword, 10);

      adminUser = {
        _id: 'admin_id_99',
        id: 'admin_id_99',
        name: 'Master Admin',
        email: 'master.admin@veloop.io',
        passwordHash: adminHash,
        role: 'admin',
        accountStatus: 'Active'
      };

      normalUser = {
        _id: 'user_id_44',
        id: 'user_id_44',
        name: 'Ordinary User',
        email: 'ordinary.user@veloop.edu',
        passwordHash: userHash,
        role: 'user',
        accountStatus: 'Active'
      };

      mockUsers.push(adminUser);
      mockUsers.push(normalUser);
    });

    test('POST /api/admin/auth/login succeeds for provisioned administrator', async () => {
      const res = await request(app)
        .post('/api/admin/auth/login')
        .send({ email: 'master.admin@veloop.io', password: adminPassword });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.token);
      assert.equal(res.body.admin.role, 'admin');
      assert.equal(res.body.admin.email, 'master.admin@veloop.io');
    });

    test('POST /api/admin/auth/login rejects ordinary user attempting admin access', async () => {
      const res = await request(app)
        .post('/api/admin/auth/login')
        .send({ email: 'ordinary.user@veloop.edu', password: userPassword });

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /invalid administrative credentials/i);
    });

    test('provisioned admin can access admin-only endpoint (GET /api/admin/auth/me)', async () => {
      const token = generateToken(adminUser);
      const res = await request(app)
        .get('/api/admin/auth/me')
        .set('Authorization', `Bearer ${token}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.user.role, 'admin');
    });

    test('ordinary user cannot access admin-only endpoint (GET /api/admin/auth/me returns 403 Forbidden)', async () => {
      const token = generateToken(normalUser);
      const res = await request(app)
        .get('/api/admin/auth/me')
        .set('Authorization', `Bearer ${token}`);

      assert.equal(res.status, 403);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /forbidden/i);
    });
  });
});

