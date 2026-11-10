const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const adminWithdrawalController = require('../controllers/adminWithdrawalController');

// All admin withdrawal routes require authentication and the 'admin' role
router.use(protect, authorize('admin'));

// GET /api/admin/withdrawals
router.get('/', adminWithdrawalController.getWithdrawals);

// PATCH /api/admin/withdrawals/:id
router.patch('/:id', adminWithdrawalController.reviewWithdrawal);

module.exports = router;

