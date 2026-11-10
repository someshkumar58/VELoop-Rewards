import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ToastProvider } from '../context/ToastContext';
import { AuthProvider } from '../context/AuthContext';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import AdminUserDetailsPage from '../pages/admin/AdminUserDetailsPage';
import AdminRewardsPage from '../pages/admin/AdminRewardsPage';
import AdminWithdrawalsPage from '../pages/admin/AdminWithdrawalsPage';
import AdminSettingsPage from '../pages/admin/AdminSettingsPage';

describe('Admin Management Suite Testing', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders user directory and filters by search query', async () => {
    render(
      <MemoryRouter>
        <ToastProvider>
          <AuthProvider>
            <AdminUsersPage />
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    );

    // Initial load
    expect(await screen.findByText('Alexander Wright')).toBeInTheDocument();
    expect(screen.getByText('Elena Rostova')).toBeInTheDocument();

    // Search query
    const searchInput = screen.getByPlaceholderText(/Search by name, email, or User ID/i);
    fireEvent.change(searchInput, { target: { value: 'Lucas' } });

    await waitFor(() => {
      expect(screen.getByText('Lucas Vance')).toBeInTheDocument();
      expect(screen.queryByText('Elena Rostova')).not.toBeInTheDocument();
    });
  });

  it('opens suspend modal and enforces mandatory audit justification', async () => {
    render(
      <MemoryRouter>
        <ToastProvider>
          <AuthProvider>
            <AdminUsersPage />
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    );

    const suspendBtns = await screen.findAllByRole('button', { name: /Suspend/i });
    fireEvent.click(suspendBtns[0]);

    expect(await screen.findByText(/Administrative Audit Reason/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Confirm Suspend/i })).toBeInTheDocument();
  });

  it('renders 404 error state when user ID does not exist in User Details', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/users/non-existent-user-id']}>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              <Route path="/admin/users/:id" element={<AdminUserDetailsPage />} />
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText(/User Not Found/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retry Request/i })).toBeInTheDocument();
  });

  it('renders reward vault holdings and opens adjustment modal', async () => {
    render(
      <MemoryRouter>
        <ToastProvider>
          <AuthProvider>
            <AdminRewardsPage />
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('Reserve Vault Holdings')).toBeInTheDocument();
    expect(screen.getByText('5,000,000 VEs')).toBeInTheDocument();

    const adjustBtn = screen.getByRole('button', { name: /Adjust User Balance/i });
    fireEvent.click(adjustBtn);

    expect(await screen.findByRole('heading', { name: /Authorized Balance Adjustment/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Target Member User ID/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mandatory Audit Justification/i)).toBeInTheDocument();
  });

  it('filters withdrawals by status and triggers approve modal', async () => {
    render(
      <MemoryRouter>
        <ToastProvider>
          <AuthProvider>
            <AdminWithdrawalsPage />
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText(/Withdrawal Payout Approvals/i)).toBeInTheDocument();

    // Click Approve on a pending request (exact button text 'Approve', not 'Approved Requests' filter tab)
    const approveBtns = await screen.findAllByRole('button', { name: /^Approve$/i });
    expect(approveBtns.length).toBeGreaterThan(0);
    fireEvent.click(approveBtns[0]);

    expect(await screen.findByRole('heading', { name: /Approved Withdrawal Request/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Reviewer Justification/i)).toBeInTheDocument();
  });

  it('loads and updates platform configuration settings', async () => {
    render(
      <MemoryRouter>
        <ToastProvider>
          <AuthProvider>
            <AdminSettingsPage />
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    );

    const brandInput = await screen.findByLabelText(/Platform Brand Name/i);
    expect(brandInput).toHaveValue('VELoop Rewards');

    const saveBtn = screen.getByRole('button', { name: /Save Configuration/i });
    expect(saveBtn).toBeInTheDocument();
  });
});
