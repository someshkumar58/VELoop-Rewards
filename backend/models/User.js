const mongoose = require('mongoose');

/**
 * ============================================================================
 * VELOOP REWARDS - USER SCHEMA & MODEL (STEP 4A)
 * ============================================================================
 * 
 * Represents platform users (both regular reward participants and administrators).
 * 
 * Field selection is aligned directly with the VELoop Rewards frontend contract:
 * - API Specification: frontend/API_INTEGRATION_STATUS.md
 * - User Profile: ProfileHero, ProfileEditModal, previewData (PREVIEW_USER)
 * - Admin Panel: AdminUserDetailsPage, AdminUsersPage (PREVIEW_USERS_LIST)
 * 
 * NOTICE:
 * - Financial balances (VEs, tokens, gems, XP) belong to the Wallet / Rewards system.
 *   They are separated into dedicated models in upcoming steps (separation of concerns).
 * - Plaintext passwords are NEVER stored. The optional `passwordHash` field is prepared
 *   for Step 5 (Authentication & bcrypt) with { select: false }.
 * ============================================================================
 */

// Standard RFC-compliant email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9]+([.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/;

const userSchema = new mongoose.Schema(
  {
    // Name of user (with alias 'fullName' for seamless frontend interoperability)
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
      alias: 'fullName'
    },

    // Normalized unique email address
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: [255, 'Email cannot exceed 255 characters'],
      match: [EMAIL_REGEX, 'Please provide a valid email address']
    },

    /**
     * Future authentication credential field (Step 5).
     * Stored as a salted bcrypt hash, never plaintext.
     * select: false prevents the hash from being returned in standard queries.
     * Not required in Step 4A to allow model validation tests without credentials.
     */
    passwordHash: {
      type: String,
      select: false
    },

    // User access role
    role: {
      type: String,
      enum: {
        values: ['user', 'admin'],
        message: '{VALUE} is not a valid role. Allowed roles are: user, admin'
      },
      default: 'user',
      trim: true,
      lowercase: true
    },

    // Account administrative status
    accountStatus: {
      type: String,
      enum: {
        values: ['Active', 'Suspended', 'Pending'],
        message: '{VALUE} is not a valid account status. Allowed values: Active, Suspended, Pending'
      },
      default: 'Active',
      trim: true,
      // Normalize casing so both 'active' and 'Active' are accepted
      set: (val) => {
        if (typeof val !== 'string') return val;
        const trimmed = val.trim();
        return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
      }
    },

    // Platform user identifier (e.g., VEL-894210 from frontend PREVIEW_USER)
    userId: {
      type: String,
      trim: true,
      uppercase: true
    },

    // Optional contact phone number
    phone: {
      type: String,
      trim: true,
      maxlength: [30, 'Phone number cannot exceed 30 characters']
    },

    // Avatar image URL
    avatarUrl: {
      type: String,
      trim: true,
      default: ''
    },

    // Unique personal referral code for the rewards system
    referralCode: {
      type: String,
      trim: true,
      uppercase: true
    },

    // Email / KYC verification flag
    isVerified: {
      type: Boolean,
      default: false
    },

    // User reward tier / progression level (reflected in frontend Profile & Admin views)
    level: {
      type: Number,
      default: 1,
      min: [1, 'Level must be at least 1']
    }
  },
  {
    // Automatically manages createdAt and updatedAt timestamps
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Prevent model overwrite in development/reloading environments
const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;
