import React, { useState, useEffect, useCallback } from 'react';
import {
  Coins,
  TrendingUp,
  PlusCircle,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  History,
  Shield,
  Layers,
  Sparkles
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import InputField from '../../components/common/InputField';
import SelectField from '../../components/common/SelectField';
import Modal from '../../components/common/Modal';
import styles from './AdminRewards.module.css';

const AdminRewardsPage = () => {
  const { addToast } = useToast();

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  // Adjustment Modal State
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [targetUserId, setTargetUserId] = useState('VEL-894210');
  const [targetAsset, setTargetAsset] = useState('ves');
  const [adjustmentAmount, setAdjustmentAmount] = useState('100');
  const [adjustmentType, setAdjustmentType] = useState('CREDIT'); // 'CREDIT' | 'DEBIT'
  const [adjustmentReason, setAdjustmentReason] = useState('Promotion Campaign Bonus');
  const [adjusting, setAdjusting] = useState(false);
  const [errors, setErrors] = useState({});

  const fetchRewards = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminService.getRewardsOverview();
      setOverview(response.data);
    } catch (err) {
      addToast(err.message || 'Failed to load reward overview.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!targetUserId.trim()) errs.userId = 'User ID is required';
    if (!adjustmentAmount || isNaN(parseFloat(adjustmentAmount)) || parseFloat(adjustmentAmount) <= 0) {
      errs.amount = 'Valid positive amount is required';
    }
    if (!adjustmentReason.trim()) errs.reason = 'Auditable reason is mandatory';

    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setAdjusting(true);
    try {
      const payload = {
        userId: targetUserId,
        asset: targetAsset,
        amount: adjustmentType === 'CREDIT' ? parseFloat(adjustmentAmount) : -parseFloat(adjustmentAmount),
        reason: adjustmentReason,
      };

      const res = await adminService.adjustUserReward(payload);
      addToast(res.message || 'Balance adjusted successfully.', 'success');
      setShowAdjustModal(false);
      setAdjustmentAmount('100');
      setAdjustmentReason('');
    } catch (err) {
      addToast(err.message || 'Balance adjustment rejected by backend.', 'error');
    } finally {
      setAdjusting(false);
    }
  };

  const distribution = overview?.distribution || [];

  return (
    <div className={styles.pageWrap}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.pageTitle}>Reward & Vault Management</h1>
          <p className={styles.pageSubtitle}>
            Monitor tokenomics, track reserve liquidity, and execute authorized balance adjustments with audit trails.
          </p>
        </div>

        <Button
          variant="gold"
          size="md"
          icon={PlusCircle}
          onClick={() => setShowAdjustModal(true)}
        >
          Adjust User Balance
        </Button>
      </div>

      {/* Top Vault Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.cardHeader}>
            <span className={styles.label}>Reserve Vault Holdings</span>
            <Coins size={18} className={styles.goldText} />
          </div>
          <div className={styles.value}>
            {overview?.reserveVaultBalance || '5,000,000 VEs'}
          </div>
          <span className={styles.subtext}>Secured smart contract reserve</span>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.cardHeader}>
            <span className={styles.label}>Cumulative Issued VEs</span>
            <TrendingUp size={18} className={styles.blueText} />
          </div>
          <div className={styles.value}>
            {overview?.totalVEsDistributed ? overview.totalVEsDistributed.toLocaleString() : '1,450,890'} VEs
          </div>
          <span className={styles.subtext}>Circulating across all accounts</span>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.cardHeader}>
            <span className={styles.label}>Pending Claims Queue</span>
            <Sparkles size={18} className={styles.purpleText} />
          </div>
          <div className={styles.value}>
            {overview?.pendingClaims || 34} Claims
          </div>
          <span className={styles.subtext}>Awaiting validator confirmations</span>
        </div>
      </div>

      {/* Distribution Breakdown Cards */}
      <div className={styles.distGrid}>
        {distribution.map((d, i) => (
          <div key={i} className={styles.distCard} style={{ '--card-accent': d.color }}>
            <div className={styles.distTop}>
              <span className={styles.distName}>{d.name}</span>
              <span className={styles.distColorDot} style={{ backgroundColor: d.color }} />
            </div>
            <div className={styles.distAmount}>{d.amount.toLocaleString()}</div>
            <span className={styles.distRate}>Active circulation</span>
          </div>
        ))}
      </div>

      {/* Audit Guarantee Card */}
      <Card title="Authoritative Ledger Enforcement" icon={Shield}>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          In accordance with the financial integrity rules of VELoop Rewards, all balance modifications must be authorized by the backend server via <code>POST /api/admin/rewards/adjust</code>. Client-side browser modifications are strictly prohibited from appearing as completed without backend confirmation.
        </p>
      </Card>

      {/* Balance Adjustment Modal */}
      {showAdjustModal && (
        <Modal
          isOpen={showAdjustModal}
          onClose={() => setShowAdjustModal(false)}
          title="Authorized Balance Adjustment"
          subtitle="Modify a member's reward asset balance with mandatory audit logging"
          maxWidth="520px"
          footer={
            <>
              <Button variant="ghost" onClick={() => setShowAdjustModal(false)} disabled={adjusting}>
                Cancel
              </Button>
              <Button variant="gold" onClick={handleAdjustSubmit} loading={adjusting}>
                Execute Adjustment
              </Button>
            </>
          }
        >
          <form onSubmit={handleAdjustSubmit}>
            <InputField
              label="Target Member User ID"
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              placeholder="e.g. VEL-894210"
              error={errors.userId}
              required
            />

            <SelectField
              label="Target Asset"
              value={targetAsset}
              onChange={(e) => setTargetAsset(e.target.value)}
              options={[
                { value: 'ves', label: 'VEs (Virtual Ecosystem)' },
                { value: 'sves', label: 'SVEs (Staked Ecosystem)' },
                { value: 'gems', label: 'Gems' },
                { value: 'tokens', label: 'Platform Tokens' },
                { value: 'xp', label: 'Experience Points (XP)' }
              ]}
              required
            />

            <SelectField
              label="Adjustment Type"
              value={adjustmentType}
              onChange={(e) => setAdjustmentType(e.target.value)}
              options={[
                { value: 'CREDIT', label: 'Credit (Add to user balance)' },
                { value: 'DEBIT', label: 'Debit (Deduct from user balance)' }
              ]}
              required
            />

            <InputField
              label="Adjustment Amount"
              type="number"
              step="any"
              value={adjustmentAmount}
              onChange={(e) => setAdjustmentAmount(e.target.value)}
              error={errors.amount}
              required
            />

            <InputField
              label="Mandatory Audit Justification"
              value={adjustmentReason}
              onChange={(e) => setAdjustmentReason(e.target.value)}
              placeholder="e.g. Correction for bug report #319 or VIP promotional credit"
              error={errors.reason}
              helperText="Logged immutably to the administrative audit ledger."
              required
            />
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AdminRewardsPage;
