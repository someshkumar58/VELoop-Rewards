import React, { useState } from 'react';
import {
  LogIn,
  UserPlus,
  X,
  Mail,
  Lock,
  User,
  KeyRound,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import styles from './UserAuthModal.module.css';

const UserAuthModal = ({ isOpen, onClose, onSuccess }) => {
  const { loginWithCredentials, registerWithCredentials } = useAuth();
  const { addToast } = useToast();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [referralCode, setReferralCode] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (mode === 'login') {
      if (!email.trim() || !password) {
        setErrorMessage('Please enter both email and password.');
        return;
      }

      setLoading(true);
      try {
        const result = await loginWithCredentials(email.trim(), password);
        addToast(`Welcome back, ${result.user?.fullName || result.user?.name || 'User'}! Switched to Live API Mode.`, 'success');
        if (onSuccess) onSuccess(result.user);
        onClose();
      } catch (err) {
        console.error('[UserAuthModal] Login failed:', err);
        setErrorMessage(err.message || 'Invalid email or password. Please verify your credentials.');
      } finally {
        setLoading(false);
      }
    } else {
      // Register
      if (!name.trim()) {
        setErrorMessage('Please enter your full name.');
        return;
      }
      if (!email.trim()) {
        setErrorMessage('Please provide a valid email address.');
        return;
      }
      if (!password || password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        return;
      }

      setLoading(true);
      try {
        const result = await registerWithCredentials(name.trim(), email.trim(), password, referralCode.trim());
        addToast(`Welcome to VELoop Rewards, ${result.user?.fullName || name}! Live account created.`, 'success');
        if (onSuccess) onSuccess(result.user);
        onClose();
      } catch (err) {
        console.error('[UserAuthModal] Registration failed:', err);
        setErrorMessage(err.message || 'Registration failed. An account with this email may already exist.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleWrap}>
            <div className={styles.headerIcon}>
              {mode === 'login' ? <LogIn size={20} /> : <UserPlus size={20} />}
            </div>
            <div>
              <h3 className={styles.headerTitle}>
                {mode === 'login' ? 'User Login' : 'Create Live Account'}
              </h3>
              <p className={styles.headerSubtitle}>
                {mode === 'login'
                  ? 'Sign in to access your live MongoDB balances and history'
                  : 'Register a real account on the VELoop Rewards network'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className={styles.modeToggleBar}>
          <button
            type="button"
            className={`${styles.tabBtn} ${mode === 'login' ? styles.tabBtnActive : ''}`}
            onClick={() => {
              setMode('login');
              setErrorMessage('');
            }}
          >
            <LogIn size={15} />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${mode === 'register' ? styles.tabBtnActive : ''}`}
            onClick={() => {
              setMode('register');
              setErrorMessage('');
            }}
          >
            <UserPlus size={15} />
            <span>Register</span>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className={styles.modalBody}>
          {errorMessage && (
            <div className={styles.errorBanner}>
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {mode === 'register' && (
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Full Name</label>
              <div className={styles.inputWrap}>
                <User size={16} className={styles.inputIcon} />
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder="e.g. Somesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  autoComplete="name"
                />
              </div>
            </div>
          )}

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Email Address</label>
            <div className={styles.inputWrap}>
              <Mail size={16} className={styles.inputIcon} />
              <input
                type="email"
                className={styles.textInput}
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Password</label>
            <div className={styles.inputWrap}>
              <Lock size={16} className={styles.inputIcon} />
              <input
                type="password"
                className={styles.textInput}
                placeholder={mode === 'register' ? 'Minimum 6 characters' : 'Enter your password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              />
            </div>
          </div>

          {mode === 'register' && (
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>
                <span>Referral Code</span>
                <span className={styles.labelOptional}>Optional</span>
              </label>
              <div className={styles.inputWrap}>
                <KeyRound size={16} className={styles.inputIcon} />
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder="e.g. VEL-ALEX99"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  disabled={loading}
                />
              </div>
            </div>
          )}

          <div className={styles.demoHelper}>
            <Sparkles size={13} style={{ display: 'inline', marginRight: '6px', color: 'var(--accent-gold)' }} />
            <strong>Demo Tip:</strong> When not logged in, you explore in <strong>Preview Mode</strong> with pre-populated metrics. Logging in switches your session directly to live MongoDB Atlas APIs.
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="spin" />
                <span>Connecting...</span>
              </>
            ) : mode === 'login' ? (
              <>
                <span>Sign In to Live Account</span>
                <ArrowRight size={16} />
              </>
            ) : (
              <>
                <span>Create Live Account</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserAuthModal;
