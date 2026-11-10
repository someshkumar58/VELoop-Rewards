import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToastProvider } from '../context/ToastContext';
import { AuthProvider } from '../context/AuthContext';
import ProfileHero from '../components/profile/ProfileHero';
import RewardAssets from '../components/profile/RewardAssets';
import LevelAchievements from '../components/profile/LevelAchievements';
import WithdrawalOverview from '../components/profile/WithdrawalOverview';
import WithdrawalRequestModal from '../components/profile/WithdrawalRequestModal';
import ProfileEditModal from '../components/profile/ProfileEditModal';
import RecentActivity from '../components/profile/RecentActivity';
import { PREVIEW_USER } from '../constants/previewData';

describe('User Profile Module Complete Testing', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders Profile Hero with correct user attributes and level', () => {
    render(
      <ToastProvider>
        <ProfileHero user={PREVIEW_USER} onOpenEdit={() => {}} />
      </ToastProvider>
    );

    expect(screen.getByText('Alexander Wright')).toBeInTheDocument();
    expect(screen.getByText('VEL-894210')).toBeInTheDocument();
    expect(screen.getByText('VEL-ALEX99')).toBeInTheDocument();
    expect(screen.getByText('Level 4: Gold Pioneer')).toBeInTheDocument();
    expect(screen.getByText('KYC Verified')).toBeInTheDocument();
  });

  it('handles copy interactions for User ID and Referral Code', async () => {
    const writeTextMock = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

    render(
      <ToastProvider>
        <ProfileHero user={PREVIEW_USER} onOpenEdit={() => {}} />
      </ToastProvider>
    );

    const copyBtns = screen.getAllByTitle(/Copy User ID|Copy Referral Code/i);
    expect(copyBtns.length).toBeGreaterThanOrEqual(2);

    fireEvent.click(copyBtns[0]);
    expect(writeTextMock).toHaveBeenCalledWith('VEL-894210');

    fireEvent.click(copyBtns[1]);
    expect(writeTextMock).toHaveBeenCalledWith('VEL-ALEX99');
  });

  it('renders all 5 reward asset cards with appropriate balances', () => {
    render(
      <AuthProvider>
        <RewardAssets rewards={PREVIEW_USER.rewards} />
      </AuthProvider>
    );

    expect(screen.getByText('VEs')).toBeInTheDocument();
    expect(screen.getByText('SVEs')).toBeInTheDocument();
    expect(screen.getByText('Gems')).toBeInTheDocument();
    expect(screen.getByText('Tokens')).toBeInTheDocument();
    expect(screen.getByText('XP')).toBeInTheDocument();

    // Check formatting
    expect(screen.getByText('4,850.50')).toBeInTheDocument();
    expect(screen.getByText('1,220.00')).toBeInTheDocument();
    expect(screen.getByText('345')).toBeInTheDocument();
    expect(screen.getByText('85.00')).toBeInTheDocument();
    expect(screen.getByText('12,450')).toBeInTheDocument();
  });

  it('strictly isolates pending withdrawals from completed withdrawal total', () => {
    render(
      <WithdrawalOverview
        withdrawals={PREVIEW_USER.withdrawals}
        onRequestWithdrawal={() => {}}
      />
    );

    // Completed total is strictly 320.00
    expect(screen.getByText(/320\.00/i)).toBeInTheDocument();
    // Pending total (45.00) is shown in pending card, NOT in completed
    expect(screen.getByText(/45\.00.*awaiting admin review/i)).toBeInTheDocument();
    expect(screen.getByText('Strict Rule: Pending requests are strictly excluded from completed total.')).toBeInTheDocument();
  });

  it('validates withdrawal modal amount and balance limits in Tokens', async () => {
    const submitMock = vi.fn();
    render(
      <ToastProvider>
        <AuthProvider>
          <WithdrawalRequestModal
            isOpen={true}
            onClose={() => {}}
            maxAmount={85.00}
            onSubmitWithdrawal={submitMock}
          />
        </AuthProvider>
      </ToastProvider>
    );

    const amountInput = screen.getByLabelText(/Withdrawal Amount \(Tokens\)/i);
    const destinationInput = screen.getByLabelText(/Payout Destination/i);

    // Initial reserved balance preview for default 25.00
    expect(screen.getByText('25.00 Tokens')).toBeInTheDocument();

    // Test minimum amount validation (min 0.01 Tokens)
    fireEvent.change(amountInput, { target: { value: '0.005' } });
    fireEvent.change(destinationInput, { target: { value: '0x123abc' } });

    const submitBtn = screen.getByRole('button', { name: /Submit.*Request/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Minimum withdrawal amount is 0\.01 Tokens/i)).toBeInTheDocument();

    // Test excessive balance validation
    fireEvent.change(amountInput, { target: { value: '200.00' } });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Insufficient balance/i)).toBeInTheDocument();
  });

  it('validates profile edit modal required fields', async () => {
    render(
      <ToastProvider>
        <ProfileEditModal
          isOpen={true}
          onClose={() => {}}
          user={PREVIEW_USER}
          onUpdated={() => {}}
        />
      </ToastProvider>
    );

    const nameInput = screen.getByLabelText(/Full Name/i);
    fireEvent.change(nameInput, { target: { value: '' } });

    const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(saveBtn);

    expect(await screen.findByText(/Full name is required/i)).toBeInTheDocument();
  });

  it('filters recent activity list by selected category', () => {
    render(
      <RecentActivity activities={PREVIEW_USER.recentActivities} />
    );

    expect(screen.getByText('Daily Streak Bonus (Day 8)')).toBeInTheDocument();
    expect(screen.getByText('Sponsored Partner Ad View')).toBeInTheDocument();

    // Filter to ONLY AD_REWARD
    const adFilterBtn = screen.getByRole('button', { name: /AD REWARD/i });
    fireEvent.click(adFilterBtn);

    expect(screen.getByText('Sponsored Partner Ad View')).toBeInTheDocument();
    expect(screen.queryByText('Daily Streak Bonus (Day 8)')).not.toBeInTheDocument();
  });

  it('renders empty achievement state when no achievements exist', () => {
    render(
      <LevelAchievements
        levelProgress={PREVIEW_USER.levelProgress}
        achievements={[]}
      />
    );

    expect(screen.getByText('No achievements yet')).toBeInTheDocument();
  });
});
