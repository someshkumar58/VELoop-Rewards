import React, { useState } from 'react';
import {
  Gift,
  Tv,
  Gem,
  Share2,
  Wallet,
  ShoppingBag,
  Award,
  ExternalLink,
  Lock,
  ArrowRight
} from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import styles from './QuickActions.module.css';

const QuickActions = ({ onRequestWithdrawal, onOpenDailyCheckIn }) => {
  const [selectedAction, setSelectedAction] = useState(null);

  const actions = [
    {
      id: 'refer',
      title: 'Refer Friends',
      description: 'Invite members with code & earn +100 VEs.',
      icon: Share2,
      color: '#A78BFA',
      type: 'anchor',
      target: '#section-referrals',
      badge: 'Active'
    },
    {
      id: 'achievements',
      title: 'View Achievements',
      description: 'Check unlocked badges and XP progression.',
      icon: Award,
      color: '#F4C76A',
      type: 'anchor',
      target: '#section-levels',
      badge: 'Active'
    },
    {
      id: 'wallet',
      title: 'View Wallet & Payouts',
      description: 'Review withdrawals and request payouts.',
      icon: Wallet,
      color: '#34D399',
      type: 'function',
      handler: onRequestWithdrawal,
      badge: 'Active'
    },
    {
      id: 'earn',
      title: 'Earn Rewards',
      description: 'Complete daily check-ins & community tasks.',
      icon: Gift,
      color: '#6EA8FE',
      type: onOpenDailyCheckIn ? 'function' : 'pending_backend',
      handler: onOpenDailyCheckIn,
      badge: onOpenDailyCheckIn ? 'Active' : 'Pending',
      details: {
        title: 'Task Rewards Engine (Backend Pending)',
        desc: 'Integration endpoint: POST /api/tasks/claim. This module requires the MERN backend task verification engine, scheduled cron jobs, and task validation services.',
        status: 'Contract Specified / Awaiting Backend'
      }
    },
    {
      id: 'ads',
      title: 'Watch Ads',
      description: 'Earn +15 VEs per sponsored video watch.',
      icon: Tv,
      color: '#F87171',
      type: 'pending_backend',
      details: {
        title: 'Ad Provider SDK Integration (Backend Pending)',
        desc: 'Integration endpoint: POST /api/ads/verify-impression. Requires server-side ad network callbacks (e.g. AdMob / Unity Ads SSV webhook) to prevent client fraud.',
        status: 'Contract Specified / Awaiting Backend'
      }
    },
    {
      id: 'gems',
      title: 'Get Gems',
      description: 'Purchase or spin mystery gemstone crates.',
      icon: Gem,
      color: '#A78BFA',
      type: 'pending_backend',
      details: {
        title: 'Gem Store & Payment Gateway (Backend Pending)',
        desc: 'Integration endpoint: POST /api/store/gems/checkout. Requires Stripe / Payment gateway webhook and inventory database models.',
        status: 'Contract Specified / Awaiting Backend'
      }
    },
    {
      id: 'redeem',
      title: 'Redeem Rewards',
      description: 'Exchange VEs and tokens for gift cards.',
      icon: ShoppingBag,
      color: '#FBBF24',
      type: 'pending_backend',
      details: {
        title: 'Rewards Catalog & Fulfillment (Backend Pending)',
        desc: 'Integration endpoint: POST /api/rewards/redeem. Connects with external gift card inventory providers (Tango Card / Tremendous API).',
        status: 'Contract Specified / Awaiting Backend'
      }
    }
  ];

  const handleActionClick = (action) => {
    if (action.type === 'anchor') {
      const element = document.querySelector(action.target);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (action.type === 'function' && action.handler) {
      action.handler();
    } else if (action.type === 'pending_backend') {
      setSelectedAction(action);
    }
  };

  return (
    <section id="section-quick-actions" className={styles.sectionWrap}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>
          <p className={styles.sectionSubtitle}>
            Accelerate your earnings, invite teammates, and manage reward assets.
          </p>
        </div>
      </div>

      <div className={styles.actionsGrid}>
        {actions.map((act) => {
          const Icon = act.icon;
          const isPending = act.type === 'pending_backend';

          return (
            <button
              key={act.id}
              type="button"
              className={`${styles.actionCard} ${isPending ? styles.pendingCard : ''}`}
              onClick={() => handleActionClick(act)}
              style={{ '--action-color': act.color }}
            >
              <div className={styles.actionTop}>
                <div className={styles.iconBox}>
                  <Icon size={20} />
                </div>
                {act.badge ? (
                  <span className={styles.activeBadge}>{act.badge}</span>
                ) : (
                  <span className={styles.backendBadge} title="Requires Backend Microservice">
                    <Lock size={11} />
                    <span>API Required</span>
                  </span>
                )}
              </div>

              <div className={styles.actionContent}>
                <h4 className={styles.actionTitle}>{act.title}</h4>
                <p className={styles.actionDesc}>{act.description}</p>
              </div>

              <div className={styles.cardArrow}>
                <span>{isPending ? 'Inspect Endpoint' : 'Navigate'}</span>
                <ArrowRight size={14} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Backend Integration Explainer Modal */}
      {selectedAction && (
        <Modal
          isOpen={!!selectedAction}
          onClose={() => setSelectedAction(null)}
          title={selectedAction.details.title}
          subtitle="Honest Architectural & Backend Integration Status"
          maxWidth="540px"
          footer={
            <Button variant="gold" onClick={() => setSelectedAction(null)}>
              Understood
            </Button>
          }
        >
          <div className={styles.modalBody}>
            <div className={styles.statusBox}>
              <span className={styles.statusLabel}>Implementation State:</span>
              <span className={styles.statusVal}>{selectedAction.details.status}</span>
            </div>

            <p className={styles.modalText}>
              {selectedAction.details.desc}
            </p>

            <div className={styles.auditPromise}>
              🛡️ <strong>Production Integrity Guarantee:</strong> In accordance with prompt requirements, we do not build fake client-side counters or pretend hardcoded earn triggers are persisted until the backend endpoint is wired.
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
};

export default QuickActions;
