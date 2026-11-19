import apiClient from './apiClient';
import { API_ENDPOINTS } from '../constants/apiEndpoints';
import { isPreviewModeActive } from '../utils/previewMode';

const simulateDelay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

const hasUserAuthToken = () => {
  return typeof window !== 'undefined' && !!localStorage.getItem('veloop_auth_token');
};

export const adService = {
  /**
   * Fetch user's ad watching status, daily quota, and active cooldown timer.
   * GET /api/ads/status
   */
  async getAdStatus() {
    if (isPreviewModeActive() && !hasUserAuthToken()) {
      await simulateDelay(150);
      return {
        data: {
          success: true,
          dailyLimit: 20,
          dailyCompleted: 2,
          remainingToday: 18,
          cooldownRemaining: 0,
          cooldownSeconds: 60,
          durationSeconds: 15,
          canWatch: true,
          baseReward: 15,
          levelMultiplier: 1.25,
          potentialReward: 18.75,
          currentLevel: 4,
          levelName: 'Gold Pioneer'
        },
        isDemoData: true
      };
    }

    const response = await apiClient.get(API_ENDPOINTS.ADS.STATUS);
    return { data: response.data, isDemoData: false };
  },

  /**
   * Initialize an ad watching session and obtain single-use impression nonce.
   * POST /api/ads/start-session
   */
  async startAdSession() {
    if (isPreviewModeActive() && !hasUserAuthToken()) {
      await simulateDelay(250);
      return {
        data: {
          success: true,
          message: 'Ad session started successfully.',
          impressionToken: `ad_sim_${Date.now()}`,
          durationSeconds: 15,
          baseReward: 15,
          levelMultiplier: 1.25,
          earnedReward: 18.75,
          currentLevel: 4,
          levelName: 'Gold Pioneer',
          expiresAt: new Date(Date.now() + 300000).toISOString()
        },
        isDemoData: true
      };
    }

    const response = await apiClient.post(API_ENDPOINTS.ADS.START_SESSION);
    return { data: response.data, isDemoData: false };
  },

  /**
   * Verify watch duration completion and claim VEs reward.
   * POST /api/ads/claim-reward
   * @param {string} impressionToken
   */
  async claimAdReward(impressionToken) {
    if (isPreviewModeActive() && !hasUserAuthToken()) {
      await simulateDelay(300);
      return {
        data: {
          success: true,
          message: 'Reward claimed successfully! +18.75 VEs added to your wallet.',
          earnedReward: 18.75,
          baseReward: 15,
          levelMultiplier: 1.25,
          newBalance: 4869.25,
          impressionToken,
          status: 'CLAIMED'
        },
        isDemoData: true
      };
    }

    const response = await apiClient.post(API_ENDPOINTS.ADS.CLAIM_REWARD, { impressionToken });
    return { data: response.data, isDemoData: false };
  }
};

