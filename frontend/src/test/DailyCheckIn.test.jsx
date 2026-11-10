import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { profileService } from '../services/profileService';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import DailyCheckInModal from '../components/profile/DailyCheckInModal';
import QuickActions from '../components/profile/QuickActions';
import { API_ENDPOINTS } from '../constants/apiEndpoints';

describe('Step 10: Frontend Daily Check-in & Streak System Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('profileService Check-in Methods', () => {
    it('dispatches GET to /profile/check-in-status when auth token exists', async () => {
      localStorage.setItem('veloop_auth_token', 'mock-valid-jwt');

      const mockStatusResponse = {
        data: {
          success: true,
          currentStreak: 3,
          lastCheckInDate: '2026-11-04',
          canCheckInToday: true,
          hasCheckedInToday: false,
          todayDate: '2026-11-05',
          todayReward: { ves: 25, xp: 25 },
          streakGoal: 7,
          streakAchievementUnlocked: false
        }
      };

      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockStatusResponse);

      const result = await profileService.getCheckInStatus();
      expect(getSpy).toHaveBeenCalledWith(API_ENDPOINTS.PROFILE.CHECK_IN_STATUS);
      expect(result.isDemoData).toBe(false);
      expect(result.data.currentStreak).toBe(3);
      expect(result.data.canCheckInToday).toBe(true);
    });

    it('dispatches POST to /profile/check-in when auth token exists', async () => {
      localStorage.setItem('veloop_auth_token', 'mock-valid-jwt');

      const mockClaimResponse = {
        data: {
          success: true,
          message: 'Daily check-in successful! +25 VEs and +25 XP awarded.',
          checkIn: {
            checkInDate: '2026-11-05',
            streakCount: 4,
            rewardVEs: 25,
            rewardXP: 25
          },
          wallet: {
            ves: 200,
            xp: 500
          },
          streakAchievementUnlocked: false
        }
      };

      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue(mockClaimResponse);

      const result = await profileService.performCheckIn();
      expect(postSpy).toHaveBeenCalledWith(API_ENDPOINTS.PROFILE.CHECK_IN);
      expect(result.isDemoData).toBe(false);
      expect(result.data.checkIn.streakCount).toBe(4);
      expect(result.data.checkIn.rewardVEs).toBe(25);
    });
  });

  describe('QuickActions Earn Rewards Integration', () => {
    it('renders Earn Rewards as active and triggers onOpenDailyCheckIn when clicked', () => {
      const openModalSpy = vi.fn();
      render(
        <QuickActions
          onRequestWithdrawal={vi.fn()}
          onOpenDailyCheckIn={openModalSpy}
        />
      );

      const earnTitle = screen.getByText('Earn Rewards');
      expect(earnTitle).toBeInTheDocument();

      const earnCard = earnTitle.closest('button');
      expect(earnCard).toBeInTheDocument();

      fireEvent.click(earnCard);
      expect(openModalSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('DailyCheckInModal Component', () => {
    it('loads check-in status and displays current streak and claim button', async () => {
      localStorage.setItem('veloop_auth_token', 'mock-valid-jwt');

      vi.spyOn(profileService, 'getCheckInStatus').mockResolvedValue({
        data: {
          success: true,
          currentStreak: 3,
          lastCheckInDate: '2026-11-04',
          canCheckInToday: true,
          hasCheckedInToday: false,
          todayDate: '2026-11-05',
          todayReward: { ves: 25, xp: 25 },
          streakGoal: 7,
          streakAchievementUnlocked: false
        },
        isDemoData: false
      });

      render(
        <ToastProvider>
          <DailyCheckInModal
            isOpen={true}
            onClose={vi.fn()}
            onClaimSuccess={vi.fn()}
          />
        </ToastProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('3 Days')).toBeInTheDocument();
      });

      expect(screen.getByText('Current Check-in Streak')).toBeInTheDocument();
      expect(screen.getByText('+25 VEs & +25 XP')).toBeInTheDocument();

      const claimBtn = screen.getByRole('button', { name: /Claim Daily Bonus/i });
      expect(claimBtn).toBeInTheDocument();
      expect(claimBtn).not.toBeDisabled();
    });

    it('successfully claims daily check-in and invokes onClaimSuccess callback', async () => {
      localStorage.setItem('veloop_auth_token', 'mock-valid-jwt');

      vi.spyOn(profileService, 'getCheckInStatus').mockResolvedValue({
        data: {
          success: true,
          currentStreak: 3,
          canCheckInToday: true,
          hasCheckedInToday: false,
          todayDate: '2026-11-05',
          todayReward: { ves: 25, xp: 25 },
          streakGoal: 7
        },
        isDemoData: false
      });

      const onClaimSuccessSpy = vi.fn();

      vi.spyOn(profileService, 'performCheckIn').mockResolvedValue({
        data: {
          success: true,
          message: 'Daily check-in successful! +25 VEs and +25 XP awarded.',
          checkIn: {
            checkInDate: '2026-11-05',
            streakCount: 4,
            rewardVEs: 25,
            rewardXP: 25
          },
          wallet: { ves: 225, xp: 525 },
          streakAchievementUnlocked: false
        },
        isDemoData: false
      });

      render(
        <ToastProvider>
          <DailyCheckInModal
            isOpen={true}
            onClose={vi.fn()}
            onClaimSuccess={onClaimSuccessSpy}
          />
        </ToastProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Claim Daily Bonus/i })).toBeInTheDocument();
      });

      const claimBtn = screen.getByRole('button', { name: /Claim Daily Bonus/i });
      fireEvent.click(claimBtn);

      await waitFor(() => {
        expect(onClaimSuccessSpy).toHaveBeenCalledTimes(1);
      });

      expect(screen.getByRole('button', { name: /Checked In Today/i })).toBeDisabled();
    });

    it('renders already-claimed state with disabled button when user checked in today', async () => {
      localStorage.setItem('veloop_auth_token', 'mock-valid-jwt');

      vi.spyOn(profileService, 'getCheckInStatus').mockResolvedValue({
        data: {
          success: true,
          currentStreak: 4,
          canCheckInToday: false,
          hasCheckedInToday: true,
          todayDate: '2026-11-05',
          todayReward: { ves: 25, xp: 25 },
          streakGoal: 7
        },
        isDemoData: false
      });

      render(
        <ToastProvider>
          <DailyCheckInModal
            isOpen={true}
            onClose={vi.fn()}
            onClaimSuccess={vi.fn()}
          />
        </ToastProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('4 Days')).toBeInTheDocument();
      });

      const claimedBtn = screen.getByRole('button', { name: /Checked In Today/i });
      expect(claimedBtn).toBeDisabled();
      expect(screen.getByText(/You have already checked in for today/i)).toBeInTheDocument();
    });

    it('celebrates Day 7 milestone with achievement notification banner', async () => {
      localStorage.setItem('veloop_auth_token', 'mock-valid-jwt');

      vi.spyOn(profileService, 'getCheckInStatus').mockResolvedValue({
        data: {
          success: true,
          currentStreak: 6,
          canCheckInToday: true,
          hasCheckedInToday: false,
          todayDate: '2026-11-07',
          todayReward: { ves: 25, xp: 25 },
          streakGoal: 7
        },
        isDemoData: false
      });

      vi.spyOn(profileService, 'performCheckIn').mockResolvedValue({
        data: {
          success: true,
          message: 'Daily check-in successful! +25 VEs and +25 XP awarded.',
          checkIn: {
            checkInDate: '2026-11-07',
            streakCount: 7,
            rewardVEs: 25,
            rewardXP: 25
          },
          wallet: { ves: 500, xp: 1200 },
          streakAchievementUnlocked: true,
          achievement: {
            code: 'STREAK_7',
            title: 'Streak Master',
            xpReward: 350
          }
        },
        isDemoData: false
      });

      render(
        <ToastProvider>
          <DailyCheckInModal
            isOpen={true}
            onClose={vi.fn()}
            onClaimSuccess={vi.fn()}
          />
        </ToastProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Claim Daily Bonus/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Claim Daily Bonus/i }));

      await waitFor(() => {
        expect(screen.getByText(/Achievement Unlocked: Streak Master!/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/earned an extra/i)).toBeInTheDocument();
    });
  });
});

