import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { ProtectedRoute, AdminProtectedRoute } from '../components/common/RouteGuards';
import AdminLoginPage from '../pages/admin/AdminLoginPage';
import { adminService } from '../services/adminService';

describe('Authentication, Security & Route Guards', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('validates admin login form fields for empty inputs', async () => {
    render(
      <MemoryRouter>
        <ToastProvider>
          <AuthProvider>
            <AdminLoginPage />
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /Authenticate & Access Console/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Admin email address is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/Password is required/i)).toBeInTheDocument();
  });

  it('validates email format in admin login', async () => {
    render(
      <MemoryRouter>
        <ToastProvider>
          <AuthProvider>
            <AdminLoginPage />
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/Admin Email Address/i);
    const passwordInput = screen.getByLabelText(/Security Password/i);
    const submitBtn = screen.getByRole('button', { name: /Authenticate & Access Console/i });

    fireEvent.change(emailInput, { target: { value: 'not-an-email' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Please provide a valid email format/i)).toBeInTheDocument();
  });

  it('autofills demo credentials on button click in development preview mode', async () => {
    render(
      <MemoryRouter>
        <ToastProvider>
          <AuthProvider>
            <AdminLoginPage />
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    );

    const autofillBtn = screen.getByRole('button', { name: /Autofill/i });
    fireEvent.click(autofillBtn);

    const emailInput = screen.getByLabelText(/Admin Email Address/i);
    const passwordInput = screen.getByLabelText(/Security Password/i);

    expect(emailInput).toHaveValue('admin@veloop.io');
    expect(passwordInput).toHaveValue('Admin@2026');
  });

  it('blocks unauthenticated access to admin routes and redirects to /admin/login', () => {
    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <AuthProvider>
          <Routes>
            <Route path="/admin/login" element={<div>Admin Login Screen</div>} />
            <Route
              path="/admin/dashboard"
              element={
                <AdminProtectedRoute>
                  <div>Secret Admin Dashboard</div>
                </AdminProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.queryByText('Secret Admin Dashboard')).not.toBeInTheDocument();
    expect(screen.getByText('Admin Login Screen')).toBeInTheDocument();
  });

  it('allows access to admin routes when admin is authenticated', () => {
    localStorage.setItem('veloop_admin_token', 'valid_test_token');
    localStorage.setItem('veloop_admin_profile', JSON.stringify({ name: 'Admin Somesh', role: 'SuperAdmin' }));

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <AuthProvider>
          <Routes>
            <Route path="/admin/login" element={<div>Admin Login Screen</div>} />
            <Route
              path="/admin/dashboard"
              element={
                <AdminProtectedRoute>
                  <div>Secret Admin Dashboard</div>
                </AdminProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Secret Admin Dashboard')).toBeInTheDocument();
  });

  it('clears admin credentials completely on logout', async () => {
    localStorage.setItem('veloop_admin_token', 'test_token');
    localStorage.setItem('veloop_admin_profile', JSON.stringify({ name: 'Admin', role: 'SuperAdmin' }));

    const TestComponent = () => {
      const { isAdminAuthenticated, logoutAdmin } = useAuth();
      return (
        <div>
          <span>{isAdminAuthenticated ? 'Logged In' : 'Logged Out'}</span>
          <button onClick={logoutAdmin}>Log Out</button>
        </div>
      );
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('Logged In')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Log Out/i }));

    expect(screen.getByText('Logged Out')).toBeInTheDocument();
    expect(localStorage.getItem('veloop_admin_token')).toBeNull();
    expect(localStorage.getItem('veloop_admin_profile')).toBeNull();
  });
});
