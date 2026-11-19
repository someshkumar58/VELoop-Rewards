import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
  Inbox,
  Gem,
  Compass,
  Sparkles,
  ArrowRight,
  Clock,
  Gift
} from 'lucide-react';
import EmptyState from '../common/EmptyState';
import styles from './LevelAchievements.module.css';

// 5 Canonical Tiers Roadmap
const ROADMAP_TIERS = [
  {
    level: 1,
    name: 'Bronze Initiate',
    stepLabel: 'Bronze Tier',
    minXP: 0,
    maxXP: 2499,
    multiplier: '1.00x',
    icon: Shield,
    accent: '#CD7F32',
    glow: 'rgba(205, 127, 50, 0.35)',
    perks: 'Standard daily check-in rewards & baseline VE earning rates.'
  },
  {
    level: 2,
    name: 'Silver Explorer',
    stepLabel: 'Silver Tier',
    minXP: 2500,
    maxXP: 5999,
    multiplier: '1.10x',
    icon: Compass,
    accent: '#C0C0C0',
    glow: 'rgba(192, 192, 192, 0.35)',
    perks: '+10% bonus on ad watches and priority verification queue.'
  },
  {
    level: 3,
    name: 'Titanium Voyager',
    stepLabel: 'Titanium Tier',
    minXP: 6000,
    maxXP: 9999,
    multiplier: '1.15x',
    icon: Rocket,
    accent: '#48CAE4',
    glow: 'rgba(72, 202, 228, 0.35)',
    perks: 'Free monthly gem crate and 12-hour withdrawal processing.'
  },
  {
    level: 4,
    name: 'Gold Pioneer',
    stepLabel: 'Gold Tier',
    minXP: 10000,
    maxXP: 14999,
    multiplier: '1.25x',
    icon: Crown,
    accent: '#F4C76A',
    glow: 'rgba(244, 199, 106, 0.4)',
    perks: '+25% reward multipliers across all claims & zero-fee swaps.'
  },
  {
    level: 5,
    name: 'Diamond Legend',
    stepLabel: 'Diamond Tier',
    minXP: 15000,
    maxXP: Infinity,
    multiplier: '1.50x',
    icon: Gem,
    accent: '#00F2FE',
    glow: 'rgba(0, 242, 254, 0.45)',
    perks: 'VIP Telegram access, instant token payouts & physical swag kit.'
  }
];

// Determine rarity based on XP reward or code
const getRarityInfo = (ach) => {
  const xp = ach.xpReward || 0;
  if (xp >= 2000) {
    return { name: 'Legendary', color: '#F59E0B', glow: 'rgba(245, 158, 11, 0.3)' };
  }
  if (xp >= 800) {
    return { name: 'Epic', color: '#C084FC', glow: 'rgba(192, 132, 252, 0.3)' };
  }
  if (xp >= 300) {
    return { name: 'Rare', color: '#818CF8', glow: 'rgba(129, 140, 248, 0.3)' };
  }
  return { name: 'Common', color: '#38BDF8', glow: 'rgba(56, 189, 248, 0.3)' };
};

const LevelAchievements = ({
  levelProgress = {},
  achievements = [],
  loading = false,
}) => {
  const [filter, setFilter] = useState('all'); // 'all' | 'unlocked' | 'locked'

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
      case 'Gem': return Gem;
      default: return Award;
    }
  };

  const safeAchievements = Array.isArray(achievements) ? achievements : [];
  const unlockedList = safeAchievements.filter((a) => a && a.unlocked);
  const lockedList = safeAchievements.filter((a) => a && !a.unlocked);

  const filteredAchievements = safeAchievements.filter((ach) => {
    if (filter === 'unlocked') return ach.unlocked;
    if (filter === 'locked') return !ach.unlocked;
    return true;
  });

  // Defensive calculations for level progress
  const currentLevel = Number(levelProgress.currentLevel) || 1;
  const levelName = levelProgress.levelName || 'Bronze Initiate';
  const totalXP = Number(levelProgress.totalXP) || 0;
  const nextLevelXP = Number(levelProgress.nextLevelXPRequirement) || 2500;
  const remainingXP = Math.max(0, Number(levelProgress.remainingXP) || (nextLevelXP - totalXP));
  const progressPct = levelProgress.progressPercentage !== undefined && !isNaN(levelProgress.progressPercentage)
    ? Math.min(100, Math.max(0, Number(levelProgress.progressPercentage)))
    : nextLevelXP > 0 ? Math.min(100, Math.max(0, Math.round((totalXP / nextLevelXP) * 100))) : 0;

  // Active tier styling
  const activeTierMeta = ROADMAP_TIERS.find((t) => t.level === currentLevel) || ROADMAP_TIERS[0];
  const TierEmblemIcon = activeTierMeta.icon || Award;

  return (
    <section id="section-levels" className={styles.sectionWrap}>
      {/* Header with Title and Link to dedicated Roadmap page */}
      <div className={styles.sectionHeader}>
        <div className={styles.titleArea}>
          <h2 className={styles.sectionTitle}>Level Progression & Achievements</h2>
          <p className={styles.sectionSubtitle}>
            Gamified experience progression, multi-tier reward bonuses, and collectible platform badges.
          </p>
        </div>
        <a href="/levels" className={styles.roadmapBtn}>
          <span>View Full Roadmap</span>
          <ArrowRight size={15} />
        </a>
      </div>

      {/* 1. Hero Level Showcase Card */}
      <div
        className={styles.heroLevelCard}
        style={{
          '--tier-accent': activeTierMeta.accent,
          '--tier-glow': activeTierMeta.glow
        }}
      >
        <div className={styles.heroGlowOrb} />
        <div className={styles.heroTopRow}>
          <div className={styles.emblemAndInfo}>
            <div className={styles.emblemWrapper}>
              <TierEmblemIcon size={32} className={styles.emblemIcon} />
            </div>
            <div className={styles.tierInfo}>
              <div className={styles.tierBadgePill}>
                <Sparkles size={12} />
                <span>Level {currentLevel} • Active Tier</span>
              </div>
              <h3 className={styles.rankTitle}>{levelName}</h3>
              <p className={styles.tierSubtitle}>
                {activeTierMeta.perks}
              </p>
            </div>
          </div>

          <div className={styles.heroMultiplierBox}>
            <span className={styles.multiplierLabel}>Tier Earning Multiplier</span>
            <span className={styles.multiplierValue}>{levelProgress.rewardMultiplier || activeTierMeta.multiplier}</span>
            <span className={styles.multiplierSub}>Applied to Ads & Claims</span>
          </div>
        </div>

        {/* Animated XP Progress Bar */}
        <div className={styles.progressArea}>
          <div className={styles.progressLabelRow}>
            <span>Experience: <strong className={styles.currentXPBold}>{totalXP.toLocaleString()} XP</strong></span>
            <span>
              {currentLevel >= 5 ? (
                <strong className={styles.targetXPBold}>Max Tier Reached</strong>
              ) : (
                <>Next Goal: <strong className={styles.targetXPBold}>{nextLevelXP.toLocaleString()} XP</strong></>
              )}
            </span>
          </div>

          <div className={styles.customProgressBarWrap}>
            <div
              className={styles.customProgressFill}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className={styles.progressBottomRow}>
            <span className={styles.remainingHighlight}>
              {currentLevel >= 5 ? (
                'Diamond Legend achieved — VIP perks unlocked'
              ) : (
                <>Remaining to Level {currentLevel + 1}: <strong>{remainingXP.toLocaleString()} XP</strong></>
              )}
            </span>
            <span className={styles.pctPill}>{progressPct}% Completed</span>
          </div>
        </div>
      </div>

      {/* 2. Interactive Level Tier Roadmap */}
      <div className={styles.roadmapSection}>
        <div className={styles.roadmapHeader}>
          <h4 className={styles.roadmapTitle}>
            <Award size={18} style={{ color: 'var(--accent-gold)' }} />
            <span>5-Tier Progression Roadmap</span>
          </h4>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Current: Tier {currentLevel} of 5
          </span>
        </div>

        <div className={styles.roadmapTrack}>
          {ROADMAP_TIERS.map((tier) => {
            const isUnlocked = currentLevel > tier.level;
            const isCurrent = currentLevel === tier.level;
            const isLocked = currentLevel < tier.level;
            const StepIcon = tier.icon;

            return (
              <div
                key={tier.level}
                className={`
                  ${styles.tierStepCard}
                  ${isUnlocked ? styles.tierStepUnlocked : ''}
                  ${isCurrent ? styles.tierStepCurrent : ''}
                  ${isLocked ? styles.tierStepLocked : ''}
                `}
                title={`${tier.name}: ${tier.perks}`}
              >
                {isCurrent && <span className={styles.currentMarker}>Active</span>}

                <div className={styles.tierStepIconWrap}>
                  {isUnlocked ? (
                    <CheckCircle2 size={22} />
                  ) : isLocked ? (
                    <Lock size={18} />
                  ) : (
                    <StepIcon size={22} />
                  )}
                </div>

                <div className={styles.tierStepTitle}>{tier.stepLabel}</div>
                <div className={styles.tierStepXP}>
                  {tier.minXP.toLocaleString()} {tier.maxXP === Infinity ? '+ XP' : `– ${tier.maxXP.toLocaleString()} XP`}
                </div>
                <span className={styles.tierStepMult}>{tier.multiplier}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Tier Perks & Rewards Matrix */}
      <div className={styles.perksMatrixWrap}>
        <div className={styles.perkCard}>
          <div className={styles.perkHeader}>
            <div className={styles.perkIconWrap}>
              <Zap size={18} />
            </div>
            <h5 className={styles.perkTitle}>VE Multiplier Boost</h5>
          </div>
          <p className={styles.perkDesc}>
            Receive an automatic {activeTierMeta.multiplier} multiplier on ad session claims and daily check-ins.
          </p>
        </div>

        <div className={styles.perkCard}>
          <div className={styles.perkHeader}>
            <div className={styles.perkIconWrap} style={{ color: 'var(--accent-purple)', borderColor: 'rgba(167, 139, 250, 0.4)', background: 'rgba(167, 139, 250, 0.12)' }}>
              <Gem size={18} />
            </div>
            <h5 className={styles.perkTitle}>Gem Drop Eligibility</h5>
          </div>
          <p className={styles.perkDesc}>
            Unlock access to periodic community Gem airdrops and tier milestone crates.
          </p>
        </div>

        <div className={styles.perkCard}>
          <div className={styles.perkHeader}>
            <div className={styles.perkIconWrap} style={{ color: 'var(--accent-blue)', borderColor: 'rgba(110, 168, 254, 0.4)', background: 'rgba(110, 168, 254, 0.12)' }}>
              <Clock size={18} />
            </div>
            <h5 className={styles.perkTitle}>Fast Redemptions</h5>
          </div>
          <p className={styles.perkDesc}>
            Expedited queue for token withdrawal reviews and instant settlement routing.
          </p>
        </div>

        <div className={styles.perkCard}>
          <div className={styles.perkHeader}>
            <div className={styles.perkIconWrap} style={{ color: '#34D399', borderColor: 'rgba(52, 211, 153, 0.4)', background: 'rgba(52, 211, 153, 0.12)' }}>
              <Gift size={18} />
            </div>
            <h5 className={styles.perkTitle}>Status Privileges</h5>
          </div>
          <p className={styles.perkDesc}>
            Zero-fee token swap limits and exclusive community role credentials.
          </p>
        </div>
      </div>

      {/* 4. Achievements Showcase Grid */}
      <div className={styles.achievementsWrap}>
        <div className={styles.achTopBar}>
          <div className={styles.achHeading}>
            <h3 className={styles.achTitle}>Achievement Badges</h3>
            <p className={styles.achStatsSummary}>
              {unlockedList.length} Unlocked • {lockedList.length} In Progress
            </p>
          </div>

          <div className={styles.achFilterTabs}>
            <button
              type="button"
              className={`${styles.filterBtn} ${filter === 'all' ? styles.filterBtnActive : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({safeAchievements.length})
            </button>
            <button
              type="button"
              className={`${styles.filterBtn} ${filter === 'unlocked' ? styles.filterBtnActive : ''}`}
              onClick={() => setFilter('unlocked')}
            >
              Unlocked ({unlockedList.length})
            </button>
            <button
              type="button"
              className={`${styles.filterBtn} ${filter === 'locked' ? styles.filterBtnActive : ''}`}
              onClick={() => setFilter('locked')}
            >
              In Progress ({lockedList.length})
            </button>
          </div>
        </div>

        {safeAchievements.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No achievements yet"
            description="Platform achievement badges are currently being synchronized."
          />
        ) : (
          <div className={styles.achGrid}>
            {filteredAchievements.map((ach) => {
              const Icon = getIcon(ach.icon);
              const rarity = getRarityInfo(ach);

              return (
                <div
                  key={ach.id}
                  className={`
                    ${styles.achCard}
                    ${ach.unlocked ? styles.achCardUnlocked : ''}
                  `}
                  style={{
                    '--rarity-color': rarity.color,
                    '--rarity-glow': rarity.glow
                  }}
                >
                  <div className={styles.achCardTop}>
                    <div className={styles.achIconAndRarity}>
                      <div className={styles.achIconBox}>
                        <Icon size={20} />
                      </div>
                      <div className={styles.achCardTitleArea}>
                        <span className={styles.rarityTag}>{rarity.name}</span>
                        <h4 className={styles.achItemTitle}>{ach.title}</h4>
                      </div>
                    </div>
                    <span className={styles.xpRewardBadge}>+{ach.xpReward} XP</span>
                  </div>

                  <p className={styles.achItemDesc}>{ach.description}</p>

                  <div className={styles.achFooter}>
                    {ach.unlocked ? (
                      <div className={styles.unlockedStatus}>
                        <CheckCircle2 size={14} />
                        <span>Unlocked {ach.unlockedAt ? `on ${ach.unlockedAt}` : '✓ Claimed'}</span>
                      </div>
                    ) : (
                      <div className={styles.lockedStatusBar}>
                        <div className={styles.lockedTextRow}>
                          <span>Progress</span>
                          <strong>
                            {ach.required
                              ? `${Number(ach.progress || 0).toLocaleString()} / ${Number(ach.required).toLocaleString()}`
                              : 'In Progress'}
                          </strong>
                        </div>
                        {ach.required && Number(ach.required) > 0 && (
                          <div className={styles.miniProgressBar}>
                            <div
                              className={styles.miniProgressFill}
                              style={{
                                width: `${Math.min(100, Math.round(((ach.progress || 0) / ach.required) * 100))}%`
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}
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

export default LevelAchievements;
