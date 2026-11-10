import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Shield,
  Coins,
  Award,
  Share2,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Skeleton from '../../components/common/Skeleton';
import Modal from '../../components/common/Modal';
import InputField from '../../components/common/InputField';
import ErrorState from '../../components/common/ErrorState';
import styles from './AdminUserDetails.module.css';

const AdminUserDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status Modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState('Suspend');
  const [statusReason, setStatusReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getUserDetails(id);
      setUser(response.data);
    } catch (err) {
      console.error('[AdminUserDetailsPage] Error fetching user:', err);
      setError(err.message || 'Unable to retrieve user details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleStatusChange = async () => {
    setActionLoading(true);
    try {
      const newStatus = statusAction === 'Suspend' ? 'Suspended' : 'Active';
      await adminService.updateUserStatus(user.id, newStatus, statusReason);
      setUser((prev) => ({ ...prev, accountStatus: newStatus }));
      addToast(`User ${user.fullName} status updated to ${newStatus}.`, 'success');
      setShowStatusModal(false);
    } catch (err) {
      addToast(err.message || 'Failed to update user status.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (error && !user) {
    return (
      <div style={{ padding: '30px 0' }}>
        <ErrorState
          title="User Not Found"
          message={error}
          onRetry={fetchUser}
        />
      </div>
    );
  }

  return (
    <div className={styles.pageWrap}>
      {/* Back button row */}
      <div className={styles.topNavRow}>
        <Link to="/admin/users" className={styles.backBtn}>
          <ArrowLeft size={16} />
          <span>Back to User Directory</span>
        </Link>
      </div>

      {loading ? (
        <Card>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <Skeleton variant="circle" width="70px" height="70px" />
            <div style={{ flex: 1 }}>
              <Skeleton width="40%" height="24px" />
              <Skeleton width="25%" height="16px" />
            </div>
          </div>
        </Card>
      ) : user ? (
        <>
          {/* User Hero Card */}
          <Card className={styles.userHeroCard}>
            <div className={styles.heroContent}>
              <div className={styles.avatarWrap}>
                <div className={styles.avatarBig}>{user.fullName.charAt(0)}</div>
                <div className={styles.levelTag}>Lv.{user.level}</div>
              </div>

              <div className={styles.heroDetails}>
                <div className={styles.heroTitleRow}>
                  <h1 className={styles.userName}>{user.fullName}</h1>
                  <Badge dot>{user.accountStatus}</Badge>
                </div>

                <div className={styles.heroMetaRow}>
                  <span>ID: <code className={styles.codeId}>{user.userId}</code></span>
                  <span>•</span>
                  <span>Email: <strong>{user.email}</strong></span>
                  <span>•</span>
                  <span>Member Since: {user.registeredDate}</span>
                </div>
              </div>

              <div className={styles.heroActions}>
                {user.accountStatus === 'Suspended' ? (
                  <Button
                    variant="gold"
                    size="md"
                    onClick={() => {
                      setStatusAction('Restore');
                      setStatusReason('Reinstated by admin after review');
                      setShowStatusModal(true);
                    }}
                  >
                    Restore Account
                  </Button>
                ) : (
                  <Button
                    variant="danger"
                    size="md"
                    onClick={() => {
                      setStatusAction('Suspend');
                      setStatusReason('Suspended due to terms violation');
                      setShowStatusModal(true);
                    }}
                  >
                    Suspend Account
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Key Balances & Telemetry */}
          <div className={styles.detailsGrid}>
            <Card title="Authoritative Wallet Balances" icon={Coins}>
              <div className={styles.balanceList}>
                <div className={styles.balanceItem}>
                  <span className={styles.balanceLabel}>VEs Balance:</span>
                  <span className={styles.balanceGold}>
                    {Number(user.vesBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} VEs
                  </span>
                </div>
                <div className={styles.balanceItem}>
                  <span className={styles.balanceLabel}>Tokens Balance:</span>
                  <span className={styles.balanceVal}>
                    {Number(user.tokensBalance || 0).toFixed(2)} Tokens
                  </span>
                </div>
                <div className={styles.balanceItem}>
                  <span className={styles.balanceLabel}>Platform Seniority:</span>
                  <span className={styles.balanceVal}>Level {user.level}</span>
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <Link to="/admin/rewards">
                  <Button variant="outline" size="sm">
                    Open Reward Adjustment Console
                  </Button>
                </Link>
              </div>
            </Card>

            <Card title="Referral & Network Standing" icon={Share2}>
              <div className={styles.balanceList}>
                <div className={styles.balanceItem}>
                  <span className={styles.balanceLabel}>Total Referrals:</span>
                  <span className={styles.referralVal}>{user.referralsCount || 0} members</span>
                </div>
                <div className={styles.balanceItem}>
                  <span className={styles.balanceLabel}>Last Active Timestamp:</span>
                  <span className={styles.balanceVal}>{user.lastActive || '2026-10-30'}</span>
                </div>
                <div className={styles.balanceItem}>
                  <span className={styles.balanceLabel}>Anti-Fraud Verification:</span>
                  <span style={{ color: 'var(--status-success)', fontWeight: 600 }}>Passed Automated Checks</span>
                </div>
              </div>
            </Card>
          </div>
        </>
      ) : null}

      {/* Suspend/Restore Modal */}
      {showStatusModal && (
        <Modal
          isOpen={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          title={`${statusAction} User Account`}
          subtitle={`Audit logging enabled for ${user?.userId}`}
          maxWidth="480px"
          footer={
            <>
              <Button variant="ghost" onClick={() => setShowStatusModal(false)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button
                variant={statusAction === 'Suspend' ? 'danger' : 'gold'}
                onClick={handleStatusChange}
                loading={actionLoading}
              >
                Confirm {statusAction}
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Provide the administrative justification for changing this member's standing.
            </p>
            <InputField
              label="Audit Reason"
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              placeholder="e.g. Terms of Service violation #4"
              required
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminUserDetailsPage;
