import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { profileService } from '../../services/profileService';

import ProfileHero from '../../components/profile/ProfileHero';
import RewardAssets from '../../components/profile/RewardAssets';
import LevelAchievements from '../../components/profile/LevelAchievements';
import WithdrawalOverview from '../../components/profile/WithdrawalOverview';
import QuickActions from '../../components/profile/QuickActions';
import ReferralSnapshot from '../../components/profile/ReferralSnapshot';
import RecentActivity from '../../components/profile/RecentActivity';
import AccountSecurity from '../../components/profile/AccountSecurity';

import ProfileEditModal from '../../components/profile/ProfileEditModal';
import WithdrawalRequestModal from '../../components/profile/WithdrawalRequestModal';
import DailyCheckInModal from '../../components/profile/DailyCheckInModal';
import WatchAdsModal from '../../components/profile/WatchAdsModal';
import ErrorState from '../../components/common/ErrorState';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';

const UserProfilePage = () => {
  const { user, isDevPreview, updateUserProfile, logoutUser } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Module state
  const [profileData, setProfileData] = useState(user || null);
  const [rewards, setRewards] = useState(user?.rewards || {});
  const [levelProgress, setLevelProgress] = useState(user?.levelProgress || {});
  const [achievements, setAchievements] = useState(user?.achievements || []);
  const [withdrawals, setWithdrawals] = useState(user?.withdrawals || {});
  const [referrals, setReferrals] = useState(user?.referrals || {});
  const [activities, setActivities] = useState(user?.recentActivities || []);

  // Modal controls
  const [showEditModal, setShowEditModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showWatchAdsModal, setShowWatchAdsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Load all 8 module sections from profileService
  const loadProfileData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        pRes,
        rRes,
        lRes,
        aRes,
        wRes,
        refRes,
        actRes
      ] = await Promise.all([
        profileService.getProfile(),
        profileService.getRewardAssets(),
        profileService.getLevelProgress(),
        profileService.getAchievements(),
        profileService.getWithdrawalSummary(),
        profileService.getReferrals(),
        profileService.getRecentActivity(),
      ]);

      setProfileData(pRes.data);
      setRewards(rRes.data);
      setLevelProgress(lRes.data);
      setAchievements(aRes.data);
      setWithdrawals(wRes.data);
      setReferrals(refRes.data);
      setActivities(actRes.data);
    } catch (err) {
      console.error('[UserProfilePage] Failed to fetch data:', err);
      setError(err.message || 'Unable to communicate with the profile service. Please verify backend status.');
      setProfileData(null);
    } finally {
      setLoading(false);
    }
  }, [isDevPreview]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const handleProfileUpdated = (updates) => {
    setProfileData((prev) => ({ ...prev, ...updates }));
    updateUserProfile(updates);
    loadProfileData();
  };

  const handleWithdrawalSubmitted = async (newRequest) => {
    try {
      const res = await profileService.createWithdrawal({
        amount: newRequest.amount,
        payoutMethod: newRequest.method || newRequest.payoutMethod,
        destination: newRequest.destination
      });

      addToast(
        res.message || `Withdrawal request for ${newRequest.amount} Tokens submitted for administrative review!`,
        'success'
      );

      // Re-fetch live profile, wallet holdings (updated tokens balance), and withdrawal summary
      await loadProfileData();

      // Add to activity stream
      const newAct = {
        id: `act_${Date.now()}`,
        type: 'WITHDRAWAL',
        title: `Payout Request (${(newRequest.method || newRequest.payoutMethod || 'Tokens').replace('_', ' ')})`,
        amount: `-${Number(newRequest.amount).toFixed(2)} Tokens`,
        assetType: 'tokens',
        timestamp: 'Just now',
        status: 'Pending',
      };
      setActivities((prev) => [newAct, ...(prev || [])]);
    } catch (err) {
      addToast(err.message || 'Failed to submit withdrawal request.', 'error');
      throw err;
    }
  };

  const handleCheckInSuccess = async (result) => {
    // Refresh live profile, reward balances, level progress, and achievements from backend
    await loadProfileData();

    // Append check-in bonus to live activity stream
    if (result?.checkIn) {
      const newAct = {
        id: `act_${Date.now()}`,
        type: 'DAILY_BONUS',
        title: `Daily Streak Bonus (Day ${result.checkIn.streakCount})`,
        amount: `+${result.checkIn.rewardVEs || 25} VEs`,
        assetType: 'ves',
        timestamp: 'Just now',
        status: 'Completed',
        icon: 'Gift'
      };
      setActivities((prev) => [newAct, ...(prev || [])]);
    }
  };

  const handleAdRewardClaimed = async (claimData) => {
    // Refresh live profile, reward balances, level progress, and achievements from backend
    await loadProfileData();

    // Append ad reward to live activity stream
    if (claimData) {
      const newAct = {
        id: `act_${Date.now()}`,
        type: 'AD_REWARD',
        title: 'Sponsored Partner Ad View',
        amount: `+${claimData.earnedReward || 15} VEs`,
        assetType: 'ves',
        timestamp: 'Just now',
        status: 'Completed',
        icon: 'PlaySquare'
      };
      setActivities((prev) => [newAct, ...(prev || [])]);
    }
  };

  if (error && !profileData) {
    return (
      <div style={{ padding: '40px 0' }}>
        <ErrorState
          title="Profile Service Unavailable"
          message={error}
          onRetry={loadProfileData}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* 1. Profile Hero & Personal Information */}
      <ProfileHero
        user={profileData}
        loading={loading}
        onOpenEdit={() => setShowEditModal(true)}
      />

      {/* 2. Reward Assets (5 Separate Cards) */}
      <RewardAssets
        rewards={rewards}
        loading={loading}
      />

      {/* 3. Level Progress and Achievements */}
      <LevelAchievements
        levelProgress={levelProgress}
        achievements={achievements}
        loading={loading}
      />

      {/* 4. Withdrawal Overview */}
      <WithdrawalOverview
        withdrawals={withdrawals}
        loading={loading}
        onRequestWithdrawal={() => setShowWithdrawModal(true)}
      />

      {/* 5. Quick Actions */}
      <QuickActions
        onRequestWithdrawal={() => setShowWithdrawModal(true)}
        onOpenDailyCheckIn={() => setShowCheckInModal(true)}
        onOpenWatchAds={() => setShowWatchAdsModal(true)}
      />

      {/* 6. Referral Snapshot */}
      <ReferralSnapshot
        referrals={referrals}
        loading={loading}
      />

      {/* 7. Recent Activity Stream */}
      <RecentActivity
        activities={activities}
        loading={loading}
      />

      {/* 8. Account Information and Security */}
      <AccountSecurity
        user={profileData}
        onLogout={logoutUser}
        onOpenSettings={() => setShowSettingsModal(true)}
      />

      {/* Interactive Profile Edit Modal */}
      <ProfileEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        user={profileData}
        onUpdated={handleProfileUpdated}
      />

      {/* Payout Withdrawal Request Modal */}
      <WithdrawalRequestModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        maxAmount={typeof rewards?.tokens === 'number' ? rewards.tokens : 0}
        onSubmitWithdrawal={handleWithdrawalSubmitted}
      />

      {/* Daily Check-in & Streak Modal */}
      <DailyCheckInModal
        isOpen={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
        onClaimSuccess={handleCheckInSuccess}
      />

      {/* Watch Ads Simulation Modal */}
      <WatchAdsModal
        isOpen={showWatchAdsModal}
        onClose={() => setShowWatchAdsModal(false)}
        onRewardClaimed={handleAdRewardClaimed}
      />

      {/* Account Settings / Preferences Modal */}
      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Account Preferences"
        subtitle="Manage notifications and localized platform settings"
        maxWidth="480px"
        footer={
          <Button variant="gold" onClick={() => setShowSettingsModal(false)}>
            Close
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.88rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
            <span>Email Activity Digests:</span>
            <strong style={{ color: 'var(--status-success)' }}>Subscribed (Weekly)</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
            <span>Push Notifications:</span>
            <strong style={{ color: 'var(--status-success)' }}>Enabled</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
            <span>Preferred Payout Currency:</span>
            <strong style={{ color: 'var(--accent-gold)' }}>USDC (Polygon)</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
            <span>Display Language:</span>
            <span>English (US)</span>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserProfilePage;
