import React from 'react';
import {
  Wallet,
  Clock,
  CheckCircle,
  XCircle,
  ArrowDownRight,
  AlertTriangle,
  Info
} from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Skeleton from '../common/Skeleton';
import styles from './WithdrawalOverview.module.css';

const WithdrawalOverview = ({
  withdrawals = {},
  loading = false,
  onRequestWithdrawal,
}) => {
  const {
    totalRequests = 0,
    pendingCount = 0,
    pendingAmount = 0,
    approvedCount = 0,
    rejectedCount = 0,
    successfullyWithdrawnAmount = 0,
    currency = 'Tokens'
  } = withdrawals;

  return (
    <section id="section-withdrawals" className={styles.sectionWrap}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Withdrawal Overview</h2>
          <p className={styles.sectionSubtitle}>
            Complete record of your withdrawal requests and historical transactions.
          </p>
        </div>
      </div>

      <div className={styles.overviewGrid}>
        {/* Total Completed Payout Hero Card */}
        <div className={styles.heroSummaryCard}>
          <div className={styles.heroLeft}>
            <div className={styles.walletIconWrap}>
              <Wallet size={24} />
            </div>
            <div>
              <span className={styles.summaryLabel}>Approved Requests</span>
              {loading ? (
                <Skeleton width="140px" height="34px" />
              ) : (
                <h3 className={styles.summaryAmount}>
                  {Number(successfullyWithdrawnAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  <span className={styles.currencyBadge}>{currency || 'Tokens'}</span>
                </h3>
              )}
              <div className={styles.strictAuditNote}>
                <Info size={12} />
                <span>Strict Rule: Pending requests are strictly excluded from completed total.</span>
              </div>
              <div className={styles.strictAuditNote} style={{ marginTop: '4px', opacity: 0.85 }}>
                <AlertTriangle size={12} />
                <span>Infrastructure Mode: Real-money fiat and cryptocurrency transfers remain disabled.</span>
              </div>
            </div>
          </div>

          <div className={styles.actionCol}>
            <button
              type="button"
              className={styles.withdrawActionBtn}
              onClick={onRequestWithdrawal}
            >
              <ArrowDownRight size={16} />
              <span>New Withdrawal Request</span>
            </button>
          </div>
        </div>

        {/* 4 Status Breakdown Cards */}
        <div className={styles.metricsRow}>
          {/* Total Requests */}
          <div className={styles.metricCard}>
            <div className={styles.metricTop}>
              <span className={styles.metricLabel}>Total Requests</span>
              <span className={styles.metricIconMuted}>#</span>
            </div>
            <div className={styles.metricValue}>
              {loading ? <Skeleton width="50%" height="26px" /> : totalRequests}
            </div>
            <span className={styles.metricSub}>All-time submissions</span>
          </div>

          {/* Pending Withdrawals */}
          <div className={`${styles.metricCard} ${styles.pendingCard}`}>
            <div className={styles.metricTop}>
              <span className={styles.metricLabel}>Pending Review</span>
              <Clock size={16} className={styles.warningColor} />
            </div>
            <div className={styles.metricValue}>
              {loading ? <Skeleton width="50%" height="26px" /> : pendingCount}
            </div>
            <span className={styles.metricSub}>
              {Number(pendingAmount).toFixed(2)} {currency || 'Tokens'} awaiting admin review
            </span>
          </div>

          {/* Approved Withdrawals */}
          <div className={`${styles.metricCard} ${styles.approvedCard}`}>
            <div className={styles.metricTop}>
              <span className={styles.metricLabel}>Approved Requests</span>
              <CheckCircle size={16} className={styles.successColor} />
            </div>
            <div className={styles.metricValue}>
              {loading ? <Skeleton width="50%" height="26px" /> : approvedCount}
            </div>
            <span className={styles.metricSub}>Administratively verified</span>
          </div>

          {/* Rejected / Failed */}
          <div className={`${styles.metricCard} ${styles.rejectedCard}`}>
            <div className={styles.metricTop}>
              <span className={styles.metricLabel}>Rejected / Failed</span>
              <XCircle size={16} className={styles.errorColor} />
            </div>
            <div className={styles.metricValue}>
              {loading ? <Skeleton width="50%" height="26px" /> : rejectedCount}
            </div>
            <span className={styles.metricSub}>Refunded to user balance</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WithdrawalOverview;
