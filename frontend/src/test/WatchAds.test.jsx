import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import apiClient from '../services/apiClient';
import { adService } from '../services/adService';
import { ToastProvider } from '../context/ToastContext';
import WatchAdsModal from '../components/profile/WatchAdsModal';
import QuickActions from '../components/profile/QuickActions';
import { API_ENDPOINTS } from '../constants/apiEndpoints';

describe('Phase 2B.2: Frontend Watch Ads & Reward Simulation Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('adService API Methods', () => {
    it('dispatches GET to /ads/status when auth token exists', async () => {
      localStorage.setItem('veloop_auth_token', 'mock-valid-jwt');

      const mockStatusResponse = {
        data: {
          success: true,
          canWatch: true,
          dailyCompleted: 4,
          dailyLimit: 20,
          remainingToday: 16,
          cooldownRemaining: 0,
          currentLevel: 2,
          levelMultiplier: 1.5,
          baseReward: 15,
          potentialReward: 22.5
        }
      };

      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockStatusResponse);

      const result = await adService.getAdStatus();
      expect(getSpy).toHaveBeenCalledWith(API_ENDPOINTS.ADS.STATUS);
      expect(result.isDemoData).toBe(false);
      expect(result.data.canWatch).toBe(true);
      expect(result.data.potentialReward).toBe(22.5);
      expect(result.data.dailyCompleted).toBe(4);
    });

    it('dispatches POST to /ads/start-session when auth token exists', async () => {
      localStorage.setItem('veloop_auth_token', 'mock-valid-jwt');

      const mockStartResponse = {
        data: {
          success: true,
          message: 'Ad session initialized.',
          impressionToken: 'imp_token_1234567890abcdef',
          durationSeconds: 15,
          expiresAt: new Date(Date.now() + 300000).toISOString(),
          baseReward: 15,
          levelMultiplier: 1.5,
          potentialReward: 22.5
        }
      };

      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue(mockStartResponse);

      const result = await adService.startAdSession();
      expect(postSpy).toHaveBeenCalledWith(API_ENDPOINTS.ADS.START_SESSION);
      expect(result.isDemoData).toBe(false);
      expect(result.data.impressionToken).toBe('imp_token_1234567890abcdef');
      expect(result.data.durationSeconds).toBe(15);
    });

    it('dispatches POST to /ads/claim-reward with impressionToken', async () => {
      localStorage.setItem('veloop_auth_token', 'mock-valid-jwt');

      const mockClaimResponse = {
        data: {
          success: true,
          message: 'Ad reward claimed successfully! +22.50 VEs awarded.',
          earnedReward: 22.5,
          baseReward: 15,
          levelMultiplier: 1.5,
          wallet: {
            ves: 122.5,
            tokens: 50
          },
          dailyCompleted: 5,
          dailyLimit: 20,
          cooldownSeconds: 60
        }
      };

      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue(mockClaimResponse);

      const result = await adService.claimAdReward('imp_token_1234567890abcdef');
      expect(postSpy).toHaveBeenCalledWith(API_ENDPOINTS.ADS.CLAIM_REWARD, {
        impressionToken: 'imp_token_1234567890abcdef'
      });
      expect(result.isDemoData).toBe(false);
      expect(result.data.earnedReward).toBe(22.5);
      expect(result.data.wallet.ves).toBe(122.5);
    });
  });

  describe('QuickActions Watch Ads Card', () => {
    it('renders Watch Ads as active and invokes onOpenWatchAds when clicked', () => {
      const openModalSpy = vi.fn();
      render(
        <QuickActions
          onRequestWithdrawal={vi.fn()}
          onOpenDailyCheckIn={vi.fn()}
          onOpenWatchAds={openModalSpy}
        />
      );

      const adsTitle = screen.getByText('Watch Ads');
      expect(adsTitle).toBeInTheDocument();

      const adsCard = adsTitle.closest('button');
      expect(adsCard).toBeInTheDocument();
      expect(adsCard).toHaveTextContent('Active');

      fireEvent.click(adsCard);
      expect(openModalSpy).toHaveBeenCalledTimes(1);
    });

    it('renders Watch Ads with Pending badge when onOpenWatchAds is omitted', () => {
      render(
        <QuickActions
          onRequestWithdrawal={vi.fn()}
          onOpenDailyCheckIn={vi.fn()}
        />
      );

      const adsTitle = screen.getByText('Watch Ads');
      expect(adsTitle).toBeInTheDocument();

      const adsCard = adsTitle.closest('button');
      expect(adsCard).toHaveTextContent('Pending');

      fireEvent.click(adsCard);

      expect(screen.getByText(/Ad Provider SDK Integration/i)).toBeInTheDocument();
    });
  });

  describe('WatchAdsModal Component Lifecycle', () => {
    it('loads ad status and displays Ready state with reward potential and multiplier', async () => {
      localStorage.setItem('veloop_auth_token', 'mock-valid-jwt');

      vi.spyOn(adService, 'getAdStatus').mockResolvedValue({
        data: {
          success: true,
          canWatch: true,
          dailyCompleted: 3,
          dailyLimit: 20,
          remainingToday: 17,
          cooldownRemaining: 0,
          currentLevel: 2,
          levelMultiplier: 1.5,
          baseReward: 15,
          potentialReward: 22.5
        },
        isDemoData: false
      });

      render(
        <ToastProvider>
          <WatchAdsModal
            isOpen={true}
            onClose={vi.fn()}
            onRewardClaimed={vi.fn()}
          />
        </ToastProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/Earn \+22\.5 VEs per view/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/1.50x Multiplier/i)).toBeInTheDocument();
      expect(screen.getByText('3 / 20')).toBeInTheDocument();
      expect(screen.getByText(/Base: 15 VEs/i)).toBeInTheDocument();

      const startBtn = screen.getByRole('button', { name: /Watch Sponsored Ad/i });
      expect(startBtn).toBeInTheDocument();
      expect(startBtn).not.toBeDisabled();
    });

    it('displays Cooldown warning and disables button when cooldown is active', async () => {
      localStorage.setItem('veloop_auth_token', 'mock-valid-jwt');

      vi.spyOn(adService, 'getAdStatus').mockResolvedValue({
        data: {
          success: true,
          canWatch: false,
          dailyCompleted: 5,
          dailyLimit: 20,
          remainingToday: 15,
          cooldownRemaining: 42,
          currentLevel: 1,
          levelMultiplier: 1.0,
          baseReward: 15,
          potentialReward: 15.0
        },
        isDemoData: false
      });

      render(
        <ToastProvider>
          <WatchAdsModal
            isOpen={true}
            onClose={vi.fn()}
            onRewardClaimed={vi.fn()}
          />
        </ToastProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Cooldown Active/i })).toBeInTheDocument();
      });

      expect(screen.getByText(/seconds/i)).toBeInTheDocument();
      const startBtn = screen.getByRole('button', { name: /Cooldown Active/i });
      expect(startBtn).toBeDisabled();
    });

    it('displays Daily Limit Reached message and disables button when limit reached', async () => {
      localStorage.setItem('veloop_auth_token', 'mock-valid-jwt');

      vi.spyOn(adService, 'getAdStatus').mockResolvedValue({
        data: {
          success: true,
          canWatch: false,
          dailyCompleted: 20,
          dailyLimit: 20,
          remainingToday: 0,
          cooldownRemaining: 0,
          currentLevel: 1,
          levelMultiplier: 1.0,
          baseReward: 15,
          potentialReward: 15.0
        },
        isDemoData: false
      });

      render(
        <ToastProvider>
          <WatchAdsModal
            isOpen={true}
            onClose={vi.fn()}
            onRewardClaimed={vi.fn()}
          />
        </ToastProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/Daily Cap Reached/i)).toBeInTheDocument();
      });

      expect(screen.getByText('20 / 20')).toBeInTheDocument();
      const startBtn = screen.getByRole('button', { name: /Daily Limit Reached/i });
      expect(startBtn).toBeDisabled();
    });

    it('transitions from WATCHING to CLAIMING and SUCCESS, invoking onRewardClaimed', async () => {
      localStorage.setItem('veloop_auth_token', 'mock-valid-jwt');
      vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });

      vi.spyOn(adService, 'getAdStatus').mockResolvedValue({
        data: {
          success: true,
          canWatch: true,
          dailyCompleted: 0,
          dailyLimit: 20,
          remainingToday: 20,
          cooldownRemaining: 0,
          currentLevel: 1,
          levelMultiplier: 1.0,
          baseReward: 15,
          potentialReward: 15.0
        },
        isDemoData: false
      });

      const startSessionSpy = vi.spyOn(adService, 'startAdSession').mockResolvedValue({
        data: {
          success: true,
          impressionToken: 'imp_token_flow_test',
          durationSeconds: 15,
          baseReward: 15,
          levelMultiplier: 1.0,
          potentialReward: 15.0
        },
        isDemoData: false
      });

      const claimRewardSpy = vi.spyOn(adService, 'claimAdReward').mockResolvedValue({
        data: {
          success: true,
          message: 'Ad reward claimed successfully! +15.00 VEs awarded.',
          earnedReward: 15,
          baseReward: 15,
          levelMultiplier: 1.0,
          wallet: { ves: 140, tokens: 50 },
          dailyCompleted: 1,
          dailyLimit: 20,
          cooldownSeconds: 60
        },
        isDemoData: false
      });

      const onRewardClaimedSpy = vi.fn();

      render(
        <ToastProvider>
          <WatchAdsModal
            isOpen={true}
            onClose={vi.fn()}
            onRewardClaimed={onRewardClaimedSpy}
          />
        </ToastProvider>
      );

      // Wait for async fetchStatus resolution
      await vi.waitFor(() => {
        expect(screen.getByRole('button', { name: /Watch Sponsored Ad/i })).toBeInTheDocument();
      });

      const startBtn = screen.getByRole('button', { name: /Watch Sponsored Ad/i });

      // Click start button
      await act(async () => {
        fireEvent.click(startBtn);
      });

      expect(startSessionSpy).toHaveBeenCalledTimes(1);

      // Video simulation screen and countdown badge visible
      expect(screen.getByText(/SPONSORED STREAM/i)).toBeInTheDocument();
      expect(screen.getByText(/Reward unlocks in/i)).toBeInTheDocument();

      // Fast-forward 15 seconds
      await act(async () => {
        vi.advanceTimersByTime(15000);
      });

      // Claim reward API is called with the impression token
      expect(claimRewardSpy).toHaveBeenCalledWith('imp_token_flow_test');

      // Check onRewardClaimed was invoked
      await vi.waitFor(() => {
        expect(onRewardClaimedSpy).toHaveBeenCalledTimes(1);
      });

      expect(onRewardClaimedSpy).toHaveBeenCalledWith(
        expect.objectContaining({ earnedReward: 15 })
      );

      // Reward celebration screen is displayed
      expect(screen.getByText('Reward Unlocked!')).toBeInTheDocument();
      expect(screen.getByText('+15 VEs')).toBeInTheDocument();
      expect(screen.getByText(/140\.00 VEs/i)).toBeInTheDocument();

      vi.useRealTimers();
    });
  });
});
