import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../context/ToastContext';
import { AuthProvider } from '../context/AuthContext';
import LevelsPage from '../pages/profile/LevelsPage';
import LevelBadge, { TIER_CONFIG } from '../components/common/LevelBadge';

describe('LevelsPage & LevelBadge Redesign Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('LevelBadge Component', () => {
    it('renders LevelBadge for all 5 canonical tiers with proper accessibility and config', () => {
      [1, 2, 3, 4, 5].forEach((tier) => {
        const { unmount } = render(
          <LevelBadge tier={tier} size="md" showRibbon={true} />
        );
        const config = TIER_CONFIG[tier];
        const badge = screen.getByLabelText(`${config.name} Badge (Level ${tier})`);
        expect(badge).toBeInTheDocument();
        expect(screen.getByText(config.ribbonText)).toBeInTheDocument();
        unmount();
      });
    });

    it('renders with locked state and disables ribbon when requested', () => {
      render(
        <LevelBadge tier={5} size="lg" locked={true} showRibbon={false} />
      );
      const badge = screen.getByLabelText(/Diamond Legend Badge/i);
      expect(badge).toBeInTheDocument();
      expect(screen.queryByText(/LEVEL 5 • DIAMOND/i)).not.toBeInTheDocument();
    });
  });

  describe('LevelsPage Interactive Experience', () => {
    it('renders Hero VIP status section with active Gold Pioneer tier and 1.25x multiplier', async () => {
      render(
        <MemoryRouter>
          <ToastProvider>
            <AuthProvider>
              <LevelsPage />
            </AuthProvider>
          </ToastProvider>
        </MemoryRouter>
      );

      // Hero rank title (level 1 heading) and multiplier
      expect(await screen.findByRole('heading', { level: 1, name: 'Gold Pioneer' })).toBeInTheDocument();
      expect(screen.getAllByText(/1\.25x Earning Multiplier/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/12,450 XP/i)).toBeInTheDocument();
      expect(screen.getByText(/Next Rank Target:/i)).toBeInTheDocument();
      expect(screen.getByText(/15,000 XP/i)).toBeInTheDocument();
    });

    it('renders interactive 5-tier roadmap pathway with all tier nodes', async () => {
      render(
        <MemoryRouter>
          <ToastProvider>
            <AuthProvider>
              <LevelsPage />
            </AuthProvider>
          </ToastProvider>
        </MemoryRouter>
      );

      expect(await screen.findByRole('heading', { name: /Progression Pathway/i })).toBeInTheDocument();
      expect(screen.getByText(/Tier 4 of 5/i)).toBeInTheDocument();

      // Check all 5 tier nodes in roadmap/cards
      expect(screen.getAllByRole('heading', { name: 'Bronze Initiate' }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('heading', { name: 'Silver Explorer' }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('heading', { name: 'Titanium Voyager' }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('heading', { name: 'Diamond Legend' }).length).toBeGreaterThan(0);
    });

    it('renders all 5 comprehensive Tier Showcase cards with multipliers and perks', async () => {
      render(
        <MemoryRouter>
          <ToastProvider>
            <AuthProvider>
              <LevelsPage />
            </AuthProvider>
          </ToastProvider>
        </MemoryRouter>
      );

      expect(await screen.findByRole('heading', { name: /Tier Rewards & Privileges/i })).toBeInTheDocument();

      // Multiplier calls across cards & table
      expect(screen.getAllByText('1.00x').length).toBeGreaterThan(0);
      expect(screen.getAllByText('1.10x').length).toBeGreaterThan(0);
      expect(screen.getAllByText('1.15x').length).toBeGreaterThan(0);
      expect(screen.getAllByText('1.50x').length).toBeGreaterThan(0);

      // Specific perks
      expect(screen.getByText(/Zero-fee cryptocurrency & token redemption swaps/i)).toBeInTheDocument();
      expect(screen.getByText(/Instant settlement routing on all token redemptions/i)).toBeInTheDocument();
    });

    it('renders side-by-side tier comparison matrix table with YOU column indicator', async () => {
      render(
        <MemoryRouter>
          <ToastProvider>
            <AuthProvider>
              <LevelsPage />
            </AuthProvider>
          </ToastProvider>
        </MemoryRouter>
      );

      expect(await screen.findByRole('heading', { name: /Full Tier Comparison Matrix/i })).toBeInTheDocument();
      expect(screen.getByText('YOU')).toBeInTheDocument();
      expect(screen.getByText('XP Range Requirement')).toBeInTheDocument();
      expect(screen.getByText('Internal Token Swap Fee')).toBeInTheDocument();
      expect(screen.getByText('Monthly Mystery Gem Crate')).toBeInTheDocument();
    });

    it('renders Quest Hub with actionable earning methods and accurate VEs description', async () => {
      render(
        <MemoryRouter>
          <ToastProvider>
            <AuthProvider>
              <LevelsPage />
            </AuthProvider>
          </ToastProvider>
        </MemoryRouter>
      );

      expect(await screen.findByRole('heading', { name: /How to Earn XP & Level Up Faster/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Check In Today/i })).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /Watch Video/i }).length).toBeGreaterThan(0);
      expect(screen.getByRole('button', { name: /Copy Referral Link/i })).toBeInTheDocument();
      expect(screen.getByText('+15 to +22.5 VEs / View')).toBeInTheDocument();
      expect(screen.getByText(/Video rewards are credited as VEs to your wallet balance/i)).toBeInTheDocument();
    });

    it('renders planned perk and coming soon tags on unbacked platform perks in matrix', async () => {
      render(
        <MemoryRouter>
          <ToastProvider>
            <AuthProvider>
              <LevelsPage />
            </AuthProvider>
          </ToastProvider>
        </MemoryRouter>
      );

      expect(await screen.findByRole('heading', { name: /Full Tier Comparison Matrix/i })).toBeInTheDocument();
      expect(screen.getAllByText('Planned Perk').length).toBeGreaterThanOrEqual(3);
      expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    });

    it('accurately renders 0 XP and Level 1 for new user without defaulting to Level 4 or 12,450 XP', async () => {
      // Mock profileService to return a brand new level 1 user with 0 XP
      const { profileService } = await import('../services/profileService');
      vi.spyOn(profileService, 'getLevelProgress').mockResolvedValue({
        data: {
          currentLevel: 1,
          levelName: 'Bronze Initiate',
          totalXP: 0,
          currentLevelXPRequirement: 0,
          nextLevelXPRequirement: 2500,
          remainingXP: 2500,
          progressPercentage: 0,
          rewardMultiplier: '1.00x'
        },
        isDemoData: false
      });
      vi.spyOn(profileService, 'getProfile').mockResolvedValue({
        data: {
          id: 'usr_new_01',
          name: 'New Player',
          referralCode: null
        },
        isDemoData: false
      });

      render(
        <MemoryRouter>
          <ToastProvider>
            <AuthProvider>
              <LevelsPage />
            </AuthProvider>
          </ToastProvider>
        </MemoryRouter>
      );

      // Must display Level 1 Bronze Initiate, not Level 4 Gold Pioneer
      expect(await screen.findByRole('heading', { level: 1, name: 'Bronze Initiate' })).toBeInTheDocument();
      expect(screen.getAllByText(/0 XP|0 Total XP/).length).toBeGreaterThan(0);
      expect(screen.queryByText(/12,450 XP/i)).not.toBeInTheDocument();

      // Referral code unavailable state when code is null
      const disabledBtn = await screen.findByRole('button', { name: /Referral Code Unavailable/i });
      expect(disabledBtn).toBeInTheDocument();
      expect(disabledBtn).toBeDisabled();
      expect(screen.queryByText(/VEL-ALEX99/i)).not.toBeInTheDocument();
    });

    it('opens tier inspect modal when clicking View Details on a tier card', async () => {
      render(
        <MemoryRouter>
          <ToastProvider>
            <AuthProvider>
              <LevelsPage />
            </AuthProvider>
          </ToastProvider>
        </MemoryRouter>
      );

      const viewDetailsButtons = await screen.findAllByRole('button', { name: /View Details/i });
      expect(viewDetailsButtons.length).toBeGreaterThan(0);

      // Click Diamond Legend details
      fireEvent.click(viewDetailsButtons[4]);

      expect(await screen.findByRole('heading', { name: /Level 5 — Diamond Legend/i })).toBeInTheDocument();
      expect(screen.getByText(/1.50x Permanent Earning Multiplier/i)).toBeInTheDocument();

      // Close modal
      const closeBtn = screen.getByRole('button', { name: /Close Inspection/i });
      fireEvent.click(closeBtn);
      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /Level 5 — Diamond Legend/i })).not.toBeInTheDocument();
      });
    });

    it('copies referral link with toast notification when clicking Copy Referral Link', async () => {
      const writeTextMock = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

      render(
        <MemoryRouter>
          <ToastProvider>
            <AuthProvider>
              <LevelsPage />
            </AuthProvider>
          </ToastProvider>
        </MemoryRouter>
      );

      const copyBtn = await screen.findByRole('button', { name: /Copy Referral Link/i });
      fireEvent.click(copyBtn);

      expect(writeTextMock).toHaveBeenCalled();
      expect(await screen.findByText(/Referral link copied!/i)).toBeInTheDocument();
    });
  });
});
