import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Crown,
  Zap,
  Award,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowLeft,
  ArrowRight,
  Gift,
  Tv,
  Share2,
  Flame,
  Coins,
  Gem,
  Clock,
  TrendingUp,
  ChevronRight,
  Info,
  Check,
  Star,
  Shield,
  Compass,
  Rocket
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { profileService } from '../../services/profileService';
import LevelBadge, { TIER_CONFIG } from '../../components/common/LevelBadge';
import DailyCheckInModal from '../../components/profile/DailyCheckInModal';
import WatchAdsModal from '../../components/profile/WatchAdsModal';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Skeleton from '../../components/common/Skeleton';
import styles from './LevelsPage.module.css';

// 5 Canonical Tiers Roadmap Specification
const ROADMAP_TIERS = [
  {
    level: 1,
    name: 'Bronze Initiate',
    tagline: 'Initiate of the Rewards Realm',
    minXP: 0,
    maxXP: 2499,
    multiplier: '1.00x',
    adPayout: '15.00 VEs / ad',
    checkInBonus: 'Standard (Base XP)',
    withdrawalSpeed: 'Standard Review (24 – 48h)',
    gemCrate: 'None',
    swapFee: '2.0% Processing Fee',
    vipPrivilege: 'Standard Community Discord Access',
    perksList: [
      'Standard daily check-in rewards & baseline VE earning rates',
      'Earn 15.00 VEs per verified sponsored ad watch',
      'Basic access to platform token conversion options',
      'Standard community membership in Discord'
    ]
  },
  {
    level: 2,
    name: 'Silver Explorer',
    tagline: 'Pathfinder of Infinite Quests',
    minXP: 2500,
    maxXP: 5999,
    multiplier: '1.10x',
    adPayout: '16.50 VEs / ad',
    checkInBonus: '+10% Bonus XP & VEs',
    withdrawalSpeed: 'Expedited Queue (24h)',
    gemCrate: 'Common Monthly Crate',
    swapFee: '1.5% Reduced Fee',
    vipPrivilege: 'Silver Explorer Role & Badge',
    perksList: [
      '+10% bonus multiplier on all ad watches and task rewards',
      'Earn 16.50 VEs per sponsored video impression',
      'Expedited review queue for KYC & verification',
      'Monthly Common Gemstone Drop eligibility'
    ]
  },
  {
    level: 3,
    name: 'Titanium Voyager',
    tagline: 'Master of Cosmic Velocities',
    minXP: 6000,
    maxXP: 9999,
    multiplier: '1.15x',
    adPayout: '17.25 VEs / ad',
    checkInBonus: '+15% Bonus XP & VEs',
    withdrawalSpeed: 'Priority Queue (12h)',
    gemCrate: 'Rare Gem Crate',
    swapFee: '1.0% Low Fee',
    vipPrivilege: 'Voyager Community Channels',
    perksList: [
      '+15% bonus multiplier across all ecosystem claims',
      'Earn 17.25 VEs per verified video view',
      'Free monthly Rare Gem Crate with guaranteed drop',
      '12-hour prioritized withdrawal processing window'
    ]
  },
  {
    level: 4,
    name: 'Gold Pioneer',
    tagline: 'Imperial Sovereign of Rewards',
    minXP: 10000,
    maxXP: 14999,
    multiplier: '1.25x',
    adPayout: '18.75 VEs / ad',
    checkInBonus: '+25% Bonus XP & VEs',
    withdrawalSpeed: 'Fast-Track Payout (6h)',
    gemCrate: 'Epic Gold Crate',
    swapFee: '0.0% Zero-Fee Swaps',
    vipPrivilege: 'Gold VIP Lounge & Early Feature Access',
    perksList: [
      '+25% reward multipliers across all claims, ads & checks',
      'Earn 18.75 VEs per sponsored video impression',
      'Zero-fee cryptocurrency & token redemption swaps',
      '6-hour fast-track withdrawal processing queue',
      'Exclusive Gold Pioneer VIP lounge and direct support'
    ]
  },
  {
    level: 5,
    name: 'Diamond Legend',
    tagline: 'Ascended Mythic Legend',
    minXP: 15000,
    maxXP: Infinity,
    multiplier: '1.50x',
    adPayout: '22.50 VEs / ad',
    checkInBonus: '+50% Max Streak Boost',
    withdrawalSpeed: 'Instant Settlement Routing',
    gemCrate: 'Legendary Diamond Crate',
    swapFee: 'Zero-Fee + 1.0% Token Cashback',
    vipPrivilege: 'VIP Telegram, Personal Rep & Swag Kit',
    perksList: [
      '+50% maximum platform multiplier on all earning engines',
      'Earn 22.50 VEs per sponsored video watch',
      'Instant settlement routing on all token redemptions',
      'Zero-fee swaps plus +1% cashback bonus on payouts',
      'VIP Telegram concierge, direct management rep & physical swag kit'
    ]
  }
];

const LevelsPage = () => {
  const { user, isDevPreview } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [levelProgress, setLevelProgress] = useState(user?.levelProgress || {});
  const [profileData, setProfileData] = useState(user || {});

  // Modals state
  const [inspectTier, setInspectTier] = useState(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showWatchAdsModal, setShowWatchAdsModal] = useState(false);

  // Fetch authoritative level status and user profile
  const fetchLevelData = useCallback(async () => {
    setLoading(true);
    try {
      const [lvlRes, profRes] = await Promise.all([
        profileService.getLevelProgress(),
        profileService.getProfile()
      ]);
      setLevelProgress(lvlRes.data || {});
      setProfileData(profRes.data || {});
    } catch (err) {
      console.error('[LevelsPage] Error loading level progression data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLevelData();
  }, [fetchLevelData, isDevPreview]);

  // Defensive calculations for level status with safe initial defaults (Level 1 Bronze Initiate, 0 XP)
  // Ensure valid numeric 0 values and actual backend levels are not overridden by falsy checks.
  const rawLevel = levelProgress?.currentLevel ?? user?.levelProgress?.currentLevel;
  const parsedLevel = rawLevel !== undefined && rawLevel !== null && !isNaN(Number(rawLevel))
    ? Math.max(1, Math.min(5, Math.floor(Number(rawLevel))))
    : 1;
  const currentLevel = parsedLevel;

  const activeTierMeta = ROADMAP_TIERS.find((t) => t.level === currentLevel) ?? ROADMAP_TIERS[0];
  const activeBadgeConfig = TIER_CONFIG[currentLevel] ?? TIER_CONFIG[1];

  const levelName = levelProgress?.levelName ?? user?.levelProgress?.levelName ?? activeTierMeta.name;

  const rawTotalXP = levelProgress?.totalXP ?? user?.levelProgress?.totalXP;
  const totalXP = rawTotalXP !== undefined && rawTotalXP !== null && !isNaN(Number(rawTotalXP))
    ? Math.max(0, Math.floor(Number(rawTotalXP)))
    : 0;

  const rawMinXP = levelProgress?.currentLevelXPRequirement ?? user?.levelProgress?.currentLevelXPRequirement;
  const currentLevelMinXP = rawMinXP !== undefined && rawMinXP !== null && !isNaN(Number(rawMinXP))
    ? Math.max(0, Math.floor(Number(rawMinXP)))
    : activeTierMeta.minXP;

  const rawNextXP = levelProgress?.nextLevelXPRequirement ?? user?.levelProgress?.nextLevelXPRequirement;
  const nextLevelXP = rawNextXP !== undefined && rawNextXP !== null && !isNaN(Number(rawNextXP))
    ? Math.max(0, Math.floor(Number(rawNextXP)))
    : (activeTierMeta.maxXP === Infinity ? activeTierMeta.minXP : activeTierMeta.maxXP + 1);

  const rawRemainingXP = levelProgress?.remainingXP ?? user?.levelProgress?.remainingXP;
  const remainingXP = rawRemainingXP !== undefined && rawRemainingXP !== null && !isNaN(Number(rawRemainingXP))
    ? Math.max(0, Math.floor(Number(rawRemainingXP)))
    : Math.max(0, nextLevelXP - totalXP);

  // Progress percentage within tier
  let progressPct = 0;
  const rawProgressPct = levelProgress?.progressPercentage ?? user?.levelProgress?.progressPercentage;
  if (rawProgressPct !== undefined && rawProgressPct !== null && !isNaN(Number(rawProgressPct))) {
    progressPct = Math.min(100, Math.max(0, Math.round(Number(rawProgressPct))));
  } else if (currentLevel >= 5) {
    progressPct = 100;
  } else if (nextLevelXP > currentLevelMinXP) {
    const tierSpan = nextLevelXP - currentLevelMinXP;
    const gainedInTier = totalXP - currentLevelMinXP;
    progressPct = Math.min(100, Math.max(0, Math.round((gainedInTier / tierSpan) * 100)));
  }

  // Derive authentic user referral code without any hardcoded mock fallback
  const rawReferral = (profileData && ('referralCode' in profileData || (profileData.user && 'referralCode' in profileData.user)))
    ? (profileData.referralCode ?? profileData.user?.referralCode ?? null)
    : (user?.referralCode ?? user?.referrals?.referralCode ?? null);
  const referralCode = typeof rawReferral === 'string' && rawReferral.trim().length > 0 ? rawReferral.trim() : null;

  // Copy referral code for XP quest
  const handleCopyReferral = () => {
    if (!referralCode) {
      addToast('Referral code is currently unavailable for this account.', 'error');
      return;
    }
    const link = `${window.location.origin}/register?ref=${referralCode}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
      addToast('Referral link copied! Share to earn +200 XP per friend.', 'success');
    }
  };

  const scrollToRoadmap = () => {
    const el = document.getElementById('tiers-grid-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToMatrix = () => {
    const el = document.getElementById('perks-matrix-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={styles.pageWrap}>
      {/* 1. Top Breadcrumb & Quick Stats Bar */}
      <div className={styles.topNavRow}>
        <div className={styles.breadcrumb}>
          <Link to="/user-profile" className={styles.backLink}>
            <ArrowLeft size={15} />
            <span>Profile Overview</span>
          </Link>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>Level Progression & VIP Rewards Hub</span>
        </div>

        <div className={styles.quickStatsPills}>
          <div className={`${styles.statPill} ${styles.statPillGold}`}>
            <Crown size={14} />
            <span>Tier {currentLevel}: {levelName}</span>
          </div>
          <div className={`${styles.statPill} ${styles.statPillCyan}`}>
            <Zap size={14} />
            <span>{levelProgress.rewardMultiplier || activeTierMeta.multiplier} Boost</span>
          </div>
          <div className={styles.statPill}>
            <Sparkles size={14} style={{ color: 'var(--accent-purple)' }} />
            <span>{totalXP.toLocaleString()} Total XP</span>
          </div>
        </div>
      </div>

      {/* 2. Hero Section: VIP Player Status Showcase */}
      <div
        className={styles.heroCard}
        style={{
          '--tier-accent': activeBadgeConfig.accentColor,
          '--tier-glow': activeBadgeConfig.glowColor
        }}
      >
        <div className={styles.heroBackgroundMesh} />

        <div className={styles.heroContent}>
          {/* Left: Glorious Animated 3D Level Badge */}
          <div className={styles.heroBadgeWrap}>
            <div className={styles.heroBadgeFrame}>
              <LevelBadge
                tier={currentLevel}
                size="lg"
                animated={true}
                glow={true}
                showRibbon={true}
              />
            </div>
          </div>

          {/* Center: Identity, Tier Title & XP Progress Gauge */}
          <div className={styles.heroIdentity}>
            <div className={styles.tierPillRow}>
              <div className={styles.tierPill}>
                <Sparkles size={12} />
                <span>Level {currentLevel} • Active Tier</span>
              </div>
              <div className={styles.multiplierPill}>
                <Zap size={13} />
                <span>{levelProgress.rewardMultiplier || activeTierMeta.multiplier} Earning Multiplier</span>
              </div>
            </div>

            <h1 className={styles.heroRankTitle}>{levelName}</h1>
            <p className={styles.heroRankTagline}>
              {activeBadgeConfig.tagline} • {activeTierMeta.perksList[0]}
            </p>

            {/* Glowing XP Progress Tracker */}
            <div className={styles.heroProgressBlock}>
              <div className={styles.progressLabelRow}>
                <span>
                  Experience Points: <strong className={styles.currentXPValue}>{totalXP.toLocaleString()} XP</strong>
                </span>
                <span>
                  {currentLevel >= 5 ? (
                    <strong className={styles.targetXPValue}>Max Tier Reached</strong>
                  ) : (
                    <>
                      Next Rank Target: <strong className={styles.targetXPValue}>{nextLevelXP.toLocaleString()} XP</strong>
                    </>
                  )}
                </span>
              </div>

              <div className={styles.progressBarTrack} role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
                <div
                  className={styles.progressBarFill}
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <div className={styles.progressFooterRow}>
                <span className={styles.remainingText}>
                  {currentLevel >= 5 ? (
                    '🎉 Diamond Legend Status achieved! VIP perks and instant settlement are active.'
                  ) : (
                    <>
                      Remaining to Level {currentLevel + 1} ({ROADMAP_TIERS[currentLevel]?.name}):{' '}
                      <strong className={styles.remainingHighlight}>{remainingXP.toLocaleString()} XP</strong>
                    </>
                  )}
                </span>
                <span className={styles.pctBadge}>{progressPct}% Completed</span>
              </div>
            </div>
          </div>

          {/* Right: Quick Action Hub */}
          <div className={styles.heroActionsBox}>
            <h4 className={styles.heroActionTitle}>Level Actions</h4>
            <button
              type="button"
              className={styles.actionBtnPrimary}
              onClick={() => setShowCheckInModal(true)}
            >
              <Flame size={16} />
              <span>Claim Daily XP</span>
            </button>
            <button
              type="button"
              className={styles.actionBtnSecondary}
              onClick={() => setShowWatchAdsModal(true)}
            >
              <Tv size={16} />
              <span>Watch Video (+VEs)</span>
            </button>
            <button
              type="button"
              className={styles.actionBtnSecondary}
              onClick={scrollToMatrix}
            >
              <Award size={16} />
              <span>Compare All Tiers</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Interactive Progression Pathway Track */}
      <div className={styles.sectionBlock}>
        <div className={styles.sectionHeaderRow}>
          <div>
            <h2 className={styles.blockTitle}>
              <TrendingUp size={22} className={styles.titleIcon} />
              <span>Progression Pathway</span>
            </h2>
            <p className={styles.blockSubtitle}>
              Your journey from initiate to legend. Ascend tiers to unlock higher multipliers and instant payouts.
            </p>
          </div>
          <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
            Active: <strong>Tier {currentLevel} of 5</strong>
          </span>
        </div>

        <div className={styles.roadmapContainer}>
          {/* Background Connecting Progression Line */}
          <div className={styles.roadmapPathLineWrap}>
            <div
              className={styles.roadmapPathLineFill}
              style={{
                width: `${Math.min(100, Math.max(0, ((currentLevel - 1) / 4) * 100 + (progressPct / 4)))}%`
              }}
            />
          </div>

          {/* 5 Interconnected Progression Nodes */}
          <div className={styles.roadmapNodesRow}>
            {ROADMAP_TIERS.map((tier) => {
              const isUnlocked = currentLevel > tier.level;
              const isCurrent = currentLevel === tier.level;
              const isLocked = currentLevel < tier.level;
              const tierBadgeCfg = TIER_CONFIG[tier.level];

              return (
                <div
                  key={tier.level}
                  className={`${styles.roadmapNode} ${isCurrent ? styles.nodeActive : ''}`}
                  style={{
                    '--node-color': tierBadgeCfg.accentColor,
                    '--node-glow': tierBadgeCfg.glowColor
                  }}
                  onClick={() => setInspectTier(tier)}
                  title={`Click to inspect ${tier.name} perks`}
                  role="button"
                  tabIndex={0}
                >
                  <div className={styles.nodeBadgeWrap}>
                    <LevelBadge
                      tier={tier.level}
                      size="sm"
                      showRibbon={false}
                      locked={isLocked}
                      glow={isCurrent}
                      animated={isCurrent}
                    />

                    {isCurrent && (
                      <span className={styles.nodeActiveMarker}>Current</span>
                    )}
                    {isUnlocked && (
                      <span className={styles.nodeUnlockedCheck} title="Tier Unlocked">
                        <Check size={14} strokeWidth={3} />
                      </span>
                    )}
                    {isLocked && (
                      <span className={styles.nodeLockedPadlock} title="Tier Locked">
                        <Lock size={12} strokeWidth={2.5} />
                      </span>
                    )}
                  </div>

                  <h3 className={styles.nodeTitle}>{tier.name}</h3>
                  <p className={styles.nodeXPRequired}>
                    {tier.minXP.toLocaleString()} {tier.maxXP === Infinity ? '+ XP' : `– ${tier.maxXP.toLocaleString()} XP`}
                  </p>
                  <span className={styles.nodeMultiplierTag}>{tier.multiplier}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Comprehensive 5-Tier Cards Grid */}
      <div id="tiers-grid-section" className={styles.sectionBlock}>
        <div className={styles.sectionHeaderRow}>
          <div>
            <h2 className={styles.blockTitle}>
              <Award size={22} className={styles.titleIcon} />
              <span>Tier Rewards & Privileges</span>
            </h2>
            <p className={styles.blockSubtitle}>
              Detailed breakdown of earning bonuses, perks, and withdrawal speeds at every level tier.
            </p>
          </div>
        </div>

        <div className={styles.tiersGrid}>
          {ROADMAP_TIERS.map((tier) => {
            const isUnlocked = currentLevel > tier.level;
            const isCurrent = currentLevel === tier.level;
            const isLocked = currentLevel < tier.level;
            const tierBadgeCfg = TIER_CONFIG[tier.level];

            return (
              <div
                key={tier.level}
                className={`
                  ${styles.tierCard}
                  ${isCurrent ? styles.tierCardActive : ''}
                  ${isLocked ? styles.tierCardLocked : ''}
                `}
                style={{
                  '--card-accent': tierBadgeCfg.accentColor,
                  '--card-shadow': tierBadgeCfg.glowColor,
                  '--card-border-hover': tierBadgeCfg.accentColor
                }}
              >
                {/* Card Top: Badge & Tier Identity */}
                <div className={styles.tierCardTop}>
                  <div className={styles.tierCardBadgeArea}>
                    <LevelBadge
                      tier={tier.level}
                      size="sm"
                      showRibbon={false}
                      locked={isLocked}
                      glow={isCurrent}
                    />
                    <div className={styles.tierCardMeta}>
                      <span className={styles.tierLevelNumberBadge}>Level {tier.level} Tier</span>
                      <h3 className={styles.tierCardTitle}>{tier.name}</h3>
                      <p className={styles.tierCardTagline}>{tier.tagline}</p>
                    </div>
                  </div>

                  {/* Status Indicator Pill */}
                  {isCurrent && (
                    <span className={`${styles.statusIndicatorPill} ${styles.statusCurrent}`}>
                      <Sparkles size={12} />
                      <span>Current</span>
                    </span>
                  )}
                  {isUnlocked && (
                    <span className={`${styles.statusIndicatorPill} ${styles.statusCompleted}`}>
                      <CheckCircle2 size={12} />
                      <span>Unlocked</span>
                    </span>
                  )}
                  {isLocked && (
                    <span className={`${styles.statusIndicatorPill} ${styles.statusLocked}`}>
                      <Lock size={12} />
                      <span>Locked</span>
                    </span>
                  )}
                </div>

                {/* Multiplier Callout Banner */}
                <div className={styles.multiplierBanner}>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800 }}>
                      Multiplier Boost
                    </span>
                    <span className={styles.multiplierValueBig}>{tier.multiplier}</span>
                  </div>
                  <span className={styles.multiplierDescText}>
                    Earn {tier.adPayout} on sponsored ad watches
                  </span>
                </div>

                {/* Perks Checklist */}
                <ul className={styles.tierPerksList}>
                  {tier.perksList.map((perk, idx) => (
                    <li key={idx} className={styles.tierPerkItem}>
                      <CheckCircle2 size={15} className={styles.tierPerkIcon} />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>

                {/* Card Footer: XP Range & Inspect Trigger */}
                <div className={styles.tierCardFooter}>
                  <span className={styles.xpRangeText}>
                    XP: {tier.minXP.toLocaleString()} {tier.maxXP === Infinity ? '+' : `– ${tier.maxXP.toLocaleString()}`}
                  </span>
                  <button
                    type="button"
                    className={styles.inspectTierBtn}
                    onClick={() => setInspectTier(tier)}
                  >
                    <span>View Details</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Side-by-Side Tier Perks Comparison Matrix */}
      <div id="perks-matrix-section" className={styles.sectionBlock}>
        <div className={styles.sectionHeaderRow}>
          <div>
            <h2 className={styles.blockTitle}>
              <ShieldCheck size={22} className={styles.titleIcon} />
              <span>Full Tier Comparison Matrix</span>
            </h2>
            <p className={styles.blockSubtitle}>
              Compare all 5 progression ranks side-by-side to plan your advancement strategy.
            </p>
          </div>
        </div>

        <div className={styles.matrixTableCard}>
          <div className={styles.matrixTableWrap}>
            <table className={styles.matrixTable}>
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>Platform Privilege</th>
                  {ROADMAP_TIERS.map((tier) => (
                    <th
                      key={tier.level}
                      className={currentLevel === tier.level ? styles.activeColumnTh : ''}
                      style={{ textAlign: 'center' }}
                    >
                      <div className={styles.badgeHeaderCell}>
                        <LevelBadge tier={tier.level} size="xs" showRibbon={false} />
                        <span>{tier.name}</span>
                        {currentLevel === tier.level && (
                          <span style={{ fontSize: '0.65rem', background: 'var(--accent-gold)', color: '#12141F', padding: '1px 6px', borderRadius: '4px', fontWeight: 900 }}>
                            YOU
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={styles.featureTitleCell}>
                    <Coins size={16} style={{ color: 'var(--accent-gold)' }} />
                    <span>XP Range Requirement</span>
                  </td>
                  {ROADMAP_TIERS.map((t) => (
                    <td key={t.level} className={currentLevel === t.level ? styles.activeColumnTd : ''} style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                      {t.minXP.toLocaleString()} {t.maxXP === Infinity ? '+' : `– ${t.maxXP.toLocaleString()}`}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className={styles.featureTitleCell}>
                    <Zap size={16} style={{ color: 'var(--accent-gold)' }} />
                    <span>Earning Multiplier</span>
                  </td>
                  {ROADMAP_TIERS.map((t) => (
                    <td key={t.level} className={currentLevel === t.level ? styles.activeColumnTd : ''} style={{ textAlign: 'center', fontWeight: 800 }}>
                      <span style={{ color: TIER_CONFIG[t.level].accentColor }}>{t.multiplier}</span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className={styles.featureTitleCell}>
                    <Tv size={16} style={{ color: '#F87171' }} />
                    <span>Sponsored Ad Payout</span>
                  </td>
                  {ROADMAP_TIERS.map((t) => (
                    <td key={t.level} className={currentLevel === t.level ? styles.activeColumnTd : ''} style={{ textAlign: 'center' }}>
                      {t.adPayout}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className={styles.featureTitleCell}>
                    <Flame size={16} style={{ color: '#F97316' }} />
                    <span>Daily Check-In Streak Bonus</span>
                  </td>
                  {ROADMAP_TIERS.map((t) => (
                    <td key={t.level} className={currentLevel === t.level ? styles.activeColumnTd : ''} style={{ textAlign: 'center' }}>
                      {t.checkInBonus}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className={styles.featureTitleCell}>
                    <Clock size={16} style={{ color: 'var(--accent-blue)' }} />
                    <span>Withdrawal Processing Speed</span>
                    <span className={styles.plannedPerkTag}>Planned Perk</span>
                  </td>
                  {ROADMAP_TIERS.map((t) => (
                    <td key={t.level} className={currentLevel === t.level ? styles.activeColumnTd : ''} style={{ textAlign: 'center' }}>
                      {t.withdrawalSpeed}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className={styles.featureTitleCell}>
                    <Gem size={16} style={{ color: 'var(--accent-purple)' }} />
                    <span>Monthly Mystery Gem Crate</span>
                    <span className={styles.plannedPerkTag}>Coming Soon</span>
                  </td>
                  {ROADMAP_TIERS.map((t) => (
                    <td key={t.level} className={currentLevel === t.level ? styles.activeColumnTd : ''} style={{ textAlign: 'center' }}>
                      {t.gemCrate}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className={styles.featureTitleCell}>
                    <Shield size={16} style={{ color: '#34D399' }} />
                    <span>Internal Token Swap Fee</span>
                    <span className={styles.plannedPerkTag}>Planned Perk</span>
                  </td>
                  {ROADMAP_TIERS.map((t) => (
                    <td key={t.level} className={currentLevel === t.level ? styles.activeColumnTd : ''} style={{ textAlign: 'center' }}>
                      {t.swapFee}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className={styles.featureTitleCell}>
                    <Crown size={16} style={{ color: '#F4C76A' }} />
                    <span>Exclusive VIP Privileges</span>
                    <span className={styles.plannedPerkTag}>Planned Perk</span>
                  </td>
                  {ROADMAP_TIERS.map((t) => (
                    <td key={t.level} className={currentLevel === t.level ? styles.activeColumnTd : ''} style={{ textAlign: 'center', fontSize: '0.8rem' }}>
                      {t.vipPrivilege}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 6. "How to Level Up Faster" Quest Hub */}
      <div className={styles.sectionBlock}>
        <div className={styles.sectionHeaderRow}>
          <div>
            <h2 className={styles.blockTitle}>
              <Sparkles size={22} className={styles.titleIcon} />
              <span>How to Earn XP & Level Up Faster</span>
            </h2>
            <p className={styles.blockSubtitle}>
              Complete active quests and daily milestones to accelerate your progression to Diamond Legend.
            </p>
          </div>
        </div>

        <div className={styles.questGrid}>
          {/* Quest 1: Daily Check-In */}
          <div className={styles.questCard}>
            <div className={styles.questCardHeader}>
              <div className={styles.questIconBox} style={{ color: '#F97316', borderColor: 'rgba(249, 115, 22, 0.4)', background: 'rgba(249, 115, 22, 0.12)' }}>
                <Flame size={22} />
              </div>
              <div className={styles.questInfo}>
                <h3 className={styles.questTitle}>Daily Check-In</h3>
                <span className={styles.questXPReward}>+50 to +250 XP Daily</span>
              </div>
            </div>
            <p className={styles.questDesc}>
              Maintain continuous consecutive daily check-ins to build streak multipliers and gain bonus XP.
            </p>
            <button
              type="button"
              className={styles.questActionBtn}
              onClick={() => setShowCheckInModal(true)}
            >
              <span>Check In Today</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Quest 2: Sponsored Ads */}
          <div className={styles.questCard}>
            <div className={styles.questCardHeader}>
              <div className={styles.questIconBox} style={{ color: '#F87171', borderColor: 'rgba(248, 113, 113, 0.4)', background: 'rgba(248, 113, 113, 0.12)' }}>
                <Tv size={22} />
              </div>
              <div className={styles.questInfo}>
                <h3 className={styles.questTitle}>Watch Video Ads</h3>
                <span className={styles.questXPReward}>+15 to +22.5 VEs / View</span>
              </div>
            </div>
            <p className={styles.questDesc}>
              Stream partner sponsored videos with server-side HMAC validation. Earn 15.00 to 22.50 VEs scaled by your tier multiplier. Note: Video rewards are credited as VEs to your wallet balance.
            </p>
            <button
              type="button"
              className={styles.questActionBtn}
              onClick={() => setShowWatchAdsModal(true)}
            >
              <span>Watch Video</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Quest 3: Friend Referrals */}
          <div className={styles.questCard}>
            <div className={styles.questCardHeader}>
              <div className={styles.questIconBox} style={{ color: '#A78BFA', borderColor: 'rgba(167, 139, 250, 0.4)', background: 'rgba(167, 139, 250, 0.12)' }}>
                <Share2 size={22} />
              </div>
              <div className={styles.questInfo}>
                <h3 className={styles.questTitle}>Invite Friends</h3>
                <span className={styles.questXPReward}>+200 XP / Friend</span>
              </div>
            </div>
            <p className={styles.questDesc}>
              {referralCode ? (
                <>
                  Share your referral link ({referralCode}). When your invited friend registers, both of you instantly gain bonus XP.
                </>
              ) : (
                <>
                  Referral code is currently unavailable. Complete profile verification or contact support to generate a personal link.
                </>
              )}
            </p>
            {referralCode ? (
              <button
                type="button"
                className={styles.questActionBtn}
                onClick={handleCopyReferral}
              >
                <span>Copy Referral Link</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                className={`${styles.questActionBtn} ${styles.questActionBtnDisabled}`}
                onClick={handleCopyReferral}
                disabled
                aria-disabled="true"
              >
                <span>Referral Code Unavailable</span>
              </button>
            )}
          </div>

          {/* Quest 4: Platform Achievements */}
          <div className={styles.questCard}>
            <div className={styles.questCardHeader}>
              <div className={styles.questIconBox} style={{ color: 'var(--accent-gold)', borderColor: 'rgba(244, 199, 106, 0.4)', background: 'rgba(244, 199, 106, 0.12)' }}>
                <Award size={22} />
              </div>
              <div className={styles.questInfo}>
                <h3 className={styles.questTitle}>Unlock Badges</h3>
                <span className={styles.questXPReward}>Up to +3,000 XP</span>
              </div>
            </div>
            <p className={styles.questDesc}>
              Complete platform milestones like Whale Tier, Ambassador, and Centurion for massive one-time XP leaps.
            </p>
            <Link to="/user-profile#section-levels" className={styles.questActionBtn}>
              <span>View Badges</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* 7. Tier Details Inspection Modal */}
      {inspectTier && (
        <Modal
          isOpen={!!inspectTier}
          onClose={() => setInspectTier(null)}
          title={`Level ${inspectTier.level} — ${inspectTier.name}`}
          subtitle={inspectTier.tagline}
          maxWidth="560px"
          footer={
            <Button variant="gold" onClick={() => setInspectTier(null)}>
              Close Inspection
            </Button>
          }
        >
          <div className={styles.modalBadgeShowcase}>
            <LevelBadge
              tier={inspectTier.level}
              size="lg"
              animated={true}
              glow={true}
              showRibbon={true}
            />
            <h3 className={styles.modalTierName}>{inspectTier.name}</h3>
            <div className={styles.modalMultiplierHighlight}>
              <Zap size={15} />
              <span>{inspectTier.multiplier} Permanent Earning Multiplier</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
              XP Requirement: <strong>{inspectTier.minXP.toLocaleString()} {inspectTier.maxXP === Infinity ? '+ XP' : `– ${inspectTier.maxXP.toLocaleString()} XP`}</strong>
            </p>

            <div className={styles.modalPerksList}>
              <h4 style={{ fontSize: '0.86rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.6px', margin: '0 0 6px 0', textAlign: 'left' }}>
                Exclusive Rank Privileges
              </h4>
              {inspectTier.perksList.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'left' }}>
                  <CheckCircle2 size={16} style={{ color: TIER_CONFIG[inspectTier.level].accentColor, flexShrink: 0, marginTop: '2px' }} />
                  <span>{p}</span>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* Daily Check-In Modal */}
      <DailyCheckInModal
        isOpen={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
        onClaimSuccess={() => fetchLevelData()}
      />

      {/* Watch Ads Modal */}
      <WatchAdsModal
        isOpen={showWatchAdsModal}
        onClose={() => setShowWatchAdsModal(false)}
        onRewardClaimed={() => fetchLevelData()}
      />
    </div>
  );
};

export default LevelsPage;
