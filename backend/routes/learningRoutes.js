/**
 * ============================================================================
 * LEARNING MODULE ROUTES - REST API FUNDAMENTALS (STEP 2 ONLY)
 * ============================================================================
 * 
 * Base Mount Point: /api/learning/users
 * 
 * Endpoints:
 * - GET    /api/learning/users        -> List all sample users
 * - GET    /api/learning/users/:id    -> Get a single user by ID
 * - POST   /api/learning/users        -> Create a user (in-memory)
 * - PATCH  /api/learning/users/:id    -> Update a user by ID
 * - DELETE /api/learning/users/:id    -> Delete a user by ID
 * 
 * NOTICE: These routes are for pedagogical purposes only.
 * They are not connected to real MongoDB collections or production auth.
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const learningController = require('../controllers/learningController');

// Define REST routes mapped to controller methods
router.get('/', learningController.getAllUsers);
router.get('/:id', learningController.getUserById);
router.post('/', learningController.createUser);
router.patch('/:id', learningController.updateUser);
router.delete('/:id', learningController.deleteUser);

module.exports = router;

