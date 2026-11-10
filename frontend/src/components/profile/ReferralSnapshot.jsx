import React, { useState } from 'react';
import {
  Users,
  Copy,
  Check,
  Share2,
  Gift,
  Coins,
  Zap,
  Target,
  Sparkles
} from 'lucide-react';
import Card from '../common/Card';
import ProgressBar from '../common/ProgressBar';
import Skeleton from '../common/Skeleton';
import Button from '../common/Button';
import { useToast } from '../../context/ToastContext';
import styles from './ReferralSnapshot.module.css';

const ReferralSnapshot = ({
  referrals = {},
  loading = false,
}) => {
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);

  const {
    referralCode = 'VEL-CODE',
    totalReferrals = 0,
    successfulReferrals = 0,
    pendingReferrals = 0,
    referralRewardsVEs = 0,
    referralXPEarned = 0,
    currentMilestoneTarget = 20,
    milestoneCurrentCount = 0,
    milestoneReward = '500 Bonus VEs',
    milestonePercentage = 0
  } = referrals;

  const handleCopyCode = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(referralCode);
      } else {
        const ta = document.createElement('textarea');
        ta.value = referralCode;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      addToast('Referral code copied! Share with friends to earn +100 VEs.', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast('Unable to copy code. Please copy manually.', 'warning');
    }
  };

  const shareLink = `https://veloop.io/register?ref=${referralCode}`;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareLink);
      } else {
        const ta = document.createElement('textarea');
        ta.value = shareLink;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      addToast('Complete referral registration link copied!', 'success');
    } catch {
      addToast('Unable to copy link. Please copy manually.', 'warning');
    }
  };

  return (
    <section id="section-referrals" className={styles.sectionWrap}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Referral Snapshot</h2>
          <p className={styles.sectionSubtitle}>
            Grow the community. Earn 100 VEs and 200 XP for every friend who activates their account.
          </p>
        </div>
      </div>

      <div className={styles.referralGrid}>
        {/* Referral Sharing Hero Card */}
        <div className={styles.shareCard}>
          <div className={styles.shareTop}>
            <div className={styles.shareIconWrap}>
              <Share2 size={24} />
            </div>
            <div>
              <span className={styles.shareLabel}>YOUR UNIQUE INVITATION CODE</span>
              <div className={styles.codeRow}>
                <span className={styles.codeDisplay}>{referralCode}</span>
                <button
                  type="button"
                  className={styles.copyBtn}
                  onClick={handleCopyCode}
                  title="Copy Referral Code"
                >
                  {copied ? <Check size={16} className={styles.successColor} /> : <Copy size={16} />}
                  <span>{copied ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className={styles.shareFooter}>
            <span className={styles.linkTeaser}>Shareable Link: <code>{shareLink}</code></span>
            <button
              type="button"
              className={styles.copyLinkBtn}
              onClick={handleCopyLink}
            >
              Copy Link
            </button>
          </div>

          {/* Milestone Progress */}
          <div className={styles.milestoneBox}>
            <div className={styles.milestoneHeader}>
              <div className={styles.milestoneTitle}>
                <Target size={16} className={styles.goldText} />
                <span>Next Referral Milestone: {currentMilestoneTarget} Friends</span>
              </div>
              <span className={styles.milestoneBonus}>Reward: {milestoneReward}</span>
            </div>

            <ProgressBar
              customPercentage={milestonePercentage}
              color="purple"
              height={10}
              showLabel
              labelText={`${milestoneCurrentCount} / ${currentMilestoneTarget} Qualified Referrals`}
            />
          </div>
        </div>

        {/* 4 Referral Metrics */}
        <div className={styles.metricsCol}>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Total Invites</div>
            <div className={styles.metricVal}>
              {loading ? <Skeleton width="40px" height="24px" /> : totalReferrals}
            </div>
            <span className={styles.metricSub}>Registered via your link</span>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Successful / Active</div>
            <div className={`${styles.metricVal} ${styles.successColor}`}>
              {loading ? <Skeleton width="40px" height="24px" /> : successfulReferrals}
            </div>
            <span className={styles.metricSub}>Completed verification</span>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Pending Onboarding</div>
            <div className={`${styles.metricVal} ${styles.warningColor}`}>
              {loading ? <Skeleton width="40px" height="24px" /> : pendingReferrals}
            </div>
            <span className={styles.metricSub}>Awaiting initial task</span>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Referral VEs & XP Earned</div>
            <div className={styles.metricVal}>
              {loading ? <Skeleton width="80px" height="24px" /> : `+${referralRewardsVEs.toLocaleString()} VEs`}
            </div>
            <span className={styles.metricSub}>+{referralXPEarned.toLocaleString()} Level XP</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReferralSnapshot;
