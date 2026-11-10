const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const User = require('../models/User');

describe('Step 4A: User Model & Schema Validation Tests', () => {
  // 1. Valid user passes validation
  test('valid user with required name and email passes validation', async () => {
    const user = new User({
      name: 'Alexander Wright',
      email: 'alex.wright@veloop.io'
    });

    // Validating should resolve without throwing an error
    await assert.doesNotReject(async () => {
      await user.validate();
    });

    assert.equal(user.name, 'Alexander Wright');
    assert.equal(user.email, 'alex.wright@veloop.io');
  });

  // 2. Frontend alias compatibility (fullName)
  test('supports fullName alias interchangeably with name', async () => {
    const user = new User({
      fullName: 'Alexander Wright',
      email: 'alex.wright@veloop.io'
    });

    await assert.doesNotReject(async () => {
      await user.validate();
    });

    assert.equal(user.name, 'Alexander Wright');
    assert.equal(user.fullName, 'Alexander Wright');
  });

  // 3. Missing required fields
  describe('Required field validation', () => {
    test('fails validation when name is missing', async () => {
      const user = new User({
        email: 'alex.wright@veloop.io'
      });

      await assert.rejects(
        async () => {
          await user.validate();
        },
        (err) => {
          assert.ok(err.errors.name, 'Expected error on name field');
          assert.match(err.errors.name.message, /name is required/i);
          return true;
        }
      );
    });

    test('fails validation when email is missing', async () => {
      const user = new User({
        name: 'Alexander Wright'
      });

      await assert.rejects(
        async () => {
          await user.validate();
        },
        (err) => {
          assert.ok(err.errors.email, 'Expected error on email field');
          assert.match(err.errors.email.message, /email is required/i);
          return true;
        }
      );
    });
  });

  // 4. Role validation & enum
  describe('Role enum validation', () => {
    test('accepts valid roles: "user" and "admin"', async () => {
      const regularUser = new User({
        name: 'Regular User',
        email: 'user@veloop.io',
        role: 'user'
      });
      await regularUser.validate();
      assert.equal(regularUser.role, 'user');

      const adminUser = new User({
        name: 'Admin User',
        email: 'admin@veloop.io',
        role: 'admin'
      });
      await adminUser.validate();
      assert.equal(adminUser.role, 'admin');
    });

    test('fails validation when an invalid role is provided', async () => {
      const user = new User({
        name: 'Invalid Role User',
        email: 'invalid@veloop.io',
        role: 'moderator'
      });

      await assert.rejects(
        async () => {
          await user.validate();
        },
        (err) => {
          assert.ok(err.errors.role, 'Expected error on role field');
          assert.match(err.errors.role.message, /not a valid role/i);
          return true;
        }
      );
    });
  });

  // 5. Email normalization & format
  describe('Email normalization and format validation', () => {
    test('normalizes email by trimming whitespace and converting to lowercase', () => {
      const user = new User({
        name: 'Alexander Wright',
        email: '   ALEX.WRIGHT@VeLoop.IO   '
      });

      assert.equal(user.email, 'alex.wright@veloop.io');
    });

    test('fails validation when email format is invalid', async () => {
      const invalidEmails = [
        'plainaddress',
        '@missinguser.com',
        'user@.missingdomain.com',
        'user@domain'
      ];

      for (const badEmail of invalidEmails) {
        const user = new User({
          name: 'Alexander Wright',
          email: badEmail
        });

        await assert.rejects(
          async () => {
            await user.validate();
          },
          (err) => {
            assert.ok(err.errors.email, `Expected email validation error for: ${badEmail}`);
            assert.match(err.errors.email.message, /valid email address/i);
            return true;
          }
        );
      }
    });
  });

  // 6. Default values
  describe('Default field values', () => {
    test('applies sensible defaults for role, accountStatus, isVerified, and level', () => {
      const user = new User({
        name: 'New Participant',
        email: 'participant@veloop.io'
      });

      assert.equal(user.role, 'user');
      assert.equal(user.accountStatus, 'Active');
      assert.equal(user.isVerified, false);
      assert.equal(user.level, 1);
      assert.equal(user.avatarUrl, '');
    });

    test('accepts valid accountStatus values and normalizes casing', async () => {
      const activeUser = new User({ name: 'Alex', email: 'a@v.io', accountStatus: 'active' });
      assert.equal(activeUser.accountStatus, 'Active');
      await activeUser.validate();

      const suspendedUser = new User({ name: 'Alex', email: 's@v.io', accountStatus: 'suspended' });
      assert.equal(suspendedUser.accountStatus, 'Suspended');
      await suspendedUser.validate();

      const pendingUser = new User({ name: 'Alex', email: 'p@v.io', accountStatus: 'pending' });
      assert.equal(pendingUser.accountStatus, 'Pending');
      await pendingUser.validate();

      const invalidUser = new User({ name: 'Alex', email: 'i@v.io', accountStatus: 'Banned' });
      await assert.rejects(
        async () => await invalidUser.validate(),
        (err) => {
          assert.ok(err.errors.accountStatus);
          return true;
        }
      );
    });
  });

  // 7. Timestamps
  describe('Timestamps configuration', () => {
    test('enables createdAt and updatedAt in schema paths', () => {
      assert.ok(User.schema.paths.createdAt, 'Schema must define createdAt');
      assert.ok(User.schema.paths.updatedAt, 'Schema must define updatedAt');
      assert.equal(User.schema.options.timestamps, true);
    });
  });

  // 8. Field length restrictions
  describe('Field length restrictions', () => {
    test('fails validation when name is shorter than 2 characters', async () => {
      const user = new User({
        name: 'A',
        email: 'alex@veloop.io'
      });

      await assert.rejects(
        async () => {
          await user.validate();
        },
        (err) => {
          assert.ok(err.errors.name);
          assert.match(err.errors.name.message, /at least 2 characters/i);
          return true;
        }
      );
    });

    test('fails validation when name exceeds 100 characters', async () => {
      const user = new User({
        name: 'A'.repeat(101),
        email: 'alex@veloop.io'
      });

      await assert.rejects(
        async () => {
          await user.validate();
        },
        (err) => {
          assert.ok(err.errors.name);
          assert.match(err.errors.name.message, /cannot exceed 100 characters/i);
          return true;
        }
      );
    });

    test('fails validation when email exceeds 255 characters', async () => {
      const user = new User({
        name: 'Alexander Wright',
        email: 'a'.repeat(250) + '@veloop.io'
      });

      await assert.rejects(
        async () => {
          await user.validate();
        },
        (err) => {
          assert.ok(err.errors.email);
          assert.match(err.errors.email.message, /cannot exceed 255 characters/i);
          return true;
        }
      );
    });
  });

  // 9. Unique Index Verification & Educational Assertion
  describe('Unique email index verification', () => {
    test('schema defines unique index on email', () => {
      /**
       * IMPORTANT NOTE ON UNIQUE VALIDATION:
       * Mongoose's validate() and validateSync() only perform synchronous in-memory
       * schema checks (types, required, regex, enums, length).
       * 
       * They DO NOT query the database to detect whether another user already has
       * the same email. Uniqueness is enforced at the MongoDB storage engine level
       * via the unique index below. When a duplicate email is saved, MongoDB throws
       * an E11000 duplicate key error.
       */
      const emailPath = User.schema.path('email');
      assert.equal(
        emailPath.options.unique,
        true,
        'Email field must be marked with unique: true for MongoDB index generation'
      );
    });
  });
});

