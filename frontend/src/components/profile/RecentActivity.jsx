import React, { useState } from 'react';
import {
  History,
  Gift,
  PlaySquare,
  UserPlus,
  TrendingUp,
  ArrowDownRight,
  Sparkles,
  Filter,
  CheckCircle2,
  Clock
} from 'lucide-react';
import Skeleton from '../common/Skeleton';
import EmptyState from '../common/EmptyState';
import Badge from '../common/Badge';
import styles from './RecentActivity.module.css';

const RecentActivity = ({
  activities = [],
  loading = false,
}) => {
  const [filterType, setFilterType] = useState('ALL');

  const getActivityIcon = (type) => {
    switch (type) {
      case 'DAILY_BONUS': return Gift;
      case 'AD_REWARD': return PlaySquare;
      case 'REFERRAL_REWARD': return UserPlus;
      case 'XP_EARNED': return TrendingUp;
      case 'WITHDRAWAL': return ArrowDownRight;
      case 'GEM_REWARD': return Sparkles;
      default: return History;
    }
  };

  const filteredActivities = activities.filter((act) => {
    if (filterType === 'ALL') return true;
    return act.type === filterType;
  });

  return (
    <section id="section-activity" className={styles.sectionWrap}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Recent Activity Stream</h2>
          <p className={styles.sectionSubtitle}>
            Live chronological ledger of reward claims, ad views, bonuses, and payouts.
          </p>
        </div>

        {/* Filter Pills */}
        <div className={styles.filterGroup}>
          {['ALL', 'DAILY_BONUS', 'AD_REWARD', 'REFERRAL_REWARD', 'WITHDRAWAL'].map((t) => (
            <button
              key={t}
              type="button"
              className={`${styles.filterBtn} ${filterType === t ? styles.filterActive : ''}`}
              onClick={() => setFilterType(t)}
            >
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.activityContainer}>
        {loading ? (
          <div className={styles.skeletonList}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={styles.skeletonItem}>
                <Skeleton variant="circle" width="36px" height="36px" />
                <div style={{ flex: 1 }}>
                  <Skeleton width="40%" height="16px" />
                  <Skeleton width="20%" height="12px" />
                </div>
                <Skeleton width="60px" height="20px" />
              </div>
            ))}
          </div>
        ) : filteredActivities.length === 0 ? (
          <EmptyState
            title="No activity records"
            description="You have no recorded activities matching the selected filter."
          />
        ) : (
          <div className={styles.activityList}>
            {filteredActivities.map((act) => {
              const Icon = getActivityIcon(act.type);
              const isDebit = act.amount?.startsWith('-');

              return (
                <div key={act.id} className={styles.activityRow}>
                  <div className={`${styles.iconWrap} ${styles[`icon_${act.type}`]}`}>
                    <Icon size={18} />
                  </div>

                  <div className={styles.infoCol}>
                    <div className={styles.actTitle}>{act.title}</div>
                    <div className={styles.metaRow}>
                      <span className={styles.timestamp}>{act.timestamp}</span>
                      <span className={styles.dotSeparator}>•</span>
                      <span className={styles.typeBadge}>{act.type.replace('_', ' ')}</span>
                    </div>
                  </div>

                  <div className={styles.amountCol}>
                    <span className={`${styles.amountText} ${isDebit ? styles.debitColor : styles.creditColor}`}>
                      {act.amount}
                    </span>
                    <Badge size="sm" dot>
                      {act.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default RecentActivity;
