const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public authentication routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected authenticated user profile route
router.get('/me', protect, authController.getMe);

module.exports = router;

