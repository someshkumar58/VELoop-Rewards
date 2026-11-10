/**
 * ============================================================================
 * LEARNING MODULE CONTROLLER - REST API FUNDAMENTALS (STEP 2 ONLY)
 * ============================================================================
 * 
 * IMPORTANT EDUCATIONAL NOTICES:
 * 1. TEMPORARY IN-MEMORY STORAGE:
 *    The data below lives exclusively in server RAM in a standard JavaScript array.
 *    Any time the server restarts or file changes are saved by nodemon,
 *    all added, updated, or deleted records will reset to default.
 * 
 * 2. NOT FOR PRODUCTION USE:
 *    This module is designed strictly for pedagogical purposes to demonstrate
 *    HTTP methods (GET, POST, PATCH, DELETE) and status codes (200, 201, 204, 400, 404).
 * 
 * 3. NO REAL USER DATA OR CREDENTIALS:
 *    These endpoints must NEVER be connected to the real User Profile,
 *    Wallet, Rewards balance, or Admin Dashboard. No real accounts or
 *    passwords are handled here.
 * ============================================================================
 */

// Email format validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// In-memory array of sample learning users (resets on server restart)
let learningUsers = [
  { id: 1, name: 'Alice Beginner', email: 'alice@example.com' },
  { id: 2, name: 'Bob Learner', email: 'bob@example.com' }
];
let nextId = 3;

/**
 * Helper to reset users state (primarily for automated testing)
 */
const resetUsers = () => {
  learningUsers = [
    { id: 1, name: 'Alice Beginner', email: 'alice@example.com' },
    { id: 2, name: 'Bob Learner', email: 'bob@example.com' }
  ];
  nextId = 3;
};

/**
 * @route   GET /api/learning/users
 * @desc    Get all sample learning users
 * @access  Learning / Public
 */
const getAllUsers = (req, res) => {
  res.status(200).json({
    success: true,
    count: learningUsers.length,
    data: learningUsers
  });
};

/**
 * @route   GET /api/learning/users/:id
 * @desc    Get a single sample learning user by ID
 * @access  Learning / Public
 */
const getUserById = (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user ID format. ID must be an integer.'
    });
  }

  const user = learningUsers.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: `Learning user with ID ${id} not found`
    });
  }

  res.status(200).json({
    success: true,
    data: user
  });
};

/**
 * @route   POST /api/learning/users
 * @desc    Create a new sample learning user
 * @access  Learning / Public
 */
const createUser = (req, res) => {
  const { name, email } = req.body || {};

  // Validation: Check name presence and type
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Name is required and must be a non-empty string'
    });
  }

  // Validation: Check email presence, type, and format
  if (!email || typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Email is required and must be a non-empty string'
    });
  }

  if (!EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address (e.g. user@example.com)'
    });
  }

  const newUser = {
    id: nextId++,
    name: name.trim(),
    email: email.trim().toLowerCase()
  };

  learningUsers.push(newUser);

  res.status(201).json({
    success: true,
    message: 'Learning user created successfully (in-memory only)',
    data: newUser
  });
};

/**
 * @route   PATCH /api/learning/users/:id
 * @desc    Update a sample learning user's name or email
 * @access  Learning / Public
 */
const updateUser = (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user ID format. ID must be an integer.'
    });
  }

  const userIndex = learningUsers.findIndex((u) => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      message: `Learning user with ID ${id} not found`
    });
  }

  const { name, email } = req.body || {};

  if (name === undefined && email === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Please provide at least one field to update (name or email)'
    });
  }

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name must be a non-empty string'
      });
    }
    learningUsers[userIndex].name = name.trim();
  }

  if (email !== undefined) {
    if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address format'
      });
    }
    learningUsers[userIndex].email = email.trim().toLowerCase();
  }

  res.status(200).json({
    success: true,
    message: 'Learning user updated successfully (in-memory only)',
    data: learningUsers[userIndex]
  });
};

/**
 * @route   DELETE /api/learning/users/:id
 * @desc    Delete a sample learning user by ID
 * @access  Learning / Public
 */
const deleteUser = (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user ID format. ID must be an integer.'
    });
  }

  const userIndex = learningUsers.findIndex((u) => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      message: `Learning user with ID ${id} not found`
    });
  }

  learningUsers.splice(userIndex, 1);

  // HTTP 204 No Content indicates successful deletion with an empty response body
  res.status(204).send();
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetUsers
};

