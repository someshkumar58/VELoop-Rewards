const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const { generateToken } = require('../utils/jwt');

// Email regex matching User model
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9]+([.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/;

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user account with hashed password and return JWT
 * @access  Public
 */
const register = async (req, res) => {
  try {
    const { name, fullName, email, password } = req.body || {};
    const candidateName = (name || fullName || '').trim();

    // 1. Validate required fields
    if (!candidateName || candidateName.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Name is required and must be at least 2 characters long.'
      });
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password is required and must be at least 6 characters long.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2. Check for duplicate registration
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // 3. Hash password using bcryptjs with 10 salt rounds
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Create user and provision exactly one default wallet
    // Prefer multi-document ACID transactions on replica sets (MongoDB Atlas);
    // fall back to explicit compensating rollback if transactions are unsupported (e.g. standalone/mocks).
    let session = null;
    let useTransaction = false;

    try {
      if (
        mongoose.connection &&
        mongoose.connection.readyState === 1 &&
        typeof mongoose.startSession === 'function'
      ) {
        session = await mongoose.startSession();
        if (session && typeof session.startTransaction === 'function') {
          session.startTransaction();
          useTransaction = true;
        }
      }
    } catch {
      session = null;
      useTransaction = false;
    }

    let user;
    let wallet;

    if (useTransaction && session) {
      try {
        const createdUsers = await User.create(
          [
            {
              name: candidateName,
              email: normalizedEmail,
              passwordHash,
              role: 'user'
            }
          ],
          { session }
        );
        user = createdUsers[0];

        const createdWallets = await Wallet.create(
          [
            {
              user: user._id,
              vesBalance: 0,
              svesBalance: 0,
              gemsBalance: 0,
              tokensBalance: 0,
              xpTotal: 0
            }
          ],
          { session }
        );
        wallet = createdWallets[0];

        await session.commitTransaction();
      } catch (txnError) {
        await session.abortTransaction();
        throw txnError;
      } finally {
        session.endSession();
      }
    } else {
      // Standalone or mock environment: Create user, then wallet with safe rollback
      user = await User.create({
        name: candidateName,
        email: normalizedEmail,
        passwordHash,
        role: 'user'
      });

      try {
        wallet = await Wallet.create({
          user: user._id,
          vesBalance: 0,
          svesBalance: 0,
          gemsBalance: 0,
          tokensBalance: 0,
          xpTotal: 0
        });
      } catch (walletError) {
        // Rollback: delete created user to prevent orphaned account without wallet
        try {
          await User.findByIdAndDelete(user._id);
        } catch (cleanupErr) {
          console.error('[Registration Rollback Failure]:', cleanupErr.message);
        }
        throw walletError;
      }
    }

    // 5. Generate signed JWT token
    const token = generateToken(user);

    // 6. Return safe response (passwordHash is completely excluded)
    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus,
        level: user.level,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('[Auth Register Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error during user registration.'
    });
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user credentials and return JWT
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Explicitly select passwordHash because it has select: false in schema
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

    if (!user || !user.passwordHash) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Check account status
    if (user.accountStatus === 'Suspended') {
      return res.status(403).json({
        success: false,
        message: 'Account is suspended. Please contact platform administration.'
      });
    }

    // Verify submitted password against stored bcrypt hash
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus,
        level: user.level
      }
    });
  } catch (error) {
    console.error('[Auth Login Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication.'
    });
  }
};

/**
 * @route   POST /api/admin/auth/login
 * @desc    Authenticate administrator and return admin JWT (matches frontend adminService.login)
 * @access  Public
 */
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both administrator email and password.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

    // Reject non-admin users with generic invalid administrative credentials
    if (!user || !user.passwordHash || user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrative credentials.'
      });
    }

    if (user.accountStatus === 'Suspended') {
      return res.status(403).json({
        success: false,
        message: 'Administrator account is suspended.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrative credentials.'
      });
    }

    const token = generateToken(user);

    // Return exact payload shape expected by frontend adminService.login
    res.status(200).json({
      success: true,
      token,
      admin: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('[Admin Auth Login Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error during administrative authentication.'
    });
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get currently authenticated user's safe profile
 * @access  Private (Bearer JWT required)
 */
const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user
  });
};

/**
 * @route   POST /api/admin/auth/logout
 * @desc    Stateless logout acknowledgment matching frontend API_ENDPOINTS.AUTH.ADMIN_LOGOUT
 * @access  Public / Private
 */
const adminLogout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Administrator logged out successfully.'
  });
};

module.exports = {
  register,
  login,
  adminLogin,
  getMe,
  adminLogout
};

