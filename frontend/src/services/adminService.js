import apiClient from './apiClient';
import { API_ENDPOINTS } from '../constants/apiEndpoints';
import {
  PREVIEW_ADMIN_DASHBOARD,
  PREVIEW_USERS_LIST,
  PREVIEW_WITHDRAWALS_LIST,
  PREVIEW_LEVELS_LIST,
  PREVIEW_ACHIEVEMENTS_LIST,
  PREVIEW_REFERRALS_LIST,
  PREVIEW_AUDIT_LOGS,
  PREVIEW_SETTINGS
} from '../constants/previewData';
import { isPreviewModeActive } from '../utils/previewMode';

const simulateDelay = (ms = 200) => new Promise(resolve => setTimeout(resolve, ms));

const hasRealAdminAuthToken = () => {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem('veloop_admin_token');
  return !!token && token !== 'demo_admin_jwt_token_sample_not_for_prod';
};

export const adminService = {
  /**
   * Admin Authentication
   * In Production (PROD), demo credentials bypass is strictly disabled.
   */
  async login(email, password) {
    // If demo credentials are explicitly submitted in preview mode, allow quick demo session
    if (isPreviewModeActive() && email === 'admin@veloop.io' && password === 'Admin@2026') {
      await simulateDelay(250);
      const demoAuth = {
        token: 'demo_admin_jwt_token_sample_not_for_prod',
        admin: {
          id: 'adm_01',
          email: 'admin@veloop.io',
          name: 'System Administrator',
          role: 'admin'
        }
      };
      localStorage.setItem('veloop_admin_token', demoAuth.token);
      localStorage.setItem('veloop_admin_profile', JSON.stringify(demoAuth.admin));
      return { success: true, ...demoAuth, isDemoData: true };
    }

    // Real backend request to MongoDB Atlas
    const response = await apiClient.post(API_ENDPOINTS.AUTH.ADMIN_LOGIN, { email, password });
    if (response.data?.token) {
      localStorage.setItem('veloop_admin_token', response.data.token);
      localStorage.setItem('veloop_admin_profile', JSON.stringify(response.data.admin));
    }
    return { ...response.data, isDemoData: false };
  },

  /**
   * Fetch Admin Dashboard Overview Statistics
   */
  async getDashboardStats() {
    if (isPreviewModeActive()) {
      await simulateDelay();
      return { data: PREVIEW_ADMIN_DASHBOARD, isDemoData: true };
    }
    const response = await apiClient.get(API_ENDPOINTS.ADMIN.STATS);
    return { data: response.data, isDemoData: false };
  },

  /**
   * User Management: List users with search, filter, sort
   */
  async getUsers(params = {}) {
    if (isPreviewModeActive()) {
      await simulateDelay();
      let users = [...PREVIEW_USERS_LIST];
      if (params.search) {
        const query = params.search.toLowerCase();
        users = users.filter(u =>
          u.fullName.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          u.userId.toLowerCase().includes(query)
        );
      }
      if (params.status && params.status !== 'All') {
        users = users.filter(u => u.accountStatus === params.status);
      }
      return {
        data: users,
        total: users.length,
        page: params.page || 1,
        limit: 10,
        isDemoData: true
      };
    }
    const response = await apiClient.get(API_ENDPOINTS.ADMIN.USERS, { params });
    return { data: response.data.users || response.data, total: response.data.total, isDemoData: false };
  },

  /**
   * User Details by ID
   */
  async getUserDetails(id) {
    if (isPreviewModeActive()) {
      await simulateDelay();
      const user = PREVIEW_USERS_LIST.find(u => u.id === id || u.userId === id);
      if (!user) {
        throw {
          status: 404,
          message: `Member with identifier '${id}' was not found in the directory.`
        };
      }
      return { data: user, isDemoData: true };
    }
    const response = await apiClient.get(API_ENDPOINTS.ADMIN.USER_DETAILS(id));
    return { data: response.data, isDemoData: false };
  },

  /**
   * Update User Account Status (Suspend / Restore)
   */
  async updateUserStatus(id, status, reason) {
    if (isPreviewModeActive()) {
      await simulateDelay(300);
      return {
        success: true,
        message: `User status changed to ${status} (Simulated Preview)`,
        isDemoData: true
      };
    }
    const response = await apiClient.patch(API_ENDPOINTS.ADMIN.USER_STATUS(id), { status, reason });
    return { data: response.data, isDemoData: false };
  },

  /**
   * Reward Management: Fetch overview and balances
   */
  async getRewardsOverview() {
    if (isPreviewModeActive()) {
      await simulateDelay();
      return {
        data: {
          distribution: PREVIEW_ADMIN_DASHBOARD.rewardDistribution,
          totalVEsDistributed: 1450890,
          pendingClaims: 34,
          reserveVaultBalance: '5,000,000 VEs'
        },
        isDemoData: true
      };
    }
    const response = await apiClient.get(API_ENDPOINTS.ADMIN.REWARDS);
    return { data: response.data, isDemoData: false };
  },

  /**
   * Reward Adjustment UI: Adjust balance with audit reason
   */
  async adjustUserReward(payload) {
    if (isPreviewModeActive()) {
      await simulateDelay(300);
      return {
        success: true,
        message: `Successfully adjusted balance for ${payload.userId} (Simulated Preview)`,
        isDemoData: true
      };
    }
    const response = await apiClient.post(API_ENDPOINTS.ADMIN.REWARD_ADJUST, payload);
    return { data: response.data, isDemoData: false };
  },

  /**
   * Level Management: List & Update
   */
  async getLevels() {
    if (isPreviewModeActive()) {
      await simulateDelay();
      return { data: PREVIEW_LEVELS_LIST, isDemoData: true };
    }
    const response = await apiClient.get(API_ENDPOINTS.ADMIN.LEVELS);
    return { data: response.data, isDemoData: false };
  },

  async updateLevel(id, data) {
    if (isPreviewModeActive()) {
      await simulateDelay(250);
      return { success: true, message: 'Level updated (Simulated Preview)', isDemoData: true };
    }
    const response = await apiClient.put(API_ENDPOINTS.ADMIN.LEVEL_DETAILS(id), data);
    return { data: response.data, isDemoData: false };
  },

  /**
   * Achievement Management: List & Update
   */
  async getAchievements() {
    if (isPreviewModeActive()) {
      await simulateDelay();
      return { data: PREVIEW_ACHIEVEMENTS_LIST, isDemoData: true };
    }
    const response = await apiClient.get(API_ENDPOINTS.ADMIN.ACHIEVEMENTS);
    return { data: response.data, isDemoData: false };
  },

  async updateAchievement(id, data) {
    if (isPreviewModeActive()) {
      await simulateDelay(250);
      return { success: true, message: 'Achievement updated (Simulated Preview)', isDemoData: true };
    }
    const response = await apiClient.put(API_ENDPOINTS.ADMIN.ACHIEVEMENT_DETAILS(id), data);
    return { data: response.data, isDemoData: false };
  },

  /**
   * Withdrawal Management: List & Review
   */
  async getWithdrawals(statusFilter = 'All') {
    if (isPreviewModeActive() && !hasRealAdminAuthToken()) {
      await simulateDelay();
      let list = [...PREVIEW_WITHDRAWALS_LIST];
      if (statusFilter !== 'All') {
        list = list.filter(w => w.status.toLowerCase() === statusFilter.toLowerCase());
      }
      return { data: list, isDemoData: true };
    }
    const response = await apiClient.get(API_ENDPOINTS.ADMIN.WITHDRAWALS, {
      params: { status: statusFilter !== 'All' ? statusFilter : undefined }
    });
    const data = response.data?.data || response.data;
    return { data, pagination: response.data?.pagination, isDemoData: false };
  },

  async reviewWithdrawal(id, status, reason = '') {
    if (isPreviewModeActive() && !hasRealAdminAuthToken()) {
      await simulateDelay(300);
      return {
        success: true,
        message: `Withdrawal request ${id} updated to ${status} (Simulated Preview)`,
        isDemoData: true
      };
    }
    const response = await apiClient.patch(API_ENDPOINTS.ADMIN.WITHDRAWAL_ACTION(id), { status, reason });
    return { data: response.data?.withdrawal || response.data, message: response.data?.message, isDemoData: false };
  },

  /**
   * Referral Management
   */
  async getReferrals() {
    if (isPreviewModeActive()) {
      await simulateDelay();
      return { data: PREVIEW_REFERRALS_LIST, isDemoData: true };
    }
    const response = await apiClient.get(API_ENDPOINTS.ADMIN.REFERRALS);
    return { data: response.data, isDemoData: false };
  },

  /**
   * Activity & Audit Logs
   */
  async getActivities() {
    if (isPreviewModeActive()) {
      await simulateDelay();
      return { data: PREVIEW_ADMIN_DASHBOARD.recentActivities, isDemoData: true };
    }
    const response = await apiClient.get(API_ENDPOINTS.ADMIN.ACTIVITIES);
    return { data: response.data, isDemoData: false };
  },

  async getAuditLogs() {
    if (isPreviewModeActive()) {
      await simulateDelay();
      return { data: PREVIEW_AUDIT_LOGS, isDemoData: true };
    }
    const response = await apiClient.get(API_ENDPOINTS.ADMIN.AUDIT_LOGS);
    return { data: response.data, isDemoData: false };
  },

  /**
   * Settings
   */
  async getSettings() {
    if (isPreviewModeActive()) {
      await simulateDelay();
      return { data: PREVIEW_SETTINGS, isDemoData: true };
    }
    const response = await apiClient.get(API_ENDPOINTS.ADMIN.SETTINGS);
    return { data: response.data, isDemoData: false };
  },

  async updateSettings(data) {
    if (isPreviewModeActive()) {
      await simulateDelay(300);
      return { success: true, message: 'Settings saved (Simulated Preview)', isDemoData: true };
    }
    const response = await apiClient.put(API_ENDPOINTS.ADMIN.SETTINGS, data);
    return { data: response.data, isDemoData: false };
  }
};
