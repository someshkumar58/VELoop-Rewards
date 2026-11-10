const User = require('../models/User');
const Wallet = require('../models/Wallet');
const { calculateLevelProgress } = require('../services/levelService');
const achievementService = require('../services/achievementService');
const streakService = require('../services/streakService');

// Standard RFC-compliant email validation regex matching User model
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9]+([.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/;

// System-managed or privileged fields that ordinary users can NEVER modify via profile update
const FORBIDDEN_UPDATE_FIELDS = [
  'role',
  'accountStatus',
  'isVerified',
  'userId',
  'referralCode',
  'level',
  'passwordHash',
  'password',
  '_id',
  'id',
  'createdAt',
  'updatedAt'
];

/**
 * Helper to build safe user response payload conforming to both frontend contracts:
 * - Direct object matching frontend PREVIEW_USER contract: { id, fullName, email, rewards, ... }
 * - Nested standard contract: { success: true, user: { ... } }
 */
const formatUserProfile = (user, wallet = null) => {
  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'March 15, 2024';

  const rewards = wallet
    ? {
        ves: Number(wallet.vesBalance) || 0,
        sves: Number(wallet.svesBalance) || 0,
        gems: Number(wallet.gemsBalance) || 0,
        tokens: Number(wallet.tokensBalance) || 0,
        xp: Number(wallet.xpTotal) || 0
      }
    : {
        ves: 0,
        sves: 0,
        gems: 0,
        tokens: 0,
        xp: 0
      };

  const levelProgress = calculateLevelProgress(wallet ? wallet.xpTotal : 0);

  return {
    id: user._id.toString(),
    userId: user.userId || `VEL-${user._id.toString().slice(-6).toUpperCase()}`,
    name: user.name,
    fullName: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || '',
    avatarUrl: user.avatarUrl || '',
    referralCode: user.referralCode || `VEL-${user._id.toString().slice(-6).toUpperCase()}`,
    memberSince: formattedDate,
    accountStatus: user.accountStatus,
    isVerified: Boolean(user.isVerified),
    level: levelProgress.currentLevel,
    levelProgress,
    rewards,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

/**
 * @route   GET /api/profile and GET /api/profile/me
 * @desc    Get currently authenticated user's safe profile
 * @access  Private (Bearer JWT required)
 */
const getProfile = async (req, res) => {
  try {
    // Authenticated user ID is sourced exclusively from verified JWT, never client input
    const user = await User.findById(req.user._id).select('-passwordHash');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    if (user.accountStatus === 'Suspended') {
      return res.status(403).json({
        success: false,
        message: 'Account is suspended. Please contact platform administration.'
      });
    }

    const wallet = await Wallet.findOne({ user: user._id });
    const profilePayload = formatUserProfile(user, wallet);

    res.status(200).json({
      success: true,
      ...profilePayload,
      user: profilePayload,
      data: profilePayload
    });
  } catch (error) {
    console.error('[Get Profile Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving user profile.'
    });
  }
};

/**
 * @route   PATCH /api/profile and PATCH /api/profile/me
 * @desc    Update editable fields (name/fullName, email, phone, avatarUrl)
 * @access  Private (Bearer JWT required)
 */
const updateProfile = async (req, res) => {
  try {
    const body = req.body || {};

    // 1. Check for unauthorized attempts to modify privileged or system-managed fields
    const attemptedForbidden = FORBIDDEN_UPDATE_FIELDS.filter((field) => body[field] !== undefined);
    if (attemptedForbidden.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Modification of system-managed or privileged field(s) (${attemptedForbidden.join(', ')}) is not permitted.`
      });
    }

    // 2. Identify provided editable fields
    const { name, fullName, email, phone, avatarUrl } = body;
    const candidateName = fullName !== undefined ? fullName : name;

    const hasEditableField =
      candidateName !== undefined ||
      email !== undefined ||
      phone !== undefined ||
      avatarUrl !== undefined;

    if (!hasEditableField) {
      return res.status(400).json({
        success: false,
        message: 'No valid editable profile fields provided for update.'
      });
    }

    const updateFields = {};

    // 3. Validate name/fullName
    if (candidateName !== undefined) {
      if (typeof candidateName !== 'string' || candidateName.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Full name must be at least 2 characters long.'
        });
      }
      if (candidateName.trim().length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Full name cannot exceed 100 characters.'
        });
      }
      updateFields.name = candidateName.trim();
    }

    // 4. Validate and normalize email
    if (email !== undefined) {
      if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address.'
        });
      }
      const normalizedEmail = email.trim().toLowerCase();

      // Check for collision with another user's email
      const duplicateUser = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: req.user._id }
      });

      if (duplicateUser) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email address already exists.'
        });
      }
      updateFields.email = normalizedEmail;
    }

    // 5. Validate phone
    if (phone !== undefined) {
      if (phone !== null && typeof phone !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Phone number must be a string.'
        });
      }
      if (typeof phone === 'string' && phone.trim().length > 30) {
        return res.status(400).json({
          success: false,
          message: 'Phone number cannot exceed 30 characters.'
        });
      }
      updateFields.phone = phone ? phone.trim() : '';
    }

    // 6. Validate avatarUrl
    if (avatarUrl !== undefined) {
      if (avatarUrl !== null && typeof avatarUrl !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Avatar URL must be a string.'
        });
      }
      updateFields.avatarUrl = avatarUrl ? avatarUrl.trim() : '';
    }

    // 7. Perform update in database
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    const wallet = await Wallet.findOne({ user: updatedUser._id });
    const profilePayload = formatUserProfile(updatedUser, wallet);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      ...profilePayload,
      user: profilePayload,
      data: profilePayload
    });
  } catch (error) {
    console.error('[Update Profile Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error updating user profile.'
    });
  }
};

/**
 * @route   GET /api/profile/rewards
 * @desc    Get logged-in user's authoritative wallet reward balances
 * @access  Private (Bearer JWT required)
 */
const getRewards = async (req, res) => {
  try {
    // Authenticated user ID is sourced exclusively from verified JWT, never client input
    const wallet = await Wallet.findOne({ user: req.user._id });

    if (!wallet) {
      // Safe, consistent missing-wallet strategy:
      // Return HTTP 404 Not Found without performing silent write mutations on GET requests.
      return res.status(404).json({
        success: false,
        message: 'Wallet not found for this user account.'
      });
    }

    const rewards = {
      ves: Number(wallet.vesBalance) || 0,
      sves: Number(wallet.svesBalance) || 0,
      gems: Number(wallet.gemsBalance) || 0,
      tokens: Number(wallet.tokensBalance) || 0,
      xp: Number(wallet.xpTotal) || 0
    };

    res.status(200).json({
      success: true,
      ...rewards,
      rewards
    });
  } catch (error) {
    console.error('[Get Rewards Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving reward balances.'
    });
  }
};

/**
 * @route   GET /api/profile/level-progress
 * @desc    Get logged-in user's authoritative level and progression status
 * @access  Private (Bearer JWT required)
 */
const getLevelProgress = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user._id });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found for this user account.'
      });
    }

    const progress = calculateLevelProgress(wallet.xpTotal);

    res.status(200).json({
      success: true,
      ...progress,
      data: progress
    });
  } catch (error) {
    console.error('[Get Level Progress Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving level progress.'
    });
  }
};

/**
 * @route   GET /api/profile/achievements
 * @desc    Get logged-in user's authoritative achievements list and unlock states
 * @access  Private (Bearer JWT required)
 */
const getAchievements = async (req, res) => {
  try {
    const achievements = await achievementService.getUserAchievements(req.user._id);

    res.status(200).json({
      success: true,
      data: achievements,
      achievements
    });
  } catch (error) {
    console.error('[Get Achievements Error]:', error.message);
    if (error.message.includes('Wallet record not found') || error.message.includes('User not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error retrieving achievements.'
    });
  }
};

/**
 * @route   GET /api/profile/check-in-status
 * @desc    Retrieve daily check-in and streak progression status for authenticated user
 * @access  Private (Bearer JWT required)
 */
const getCheckInStatus = async (req, res) => {
  try {
    const status = await streakService.getCheckInStatus(req.user._id);
    return res.status(200).json(status);
  } catch (err) {
    console.error('[Get Check-in Status Error]:', err.message);
    if (err.message && err.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: err.message
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Internal server error retrieving check-in status.'
    });
  }
};

/**
 * @route   POST /api/profile/check-in
 * @desc    Claim daily check-in reward (+25 VEs, +25 XP) and advance streak for authenticated user
 * @access  Private (Bearer JWT required)
 */
const performCheckIn = async (req, res) => {
  try {
    // Identity is strictly sourced from verified JWT (req.user._id)
    const result = await streakService.performDailyCheckIn(req.user._id);

    if (result.alreadyCheckedIn) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error('[Perform Check-in Error]:', err.message);
    if (err.message && err.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: err.message
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Internal server error processing daily check-in.'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getRewards,
  getLevelProgress,
  getAchievements,
  getCheckInStatus,
  performCheckIn
};

