import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Coins,
  TrendingUp,
  Award,
  Wallet,
  Share2,
  Activity,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  ArrowLeft,
  Server
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import DevPreviewBanner from '../components/common/DevPreviewBanner';
import styles from './AdminLayout.module.css';

const AdminLayout = () => {
  const { admin, logoutAdmin, isDevPreview } = useAuth();
  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logoutAdmin();
    addToast('Admin logged out securely.', 'info');
    navigate('/admin/login');
  };

  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { label: 'User Directory', icon: Users, path: '/admin/users' },
    { label: 'Reward Management', icon: Coins, path: '/admin/rewards' },
    { label: 'Level Hierarchy', icon: TrendingUp, path: '/admin/levels' },
    { label: 'Achievements', icon: Award, path: '/admin/achievements' },
    { label: 'Withdrawal Requests', icon: Wallet, path: '/admin/withdrawals' },
    { label: 'Referral System', icon: Share2, path: '/admin/referrals' },
    { label: 'Activity Streams', icon: Activity, path: '/admin/activity' },
    { label: 'Audit Security Logs', icon: FileText, path: '/admin/audit-logs' },
    { label: 'Platform Settings', icon: Settings, path: '/admin/settings' },
  ];

  return (
    <div className={styles.adminContainer}>
      <DevPreviewBanner />

      {/* Admin Header */}
      <header className={styles.adminHeader}>
        <div className={styles.headerLeft}>
          <button
            type="button"
            className={styles.menuBtn}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle admin sidebar"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <Link to="/admin/dashboard" className={styles.adminBrand}>
            <div className={styles.adminLogoIcon}>
              <Shield size={18} />
            </div>
            <div>
              <span className={styles.adminBrandTitle}>VELoop ADMIN</span>
              <span className={styles.adminRoleBadge}>
                {admin?.role || 'SuperAdmin'}
              </span>
            </div>
          </Link>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.serverStatus}>
            <Server size={14} className={isDevPreview ? styles.statusWarning : styles.statusSuccess} />
            <span className={styles.statusText}>
              {isDevPreview ? 'Preview DB' : 'API v1.0 Live'}
            </span>
          </div>

          <Link to="/user-profile" className={styles.userViewBtn}>
            <ArrowLeft size={14} />
            <span>User Portal</span>
          </Link>

          <div className={styles.adminInfo}>
            <div className={styles.adminDetails}>
              <span className={styles.adminName}>{admin?.name || 'Administrator'}</span>
              <span className={styles.adminEmail}>{admin?.email || 'admin@veloop.io'}</span>
            </div>
            <button
              type="button"
              className={styles.logoutIconBtn}
              onClick={handleLogout}
              title="Sign Out of Admin"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Admin Content Area */}
      <div className={styles.adminMainWrap}>
        {/* Admin Sidebar */}
        <aside className={`${styles.adminSidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
          <div className={styles.sidebarLabel}>ADMINISTRATION CONSOLE</div>

          <nav className={styles.adminNav}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path ||
                (item.path === '/admin/users' && location.pathname.startsWith('/admin/users/'));

              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon size={18} className={styles.itemIcon} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className={styles.sidebarBottom}>
            <Link to="/user-profile" className={styles.returnLink} onClick={() => setSidebarOpen(false)}>
              <ArrowLeft size={16} />
              <span>Back to User Profile</span>
            </Link>
          </div>
        </aside>

        {/* Mobile Backdrop */}
        {sidebarOpen && (
          <div className={styles.adminBackdrop} onClick={() => setSidebarOpen(false)} />
        )}

        {/* Dynamic Admin View */}
        <main className={styles.adminContent}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
