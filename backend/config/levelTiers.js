/**
 * VELoop Rewards — Approved Level Tiers & Threshold Configuration (Step 8)
 * 
 * Sourced directly from the approved 5-tier progression model:
 * - Level 1: Bronze Initiate (0 - 2,499 XP, 1.00x)
 * - Level 2: Silver Explorer (2,500 - 5,999 XP, 1.10x)
 * - Level 3: Titanium Voyager (6,000 - 9,999 XP, 1.15x)
 * - Level 4: Gold Pioneer (10,000 - 14,999 XP, 1.25x)
 * - Level 5: Diamond Legend (15,000+ XP, 1.50x)
 */

const LEVEL_TIERS = Object.freeze([
  {
    level: 1,
    name: 'Bronze Initiate',
    minXP: 0,
    maxXP: 2499,
    nextLevelThreshold: 2500,
    multiplier: '1.00x',
    perks: 'Standard daily check-in rewards'
  },
  {
    level: 2,
    name: 'Silver Explorer',
    minXP: 2500,
    maxXP: 5999,
    nextLevelThreshold: 6000,
    multiplier: '1.10x',
    perks: '+10% bonus on ad watches, priority queue'
  },
  {
    level: 3,
    name: 'Titanium Voyager',
    minXP: 6000,
    maxXP: 9999,
    nextLevelThreshold: 10000,
    multiplier: '1.15x',
    perks: 'Free monthly gem crate, 12h withdrawal window'
  },
  {
    level: 4,
    name: 'Gold Pioneer',
    minXP: 10000,
    maxXP: 14999,
    nextLevelThreshold: 15000,
    multiplier: '1.25x',
    perks: '+25% all reward multipliers, zero-fee token swaps'
  },
  {
    level: 5,
    name: 'Diamond Legend',
    minXP: 15000,
    maxXP: Infinity,
    nextLevelThreshold: null,
    multiplier: '1.50x',
    perks: 'VIP Telegram access, instant payouts, physical swag kit'
  }
]);

module.exports = {
  LEVEL_TIERS
};

