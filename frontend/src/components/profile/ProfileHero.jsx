import React, { useState } from 'react';
import { Copy, Check, Edit3, ShieldCheck, Calendar, Hash, Mail, Share2, Sparkles } from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';
import ProgressBar from '../common/ProgressBar';
import Skeleton from '../common/Skeleton';
import { useToast } from '../../context/ToastContext';
import styles from './ProfileHero.module.css';

const ProfileHero = ({
  user,
  loading = false,
  onOpenEdit,
}) => {
  const { addToast } = useToast();
  const [copiedField, setCopiedField] = useState(null);

  const copyToClipboard = async (text, fieldName) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedField(fieldName);
      addToast(`${fieldName} copied to clipboard!`, 'success', 2500);
      setTimeout(() => {
        setCopiedField(null);
      }, 2000);
    } catch {
      addToast(`Unable to copy ${fieldName}. Please copy manually.`, 'warning');
    }
  };

  if (loading) {
    return (
      <div className={styles.heroCard}>
        <div className={styles.heroMain}>
          <Skeleton variant="circle" width="96px" height="96px" />
          <div style={{ flex: 1 }}>
            <Skeleton width="40%" height="24px" />
            <Skeleton width="60%" height="16px" />
            <Skeleton width="30%" height="16px" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const currentLevel = user.levelProgress?.currentLevel || 1;
  const levelName = user.levelProgress?.levelName || 'Initiate';
  const progressPct = user.levelProgress?.progressPercentage || 0;

  return (
    <div id="section-hero" className={styles.heroCard}>
      <div className={styles.heroTopGrid}>
        {/* Avatar and Primary Identity */}
        <div className={styles.identityCol}>
          <div className={styles.avatarWrapper}>
            <img
              src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
              alt={user.fullName}
              className={styles.avatar}
            />
            <div className={styles.levelBadgeMini} title={`Current Level ${currentLevel}`}>
              <span>Lv.{currentLevel}</span>
            </div>
          </div>

          <div className={styles.userInfoCol}>
            <div className={styles.nameRow}>
              <h1 className={styles.fullName}>{user.fullName}</h1>
              {user.isVerified && (
                <span className={styles.verifiedBadge} title="Verified KYC Member">
                  <ShieldCheck size={16} />
                  <span>KYC Verified</span>
                </span>
              )}
              <Badge variant={user.accountStatus === 'Active' ? 'success' : 'warning'} dot>
                {user.accountStatus}
              </Badge>
            </div>

            <div className={styles.metaRow}>
              <div className={styles.metaItem}>
                <Mail size={14} className={styles.metaIcon} />
                <span>{user.email}</span>
              </div>
              <div className={styles.metaItem}>
                <Calendar size={14} className={styles.metaIcon} />
                <span>Member since {user.memberSince}</span>
              </div>
            </div>

            {/* Copy Identifiers Row */}
            <div className={styles.identifiersRow}>
              <div className={styles.copyBox}>
                <span className={styles.copyLabel}>User ID:</span>
                <span className={styles.copyValue}>{user.userId}</span>
                <button
                  type="button"
                  className={styles.copyActionBtn}
                  onClick={() => copyToClipboard(user.userId, 'User ID')}
                  title="Copy User ID"
                >
                  {copiedField === 'User ID' ? <Check size={14} className={styles.copiedIcon} /> : <Copy size={14} />}
                </button>
              </div>

              <div className={styles.copyBox}>
                <span className={styles.copyLabel}>Referral Code:</span>
                <span className={`${styles.copyValue} ${styles.goldHighlight}`}>{user.referralCode}</span>
                <button
                  type="button"
                  className={styles.copyActionBtn}
                  onClick={() => copyToClipboard(user.referralCode, 'Referral Code')}
                  title="Copy Referral Code"
                >
                  {copiedField === 'Referral Code' ? <Check size={14} className={styles.copiedIcon} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Level & XP Quick Progress Box */}
        <div className={styles.levelProgressCol}>
          <div className={styles.levelHeader}>
            <div className={styles.levelRank}>
              <Sparkles size={16} className={styles.goldText} />
              <span className={styles.levelTitleText}>Level {currentLevel}: {levelName}</span>
            </div>
            <span className={styles.multiplierText}>{user.levelProgress?.rewardMultiplier || '1.0x'} Boost</span>
          </div>

          <ProgressBar
            customPercentage={progressPct}
            color="gold"
            height={10}
            showLabel
            labelText={`${Number(user.levelProgress?.totalXP || 0).toLocaleString()} / ${Number(user.levelProgress?.nextLevelXPRequirement || 0).toLocaleString()} XP`}
          />

          <div className={styles.levelFooter}>
            <span className={styles.remainingText}>
              <strong>{Number(user.levelProgress?.remainingXP || 0).toLocaleString()} XP</strong> remaining to Level {currentLevel + 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              icon={Edit3}
              onClick={onOpenEdit}
              className={styles.editBtn}
            >
              Edit Profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHero;
