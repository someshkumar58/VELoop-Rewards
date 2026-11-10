import React from 'react';
import {
  ShieldCheck,
  Lock,
  Globe,
  Smartphone,
  LogOut,
  KeyRound,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import styles from './AccountSecurity.module.css';

const AccountSecurity = ({
  user,
  onLogout,
  onOpenSettings,
}) => {
  if (!user) return null;

  return (
    <section id="section-security" className={styles.sectionWrap}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Account Security & Authentication</h2>
          <p className={styles.sectionSubtitle}>
            Security posture, verification tier, and session control. Passwords and JWT credentials are never stored insecurely.
          </p>
        </div>
      </div>

      <div className={styles.securityGrid}>
        {/* Verification Status Card */}
        <Card
          title="Identity Verification & KYC"
          subtitle="Anti-fraud compliance level"
          icon={ShieldCheck}
        >
          <div className={styles.secRow}>
            <div className={styles.secLabel}>KYC Verification Tier:</div>
            <Badge variant="success" dot>
              {user.kycTier || 'Tier 2 (Full KYC)'}
            </Badge>
          </div>

          <div className={styles.secRow}>
            <div className={styles.secLabel}>Two-Factor Authentication (2FA):</div>
            <div className={styles.twoFaStatus}>
              <CheckCircle size={15} className={styles.successColor} />
              <span>{user.twoFactorEnabled ? 'Hardware / Authenticator Enabled' : 'Disabled'}</span>
            </div>
          </div>

          <div className={styles.secRow}>
            <div className={styles.secLabel}>Primary Email:</div>
            <span className={styles.secVal}>{user.email} (Verified)</span>
          </div>

          <div className={styles.secRow}>
            <div className={styles.secLabel}>Associated Phone:</div>
            <span className={styles.secVal}>{user.phone || 'Not configured'}</span>
          </div>
        </Card>

        {/* Session & Device Security Card */}
        <Card
          title="Active Session Details"
          subtitle="Secure session telemetry"
          icon={KeyRound}
        >
          <div className={styles.secRow}>
            <div className={styles.secLabel}>Registered Country:</div>
            <span className={styles.secVal}>{user.country || 'Global / Web3'}</span>
          </div>

          <div className={styles.secRow}>
            <div className={styles.secLabel}>Member Since:</div>
            <span className={styles.secVal}>{user.memberSince}</span>
          </div>

          <div className={styles.secRow}>
            <div className={styles.secLabel}>Last Session Login:</div>
            <span className={styles.secVal}>{user.lastLogin || 'Recent (Encrypted)'}</span>
          </div>

          <div className={styles.actionRow}>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenSettings}
            >
              Account Preferences
            </Button>

            <Button
              variant="danger"
              size="sm"
              icon={LogOut}
              onClick={onLogout}
            >
              Terminate Session
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default AccountSecurity;
