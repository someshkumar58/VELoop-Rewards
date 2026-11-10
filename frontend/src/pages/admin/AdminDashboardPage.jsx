import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  UserX,
  Coins,
  Clock,
  Share2,
  Activity,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  FileText,
  RefreshCw
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Skeleton from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';
import styles from './AdminDashboard.module.css';

const AdminDashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getDashboardStats();
      setData(response.data);
    } catch (err) {
      console.error('[AdminDashboardPage] Fetch error:', err);
      setError(err.message || 'Unable to retrieve dashboard telemetry from backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (error && !data) {
    return (
      <div style={{ padding: '30px 0' }}>
        <ErrorState
          title="Admin Dashboard Unavailable"
          message={error}
          onRetry={fetchDashboardData}
        />
      </div>
    );
  }

  const stats = data?.stats || {};
  const distribution = data?.rewardDistribution || [];
  const recentActivities = data?.recentActivities || [];
  const recentAdminLogs = data?.recentAdminLogs || [];

  return (
    <div className={styles.dashboardContainer}>
      {/* Top Header */}
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.pageTitle}>System Administration Console</h1>
          <p className={styles.pageSubtitle}>
            Real-time ecosystem metrics, user account moderation, and platform asset monitoring.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          onClick={fetchDashboardData}
          loading={loading}
        >
          Refresh Telemetry
        </Button>
      </div>

      {/* 6 Key Performance Metric Cards */}
      <div className={styles.statsGrid}>
        {/* Total Users */}
        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Total Registered Users</span>
            <div className={`${styles.statIcon} ${styles.iconBlue}`}>
              <Users size={18} />
            </div>
          </div>
          <div className={styles.statValue}>
            {loading ? <Skeleton width="60%" height="28px" /> : Number(stats.totalUsers || 0).toLocaleString()}
          </div>
          <div className={styles.statFoot}>
            <span className={styles.footSuccess}>{stats.usersGrowth || '+12.4% this month'}</span>
          </div>
        </div>

        {/* Active Users */}
        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Active Members</span>
            <div className={`${styles.statIcon} ${styles.iconSuccess}`}>
              <UserCheck size={18} />
            </div>
          </div>
          <div className={styles.statValue}>
            {loading ? <Skeleton width="60%" height="28px" /> : Number(stats.activeUsers || 0).toLocaleString()}
          </div>
          <div className={styles.statFoot}>
            <span>{stats.activePercentage || 75.5}% engagement rate</span>
          </div>
        </div>

        {/* Suspended Users */}
        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Suspended / Flagged</span>
            <div className={`${styles.statIcon} ${styles.iconError}`}>
              <UserX size={18} />
            </div>
          </div>
          <div className={styles.statValue}>
            {loading ? <Skeleton width="60%" height="28px" /> : stats.suspendedUsers || 0}
          </div>
          <div className={styles.statFoot}>
            <span className={styles.footMuted}>{stats.suspendedPercentage || 0.32}% of member base</span>
          </div>
        </div>

        {/* Total Rewards Distributed */}
        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Total VEs Distributed</span>
            <div className={`${styles.statIcon} ${styles.iconGold}`}>
              <Coins size={18} />
            </div>
          </div>
          <div className={styles.statValue}>
            {loading ? <Skeleton width="60%" height="28px" /> : Number(stats.totalRewardsDistributed || 0).toLocaleString()}
          </div>
          <div className={styles.statFoot}>
            <span>Cumulative platform issuances</span>
          </div>
        </div>

        {/* Pending Withdrawals */}
        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Pending Withdrawals</span>
            <div className={`${styles.statIcon} ${styles.iconWarning}`}>
              <Clock size={18} />
            </div>
          </div>
          <div className={styles.statValue}>
            {loading ? <Skeleton width="60%" height="28px" /> : stats.pendingWithdrawalsCount || 0}
          </div>
          <div className={styles.statFoot}>
            <span className={styles.footWarning}>
              ${Number(stats.pendingWithdrawalsAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} awaiting action
            </span>
          </div>
        </div>

        {/* Total Referrals Recorded */}
        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Referrals Tracked</span>
            <div className={`${styles.statIcon} ${styles.iconPurple}`}>
              <Share2 size={18} />
            </div>
          </div>
          <div className={styles.statValue}>
            {loading ? <Skeleton width="60%" height="28px" /> : Number(stats.totalReferralsRecorded || 0).toLocaleString()}
          </div>
          <div className={styles.statFoot}>
            <span>Attributed member signups</span>
          </div>
        </div>
      </div>

      {/* Middle Grid: Reward Distribution Visual + Recent Admin Security Logs */}
      <div className={styles.middleGrid}>
        {/* Reward Asset Distribution Breakdown */}
        <Card
          title="Reward Asset Distribution Portfolio"
          subtitle="Proportional volume across all ecosystem reward assets"
          icon={TrendingUp}
          className={styles.distributionCard}
        >
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Skeleton height="20px" width="100%" />
              <Skeleton height="20px" width="100%" />
              <Skeleton height="20px" width="100%" />
            </div>
          ) : distribution.length === 0 ? (
            <div className={styles.emptyText}>No reward distribution telemetry available.</div>
          ) : (
            <div className={styles.distContent}>
              <div className={styles.distBarWrap}>
                {(() => {
                  const total = distribution.reduce((acc, curr) => acc + (Number(curr?.amount) || 0), 0) || 1;
                  return distribution.map((item, idx) => {
                    const amount = Number(item.amount) || 0;
                    const pct = Math.max(3, Math.round((amount / total) * 100));
                    return (
                      <div
                        key={idx}
                        className={styles.distBarSegment}
                        style={{ width: `${pct}%`, backgroundColor: item.color }}
                        title={`${item.name}: ${amount.toLocaleString()} (${pct}%)`}
                      />
                    );
                  });
                })()}
              </div>

              <div className={styles.distLegendList}>
                {distribution.map((item, idx) => (
                  <div key={idx} className={styles.legendItem}>
                    <div className={styles.legendLeft}>
                      <span className={styles.legendDot} style={{ backgroundColor: item.color }} />
                      <span className={styles.legendName}>{item.name}</span>
                    </div>
                    <span className={styles.legendAmount}>
                      {Number(item.amount || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Recent Admin Actions Audit */}
        <Card
          title="Recent Administrative Actions"
          subtitle="Latest security events logged to the audit ledger"
          icon={FileText}
          action={
            <Link to="/admin/audit-logs" className={styles.viewAllLink}>
              View Ledger <ArrowUpRight size={14} />
            </Link>
          }
          className={styles.auditCard}
        >
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Skeleton height="40px" width="100%" />
              <Skeleton height="40px" width="100%" />
            </div>
          ) : recentAdminLogs.length === 0 ? (
            <div className={styles.emptyText}>No recent admin logs recorded.</div>
          ) : (
            <div className={styles.adminLogList}>
              {recentAdminLogs.map((log) => (
                <div key={log.id} className={styles.adminLogRow}>
                  <div className={styles.logLeft}>
                    <div className={styles.logAction}>{log.action}</div>
                    <div className={styles.logTarget}>Target: <code>{log.target}</code></div>
                  </div>
                  <div className={styles.logRight}>
                    <span className={styles.logAdmin}>{log.admin}</span>
                    <span className={styles.logTime}>{log.time}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Bottom Row: Recent Member Activity Feed */}
      <Card
        title="Live User Activity Stream"
        subtitle="Recent user engagements, withdrawals, and level accomplishments"
        icon={Activity}
        action={
          <Link to="/admin/activity" className={styles.viewAllLink}>
            All Logs <ArrowUpRight size={14} />
          </Link>
        }
        className={styles.bottomCard}
      >
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Skeleton height="36px" width="100%" />
            <Skeleton height="36px" width="100%" />
          </div>
        ) : recentActivities.length === 0 ? (
          <div className={styles.emptyText}>No recent activity records.</div>
        ) : (
          <div className={styles.activityFeed}>
            {recentActivities.map((act) => (
              <div key={act.id} className={styles.activityFeedRow}>
                <div className={styles.feedUserCol}>
                  <span className={styles.feedUser}>{act.user}</span>
                  <span className={styles.feedTime}>{act.time}</span>
                </div>
                <div className={styles.feedTypeCol}>
                  <span className={styles.feedType}>{act.type}</span>
                </div>
                <div className={styles.feedAmountCol}>
                  <span className={styles.feedAmount}>{act.amount}</span>
                  <Badge size="sm" dot>
                    {act.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminDashboardPage;
