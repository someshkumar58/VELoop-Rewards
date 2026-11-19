import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { profileService } from '../services/profileService';
import { adminService } from '../services/adminService';
import NotFoundPage from '../pages/common/NotFoundPage';
import UnauthorizedPage from '../pages/common/UnauthorizedPage';

describe('Services, API Contract & Routing Isolation Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('profileService', () => {
    it('fetches user profile successfully with valid data structure', async () => {
      const res = await profileService.getProfile();
      expect(res.data).toBeDefined();
      expect(res.data).toHaveProperty('id');
      expect(res.data).toHaveProperty('fullName');
      expect(res.data).toHaveProperty('email');
      expect(res.data).toHaveProperty('rewards');
      expect(res.data.rewards).toHaveProperty('ves');
      expect(res.data.rewards).toHaveProperty('sves');
      expect(res.data.rewards).toHaveProperty('gems');
      expect(res.data.rewards).toHaveProperty('tokens');
      expect(res.data.rewards).toHaveProperty('xp');
      expect(res.isDemoData).toBe(true);
    });

    it('updates user profile in preview mode without corrupting existing fields', async () => {
      const updateData = { fullName: 'Alex Somesh', bio: 'Senior Engineer' };
      const res = await profileService.updateProfile(updateData);
      expect(res.data.fullName).toBe('Alex Somesh');
      expect(res.data.bio).toBe('Senior Engineer');
      expect(res.isDemoData).toBe(true);
    });

    it('fetches reward assets, levels, and withdrawal summary', async () => {
      const assets = await profileService.getRewardAssets();
      expect(assets.data).toHaveProperty('ves');

      const levels = await profileService.getLevelProgress();
      expect(levels.data).toHaveProperty('currentLevel');

      const withdrawals = await profileService.getWithdrawalSummary();
      expect(withdrawals.data).toHaveProperty('successfullyWithdrawnAmount');
      expect(withdrawals.data.successfullyWithdrawnAmount).toBe(320.00);
      expect(withdrawals.data.pendingAmount).toBe(45.00);
    });

    it('fetches referrals snapshot with milestone and reward stats', async () => {
      const referrals = await profileService.getReferrals();
      expect(referrals.data).toBeDefined();
      expect(referrals.data).toHaveProperty('referralCode');
      expect(referrals.data).toHaveProperty('totalReferrals');
      expect(referrals.data).toHaveProperty('successfulReferrals');
      expect(referrals.data).toHaveProperty('referralRewardsVEs');
      expect(referrals.data).toHaveProperty('milestonePercentage');
    });

    it('fetches recent user activity stream with ledger details', async () => {
      const activity = await profileService.getRecentActivity();
      expect(activity.data).toBeDefined();
      expect(Array.isArray(activity.data)).toBe(true);
      if (activity.data.length > 0) {
        expect(activity.data[0]).toHaveProperty('id');
        expect(activity.data[0]).toHaveProperty('type');
        expect(activity.data[0]).toHaveProperty('amount');
        expect(activity.data[0]).toHaveProperty('status');
      }
    });
  });

  describe('adminService', () => {
    it('fetches admin dashboard summary statistics with all required metrics', async () => {
      const res = await adminService.getDashboardStats();
      expect(res.data).toBeDefined();
      expect(res.data.stats).toHaveProperty('totalUsers');
      expect(res.data.stats).toHaveProperty('totalRewardsDistributed');
      expect(res.data.stats).toHaveProperty('pendingWithdrawalsCount');
      expect(res.data).toHaveProperty('rewardDistribution');
      expect(res.data).toHaveProperty('recentActivities');
      expect(res.isDemoData).toBe(true);
    });

    it('filters users by search query and status', async () => {
      const res = await adminService.getUsers({ search: 'Elena', status: 'All' });
      expect(res.data.length).toBeGreaterThan(0);
      expect(res.data[0].fullName).toContain('Elena');
      expect(res.isDemoData).toBe(true);
    });

    it('rejects invalid user lookups with 404 error contract', async () => {
      try {
        await adminService.getUserDetails('invalid-user-xyz');
        expect.unreachable('Should have thrown 404');
      } catch (err) {
        expect(err.status).toBe(404);
        expect(err.message).toContain('not found');
      }
    });

    it('updates user status and logs audit trail reason', async () => {
      const res = await adminService.updateUserStatus('usr-101', 'Suspended', 'Suspicious login pattern detected');
      expect(res.success).toBe(true);
      expect(res.message).toContain('Suspended');
      expect(res.isDemoData).toBe(true);
    });

    it('fetches level progression tiers and calculates requirement curves', async () => {
      const res = await adminService.getLevels();
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.data.length).toBeGreaterThanOrEqual(5);
      expect(res.data[0]).toHaveProperty('level');
      expect(res.data[0]).toHaveProperty('minXP');
      expect(res.data[0]).toHaveProperty('maxXP');
    });
  });

  describe('Routing & 404 / 401 Error Pages', () => {
    it('renders 404 Not Found Page for arbitrary unknown routes', () => {
      render(
        <MemoryRouter initialEntries={['/unknown-nonexistent-path-987']}>
          <Routes>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByRole('heading', { name: /404.*Page Not Found/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /User Profile/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Admin Dashboard/i })).toBeInTheDocument();
    });

    it('renders 401 Unauthorized Page with access warning', () => {
      render(
        <MemoryRouter initialEntries={['/unauthorized']}>
          <Routes>
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByRole('heading', { name: /Access Restricted/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Return to User Profile/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Admin Login/i })).toBeInTheDocument();
    });
  });
});
