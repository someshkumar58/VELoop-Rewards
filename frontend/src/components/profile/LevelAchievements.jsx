import React from 'react';
import {
  Award,
  CheckCircle2,
  Lock,
  Flame,
  Rocket,
  Coins,
  Users,
  Crown,
  Shield,
  Zap,
  Inbox
} from 'lucide-react';
import Card from '../common/Card';
import ProgressBar from '../common/ProgressBar';
import Skeleton from '../common/Skeleton';
import Badge from '../common/Badge';
import EmptyState from '../common/EmptyState';
import styles from './LevelAchievements.module.css';

const LevelAchievements = ({
  levelProgress = {},
  achievements = [],
  loading = false,
}) => {
  // Dynamic icon lookup
  const getIcon = (iconName) => {
    switch (iconName) {
      case 'Rocket': return Rocket;
      case 'Flame': return Flame;
      case 'Coins': return Coins;
      case 'Users': return Users;
      case 'Crown': return Crown;
      case 'Shield': return Shield;
      case 'Zap': return Zap;
      default: return Award;
    }
  };

  const safeAchievements = Array.isArray(achievements) ? achievements : [];
  const unlockedList = safeAchievements.filter((a) => a && a.unlocked);
  const lockedList = safeAchievements.filter((a) => a && !a.unlocked);
  const nextAchievement = lockedList[0] || null;

  // Defensive calculations for level progress
  const currentLevel = Number(levelProgress.currentLevel) || 1;
  const levelName = levelProgress.levelName || 'Initiate';
  const totalXP = Number(levelProgress.totalXP) || 0;
  const nextLevelXP = Number(levelProgress.nextLevelXPRequirement) || 1000;
  const remainingXP = Math.max(0, Number(levelProgress.remainingXP) || (nextLevelXP - totalXP));
  const progressPct = levelProgress.progressPercentage !== undefined && !isNaN(levelProgress.progressPercentage)
    ? Math.min(100, Math.max(0, Number(levelProgress.progressPercentage)))
    : nextLevelXP > 0 ? Math.min(100, Math.max(0, Math.round((totalXP / nextLevelXP) * 100))) : 0;

  return (
    <section id="section-levels" className={styles.sectionWrap}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Level Progression & Achievements</h2>
          <p className={styles.sectionSubtitle}>
            Track your tier progression, unlock status perks, and claim collectible achievement badges.
          </p>
        </div>
      </div>

      <div className={styles.gridContainer}>
        {/* Level Progression Card */}
        <Card
          title="Server Authoritative Level Status"
          subtitle="System-verified tier and experience points"
          icon={Award}
          className={styles.levelCard}
        >
          {loading ? (
            <div className={styles.loadingWrap}>
              <Skeleton height="24px" width="50%" />
              <Skeleton height="14px" width="100%" />
              <Skeleton height="80px" width="100%" />
            </div>
          ) : (
            <div className={styles.levelBody}>
              <div className={styles.rankBadgeRow}>
                <div className={styles.rankInfo}>
                  <div className={styles.rankLevel}>Level {currentLevel}</div>
                  <h3 className={styles.rankName}>{levelName}</h3>
                </div>
                <div className={styles.multiplierBox}>
                  <span className={styles.multLabel}>Platform Multiplier</span>
                  <span className={styles.multValue}>{levelProgress.rewardMultiplier || '1.0x'}</span>
                </div>
              </div>

              {/* Progress Bar Container */}
              <div className={styles.progressContainer}>
                <div className={styles.progressStats}>
                  <span>Total XP: <strong>{totalXP.toLocaleString()}</strong></span>
                  <span>Next Level: <strong>{nextLevelXP.toLocaleString()} XP</strong></span>
                </div>

                <ProgressBar
                  customPercentage={progressPct}
                  color="gold"
                  height={12}
                  showLabel
                  labelText={`Tier ${currentLevel} Progression`}
                />

                <div className={styles.remainingInfo}>
                  <span>
                    Remaining to graduate: <strong>{remainingXP.toLocaleString()} XP</strong>
                  </span>
                  <span className={styles.pctBadge}>{progressPct}% Completed</span>
                </div>
              </div>

              {/* Next Upcoming Achievement Teaser */}
              {nextAchievement && (
                <div className={styles.nextAchBox}>
                  <div className={styles.nextAchHeader}>
                    <span className={styles.nextAchTag}>Next Achievement Target</span>
                    <span className={styles.rewardTag}>+{nextAchievement.xpReward || 0} XP</span>
                  </div>
                  <div className={styles.nextAchContent}>
                    <div className={styles.nextAchIcon}>
                      {React.createElement(getIcon(nextAchievement.icon), { size: 18 })}
                    </div>
                    <div className={styles.nextAchDetails}>
                      <span className={styles.nextAchTitle}>{nextAchievement.title}</span>
                      <span className={styles.nextAchDesc}>{nextAchievement.description}</span>
                    </div>
                  </div>
                  {nextAchievement.required && Number(nextAchievement.required) > 0 && (
                    <div className={styles.nextAchBarWrap}>
                      <ProgressBar
                        value={nextAchievement.progress || 0}
                        max={nextAchievement.required}
                        color="blue"
                        height={6}
                      />
                      <div className={styles.nextAchReqText}>
                        Progress: {nextAchievement.progress || 0} / {nextAchievement.required}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Achievements Showcase Card */}
        <Card
          title="Achievement Badges"
          subtitle={`${unlockedList.length} Unlocked • ${lockedList.length} Locked`}
          icon={Flame}
          className={styles.achievementsCard}
        >
          {loading ? (
            <div className={styles.badgesLoading}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} height="70px" width="100%" />
              ))}
            </div>
          ) : safeAchievements.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No achievements yet"
              description="Platform achievement badges are currently being synchronized."
            />
          ) : (
            <div className={styles.achList}>
              {/* Unlocked Badges */}
              {unlockedList.length > 0 && (
                <>
                  <div className={styles.groupLabel}>
                    <CheckCircle2 size={14} className={styles.successColor} />
                    <span>UNLOCKED BADGES ({unlockedList.length})</span>
                  </div>

                  <div className={styles.badgeItemsGrid}>
                    {unlockedList.map((ach) => {
                      const Icon = getIcon(ach.icon);
                      return (
                        <div
                          key={ach.id}
                          className={`${styles.achItem} ${styles.unlockedItem}`}
                          style={{ '--badge-theme': ach.badgeColor || '#F4C76A' }}
                        >
                          <div className={styles.achIconWrap}>
                            <Icon size={20} />
                          </div>
                          <div className={styles.achTextWrap}>
                            <div className={styles.achTop}>
                              <span className={styles.achTitle}>{ach.title}</span>
                              <span className={styles.xpPill}>+{ach.xpReward} XP</span>
                            </div>
                            <p className={styles.achDesc}>{ach.description}</p>
                            <span className={styles.unlockedAt}>Unlocked on {ach.unlockedAt || 'Recently'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Locked Badges */}
              {lockedList.length > 0 && (
                <>
                  <div className={`${styles.groupLabel} ${styles.lockedLabel}`}>
                    <Lock size={14} />
                    <span>LOCKED OBJECTIVES ({lockedList.length})</span>
                  </div>

                  <div className={styles.badgeItemsGrid}>
                    {lockedList.map((ach) => {
                      const Icon = getIcon(ach.icon);
                      return (
                        <div key={ach.id} className={`${styles.achItem} ${styles.lockedItem}`}>
                          <div className={styles.lockedIconWrap}>
                            <Lock size={18} />
                          </div>
                          <div className={styles.achTextWrap}>
                            <div className={styles.achTop}>
                              <span className={styles.achTitleLocked}>{ach.title}</span>
                              <span className={styles.xpPillMuted}>+{ach.xpReward} XP</span>
                            </div>
                            <p className={styles.achDesc}>{ach.description}</p>
                            {ach.required && Number(ach.required) > 0 && (
                              <div className={styles.lockedProgress}>
                                <span>{ach.progress || 0} / {ach.required} completed</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </Card>
      </div>
    </section>
  );
};

export default LevelAchievements;
