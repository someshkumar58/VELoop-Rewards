export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    USER_ME: '/profile/me',
    ADMIN_LOGIN: '/admin/auth/login',
    ADMIN_ME: '/admin/auth/me',
    ADMIN_LOGOUT: '/admin/auth/logout',
  },
  
  // User Profile
  PROFILE: {
    ME: '/profile/me',
    UPDATE: '/profile/me',
    REWARDS: '/profile/rewards',
    LEVEL_PROGRESS: '/profile/level-progress',
    ACHIEVEMENTS: '/profile/achievements',
    WITHDRAWAL_SUMMARY: '/profile/withdrawal-summary',
    WITHDRAWALS: '/profile/withdrawals',
    REFERRALS: '/profile/referrals',
    ACTIVITY: '/profile/activity',
    CHECK_IN_STATUS: '/profile/check-in-status',
    CHECK_IN: '/profile/check-in',
  },

  // Admin Management
  ADMIN: {
    STATS: '/admin/dashboard/stats',
    USERS: '/admin/users',
    USER_DETAILS: (id) => `/admin/users/${id}`,
    USER_STATUS: (id) => `/admin/users/${id}/status`,
    REWARDS: '/admin/rewards',
    REWARD_ADJUST: '/admin/rewards/adjust',
    LEVELS: '/admin/levels',
    LEVEL_DETAILS: (id) => `/admin/levels/${id}`,
    ACHIEVEMENTS: '/admin/achievements',
    ACHIEVEMENT_DETAILS: (id) => `/admin/achievements/${id}`,
    WITHDRAWALS: '/admin/withdrawals',
    WITHDRAWAL_ACTION: (id) => `/admin/withdrawals/${id}`,
    REFERRALS: '/admin/referrals',
    ACTIVITIES: '/admin/activity',
    AUDIT_LOGS: '/admin/audit-logs',
    SETTINGS: '/admin/settings',
  }
};
