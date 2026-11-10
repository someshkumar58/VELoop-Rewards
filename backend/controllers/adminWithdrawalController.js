const withdrawalService = require('../services/withdrawalService');

/**
 * @route   GET /api/admin/withdrawals
 * @desc    Get all platform withdrawal requests with optional status filtering & pagination
 * @access  Private (Admin role required)
 */
const getWithdrawals = async (req, res) => {
  try {
    const result = await withdrawalService.getAdminWithdrawals(req.query);
    return res.status(200).json(result);
  } catch (err) {
    console.error('[Admin Get Withdrawals Error]:', err.message);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Server error retrieving admin withdrawals.'
    });
  }
};

/**
 * @route   PATCH /api/admin/withdrawals/:id
 * @desc    Approve or reject a pending withdrawal request
 * @access  Private (Admin role required)
 */
const reviewWithdrawal = async (req, res) => {
  try {
    const adminId = req.user._id;
    const withdrawalId = req.params.id;
    const result = await withdrawalService.reviewWithdrawal(withdrawalId, adminId, req.body);
    return res.status(200).json(result);
  } catch (err) {
    console.error('[Admin Review Withdrawal Error]:', err.message);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Server error reviewing withdrawal request.'
    });
  }
};

module.exports = {
  getWithdrawals,
  reviewWithdrawal
};

