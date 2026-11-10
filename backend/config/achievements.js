/**
 * VELoop Rewards — Canonical Achievement Catalog (Step 9)
 * 
 * Immutable definitions for platform achievements.
 * Sourced directly from frontend preview contracts and Step 9 Phase 1 audit:
 * - FIRST_STEP — First Step — 100 XP — 1 activity
 * - STREAK_7 — Streak Master — 350 XP — 7-day streak
 * - CRYPTO_SWAP — Crypto Pioneer — 500 XP — 1 external swap
 * - AMBASSADOR — Ambassador — 800 XP — 5 verified active referrals
 * - WHALE_TIER — Whale Tier — 1500 XP — 10,000 VEs
 * - CENTURION — Centurion — 2000 XP — 100 distinct login days
 * - SUPER_CONNECTOR — Super Connector — 3000 XP — 50 confirmed referrals
 */

const ACHIEVEMENTS = Object.freeze([
  {
    id: 'ach_01',
    code: 'FIRST_STEP',
    title: 'First Step',
    description: 'Completed your first platform reward activity.',
    category: 'Onboarding',
    icon: 'Rocket',
    badgeColor: '#F4C76A',
    xpReward: 100,
    required: 1
  },
  {
    id: 'ach_02',
    code: 'STREAK_7',
    title: 'Streak Master',
    description: 'Maintained a 7-day continuous daily bonus streak.',
    category: 'Loyalty',
    icon: 'Flame',
    badgeColor: '#34D399',
    xpReward: 350,
    required: 7
  },
  {
    id: 'ach_03',
    code: 'CRYPTO_SWAP',
    title: 'Crypto Pioneer',
    description: 'Performed your first token conversion to external wallet.',
    category: 'Rewards',
    icon: 'Coins',
    badgeColor: '#6EA8FE',
    xpReward: 500,
    required: 1
  },
  {
    id: 'ach_04',
    code: 'AMBASSADOR',
    title: 'Ambassador',
    description: 'Successfully referred 5 verified active members.',
    category: 'Community',
    icon: 'Users',
    badgeColor: '#A78BFA',
    xpReward: 800,
    required: 5
  },
  {
    id: 'ach_05',
    code: 'WHALE_TIER',
    title: 'Whale Tier',
    description: 'Accumulate a cumulative balance of 10,000 VEs.',
    category: 'Elite',
    icon: 'Crown',
    badgeColor: '#F59E0B',
    xpReward: 1500,
    required: 10000
  },
  {
    id: 'ach_06',
    code: 'CENTURION',
    title: 'Centurion',
    description: 'Log into VELoop for 100 distinct days.',
    category: 'Loyalty',
    icon: 'Shield',
    badgeColor: '#3B82F6',
    xpReward: 2000,
    required: 100
  },
  {
    id: 'ach_07',
    code: 'SUPER_CONNECTOR',
    title: 'Super Connector',
    description: 'Reach 50 confirmed friend referrals.',
    category: 'Community',
    icon: 'Zap',
    badgeColor: '#EC4899',
    xpReward: 3000,
    required: 50
  }
]);

const ACHIEVEMENTS_BY_CODE = Object.freeze(
  ACHIEVEMENTS.reduce((acc, ach) => {
    acc[ach.code] = ach;
    return acc;
  }, {})
);

module.exports = {
  ACHIEVEMENTS,
  ACHIEVEMENTS_BY_CODE
};

