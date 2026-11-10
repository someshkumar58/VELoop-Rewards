import React, { useState, useEffect } from 'react';
import { Flame, CheckCircle2, Clock, Gift, Trophy, AlertCircle, Sparkles } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useToast } from '../../context/ToastContext';
import { profileService } from '../../services/profileService';
import styles from './DailyCheckInModal.module.css';

const DailyCheckInModal = ({
  isOpen = false,
  onClose,
  onClaimSuccess
}) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [claimResult, setClaimResult] = useState(null);

  // Fetch check-in and streak status whenever modal opens
  useEffect(() => {
    let isMounted = true;
    if (isOpen) {
      setLoading(true);
      setError(null);
      setClaimResult(null);

      profileService
        .getCheckInStatus()
        .then((res) => {
          if (isMounted) {
            setStatus(res.data);
          }
        })
        .catch((err) => {
          if (isMounted) {
            setError(err.message || 'Unable to load daily check-in status.');
          }
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const handleClaim = async () => {
    setClaiming(true);
    setError(null);

    try {
      const res = await profileService.performCheckIn();
      const data = res.data;

      if (!data.success && data.alreadyCheckedIn) {
        setError(data.message || 'You have already checked in today.');
        if (status) {
          setStatus((prev) => ({
            ...prev,
            hasCheckedInToday: true,
            canCheckInToday: false
          }));
        }
        return;
      }

      setClaimResult(data);
      addToast(data.message || 'Daily check-in claimed! +25 VEs & +25 XP awarded.', 'success');

      // Update local modal state immediately
      const updatedStreak = data.checkIn?.streakCount || (status?.currentStreak || 0) + 1;
      setStatus((prev) => ({
        ...prev,
        currentStreak: updatedStreak,
        hasCheckedInToday: true,
        canCheckInToday: false,
        lastCheckInDate: data.checkIn?.checkInDate,
        streakAchievementUnlocked: prev?.streakAchievementUnlocked || Boolean(data.streakAchievementUnlocked)
      }));

      // Notify parent to refresh real wallet balances and profile state
      if (onClaimSuccess) {
        await onClaimSuccess(data);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to claim daily check-in.';
      setError(errMsg);
      addToast(errMsg, 'error');
    } finally {
      setClaiming(false);
    }
  };

  const currentStreak = status?.currentStreak || 0;
  const hasCheckedInToday = Boolean(status?.hasCheckedInToday);
  const canClaim = !hasCheckedInToday && !loading && !claiming;

  // Day 1 to 7 indicator array
  const days = [1, 2, 3, 4, 5, 6, 7];
  const activeStreakDisplay = hasCheckedInToday ? currentStreak : currentStreak + 1;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Daily Check-in & Streak"
      subtitle="Check in daily to build your streak and unlock exclusive rewards."
      maxWidth="540px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', width: '100%' }}>
          <Button variant="ghost" onClick={onClose} disabled={claiming}>
            Close
          </Button>
          <Button
            variant="gold"
            onClick={handleClaim}
            disabled={!canClaim}
            loading={claiming}
          >
            {hasCheckedInToday ? (
              <>
                <CheckCircle2 size={16} /> Checked In Today
              </>
            ) : (
              <>
                <Gift size={16} /> Claim Daily Bonus (+25 VEs, +25 XP)
              </>
            )}
          </Button>
        </div>
      }
    >
      <div className={styles.container}>
        {/* Streak Hero Card */}
        <div className={styles.heroCard}>
          <div className={styles.heroLeft}>
            <div className={styles.flameBadge}>
              <Flame size={28} />
            </div>
            <div>
              <div className={styles.streakCount}>
                {loading ? '...' : `${currentStreak} Day${currentStreak === 1 ? '' : 's'}`}
              </div>
              <div className={styles.streakLabel}>Current Check-in Streak</div>
            </div>
          </div>
          <div className={styles.rewardHighlight}>
            <div className={styles.rewardValue}>+25 VEs & +25 XP</div>
            <div className={styles.rewardSub}>Standard Daily Reward</div>
          </div>
        </div>

        {/* Milestone Achievement Notification if unlocked on Day 7 */}
        {claimResult?.streakAchievementUnlocked && (
          <div className={styles.achievementUnlockNotice}>
            <Trophy size={24} style={{ color: 'var(--accent-gold)' }} />
            <div className={styles.noticeText}>
              <div className={styles.noticeTitle}>Achievement Unlocked: Streak Master!</div>
              <div>Congratulations! You maintained a 7-day streak and earned an extra <strong>+350 XP</strong> bonus!</div>
            </div>
          </div>
        )}

        {/* Status / Feedback Banners */}
        {error && (
          <div className={`${styles.statusBanner} ${styles.statusError}`}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {hasCheckedInToday && !error && (
          <div className={`${styles.statusBanner} ${styles.statusClaimed}`}>
            <Clock size={18} />
            <span>You have already checked in for today! Next check-in opens tomorrow at 00:00 UTC.</span>
          </div>
        )}

        {/* 7-Day Progression Track */}
        <div>
          <div className={styles.milestoneHeader} style={{ marginBottom: '10px' }}>
            <span><strong>7-Day Milestone Progress</strong></span>
            <span>Day 7 Bonus: +350 XP Milestone</span>
          </div>
          <div className={styles.daysGrid}>
            {days.map((dayNum) => {
              // Day is completed if:
              // - hasCheckedInToday and dayNum <= currentStreak
              // - or !hasCheckedInToday and dayNum <= currentStreak
              const isCompleted = hasCheckedInToday
                ? dayNum <= (currentStreak % 7 === 0 && currentStreak > 0 ? 7 : currentStreak % 7)
                : dayNum < (currentStreak % 7 === 0 && currentStreak > 0 ? 7 : (currentStreak % 7) + 1);

              const isCurrent = !hasCheckedInToday && dayNum === ((currentStreak % 7) + 1);
              const isMilestone = dayNum === 7;

              return (
                <div
                  key={dayNum}
                  className={`
                    ${styles.dayCard}
                    ${isCompleted ? styles.dayCardCompleted : ''}
                    ${isCurrent ? styles.dayCardCurrent : ''}
                    ${isMilestone ? styles.dayCardMilestone : ''}
                  `}
                >
                  <span className={styles.dayTitle}>Day {dayNum}</span>
                  <div className={styles.dayIcon}>
                    {isCompleted ? (
                      <CheckCircle2 size={16} color="#34D399" />
                    ) : isMilestone ? (
                      <Trophy size={16} color="#F4C76A" />
                    ) : isCurrent ? (
                      <Sparkles size={16} color="var(--accent-gold)" />
                    ) : (
                      <Gift size={16} color="var(--text-secondary)" />
                    )}
                  </div>
                  <span className={styles.dayReward}>
                    {isMilestone ? '+350 XP' : '+25 VEs'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DailyCheckInModal;
