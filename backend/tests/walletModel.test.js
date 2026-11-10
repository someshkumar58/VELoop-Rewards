const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');

describe('Step 4B: Wallet Model & Schema Validation Tests', () => {
  // 1. Valid wallet validation
  test('valid wallet with user reference and balances passes validation', async () => {
    const userId = new mongoose.Types.ObjectId();
    const wallet = new Wallet({
      user: userId,
      vesBalance: 4850.50,
      svesBalance: 1220.00,
      gemsBalance: 345,
      tokensBalance: 85.00,
      xpTotal: 12450
    });

    await assert.doesNotReject(async () => {
      await wallet.validate();
    });

    assert.equal(wallet.user.toString(), userId.toString());
    assert.equal(wallet.vesBalance, 4850.50);
    assert.equal(wallet.svesBalance, 1220.00);
    assert.equal(wallet.gemsBalance, 345);
    assert.equal(wallet.tokensBalance, 85.00);
    assert.equal(wallet.xpTotal, 12450);
  });

  // 2. Default balance values
  test('initializes all reward balances to zero by default', () => {
    const userId = new mongoose.Types.ObjectId();
    const wallet = new Wallet({ user: userId });

    assert.equal(wallet.vesBalance, 0);
    assert.equal(wallet.svesBalance, 0);
    assert.equal(wallet.gemsBalance, 0);
    assert.equal(wallet.tokensBalance, 0);
    assert.equal(wallet.xpTotal, 0);
  });

  // 3. Aliases support for frontend contract compatibility
  test('supports frontend contract aliases (ves, sves, gems, tokens, xp)', async () => {
    const userId = new mongoose.Types.ObjectId();
    const wallet = new Wallet({
      user: userId,
      ves: 100.50,
      sves: 50.25,
      gems: 10,
      tokens: 25.00,
      xp: 500
    });

    await assert.doesNotReject(async () => {
      await wallet.validate();
    });

    // Verify getter and setter interoperability
    assert.equal(wallet.vesBalance, 100.50);
    assert.equal(wallet.ves, 100.50);
    assert.equal(wallet.svesBalance, 50.25);
    assert.equal(wallet.sves, 50.25);
    assert.equal(wallet.gemsBalance, 10);
    assert.equal(wallet.gems, 10);
    assert.equal(wallet.tokensBalance, 25.00);
    assert.equal(wallet.tokens, 25.00);
    assert.equal(wallet.xpTotal, 500);
    assert.equal(wallet.xp, 500);
  });

  // 4. Required user reference
  describe('Required user reference validation', () => {
    test('fails validation when user reference is missing', async () => {
      const wallet = new Wallet({
        vesBalance: 100
      });

      await assert.rejects(
        async () => {
          await wallet.validate();
        },
        (err) => {
          assert.ok(err.errors.user, 'Expected error on user field');
          assert.match(err.errors.user.message, /user reference is required/i);
          return true;
        }
      );
    });

    test('fails validation when user reference is an invalid ObjectId', async () => {
      const wallet = new Wallet({
        user: 'invalid-not-an-objectid'
      });

      await assert.rejects(
        async () => {
          await wallet.validate();
        },
        (err) => {
          assert.ok(err.errors.user, 'Expected cast error on user field');
          return true;
        }
      );
    });
  });

  // 5. Negative values rejection
  describe('Negative balance rejection', () => {
    const negativeCases = [
      { field: 'vesBalance', value: -1, name: 'VEs' },
      { field: 'svesBalance', value: -0.5, name: 'SVEs' },
      { field: 'gemsBalance', value: -5, name: 'Gems' },
      { field: 'tokensBalance', value: -10, name: 'Tokens' },
      { field: 'xpTotal', value: -100, name: 'XP' }
    ];

    for (const { field, value, name } of negativeCases) {
      test(`rejects negative balance for ${name} (${field}: ${value})`, async () => {
        const wallet = new Wallet({
          user: new mongoose.Types.ObjectId(),
          [field]: value
        });

        await assert.rejects(
          async () => {
            await wallet.validate();
          },
          (err) => {
            assert.ok(err.errors[field], `Expected error on ${field}`);
            assert.match(err.errors[field].message, /cannot be negative/i);
            return true;
          }
        );
      });
    }
  });

  // 6. Invalid non-numeric values rejection
  describe('Invalid data type rejection', () => {
    test('rejects non-numeric string values for numeric balances', async () => {
      const wallet = new Wallet({
        user: new mongoose.Types.ObjectId(),
        vesBalance: 'not-a-number'
      });

      await assert.rejects(
        async () => {
          await wallet.validate();
        },
        (err) => {
          assert.ok(err.errors.vesBalance, 'Expected cast error for non-numeric balance');
          return true;
        }
      );
    });
  });

  // 7. Schema configuration checks
  describe('Schema configuration & relationship integrity', () => {
    test('user reference correctly points to "User" model', () => {
      const userPath = Wallet.schema.path('user');
      assert.equal(userPath.options.ref, 'User', 'Wallet.user must reference User model');
      assert.equal(userPath.instance, 'ObjectId', 'Wallet.user must be an ObjectId type');
    });

    test('schema defines unique index on user reference for one-to-one relationship', () => {
      /**
       * IMPORTANT NOTE ON UNIQUE ENFORCEMENT:
       * Mongoose's validate() method runs purely in-memory on the active node process.
       * It validates types, required fields, and min/max constraints, but CANNOT verify
       * whether another wallet already exists for this user in MongoDB Atlas.
       * 
       * Actual one-to-one uniqueness is enforced by the unique index generated in
       * MongoDB ({ user: 1 }, unique: true). If a duplicate wallet is inserted,
       * MongoDB throws an E11000 duplicate key error.
       */
      const userPath = Wallet.schema.path('user');
      assert.equal(
        userPath.options.unique,
        true,
        'Wallet.user must have unique: true to enforce one wallet per user in MongoDB'
      );
    });

    test('timestamps (createdAt, updatedAt) are enabled on Wallet schema', () => {
      assert.ok(Wallet.schema.paths.createdAt, 'Wallet schema must define createdAt');
      assert.ok(Wallet.schema.paths.updatedAt, 'Wallet schema must define updatedAt');
      assert.equal(Wallet.schema.options.timestamps, true);
    });
  });
});
