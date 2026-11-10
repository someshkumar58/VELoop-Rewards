const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

// Public admin login
router.post('/login', authController.adminLogin);

// Protected admin profile check
router.get('/me', protect, authorize('admin'), authController.getMe);

// Stateless admin logout
router.post('/logout', authController.adminLogout);

module.exports = router;

