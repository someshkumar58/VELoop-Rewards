export const PREVIEW_USER = {
  id: 'usr_894210',
  userId: 'VEL-894210',
  fullName: 'Alexander Wright',
  email: 'alex.wright@veloop.io',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  referralCode: 'VEL-ALEX99',
  memberSince: 'March 15, 2024',
  accountStatus: 'Active',
  isVerified: true,
  phone: '+1 (555) 382-9102',
  country: 'United States',
  kycTier: 'Tier 2 (Full KYC)',
  twoFactorEnabled: true,
  lastLogin: '2026-10-30 14:22 UTC (IP: 194.67.21.8)',

  // Reward Assets
  rewards: {
    ves: 4850.50,
    sves: 1220.00,
    gems: 345,
    tokens: 85.00,
    xp: 12450,
  },

  // Level & XP Progress
  levelProgress: {
    currentLevel: 4,
    levelName: 'Gold Pioneer',
    totalXP: 12450,
    currentLevelXPRequirement: 10000,
    nextLevelXPRequirement: 15000,
    remainingXP: 2550,
    progressPercentage: 83,
    rewardMultiplier: '1.25x'
  },

  // Achievements
  achievements: [
    {
      id: 'ach_01',
      title: 'First Step',
      description: 'Completed your first platform reward activity.',
      icon: 'Rocket',
      unlocked: true,
      unlockedAt: '2024-03-15',
      badgeColor: '#F4C76A',
      xpReward: 100
    },
    {
      id: 'ach_02',
      title: 'Streak Master',
      description: 'Maintained a 7-day continuous daily bonus streak.',
      icon: 'Flame',
      unlocked: true,
      unlockedAt: '2024-04-02',
      badgeColor: '#34D399',
      xpReward: 350
    },
    {
      id: 'ach_03',
      title: 'Crypto Pioneer',
      description: 'Performed your first token conversion to external wallet.',
      icon: 'Coins',
      unlocked: true,
      unlockedAt: '2024-05-18',
      badgeColor: '#6EA8FE',
      xpReward: 500
    },
    {
      id: 'ach_04',
      title: 'Ambassador',
      description: 'Successfully referred 5 verified active members.',
      icon: 'Users',
      unlocked: true,
      unlockedAt: '2024-06-10',
      badgeColor: '#A78BFA',
      xpReward: 800
    },
    {
      id: 'ach_05',
      title: 'Whale Tier',
      description: 'Accumulate a cumulative balance of 10,000 VEs.',
      icon: 'Crown',
      unlocked: false,
      progress: 4850.5,
      required: 10000,
      badgeColor: '#C7CEDB',
      xpReward: 1500
    },
    {
      id: 'ach_06',
      title: 'Centurion',
      description: 'Log into VELoop for 100 distinct days.',
      icon: 'Shield',
      unlocked: false,
      progress: 68,
      required: 100,
      badgeColor: '#C7CEDB',
      xpReward: 2000
    },
    {
      id: 'ach_07',
      title: 'Super Connector',
      description: 'Reach 50 confirmed friend referrals.',
      icon: 'Zap',
      unlocked: false,
      progress: 14,
      required: 50,
      badgeColor: '#C7CEDB',
      xpReward: 3000
    }
  ],

  // Withdrawal Overview
  withdrawals: {
    totalRequests: 8,
    pendingCount: 1,
    pendingAmount: 45.00,
    approvedCount: 6,
    rejectedCount: 1,
    rejectedAmount: 25.00,
    successfullyWithdrawnAmount: 320.00, // Note: pending ($45) is STRICTLY excluded
    currency: 'USD'
  },

  // Referral Snapshot
  referrals: {
    referralCode: 'VEL-ALEX99',
    totalReferrals: 18,
    successfulReferrals: 14,
    pendingReferrals: 4,
    referralRewardsVEs: 1400,
    referralXPEarned: 2800,
    currentMilestoneTarget: 20,
    milestoneCurrentCount: 14,
    milestoneReward: '500 Bonus VEs + Silver Ambassador Badge',
    milestonePercentage: 70
  },

  // Recent Activity Log
  recentActivities: [
    {
      id: 'act_101',
      type: 'DAILY_BONUS',
      title: 'Daily Streak Bonus (Day 8)',
      amount: '+25 VEs',
      assetType: 'ves',
      timestamp: '2 hours ago',
      status: 'Completed',
      icon: 'Gift'
    },
    {
      id: 'act_102',
      type: 'AD_REWARD',
      title: 'Sponsored Partner Ad View',
      amount: '+15 VEs',
      assetType: 'ves',
      timestamp: '5 hours ago',
      status: 'Completed',
      icon: 'PlaySquare'
    },
    {
      id: 'act_103',
      type: 'REFERRAL_REWARD',
      title: 'Referral Bonus: Marcus Brody joined',
      amount: '+100 VEs',
      assetType: 'ves',
      timestamp: 'Yesterday at 18:30',
      status: 'Completed',
      icon: 'UserPlus'
    },
    {
      id: 'act_104',
      type: 'XP_EARNED',
      title: 'Task Milestone Level XP Bonus',
      amount: '+250 XP',
      assetType: 'xp',
      timestamp: '2 days ago',
      status: 'Completed',
      icon: 'TrendingUp'
    },
    {
      id: 'act_105',
      type: 'WITHDRAWAL',
      title: 'USDC Payout Request (Polygon)',
      amount: '-$45.00 USD',
      assetType: 'usd',
      timestamp: '3 days ago',
      status: 'Pending',
      icon: 'ArrowDownRight'
    },
    {
      id: 'act_106',
      type: 'GEM_REWARD',
      title: 'Mystery Crate Drop',
      amount: '+5 Gems',
      assetType: 'gems',
      timestamp: '4 days ago',
      status: 'Completed',
      icon: 'Sparkles'
    }
  ]
};

export const PREVIEW_ADMIN_DASHBOARD = {
  stats: {
    totalUsers: 14892,
    usersGrowth: '+12.4% this month',
    activeUsers: 11240,
    activePercentage: 75.5,
    suspendedUsers: 48,
    suspendedPercentage: 0.32,
    totalRewardsDistributed: 1450890,
    pendingWithdrawalsCount: 24,
    pendingWithdrawalsAmount: 4850.00,
    totalReferralsRecorded: 6420,
    adminActionsToday: 18
  },
  rewardDistribution: [
    { name: 'VEs Distributed', amount: 980450, color: '#F4C76A' },
    { name: 'SVEs Staked', amount: 320140, color: '#6EA8FE' },
    { name: 'Gems Claimed', amount: 85400, color: '#A78BFA' },
    { name: 'Tokens Swapped', amount: 64900, color: '#C7CEDB' }
  ],
  recentActivities: [
    { id: 'act_adm_1', user: 'Sophia Martinez (VEL-4190)', type: 'Withdrawal Request', amount: '$120.00', time: '10 mins ago', status: 'Pending' },
    { id: 'act_adm_2', user: 'Liam Nguyen (VEL-1102)', type: 'Level 5 Achieved', amount: '+500 XP', time: '28 mins ago', status: 'Completed' },
    { id: 'act_adm_3', user: 'Emma Watson (VEL-7821)', type: 'Referral Surge (5 invites)', amount: '+500 VEs', time: '1 hour ago', status: 'Completed' },
    { id: 'act_adm_4', user: 'Lucas Vance (VEL-9912)', type: 'Flagged Multi-Account', amount: 'N/A', time: '2 hours ago', status: 'Flagged' }
  ],
  recentAdminLogs: [
    { id: 'log_01', admin: 'Sarah Jenkins (Security)', action: 'Suspended User', target: 'VEL-3391 (Bot pattern)', time: '25 mins ago' },
    { id: 'log_02', admin: 'Marcus Chen (Finance)', action: 'Approved Withdrawal', target: 'Req #W-904 ($250.00)', time: '1 hour ago' },
    { id: 'log_03', admin: 'David Kim (Operations)', action: 'Adjusted Level 4 XP Requirement', target: 'Level 4 Config', time: '3 hours ago' },
    { id: 'log_04', admin: 'Marcus Chen (Finance)', action: 'Rejected Withdrawal', target: 'Req #W-899 (Invalid address)', time: '5 hours ago' }
  ]
};

export const PREVIEW_USERS_LIST = [
  {
    id: 'usr_894210',
    userId: 'VEL-894210',
    fullName: 'Alexander Wright',
    email: 'alex.wright@veloop.io',
    accountStatus: 'Active',
    level: 4,
    vesBalance: 4850.50,
    tokensBalance: 85.00,
    referralsCount: 18,
    registeredDate: '2024-03-15',
    lastActive: '2026-10-30 14:22'
  },
  {
    id: 'usr_772109',
    userId: 'VEL-772109',
    fullName: 'Elena Rostova',
    email: 'elena.rostova@gmail.com',
    accountStatus: 'Active',
    level: 5,
    vesBalance: 12450.00,
    tokensBalance: 240.00,
    referralsCount: 42,
    registeredDate: '2024-01-10',
    lastActive: '2026-10-30 12:15'
  },
  {
    id: 'usr_339102',
    userId: 'VEL-339102',
    fullName: 'Lucas Vance',
    email: 'lucas.vance@techpulse.org',
    accountStatus: 'Suspended',
    level: 2,
    vesBalance: 620.00,
    tokensBalance: 0.00,
    referralsCount: 1,
    registeredDate: '2024-07-22',
    lastActive: '2026-10-28 09:41'
  },
  {
    id: 'usr_419011',
    userId: 'VEL-419011',
    fullName: 'Sophia Martinez',
    email: 'sophia.martinez@outlook.com',
    accountStatus: 'Active',
    level: 3,
    vesBalance: 2190.00,
    tokensBalance: 35.00,
    referralsCount: 9,
    registeredDate: '2024-05-19',
    lastActive: '2026-10-30 15:02'
  },
  {
    id: 'usr_110294',
    userId: 'VEL-110294',
    fullName: 'Liam Nguyen',
    email: 'liam.nguyen@proton.me',
    accountStatus: 'Active',
    level: 5,
    vesBalance: 18320.00,
    tokensBalance: 410.00,
    referralsCount: 65,
    registeredDate: '2023-11-05',
    lastActive: '2026-10-30 14:45'
  },
  {
    id: 'usr_551829',
    userId: 'VEL-551829',
    fullName: 'Aria Montgomery',
    email: 'aria.m@domain.co',
    accountStatus: 'Pending Verification',
    level: 1,
    vesBalance: 120.00,
    tokensBalance: 0.00,
    referralsCount: 0,
    registeredDate: '2024-10-25',
    lastActive: '2026-10-29 18:20'
  }
];

export const PREVIEW_WITHDRAWALS_LIST = [
  {
    id: 'wdr_904',
    requestId: 'W-904',
    userId: 'VEL-419011',
    userName: 'Sophia Martinez',
    amount: 120.00,
    currency: 'USDC (Polygon)',
    payoutAddress: '0x71C...B492',
    requestedAt: '2026-10-30 14:50',
    status: 'Pending',
    feeDeducted: 1.50,
    netPayout: 118.50
  },
  {
    id: 'wdr_903',
    requestId: 'W-903',
    userId: 'VEL-894210',
    userName: 'Alexander Wright',
    amount: 45.00,
    currency: 'USDT (Tron)',
    payoutAddress: 'TKs9...P8xQ',
    requestedAt: '2026-10-27 11:20',
    status: 'Pending',
    feeDeducted: 1.00,
    netPayout: 44.00
  },
  {
    id: 'wdr_902',
    requestId: 'W-902',
    userId: 'VEL-772109',
    userName: 'Elena Rostova',
    amount: 250.00,
    currency: 'Bank Wire / ACH',
    payoutAddress: 'Chase Bank (****4912)',
    requestedAt: '2026-10-26 09:15',
    status: 'Approved',
    feeDeducted: 0.00,
    netPayout: 250.00,
    reviewedBy: 'Marcus Chen',
    reviewedAt: '2026-10-26 14:00'
  },
  {
    id: 'wdr_901',
    requestId: 'W-901',
    userId: 'VEL-339102',
    userName: 'Lucas Vance',
    amount: 25.00,
    currency: 'PayPal',
    payoutAddress: 'lucas.vance@techpulse.org',
    requestedAt: '2026-10-24 16:30',
    status: 'Rejected',
    rejectionReason: 'Account flagged for review prior to withdrawal approval.',
    feeDeducted: 0.00,
    netPayout: 0.00,
    reviewedBy: 'Marcus Chen',
    reviewedAt: '2026-10-25 10:15'
  },
  {
    id: 'wdr_900',
    requestId: 'W-900',
    userId: 'VEL-110294',
    userName: 'Liam Nguyen',
    amount: 500.00,
    currency: 'USDC (Polygon)',
    payoutAddress: '0x32A...88FF',
    requestedAt: '2026-10-20 08:00',
    status: 'Approved',
    feeDeducted: 2.00,
    netPayout: 498.00,
    reviewedBy: 'Marcus Chen',
    reviewedAt: '2026-10-20 11:30'
  }
];

export const PREVIEW_LEVELS_LIST = [
  { id: 'lvl_1', level: 1, name: 'Bronze Initiate', minXP: 0, maxXP: 2499, multiplier: '1.00x', perks: 'Standard daily check-in rewards', activeUsers: 4890 },
  { id: 'lvl_2', level: 2, name: 'Silver Explorer', minXP: 2500, maxXP: 5999, multiplier: '1.10x', perks: '+10% bonus on ad watches, priority queue', activeUsers: 4120 },
  { id: 'lvl_3', level: 3, name: 'Titanium Voyager', minXP: 6000, maxXP: 9999, multiplier: '1.15x', perks: 'Free monthly gem crate, 12h withdrawal window', activeUsers: 3210 },
  { id: 'lvl_4', level: 4, name: 'Gold Pioneer', minXP: 10000, maxXP: 14999, multiplier: '1.25x', perks: '+25% all reward multipliers, zero-fee token swaps', activeUsers: 1980 },
  { id: 'lvl_5', level: 5, name: 'Diamond Legend', minXP: 15000, maxXP: 999999, multiplier: '1.50x', perks: 'VIP Telegram access, instant payouts, physical swag kit', activeUsers: 692 }
];

export const PREVIEW_ACHIEVEMENTS_LIST = [
  { id: 'ach_01', code: 'FIRST_STEP', title: 'First Step', description: 'Complete first platform reward activity', xpReward: 100, category: 'Onboarding', icon: 'Rocket', totalUnlocked: 14120 },
  { id: 'ach_02', code: 'STREAK_7', title: 'Streak Master', description: '7-day daily bonus streak', xpReward: 350, category: 'Loyalty', icon: 'Flame', totalUnlocked: 8940 },
  { id: 'ach_03', code: 'CRYPTO_SWAP', title: 'Crypto Pioneer', description: 'Convert tokens to external wallet', xpReward: 500, category: 'Rewards', icon: 'Coins', totalUnlocked: 4120 },
  { id: 'ach_04', code: 'AMBASSADOR', title: 'Ambassador', description: 'Refer 5 verified members', xpReward: 800, category: 'Community', icon: 'Users', totalUnlocked: 2890 },
  { id: 'ach_05', code: 'WHALE_TIER', title: 'Whale Tier', description: 'Accumulate 10,000 VEs total balance', xpReward: 1500, category: 'Elite', icon: 'Crown', totalUnlocked: 940 },
  { id: 'ach_06', code: 'CENTURION', title: 'Centurion', description: '100 distinct login days', xpReward: 2000, category: 'Loyalty', icon: 'Shield', totalUnlocked: 610 }
];

export const PREVIEW_REFERRALS_LIST = [
  { id: 'ref_1', referralCode: 'VEL-ALEX99', referrerName: 'Alexander Wright', referredUser: 'Marcus Brody', referredUserId: 'VEL-5519', date: '2026-10-29', status: 'Active (Tier 1)', rewardEarned: '100 VEs' },
  { id: 'ref_2', referralCode: 'VEL-ALEX99', referrerName: 'Alexander Wright', referredUser: 'Claire Sterling', referredUserId: 'VEL-5520', date: '2026-10-28', status: 'Active (Tier 1)', rewardEarned: '100 VEs' },
  { id: 'ref_3', referralCode: 'VEL-ALEX99', referrerName: 'Alexander Wright', referredUser: 'Tariq Al-Mansoor', referredUserId: 'VEL-5521', date: '2026-10-27', status: 'Pending Verification', rewardEarned: '0 VEs (Pending)' },
  { id: 'ref_4', referralCode: 'VEL-ELENA12', referrerName: 'Elena Rostova', referredUser: 'Nathalie Dupont', referredUserId: 'VEL-5522', date: '2026-10-26', status: 'Active (Tier 2)', rewardEarned: '250 VEs' },
  { id: 'ref_5', referralCode: 'VEL-LIAM88', referrerName: 'Liam Nguyen', referredUser: 'Jin Woo', referredUserId: 'VEL-5523', date: '2026-10-25', status: 'Active (Tier 1)', rewardEarned: '100 VEs' }
];

export const PREVIEW_AUDIT_LOGS = [
  { id: 'aud_101', adminUser: 'admin@veloop.io (SuperAdmin)', actionType: 'USER_SUSPENSION', entityType: 'User', entityId: 'VEL-339102', previousValue: 'Status: Active', newValue: 'Status: Suspended', timestamp: '2026-10-28 09:45:12', reason: 'Automated script detection on click fraud' },
  { id: 'aud_102', adminUser: 'finance@veloop.io (Finance)', actionType: 'WITHDRAWAL_APPROVAL', entityType: 'Withdrawal', entityId: 'W-902', previousValue: 'Status: Pending', newValue: 'Status: Approved ($250.00)', timestamp: '2026-10-26 14:00:22', reason: 'KYC verified & address match confirmed' },
  { id: 'aud_103', adminUser: 'admin@veloop.io (SuperAdmin)', actionType: 'LEVEL_CONFIG_UPDATE', entityType: 'Level', entityId: 'lvl_4', previousValue: 'MaxXP: 14000', newValue: 'MaxXP: 14999', timestamp: '2026-10-25 18:12:00', reason: 'Rebalanced level graduation curve' },
  { id: 'aud_104', adminUser: 'finance@veloop.io (Finance)', actionType: 'WITHDRAWAL_REJECTION', entityType: 'Withdrawal', entityId: 'W-901', previousValue: 'Status: Pending', newValue: 'Status: Rejected ($25.00)', timestamp: '2026-10-25 10:15:40', reason: 'Account flagged for suspicious activity' }
];

export const PREVIEW_SETTINGS = {
  platformName: 'VELoop Rewards',
  contactEmail: 'support@veloop.io',
  maintenanceMode: false,
  dailyBonusBaseVEs: 25,
  minWithdrawalUSD: 10.00,
  maxDailyWithdrawalUSD: 1000.00,
  withdrawalFeePercentage: 1.0,
  referralRewardBaseVEs: 100,
  requireKYCForWithdrawal: true,
  enableRegistration: true
};
