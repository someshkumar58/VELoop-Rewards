import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  User,
  ShieldCheck,
  Award,
  Wallet,
  Users,
  History,
  LogOut,
  Menu,
  X,
  Coins,
  Sparkles,
  ExternalLink,
  Crown,
  LogIn
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import DevPreviewBanner from '../components/common/DevPreviewBanner';
import UserAuthModal from '../components/auth/UserAuthModal';
import styles from './UserProfileLayout.module.css';

const UserProfileLayout = () => {
  const { user, logoutUser, isAdminAuthenticated, hasRealToken, isDevPreview } = useAuth();
  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleLogout = () => {
    logoutUser();
    addToast('You have logged out. Restored Demo Preview session.', 'info');
    navigate('/user-profile');
  };

  const navItems = [
    { label: 'Profile Overview', icon: User, path: '/user-profile' },
    { label: 'Levels & Roadmap', icon: Award, path: '/levels', badge: `Lv.${user?.levelProgress?.currentLevel || 4}` },
    { label: 'Admin Portal', icon: ShieldCheck, path: isAdminAuthenticated ? '/admin/dashboard' : '/admin/login', badge: isAdminAuthenticated ? 'Active' : 'Login' },
  ];

  return (
    <div className={styles.layoutWrapper}>
      {/* Dev Preview Mode Indicator Banner */}
      <DevPreviewBanner />

      {/* Top Navbar */}
      <header className={styles.topNavbar}>
        <div className={styles.navLeft}>
          <button
            type="button"
            className={styles.menuToggle}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Link to="/user-profile" className={styles.brandLink}>
            <div className={styles.brandLogo}>
              <Crown size={20} className={styles.brandIcon} />
            </div>
            <div className={styles.brandInfo}>
              <span className={styles.brandName}>VELoop</span>
              <span className={styles.brandTag}>REWARDS</span>
            </div>
          </Link>
        </div>

        {/* Header Right Actions */}
        <div className={styles.navRight}>
          {user && (
            <div className={styles.headerBalances}>
              <div className={`${styles.balanceChip} ${styles.veChip}`} title="Current VE Balance">
                <Coins size={14} className={styles.goldText} />
                <span>
                  {user?.rewards && typeof user.rewards.ves !== 'undefined'
                    ? Number(user.rewards.ves).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : '0.00'} VEs
                </span>
              </div>
              <div className={`${styles.balanceChip} ${styles.gemChip}`} title="Current Gems">
                <Sparkles size={14} className={styles.purpleText} />
                <span>
                  {user?.rewards && typeof user.rewards.gems !== 'undefined'
                    ? Number(user.rewards.gems).toLocaleString()
                    : '0'} Gems
                </span>
              </div>
            </div>
          )}

          {/* User Login or Live Mode Status */}
          {hasRealToken && !isDevPreview ? (
            <div className={styles.liveUserBadge} title="Authenticated in Live API Mode with MongoDB">
              <span className={styles.livePulseDot} />
              <span>Live: {user?.fullName?.split(' ')[0] || user?.name?.split(' ')[0] || 'User'}</span>
              <button
                type="button"
                className={styles.miniLogoutBtn}
                onClick={handleLogout}
                title="Log out and restore Demo Mode"
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={styles.userLoginBtn}
              onClick={() => setShowAuthModal(true)}
              title="Sign in with live account or create one"
            >
              <LogIn size={15} />
              <span>User Login</span>
            </button>
          )}

          <Link
            to={isAdminAuthenticated ? '/admin/dashboard' : '/admin/login'}
            className={styles.adminSwitchBtn}
          >
            <ShieldCheck size={16} />
            <span className={styles.adminSwitchText}>
              {isAdminAuthenticated ? 'Admin Console' : 'Admin Login'}
            </span>
          </Link>

          {user && (
            <div className={styles.userProfileBtn}>
              <img
                src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
                alt={user.fullName || 'User Avatar'}
                className={styles.avatarImg}
              />
              <span className={styles.userNameText}>{user.fullName || 'User'}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Body with Sidebar */}
      <div className={styles.bodyContainer}>
        {/* Sidebar */}
        <aside className={`${styles.sidebar} ${mobileMenuOpen ? styles.sidebarOpen : ''}`}>
          {/* User mini badge */}
          {user && (
            <div className={styles.sidebarUserCard}>
              <img
                src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
                alt={user.fullName}
                className={styles.sidebarAvatar}
              />
              <div className={styles.sidebarUserInfo}>
                <div className={styles.sidebarUserName}>{user.fullName}</div>
                <div className={styles.sidebarUserLevel}>Level {user.levelProgress?.currentLevel || 4} • {user.levelProgress?.levelName || 'Gold Pioneer'}</div>
                <div className={styles.sidebarUserId}>{user.userId}</div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className={styles.navSection}>
            <div className={styles.navSectionLabel}>NAVIGATION</div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon size={18} className={styles.navIcon} />
                  <span className={styles.navLabel}>{item.label}</span>
                  {item.badge && (
                    <span className={styles.navBadge}>{item.badge}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Quick jump anchors for User Profile sections */}
          <div className={styles.navSection}>
            <div className={styles.navSectionLabel}>PROFILE MODULE SECTIONS</div>
            <a href="#section-hero" className={styles.anchorLink} onClick={() => setMobileMenuOpen(false)}>
              <User size={15} /> <span>1. Personal & Hero</span>
            </a>
            <a href="#section-assets" className={styles.anchorLink} onClick={() => setMobileMenuOpen(false)}>
              <Coins size={15} /> <span>2. Reward Assets (5)</span>
            </a>
            <a href="#section-levels" className={styles.anchorLink} onClick={() => setMobileMenuOpen(false)}>
              <Award size={15} /> <span>3. Level & Achievements</span>
            </a>
            <a href="#section-withdrawals" className={styles.anchorLink} onClick={() => setMobileMenuOpen(false)}>
              <Wallet size={15} /> <span>4. Withdrawal Overview</span>
            </a>
            <a href="#section-quick-actions" className={styles.anchorLink} onClick={() => setMobileMenuOpen(false)}>
              <Sparkles size={15} /> <span>5. Quick Actions</span>
            </a>
            <a href="#section-referrals" className={styles.anchorLink} onClick={() => setMobileMenuOpen(false)}>
              <Users size={15} /> <span>6. Referral Snapshot</span>
            </a>
            <a href="#section-activity" className={styles.anchorLink} onClick={() => setMobileMenuOpen(false)}>
              <History size={15} /> <span>7. Recent Activity</span>
            </a>
            <a href="#section-security" className={styles.anchorLink} onClick={() => setMobileMenuOpen(false)}>
              <ShieldCheck size={15} /> <span>8. Security & Account</span>
            </a>
          </div>

          {/* Sidebar Footer */}
          <div className={styles.sidebarFooter}>
            <button
              type="button"
              className={styles.logoutBtn}
              onClick={handleLogout}
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Backdrop for mobile */}
        {mobileMenuOpen && (
          <div
            className={styles.backdrop}
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Content Area */}
        <main className={styles.mainContent}>
          <Outlet />
        </main>
      </div>

      {/* User Login & Register Modal */}
      <UserAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default UserProfileLayout;
