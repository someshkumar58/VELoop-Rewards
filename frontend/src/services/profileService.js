import apiClient from './apiClient';
import { API_ENDPOINTS } from '../constants/apiEndpoints';
import { PREVIEW_USER } from '../constants/previewData';
import { isPreviewModeActive } from '../utils/previewMode';

// Helper for simulated preview delay so loading skeletons can be visually validated
const simulateDelay = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to check whether an authenticated user JWT exists in localStorage
const hasUserAuthToken = () => {
  return typeof window !== 'undefined' && !!localStorage.getItem('veloop_auth_token');
};

export const profileService = {
  /**
   * Fetch current user's profile information.
   * Dispatches genuine HTTP request to GET /api/profile/me when an auth token
   * exists or when Dev Preview mode is disabled.
   */
  async getProfile() {
    if (isPreviewModeActive() && !hasUserAuthToken()) {
      await simulateDelay();
      return {
        data: PREVIEW_USER,
        isDemoData: true
      };
    }
    const response = await apiClient.get(API_ENDPOINTS.PROFILE.ME);
    const profile = response.data?.user || response.data;
    if (profile && !profile.fullName && profile.name) {
      profile.fullName = profile.name;
    }
    return { data: profile, isDemoData: false };
  },

  /**
   * Update personal profile information.
   * Sanitizes payload to strictly allowed editable fields before sending PATCH request.
   */
  async updateProfile(updates) {
    if (isPreviewModeActive() && !hasUserAuthToken()) {
      await simulateDelay(250);
      return {
        success: true,
        message: 'Profile updated in Development Preview Mode.',
        data: { ...PREVIEW_USER, ...updates },
        isDemoData: true
      };
    }

    // Filter to strictly permitted fields to safeguard against accidental privilege escalation
    const sanitizedUpdates = {};
    if (updates.fullName !== undefined) sanitizedUpdates.fullName = updates.fullName;
    if (updates.name !== undefined) sanitizedUpdates.name = updates.name;
    if (updates.email !== undefined) sanitizedUpdates.email = updates.email;
    if (updates.phone !== undefined) sanitizedUpdates.phone = updates.phone;
    if (updates.avatarUrl !== undefined) sanitizedUpdates.avatarUrl = updates.avatarUrl;

    const response = await apiClient.patch(API_ENDPOINTS.PROFILE.UPDATE, sanitizedUpdates);
    const updatedData = response.data?.user || response.data;
    if (updatedData && !updatedData.fullName && updatedData.name) {
      updatedData.fullName = updatedData.name;
    }
    return { data: updatedData, isDemoData: false };
  },

  /**
   * Fetch 5 reward asset balances from GET /api/profile/rewards.
   * Maps backend keys ({ ves, sves, gems, tokens, xp }) strictly to numeric values.
   */
  async getRewardAssets() {
    if (isPreviewModeActive() && !hasUserAuthToken()) {
      await simulateDelay();
      return {
        data: PREVIEW_USER.rewards,
        isDemoData: true
      };
    }
    const response = await apiClient.get(API_ENDPOINTS.PROFILE.REWARDS);
    const raw = response.data?.rewards || response.data || {};
    const formattedRewards = {
      ves: typeof raw.ves === 'number' ? raw.ves : parseFloat(raw.ves) || 0,
      sves: typeof raw.sves === 'number' ? raw.sves : parseFloat(raw.sves) || 0,
      gems: typeof raw.gems === 'number' ? raw.gems : parseInt(raw.gems, 10) || 0,
      tokens: typeof raw.tokens === 'number' ? raw.tokens : parseFloat(raw.tokens) || 0,
      xp: typeof raw.xp === 'number' ? raw.xp : parseInt(raw.xp, 10) || 0
    };
    return { data: formattedRewards, isDemoData: false };
  },

  /**
   * Fetch Level & XP progression from GET /api/profile/level-progress.
   */
  async getLevelProgress() {
    if (isPreviewModeActive() && !hasUserAuthToken()) {
      await simulateDelay();
      return {
        data: PREVIEW_USER.levelProgress,
        isDemoData: true
      };
    }
    const response = await apiClient.get(API_ENDPOINTS.PROFILE.LEVEL_PROGRESS);
    return { data: response.data, isDemoData: false };
  },

  /**
   * Fetch achievements list from GET /api/profile/achievements.
   */
  async getAchievements() {
    if (isPreviewModeActive() && !hasUserAuthToken()) {
      await simulateDelay();
      return {
        data: PREVIEW_USER.achievements,
        isDemoData: true
      };
    }
    const response = await apiClient.get(API_ENDPOINTS.PROFILE.ACHIEVEMENTS);
    const achievements = response.data?.achievements || response.data?.data || response.data;
    return { data: achievements, isDemoData: false };
  },

  /**
   * Fetch withdrawal overview summary from GET /api/profile/withdrawal-summary.
   */
  async getWithdrawalSummary() {
    if (isPreviewModeActive() && !hasUserAuthToken()) {
      await simulateDelay();
      return {
        data: PREVIEW_USER.withdrawals,
        isDemoData: true
      };
    }
    try {
      const response = await apiClient.get(API_ENDPOINTS.PROFILE.WITHDRAWAL_SUMMARY);
      return { data: response.data, isDemoData: false };
    } catch {
      return { data: PREVIEW_USER.withdrawals, isDemoData: true };
    }
  },

  /**
   * Submit a new withdrawal request to POST /api/profile/withdrawals.
   * Atomically reserves Tokens from the user's wallet.
   */
  async createWithdrawal(payload) {
    if (isPreviewModeActive() && !hasUserAuthToken()) {
      await simulateDelay(250);
      return {
        success: true,
        message: '[Preview Mode] Simulated payout request submitted for review.',
        data: payload,
        isDemoData: true
      };
    }
    const response = await apiClient.post(API_ENDPOINTS.PROFILE.WITHDRAWALS, payload);
    return { ...response.data, isDemoData: false };
  },

  /**
   * Fetch user's paginated withdrawal records from GET /api/profile/withdrawals.
   */
  async getUserWithdrawals(params = {}) {
    if (isPreviewModeActive() && !hasUserAuthToken()) {
      await simulateDelay();
      return {
        data: [],
        pagination: { total: 0, page: 1, limit: 10, pages: 0 },
        isDemoData: true
      };
    }
    const response = await apiClient.get(API_ENDPOINTS.PROFILE.WITHDRAWALS, { params });
    return {
      data: response.data?.data || response.data,
      pagination: response.data?.pagination,
      isDemoData: false
    };
  },

  /**
   * Fetch referrals snapshot from GET /api/profile/referrals
   */
  async getReferrals() {
    if (isPreviewModeActive() && !hasUserAuthToken()) {
      await simulateDelay();
      return {
        data: PREVIEW_USER.referrals,
        isDemoData: true
      };
    }
    const response = await apiClient.get(API_ENDPOINTS.PROFILE.REFERRALS);
    const data = response.data?.referrals || response.data?.data || response.data;
    return { data, isDemoData: false };
  },

  /**
   * Fetch recent user reward activity from GET /api/profile/activity
   */
  async getRecentActivity() {
    if (isPreviewModeActive() && !hasUserAuthToken()) {
      await simulateDelay();
      return {
        data: PREVIEW_USER.recentActivities,
        isDemoData: true
      };
    }
    const response = await apiClient.get(API_ENDPOINTS.PROFILE.ACTIVITY);
    const data = response.data?.activities || response.data?.data || response.data;
    return { data, isDemoData: false };
  },

  /**
   * Fetch daily check-in and streak progression status.
   */
  async getCheckInStatus() {
    if (isPreviewModeActive() && !hasUserAuthToken()) {
      await simulateDelay(150);
      return {
        data: {
          success: true,
          currentStreak: 3,
          lastCheckInDate: '2026-11-04',
          canCheckInToday: true,
          hasCheckedInToday: false,
          todayDate: new Date().toISOString().split('T')[0],
          todayReward: { ves: 25, xp: 25 },
          streakGoal: 7,
          streakAchievementUnlocked: false
        },
        isDemoData: true
      };
    }
    const response = await apiClient.get(API_ENDPOINTS.PROFILE.CHECK_IN_STATUS);
    return { data: response.data, isDemoData: false };
  },

  /**
   * Claim daily check-in reward (+25 VEs, +25 XP) and advance streak.
   */
  async performCheckIn() {
    if (isPreviewModeActive() && !hasUserAuthToken()) {
      await simulateDelay(250);
      return {
        data: {
          success: true,
          message: 'Daily check-in successful! +25 VEs and +25 XP awarded.',
          checkIn: {
            checkInDate: new Date().toISOString().split('T')[0],
            streakCount: 4,
            rewardVEs: 25,
            rewardXP: 25
          },
          wallet: {
            ves: 4875.50,
            xp: 12475
          },
          streakAchievementUnlocked: false
        },
        isDemoData: true
      };
    }
    const response = await apiClient.post(API_ENDPOINTS.PROFILE.CHECK_IN);
    return { data: response.data, isDemoData: false };
  }
};
