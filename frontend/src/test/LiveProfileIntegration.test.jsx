import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { profileService } from '../services/profileService';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import UserProfilePage from '../pages/profile/UserProfilePage';
import { API_ENDPOINTS } from '../constants/apiEndpoints';

describe('Step 7: Frontend Profile & Wallet Live Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('profileService with Live Backend API', () => {
    it('fetches real user profile from GET /api/profile/me when auth token is present', async () => {
      localStorage.setItem('veloop_auth_token', 'real-user-test-jwt-token');

      const mockUserResponse = {
        data: {
          success: true,
          id: 'usr_real_123',
          userId: 'VEL-REAL01',
          name: 'Elena Rostova',
          fullName: 'Elena Rostova',
          email: 'elena@veloop.io',
          role: 'user',
          phone: '+1 (555) 0122',
          accountStatus: 'Active',
          isVerified: true,
          level: 2,
          rewards: { ves: 1500, sves: 300, gems: 25, tokens: 10, xp: 4500 }
        }
      };

      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockUserResponse);

      const res = await profileService.getProfile();

      expect(getSpy).toHaveBeenCalledWith(API_ENDPOINTS.PROFILE.ME);
      expect(res.isDemoData).toBe(false);
      expect(res.data.fullName).toBe('Elena Rostova');
      expect(res.data.email).toBe('elena@veloop.io');
      expect(res.data.role).toBe('user');
    });

    it('fetches authoritative wallet balances from GET /api/profile/rewards with correct numeric types', async () => {
      localStorage.setItem('veloop_auth_token', 'real-user-test-jwt-token');

      const mockRewardsResponse = {
        data: {
          success: true,
          ves: 2450.75,
          sves: 620.0,
          gems: 85,
          tokens: 35.5,
          xp: 7500
        }
      };

      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockRewardsResponse);

      const res = await profileService.getRewardAssets();

      expect(getSpy).toHaveBeenCalledWith(API_ENDPOINTS.PROFILE.REWARDS);
      expect(res.isDemoData).toBe(false);

      // Verify all 5 keys are mapped correctly to numeric numbers
      expect(res.data.ves).toBe(2450.75);
      expect(typeof res.data.ves).toBe('number');
      expect(res.data.sves).toBe(620.0);
      expect(typeof res.data.sves).toBe('number');
      expect(res.data.gems).toBe(85);
      expect(typeof res.data.gems).toBe('number');
      expect(res.data.tokens).toBe(35.5);
      expect(typeof res.data.tokens).toBe('number');
      expect(res.data.xp).toBe(7500);
      expect(typeof res.data.xp).toBe('number');
    });

    it('strictly preserves zero balances without inventing mock values', async () => {
      localStorage.setItem('veloop_auth_token', 'real-user-test-jwt-token');

      const mockZeroRewards = {
        data: {
          success: true,
          ves: 0,
          sves: 0,
          gems: 0,
          tokens: 0,
          xp: 0
        }
      };

      vi.spyOn(apiClient, 'get').mockResolvedValue(mockZeroRewards);

      const res = await profileService.getRewardAssets();

      expect(res.data.ves).toBe(0);
      expect(res.data.sves).toBe(0);
      expect(res.data.gems).toBe(0);
      expect(res.data.tokens).toBe(0);
      expect(res.data.xp).toBe(0);
    });

    it('submits allowed fields and strips privileged fields in PATCH /api/profile/me', async () => {
      localStorage.setItem('veloop_auth_token', 'real-user-test-jwt-token');

      const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValue({
        data: {
          success: true,
          user: {
            id: 'usr_real_123',
            fullName: 'Elena Updated',
            email: 'elena.updated@veloop.io',
            phone: '+1 (555) 9999',
            role: 'user'
          }
        }
      });

      const submissionPayload = {
        fullName: 'Elena Updated',
        email: 'elena.updated@veloop.io',
        phone: '+1 (555) 9999',
        // Attempt privileged field modification
        role: 'admin',
        accountStatus: 'Suspended',
        isVerified: true
      };

      const res = await profileService.updateProfile(submissionPayload);

      // Verify that apiClient.patch was ONLY called with allowed fields
      expect(patchSpy).toHaveBeenCalledWith(API_ENDPOINTS.PROFILE.UPDATE, {
        fullName: 'Elena Updated',
        email: 'elena.updated@veloop.io',
        phone: '+1 (555) 9999'
      });

      expect(res.isDemoData).toBe(false);
      expect(res.data.fullName).toBe('Elena Updated');
    });

    it('propagates API errors without replacing them with fake success', async () => {
      localStorage.setItem('veloop_auth_token', 'invalid-expired-token');

      vi.spyOn(apiClient, 'get').mockRejectedValue({
        status: 401,
        message: 'Token has expired. Please log in again.'
      });

      await expect(profileService.getProfile()).rejects.toMatchObject({
        status: 401,
        message: 'Token has expired. Please log in again.'
      });
    });

    it('fetches server-authoritative level progress from GET /api/profile/level-progress when auth token is present', async () => {
      localStorage.setItem('veloop_auth_token', 'real-user-test-jwt-token');

      const mockProgressResponse = {
        data: {
          success: true,
          currentLevel: 2,
          levelName: 'Silver Explorer',
          totalXP: 3200,
          currentLevelXPRequirement: 2500,
          nextLevelXPRequirement: 6000,
          remainingXP: 2800,
          progressPercentage: 20,
          rewardMultiplier: '1.10x'
        }
      };

      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockProgressResponse);

      const res = await profileService.getLevelProgress();

      expect(getSpy).toHaveBeenCalledWith(API_ENDPOINTS.PROFILE.LEVEL_PROGRESS);
      expect(res.isDemoData).toBe(false);
      expect(res.data.currentLevel).toBe(2);
      expect(res.data.levelName).toBe('Silver Explorer');
      expect(res.data.totalXP).toBe(3200);
      expect(res.data.progressPercentage).toBe(20);
    });

    it('fetches authoritative achievements list from GET /api/profile/achievements when auth token is present', async () => {
      localStorage.setItem('veloop_auth_token', 'real-user-test-jwt-token');

      const mockAchievementsResponse = {
        data: {
          success: true,
          data: [
            { id: 'ach_01', code: 'FIRST_STEP', title: 'First Step', unlocked: true, xpReward: 100 }
          ]
        }
      };

      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockAchievementsResponse);

      const res = await profileService.getAchievements();

      expect(getSpy).toHaveBeenCalledWith(API_ENDPOINTS.PROFILE.ACHIEVEMENTS);
      expect(res.isDemoData).toBe(false);
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.data[0].code).toBe('FIRST_STEP');
    });
  });

  describe('UserProfilePage Live Integration & Error Handling', () => {
    it('renders ErrorState component when real profile API fails', async () => {
      // Live mode without token or with broken backend
      localStorage.setItem('veloop_dev_preview', 'false');

      vi.spyOn(profileService, 'getProfile').mockRejectedValue(
        new Error('Network Error: Unable to connect to backend server on port 5000')
      );
      vi.spyOn(profileService, 'getRewardAssets').mockResolvedValue({
        data: { ves: 0, sves: 0, gems: 0, tokens: 0, xp: 0 },
        isDemoData: false
      });

      render(
        <MemoryRouter>
          <ToastProvider>
            <AuthProvider>
              <UserProfilePage />
            </AuthProvider>
          </ToastProvider>
        </MemoryRouter>
      );

      expect(await screen.findByText('Profile Service Unavailable')).toBeInTheDocument();
      expect(
        screen.getByText(/Network Error: Unable to connect to backend server on port 5000/i)
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
    });

    it('renders live user profile and balances when backend responds successfully', async () => {
      localStorage.setItem('veloop_auth_token', 'valid-test-jwt');
      localStorage.setItem('veloop_dev_preview', 'false');

      vi.spyOn(profileService, 'getProfile').mockResolvedValue({
        data: {
          id: 'usr_live_888',
          userId: 'VEL-888',
          fullName: 'Marcus Aurelius',
          email: 'marcus@veloop.io',
          role: 'user',
          accountStatus: 'Active',
          isVerified: true,
          level: 3,
          memberSince: 'November 1, 2026',
          rewards: { ves: 500.0, sves: 100.0, gems: 15, tokens: 5.0, xp: 1200 }
        },
        isDemoData: false
      });

      vi.spyOn(profileService, 'getRewardAssets').mockResolvedValue({
        data: { ves: 500.0, sves: 100.0, gems: 15, tokens: 5.0, xp: 1200 },
        isDemoData: false
      });

      vi.spyOn(profileService, 'getLevelProgress').mockResolvedValue({
        data: {
          currentLevel: 3,
          levelName: 'Titanium Voyager',
          totalXP: 6000,
          currentLevelXPRequirement: 6000,
          nextLevelXPRequirement: 10000,
          remainingXP: 4000,
          progressPercentage: 0,
          rewardMultiplier: '1.15x'
        },
        isDemoData: false
      });

      vi.spyOn(profileService, 'getAchievements').mockResolvedValue({
        data: [],
        isDemoData: false
      });

      render(
        <MemoryRouter>
          <ToastProvider>
            <AuthProvider>
              <UserProfilePage />
            </AuthProvider>
          </ToastProvider>
        </MemoryRouter>
      );

      expect(await screen.findByText('Marcus Aurelius')).toBeInTheDocument();
      expect(screen.getByText('marcus@veloop.io')).toBeInTheDocument();
      expect(screen.getByText('VEL-888')).toBeInTheDocument();
      expect(screen.getByText('Titanium Voyager')).toBeInTheDocument();
    });
  });
});

