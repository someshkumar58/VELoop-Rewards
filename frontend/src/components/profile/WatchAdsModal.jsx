import React, { useState, useEffect, useRef } from 'react';
import {
  Tv,
  Play,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  RotateCw,
  Coins,
  TrendingUp
} from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import ProgressBar from '../common/ProgressBar';
import Skeleton from '../common/Skeleton';
import { useToast } from '../../context/ToastContext';
import { adService } from '../../services/adService';
import styles from './WatchAdsModal.module.css';

const DEFAULT_WATCH_DURATION = 15;

const WatchAdsModal = ({
  isOpen = false,
  onClose,
  onRewardClaimed
}) => {
  const { addToast } = useToast();

  // Lifecycle Phases: 'READY' | 'WATCHING' | 'CLAIMING' | 'SUCCESS' | 'ERROR'
  const [phase, setPhase] = useState('READY');
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [status, setStatus] = useState(null);
  const [adSession, setAdSession] = useState(null);
  const [countdown, setCountdown] = useState(DEFAULT_WATCH_DURATION);
  const [claimResult, setClaimResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [localCooldown, setLocalCooldown] = useState(0);

  const countdownIntervalRef = useRef(null);
  const cooldownIntervalRef = useRef(null);

  // Load latest ad quota & cooldown status when modal opens
  const fetchStatus = async () => {
    setLoadingStatus(true);
    setErrorMessage(null);
    try {
      const res = await adService.getAdStatus();
      const data = res.data;
      setStatus(data);
      setLocalCooldown(data.cooldownRemaining || 0);

      if (data.cooldownRemaining > 0) {
        setPhase('READY'); // Let the UI display active cooldown
      } else if (data.remainingToday === 0) {
        setPhase('READY'); // Let UI display daily limit reached
      } else {
        setPhase('READY');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Unable to load ad status. Please try again.');
      setPhase('ERROR');
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setPhase('READY');
      setAdSession(null);
      setClaimResult(null);
      setCountdown(DEFAULT_WATCH_DURATION);
      fetchStatus();
    } else {
      // Clear timers on modal close
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    }

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    };
  }, [isOpen]);

  // Tick down active cooldown timer locally
  useEffect(() => {
    if (localCooldown > 0) {
      cooldownIntervalRef.current = setInterval(() => {
        setLocalCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(cooldownIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    }

    return () => {
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    };
  }, [localCooldown]);

  // Handle starting a new sponsored ad session
  const handleStartWatch = async () => {
    setErrorMessage(null);
    setPhase('WATCHING');
    setCountdown(DEFAULT_WATCH_DURATION);

    try {
      const res = await adService.startAdSession();
      const session = res.data;
      setAdSession(session);
      const duration = session.durationSeconds || DEFAULT_WATCH_DURATION;
      setCountdown(duration);

      // Start countdown timer
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

      let currentSec = duration;
      countdownIntervalRef.current = setInterval(() => {
        currentSec -= 1;
        setCountdown(currentSec);

        if (currentSec <= 0) {
          clearInterval(countdownIntervalRef.current);
          handleAutoClaim(session.impressionToken);
        }
      }, 1000);
    } catch (err) {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      const msg = err.response?.data?.message || err.message || 'Failed to start ad session.';
      setErrorMessage(msg);
      setPhase('ERROR');
      addToast(msg, 'error');
    }
  };

  // Automatically claim reward once server-enforced countdown finishes
  const handleAutoClaim = async (token) => {
    setPhase('CLAIMING');
    setErrorMessage(null);

    try {
      const res = await adService.claimAdReward(token);
      const data = res.data;
      setClaimResult(data);
      setPhase('SUCCESS');

      addToast(data.message || `Reward claimed! +${data.earnedReward} VEs added.`, 'success');

      // Refresh ad status and update local cooldown to 60s
      setLocalCooldown(60);

      // Notify parent component to refresh live wallet balances without full page reload
      if (onRewardClaimed) {
        await onRewardClaimed(data);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Reward claim was rejected by backend.';
      setErrorMessage(msg);
      setPhase('ERROR');
      addToast(msg, 'error');
    }
  };

  // User resets to watch another ad
  const handleWatchAnother = async () => {
    setPhase('READY');
    setAdSession(null);
    setClaimResult(null);
    setCountdown(DEFAULT_WATCH_DURATION);
    await fetchStatus();
  };

  const handleSafeClose = () => {
    if (phase === 'WATCHING' && countdown > 0) {
      const confirmLeave = window.confirm(
        'Ad is currently playing! If you leave now, you will not receive your VEs reward. Leave anyway?'
      );
      if (!confirmLeave) return;
    }
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    onClose();
  };

  // Multiplier and reward data
  const baseReward = status?.baseReward || 15;
  const multiplier = status?.levelMultiplier || 1.0;
  const potentialReward = status?.potentialReward || (baseReward * multiplier).toFixed(2);
  const remainingToday = status?.remainingToday ?? 20;
  const isDailyLimitReached = remainingToday <= 0;
  const isCooldownActive = localCooldown > 0;
  const canStartWatch = !loadingStatus && !isCooldownActive && !isDailyLimitReached && phase === 'READY';

  const progressPercent = Math.min(
    100,
    Math.round(((DEFAULT_WATCH_DURATION - Math.max(0, countdown)) / DEFAULT_WATCH_DURATION) * 100)
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleSafeClose}
      title="Watch Sponsored Ads"
      subtitle="Earn VEs directly credited to your wallet with your tier multiplier"
      maxWidth="540px"
      footer={
        <>
          {phase === 'SUCCESS' ? (
            <>
              <Button variant="ghost" onClick={handleSafeClose}>
                Close
              </Button>
              <Button
                variant="gold"
                icon={Play}
                onClick={handleWatchAnother}
                disabled={isCooldownActive || isDailyLimitReached}
              >
                {isCooldownActive
                  ? `Cooldown (${localCooldown}s)`
                  : isDailyLimitReached
                  ? 'Daily Limit Reached'
                  : 'Watch Another Ad'}
              </Button>
            </>
          ) : phase === 'WATCHING' || phase === 'CLAIMING' ? (
            <Button variant="ghost" onClick={handleSafeClose} disabled={phase === 'CLAIMING'}>
              Cancel Ad
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={handleSafeClose}>
                Cancel
              </Button>
              <Button
                variant="gold"
                icon={Play}
                onClick={handleStartWatch}
                disabled={!canStartWatch}
                loading={loadingStatus}
              >
                {isCooldownActive
                  ? `Cooldown Active (${localCooldown}s)`
                  : isDailyLimitReached
                  ? 'Daily Limit Reached (20/20)'
                  : `Watch Sponsored Ad (+${potentialReward} VEs)`}
              </Button>
            </>
          )}
        </>
      }
    >
      <div className={styles.modalBody}>
        {/* Anti-fraud / Security Notice */}
        <div className={styles.bannerNotice}>
          <ShieldCheck size={16} style={{ flexShrink: 0 }} />
          <span>
            Server-verified impression: 15-second minimum watch duration and 60-second cooldown enforced to protect reward integrity.
          </span>
        </div>

        {loadingStatus && !status ? (
          <div className={styles.loadingCenter}>
            <RotateCw size={24} className="spin" />
            <span>Connecting to ad server...</span>
          </div>
        ) : phase === 'WATCHING' || phase === 'CLAIMING' ? (
          /* Simulated Video Screen View */
          <div className={styles.videoScreen}>
            <div className={styles.videoBadge}>
              <span className={styles.liveDot} />
              <span>SPONSORED STREAM</span>
            </div>

            <div className={styles.pulseIconWrap}>
              <Tv size={42} />
            </div>

            <h3 className={styles.videoTitle}>VELoop Partner Spotlight</h3>
            <p className={styles.videoSubtitle}>
              Simulating sponsored video view. Please keep this window open until the countdown finishes to unlock your reward.
            </p>

            <div className={styles.countdownPill}>
              <Clock size={16} />
              <span>
                {phase === 'CLAIMING'
                  ? 'Verifying & Claiming...'
                  : `Reward unlocks in: ${countdown}s`}
              </span>
            </div>

            <div className={styles.progressContainer}>
              <ProgressBar
                percentage={progressPercent}
                color="gold"
                height={8}
              />
            </div>

            <div className={styles.lockNotice}>
              <Lock size={12} />
              <span>Non-skippable stream • Reward unlocks automatically at 0s</span>
            </div>
          </div>
        ) : phase === 'SUCCESS' && claimResult ? (
          /* Reward Claimed Celebration Screen */
          <div className={styles.successScreen}>
            <div className={styles.celebrationIcon}>
              <Sparkles size={32} />
            </div>

            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
              Reward Unlocked!
            </h3>

            <p className={styles.earnedAmount}>
              +{claimResult.earnedReward} VEs
            </p>

            <p className={styles.successDesc}>
              {claimResult.message || 'Your wallet balance has been updated.'}
            </p>

            {(claimResult.newBalance !== undefined || claimResult.wallet?.ves !== undefined) && (
              <div className={styles.balanceNotice}>
                <Coins size={14} style={{ color: 'var(--accent-gold)' }} />
                <span>
                  Updated Balance: <strong>{Number(claimResult.newBalance ?? claimResult.wallet?.ves).toFixed(2)} VEs</strong>
                </span>
              </div>
            )}
          </div>
        ) : (
          /* Default Ready & Overview Screen */
          <>
            {/* Cooldown or Error Banner */}
            {isCooldownActive && (
              <div className={styles.alertCard}>
                <Clock size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h4 className={styles.alertCardTitle}>Cooldown Active</h4>
                  <p className={styles.alertCardDesc}>
                    Please wait <strong>{localCooldown} seconds</strong> before watching your next ad session.
                  </p>
                </div>
              </div>
            )}

            {isDailyLimitReached && (
              <div className={styles.alertCard}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h4 className={styles.alertCardTitle}>Daily Cap Reached</h4>
                  <p className={styles.alertCardDesc}>
                    You have completed all 20 rewarded ads for today (UTC calendar day). Quota resets at 00:00 UTC.
                  </p>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className={styles.alertCard}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h4 className={styles.alertCardTitle}>Session Notice</h4>
                  <p className={styles.alertCardDesc}>{errorMessage}</p>
                </div>
              </div>
            )}

            {/* 3 Metric Cards */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Daily Quota</span>
                <span className={styles.statValue}>
                  {status ? `${status.dailyCompleted} / ${status.dailyLimit}` : '0 / 20'}
                </span>
              </div>

              <div className={styles.statCard}>
                <span className={styles.statLabel}>Watch Duration</span>
                <span className={styles.statValueNormal}>15s</span>
              </div>

              <div className={styles.statCard}>
                <span className={styles.statLabel}>Remaining Today</span>
                <span className={styles.statValue}>
                  {remainingToday}
                </span>
              </div>
            </div>

            {/* Tier Multiplier Reward Card */}
            <div className={styles.rewardHighlightBox}>
              <div className={styles.rewardLeft}>
                <div className={styles.iconCircle}>
                  <Coins size={22} />
                </div>
                <div>
                  <h4 className={styles.rewardHeading}>
                    Earn +{potentialReward} VEs per view
                  </h4>
                  <p className={styles.rewardSub}>
                    Base: {baseReward} VEs • {status?.levelName || 'Current Tier'} ({multiplier.toFixed(2)}x)
                  </p>
                </div>
              </div>

              <span className={styles.multiplierPill}>
                {multiplier.toFixed(2)}x Multiplier
              </span>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default WatchAdsModal;

