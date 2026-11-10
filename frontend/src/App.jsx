import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AdminProtectedRoute, ProtectedRoute } from './components/common/RouteGuards';

// Layouts
import UserProfileLayout from './layouts/UserProfileLayout';
import AdminLayout from './layouts/AdminLayout';

// Profile Page
import UserProfilePage from './pages/profile/UserProfilePage';

// Admin Pages
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminUserDetailsPage from './pages/admin/AdminUserDetailsPage';
import AdminRewardsPage from './pages/admin/AdminRewardsPage';
import AdminLevelsPage from './pages/admin/AdminLevelsPage';
import AdminAchievementsPage from './pages/admin/AdminAchievementsPage';
import AdminWithdrawalsPage from './pages/admin/AdminWithdrawalsPage';
import AdminReferralsPage from './pages/admin/AdminReferralsPage';
import AdminActivityPage from './pages/admin/AdminActivityPage';
import AdminAuditLogsPage from './pages/admin/AdminAuditLogsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';

// Common / Error Pages
import UnauthorizedPage from './pages/common/UnauthorizedPage';
import NotFoundPage from './pages/common/NotFoundPage';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* User Profile Routes */}
            <Route element={<UserProfileLayout />}>
              <Route path="/" element={<Navigate to="/user-profile" replace />} />
              <Route path="/user-profile" element={<UserProfilePage />} />
            </Route>

            {/* Admin Login (Public entry) */}
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Protected Admin Routes */}
            <Route
              path="/admin"
              element={
                <AdminProtectedRoute>
                  <AdminLayout />
                </AdminProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="users/:id" element={<AdminUserDetailsPage />} />
              <Route path="rewards" element={<AdminRewardsPage />} />
              <Route path="levels" element={<AdminLevelsPage />} />
              <Route path="achievements" element={<AdminAchievementsPage />} />
              <Route path="withdrawals" element={<AdminWithdrawalsPage />} />
              <Route path="referrals" element={<AdminReferralsPage />} />
              <Route path="activity" element={<AdminActivityPage />} />
              <Route path="audit-logs" element={<AdminAuditLogsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>

            {/* Status and Error Pages */}
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
