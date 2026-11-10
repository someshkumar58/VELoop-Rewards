import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  Save,
  ShieldAlert,
  Server,
  DollarSign,
  Users,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import InputField from '../../components/common/InputField';
import Skeleton from '../../components/common/Skeleton';

const AdminSettingsPage = () => {
  const { addToast } = useToast();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [platformName, setPlatformName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [dailyBonus, setDailyBonus] = useState('');
  const [minWithdrawal, setMinWithdrawal] = useState('');
  const [maxDailyWithdrawal, setMaxDailyWithdrawal] = useState('');
  const [withdrawalFee, setWithdrawalFee] = useState('');
  const [referralBonus, setReferralBonus] = useState('');
  const [requireKYC, setRequireKYC] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminService.getSettings();
      const s = response.data;
      setSettings(s);
      setPlatformName(s.platformName || 'VELoop Rewards');
      setContactEmail(s.contactEmail || 'support@veloop.io');
      setDailyBonus(String(s.dailyBonusBaseVEs || 25));
      setMinWithdrawal(String(s.minWithdrawalUSD || 10.00));
      setMaxDailyWithdrawal(String(s.maxDailyWithdrawalUSD || 1000.00));
      setWithdrawalFee(String(s.withdrawalFeePercentage || 1.0));
      setReferralBonus(String(s.referralRewardBaseVEs || 100));
      setRequireKYC(s.requireKYCForWithdrawal ?? true);
      setMaintenanceMode(s.maintenanceMode ?? false);
    } catch (err) {
      addToast(err.message || 'Failed to fetch settings from backend.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        platformName,
        contactEmail,
        dailyBonusBaseVEs: Number(dailyBonus),
        minWithdrawalUSD: Number(minWithdrawal),
        maxDailyWithdrawalUSD: Number(maxDailyWithdrawal),
        withdrawalFeePercentage: Number(withdrawalFee),
        referralRewardBaseVEs: Number(referralBonus),
        requireKYCForWithdrawal: requireKYC,
        maintenanceMode,
      };

      const res = await adminService.updateSettings(payload);
      addToast(res.message || 'System configuration parameters saved.', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to update platform settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 4px 0' }}>Platform Configuration & Parameters</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Server-authoritative variables governing rewards, withdrawal caps, and member verification policies.
          </p>
        </div>

        <Button
          variant="gold"
          size="md"
          icon={Save}
          onClick={handleSave}
          loading={saving}
        >
          Save Configuration
        </Button>
      </div>

      {loading ? (
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Skeleton height="36px" width="100%" />
            <Skeleton height="36px" width="100%" />
            <Skeleton height="36px" width="100%" />
          </div>
        </Card>
      ) : (
        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* General & Identity */}
            <Card title="General Ecosystem Settings" icon={Settings}>
              <InputField
                label="Platform Brand Name"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                required
              />

              <InputField
                label="Compliance & Support Email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                required
              />

              <div style={{
                marginTop: '16px',
                padding: '14px',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.88rem' }}>Maintenance Mode</strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Suspend public user sessions during database migrations</span>
                </div>
                <input
                  type="checkbox"
                  checked={maintenanceMode}
                  onChange={(e) => setMaintenanceMode(e.target.checked)}
                  style={{ width: '20px', height: '20px', accentColor: 'var(--accent-gold)' }}
                />
              </div>
            </Card>

            {/* Financial & Withdrawal Policy */}
            <Card title="Withdrawal & Tokenomics Rules" icon={DollarSign}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <InputField
                  label="Min. Withdrawal (USD)"
                  type="number"
                  step="0.01"
                  value={minWithdrawal}
                  onChange={(e) => setMinWithdrawal(e.target.value)}
                  required
                />

                <InputField
                  label="Max. Daily Payout Cap (USD)"
                  type="number"
                  step="0.01"
                  value={maxDailyWithdrawal}
                  onChange={(e) => setMaxDailyWithdrawal(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <InputField
                  label="Withdrawal Network Fee (%)"
                  type="number"
                  step="0.1"
                  value={withdrawalFee}
                  onChange={(e) => setWithdrawalFee(e.target.value)}
                  required
                />

                <InputField
                  label="Referral Base Award (VEs)"
                  type="number"
                  value={referralBonus}
                  onChange={(e) => setReferralBonus(e.target.value)}
                  required
                />
              </div>

              <div style={{
                marginTop: '16px',
                padding: '14px',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.88rem' }}>Enforce KYC for Withdrawals</strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Block payout requests until Tier 2 verification is completed</span>
                </div>
                <input
                  type="checkbox"
                  checked={requireKYC}
                  onChange={(e) => setRequireKYC(e.target.checked)}
                  style={{ width: '20px', height: '20px', accentColor: 'var(--accent-gold)' }}
                />
              </div>
            </Card>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminSettingsPage;
