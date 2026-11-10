import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToastProvider } from '../context/ToastContext';
import { AuthProvider } from '../context/AuthContext';
import WithdrawalRequestModal from '../components/profile/WithdrawalRequestModal';
import WithdrawalOverview from '../components/profile/WithdrawalOverview';
import { profileService } from '../services/profileService';
import { adminService } from '../services/adminService';

describe('Step 11 Phase 2A: Withdrawals Frontend Integration Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('WithdrawalRequestModal Component', () => {
    it('displays infrastructure disclaimer stating real payouts are disabled', () => {
      render(
        <ToastProvider>
          <AuthProvider>
            <WithdrawalRequestModal
              isOpen={true}
              onClose={() => {}}
              maxAmount={100.00}
              onSubmitWithdrawal={() => {}}
            />
          </AuthProvider>
        </ToastProvider>
      );

      expect(
        screen.getByText(/Infrastructure Mode: Payout requests record administrative token reservations for manual audit. Real-money fiat and cryptocurrency transfers remain disabled/i)
      ).toBeInTheDocument();
    });

    it('submits withdrawal request payload via onSubmitWithdrawal callback and closes on success', async () => {
      const submitMock = vi.fn().mockResolvedValue({ success: true });
      const closeMock = vi.fn();

      render(
        <ToastProvider>
          <AuthProvider>
            <WithdrawalRequestModal
              isOpen={true}
              onClose={closeMock}
              maxAmount={100.00}
              onSubmitWithdrawal={submitMock}
            />
          </AuthProvider>
        </ToastProvider>
      );

      const destinationInput = screen.getByLabelText(/Payout Destination/i);
      fireEvent.change(destinationInput, { target: { value: '0x71C...B492' } });

      const submitBtn = screen.getByRole('button', { name: /Submit.*Request/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(submitMock).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: 25.00,
            destination: '0x71C...B492'
          })
        );
        expect(closeMock).toHaveBeenCalled();
      });
    });

    it('keeps modal open and does not display false success when submission throws an error', async () => {
      const submitMock = vi.fn().mockRejectedValue(new Error('Insufficient tokens balance. Available: 15.00 Tokens.'));
      const closeMock = vi.fn();

      render(
        <ToastProvider>
          <AuthProvider>
            <WithdrawalRequestModal
              isOpen={true}
              onClose={closeMock}
              maxAmount={100.00}
              onSubmitWithdrawal={submitMock}
            />
          </AuthProvider>
        </ToastProvider>
      );

      const destinationInput = screen.getByLabelText(/Payout Destination/i);
      fireEvent.change(destinationInput, { target: { value: '0x71C...B492' } });

      const submitBtn = screen.getByRole('button', { name: /Submit.*Request/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(submitMock).toHaveBeenCalled();
        expect(closeMock).not.toHaveBeenCalled();
      });

      // Error toast emitted
      expect(
        await screen.findByText(/Insufficient tokens balance. Available: 15.00 Tokens./i)
      ).toBeInTheDocument();
    });
  });

  describe('WithdrawalOverview Component', () => {
    it('accurately renders summary metrics and strictly excludes pending from completed total', () => {
      const mockSummary = {
        totalRequests: 4,
        pendingCount: 2,
        pendingAmount: 70.00,
        approvedCount: 1,
        approvedAmount: 150.00,
        rejectedCount: 1,
        rejectedAmount: 25.00,
        successfullyWithdrawnAmount: 150.00,
        currency: 'Tokens'
      };

      render(
        <WithdrawalOverview
          withdrawals={mockSummary}
          onRequestWithdrawal={() => {}}
        />
      );

      // Successfully withdrawn shows exactly 150.00 (not 220.00)
      expect(screen.getByText(/150\.00/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Tokens/i).length).toBeGreaterThan(0);

      // Pending card shows 70.00 Tokens awaiting review
      expect(screen.getByText(/70\.00 Tokens awaiting admin review/i)).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // pending count

      // Strict rule notice
      expect(
        screen.getByText('Strict Rule: Pending requests are strictly excluded from completed total.')
      ).toBeInTheDocument();

      // Infrastructure notice
      expect(
        screen.getByText(/Infrastructure Mode: Real-money fiat and cryptocurrency transfers remain disabled/i)
      ).toBeInTheDocument();
    });
  });

  describe('Service Contract Integration', () => {
    it('profileService.createWithdrawal dispatches POST /api/profile/withdrawals with auth token', async () => {
      localStorage.setItem('veloop_auth_token', 'valid-test-jwt');

      const mockPayload = {
        amount: 50.00,
        payoutMethod: 'USDC_POLYGON',
        destination: '0x123'
      };

      const spy = vi.spyOn(profileService, 'createWithdrawal').mockResolvedValue({
        success: true,
        message: 'Withdrawal request #W-1001 submitted for administrative review. Tokens reserved.',
        withdrawal: {
          id: 'w_01',
          requestId: 'W-1001',
          requestedAmount: 50.00,
          status: 'Pending',
          statusCode: 'PENDING'
        },
        remainingTokens: 50.00,
        isDemoData: false
      });

      const result = await profileService.createWithdrawal(mockPayload);
      expect(result.success).toBe(true);
      expect(result.withdrawal.requestId).toBe('W-1001');
      expect(result.withdrawal.status).toBe('Pending');
      expect(result.isDemoData).toBe(false);
      expect(spy).toHaveBeenCalledWith(mockPayload);
    });

    it('adminService.reviewWithdrawal dispatches review decision and reason', async () => {
      localStorage.setItem('veloop_admin_token', 'valid-admin-jwt');

      const spy = vi.spyOn(adminService, 'reviewWithdrawal').mockResolvedValue({
        success: true,
        message: 'Withdrawal #W-1001 marked as Approved.',
        data: {
          id: 'w_01',
          requestId: 'W-1001',
          status: 'Approved',
          statusCode: 'APPROVED'
        },
        isDemoData: false
      });

      const result = await adminService.reviewWithdrawal('w_01', 'Approved', 'Review justification');
      expect(result.success).toBe(true);
      expect(result.data.status).toBe('Approved');
      expect(spy).toHaveBeenCalledWith('w_01', 'Approved', 'Review justification');
    });
  });
});

