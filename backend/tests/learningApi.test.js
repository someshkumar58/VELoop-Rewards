const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../server');
const { resetUsers } = require('../controllers/learningController');

describe('Step 2: REST API Fundamentals & Learning Endpoints', () => {
  beforeEach(() => {
    resetUsers();
  });

  // 1. Health-check endpoint preservation
  test('GET /api/health - returns 200 and confirms health status', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.message, 'VELoop Rewards Backend is running!');
  });

  // 2. GET /api/learning/users
  describe('GET /api/learning/users', () => {
    test('returns 200 with list of sample learning users', async () => {
      const res = await request(app).get('/api/learning/users');
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.count, 2);
      assert.ok(Array.isArray(res.body.data));
      assert.equal(res.body.data[0].name, 'Alice Beginner');
      assert.equal(res.body.data[1].name, 'Bob Learner');
    });
  });

  // 3. GET /api/learning/users/:id
  describe('GET /api/learning/users/:id', () => {
    test('returns 200 with single user for valid existing ID', async () => {
      const res = await request(app).get('/api/learning/users/1');
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.id, 1);
      assert.equal(res.body.data.name, 'Alice Beginner');
      assert.equal(res.body.data.email, 'alice@example.com');
    });

    test('returns 404 for unknown user ID', async () => {
      const res = await request(app).get('/api/learning/users/999');
      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /not found/i);
    });

    test('returns 400 for non-numeric user ID', async () => {
      const res = await request(app).get('/api/learning/users/abc');
      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /invalid user id format/i);
    });
  });

  // 4. POST /api/learning/users
  describe('POST /api/learning/users', () => {
    test('returns 201 and creates new user with valid name and email', async () => {
      const payload = {
        name: 'Charlie Student',
        email: 'charlie@example.com'
      };
      const res = await request(app)
        .post('/api/learning/users')
        .send(payload)
        .set('Content-Type', 'application/json');

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.name, 'Charlie Student');
      assert.equal(res.body.data.email, 'charlie@example.com');
      assert.ok(res.body.data.id);

      // Verify it was added to the list
      const listRes = await request(app).get('/api/learning/users');
      assert.equal(listRes.body.count, 3);
    });

    test('returns 400 when name is missing or empty', async () => {
      const res = await request(app)
        .post('/api/learning/users')
        .send({ email: 'noname@example.com' });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /name is required/i);
    });

    test('returns 400 when email is missing or empty', async () => {
      const res = await request(app)
        .post('/api/learning/users')
        .send({ name: 'No Email User' });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /email is required/i);
    });

    test('returns 400 when email format is invalid', async () => {
      const res = await request(app)
        .post('/api/learning/users')
        .send({ name: 'Bad Email User', email: 'not-an-email' });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /valid email address/i);
    });
  });

  // 5. PATCH /api/learning/users/:id
  describe('PATCH /api/learning/users/:id', () => {
    test('returns 200 and updates user name', async () => {
      const res = await request(app)
        .patch('/api/learning/users/1')
        .send({ name: 'Alice Advanced' });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.name, 'Alice Advanced');
      assert.equal(res.body.data.email, 'alice@example.com'); // Preserved
    });

    test('returns 200 and updates user email', async () => {
      const res = await request(app)
        .patch('/api/learning/users/2')
        .send({ email: 'bob.new@example.com' });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.email, 'bob.new@example.com');
      assert.equal(res.body.data.name, 'Bob Learner'); // Preserved
    });

    test('returns 404 for unknown user ID', async () => {
      const res = await request(app)
        .patch('/api/learning/users/999')
        .send({ name: 'Nobody' });

      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /not found/i);
    });

    test('returns 400 if no fields are provided to update', async () => {
      const res = await request(app)
        .patch('/api/learning/users/1')
        .send({});

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /provide at least one field/i);
    });

    test('returns 400 if invalid email format is passed in PATCH', async () => {
      const res = await request(app)
        .patch('/api/learning/users/1')
        .send({ email: 'invalid-email' });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /valid email/i);
    });
  });

  // 6. DELETE /api/learning/users/:id
  describe('DELETE /api/learning/users/:id', () => {
    test('returns 204 on successful deletion', async () => {
      const res = await request(app).delete('/api/learning/users/1');
      assert.equal(res.status, 204);
      assert.equal(res.text, '');

      // Verify user is gone
      const getRes = await request(app).get('/api/learning/users/1');
      assert.equal(getRes.status, 404);
    });

    test('returns 404 when trying to delete unknown user ID', async () => {
      const res = await request(app).delete('/api/learning/users/999');
      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /not found/i);
    });
  });

  // 7. Error handling middleware for malformed JSON
  describe('Error handling middleware', () => {
    test('returns 400 with clear error for malformed JSON body', async () => {
      const res = await request(app)
        .post('/api/learning/users')
        .set('Content-Type', 'application/json')
        .send('{"name": "Bad JSON", broken}');

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.equal(res.body.message, 'Malformed JSON payload received');
    });
  });
});

