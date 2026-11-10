const withdrawalService = require('../services/withdrawalService');

/**
 * @route   POST /api/profile/withdrawals
 * @desc    Submit a new withdrawal request (atomically reserves Tokens from wallet)
 * @access  Private (Bearer JWT required)
 */
const createWithdrawal = async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await withdrawalService.createWithdrawalRequest(userId, req.body);
    return res.status(201).json(result);
  } catch (err) {
    console.error('[Create Withdrawal Error]:', err.message);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Server error processing withdrawal request.'
    });
  }
};

/**
 * @route   GET /api/profile/withdrawals
 * @desc    Get logged-in user's paginated withdrawal history
 * @access  Private (Bearer JWT required)
 */
const getUserWithdrawals = async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await withdrawalService.getUserWithdrawals(userId, req.query);
    return res.status(200).json(result);
  } catch (err) {
    console.error('[Get User Withdrawals Error]:', err.message);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Server error retrieving withdrawal records.'
    });
  }
};

/**
 * @route   GET /api/profile/withdrawal-summary
 * @desc    Get logged-in user's withdrawal metrics (pending, approved, rejected, completed)
 * @access  Private (Bearer JWT required)
 */
const getWithdrawalSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await withdrawalService.getUserWithdrawalSummary(userId);
    return res.status(200).json(result);
  } catch (err) {
    console.error('[Get Withdrawal Summary Error]:', err.message);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Server error calculating withdrawal summary.'
    });
  }
};

module.exports = {
  createWithdrawal,
  getUserWithdrawals,
  getWithdrawalSummary
};

