import React, { useState } from 'react';
import { Info, Database, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Modal from './Modal';
import Button from './Button';
import styles from './DevPreviewBanner.module.css';

const DevPreviewBanner = () => {
  const { isDevPreview, toggleDevPreview } = useAuth();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className={styles.banner}>
        <div className={styles.bannerContent}>
          <div className={styles.badgeWrap}>
            <span className={styles.pulseDot} />
            <span className={styles.badgeText}>
              {isDevPreview ? 'DEMO DATA ACTIVE' : 'LIVE API MODE'}
            </span>
          </div>

          <p className={styles.infoText}>
            {isDevPreview
              ? 'Development Preview Mode: Simulated responses active. Not persisted to backend.'
              : 'Live API Mode: Communicating directly with backend API at VITE_API_URL.'}
          </p>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.detailBtn}
              onClick={() => setShowModal(true)}
              aria-label="View demo preview details"
            >
              <Info size={14} />
              <span>Details</span>
            </button>

            <button
              type="button"
              className={styles.toggleBtn}
              onClick={toggleDevPreview}
              title="Toggle between Live API and Preview Mode"
            >
              {isDevPreview ? (
                <>
                  <ToggleRight size={18} className={styles.toggleActive} />
                  <span>Preview ON</span>
                </>
              ) : (
                <>
                  <ToggleLeft size={18} className={styles.toggleInactive} />
                  <span>Preview OFF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Development Preview & API Integration Status"
        subtitle="Full transparency on frontend simulation vs backend integration"
        maxWidth="600px"
        footer={
          <Button variant="gold" onClick={() => setShowModal(false)}>
            Close
          </Button>
        }
      >
        <div className={styles.modalBody}>
          <div className={styles.noticeBox}>
            <Database size={24} className={styles.noticeIcon} />
            <div>
              <h5 className={styles.noticeTitle}>
                {isDevPreview ? 'Deterministic Preview Mode Active' : 'Live API Mode Active'}
              </h5>
              <p className={styles.noticeDesc}>
                {isDevPreview
                  ? 'The current UI is populated using structured sample data so all 8 Profile sections, Admin tables, modals, filters, and states can be visually validated without an active backend.'
                  : 'The frontend will make genuine HTTP network requests to your backend (VITE_API_URL). If your backend server is not running on port 5000, requests will fail gracefully with retryable error states.'}
              </p>
            </div>
          </div>

          <div className={styles.checklist}>
            <h6 className={styles.checkTitle}>Architectural Contracts Prepared:</h6>
            <ul className={styles.checkList}>
              <li>✅ <strong>Profile endpoints:</strong> <code>GET /api/profile/me</code>, <code>PATCH /api/profile/me</code>, <code>/rewards</code>, <code>/level-progress</code>, <code>/achievements</code>, <code>/withdrawal-summary</code>, <code>/referrals</code>, <code>/activity</code></li>
              <li>✅ <strong>Admin management:</strong> User directory, User status toggle, Reward adjustments, Level configuration, Achievement badges, Withdrawal approval/rejection, Audit logs</li>
              <li>✅ <strong>Error Handling:</strong> Network error states, loading skeletons, accessible forms</li>
              <li>✅ <strong>Authorization Guard:</strong> Route level and API request interceptor headers (<code>Bearer token</code>)</li>
            </ul>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default DevPreviewBanner;
