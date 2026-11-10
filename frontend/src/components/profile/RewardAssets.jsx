import React, { useState } from 'react';
import { HelpCircle, Coins, Gem, Zap, CircleDollarSign, Layers } from 'lucide-react';
import { REWARD_ASSETS } from '../../constants/assetsInfo';
import { useAuth } from '../../context/AuthContext';
import Skeleton from '../common/Skeleton';
import styles from './RewardAssets.module.css';

const RewardAssets = ({
  rewards = {},
  loading = false,
}) => {
  const { isDevPreview } = useAuth();
  const [activeTooltip, setActiveTooltip] = useState(null);

  // Asset icons mapping
  const iconMap = {
    ves: Coins,
    sves: Layers,
    gems: Gem,
    tokens: CircleDollarSign,
    xp: Zap,
  };

  return (
    <section id="section-assets" className={styles.sectionWrap}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Reward Assets</h2>
          <p className={styles.sectionSubtitle}>
            Authoritative platform reward asset holdings backed by the VELoop ecosystem.
          </p>
        </div>
      </div>

      <div className={styles.assetsGrid}>
        {REWARD_ASSETS.map((asset) => {
          const Icon = iconMap[asset.key] || Coins;
          const rawBalance = rewards ? rewards[asset.key] : 0;
          const numBalance = typeof rawBalance === 'number' ? rawBalance : parseFloat(rawBalance) || 0;
          const formattedBalance = numBalance.toLocaleString(undefined, {
            minimumFractionDigits: asset.key === 'gems' || asset.key === 'xp' ? 0 : 2,
            maximumFractionDigits: 2,
          });

          return (
            <div
              key={asset.key}
              className={styles.assetCard}
              style={{ '--asset-accent': asset.color }}
            >
              <div className={styles.cardTop}>
                <div className={styles.iconCircle}>
                  <Icon size={20} />
                </div>

                <div className={styles.tooltipContainer}>
                  <button
                    type="button"
                    className={styles.tooltipBtn}
                    onClick={() => setActiveTooltip(activeTooltip === asset.key ? null : asset.key)}
                    onMouseEnter={() => setActiveTooltip(asset.key)}
                    onMouseLeave={() => setActiveTooltip(null)}
                    aria-label={`About ${asset.name}`}
                  >
                    <HelpCircle size={15} />
                  </button>

                  {activeTooltip === asset.key && (
                    <div className={styles.tooltipPopover} role="tooltip">
                      <div className={styles.tooltipTitle}>{asset.name}</div>
                      <p className={styles.tooltipDesc}>{asset.description}</p>
                      <div className={styles.tooltipRate}>
                        <strong>Rate / Utility:</strong> {asset.rate}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.cardContent}>
                <span className={styles.assetLabel}>{asset.shortName}</span>
                {loading ? (
                  <Skeleton width="70%" height="28px" className={styles.skeletonSpace} />
                ) : (
                  <div className={styles.balanceValue}>
                    {formattedBalance}
                  </div>
                )}
                <div className={styles.utilityText}>
                  {asset.symbol} • {isDevPreview ? 'Demo Data' : 'Server Verified'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default RewardAssets;
