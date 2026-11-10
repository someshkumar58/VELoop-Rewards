import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  KeyRound,
  ArrowLeft,
  Server
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import InputField from '../../components/common/InputField';
import Button from '../../components/common/Button';
import DevPreviewBanner from '../../components/common/DevPreviewBanner';
import styles from './AdminLogin.module.css';

const AdminLoginPage = () => {
  const { loginAdmin, isDevPreview } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showDemoCredentials, setShowDemoCredentials] = useState(true);

  const from = location.state?.from?.pathname || '/admin/dashboard';

  const validate = () => {
    const errs = {};
    if (!email.trim()) {
      errs.email = 'Admin email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = 'Please provide a valid email format';
    }
    if (!password) {
      errs.password = 'Password is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await loginAdmin(email, password);
      addToast('Administrative session authenticated successfully.', 'success');
      navigate(from, { replace: true });
    } catch (err) {
      setApiError(err.message || 'Administrative authentication failed. Please verify credentials.');
      addToast('Authentication failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCreds = () => {
    setEmail('admin@veloop.io');
    setPassword('Admin@2026');
    setErrors({});
    setApiError('');
    addToast('Demo administrative credentials populated.', 'info');
  };

  return (
    <div className={styles.pageContainer}>
      <DevPreviewBanner />
      <div className={styles.loginCard}>
        {/* Top Header */}
        <div className={styles.cardHeader}>
          <div className={styles.logoBadge}>
            <Shield size={28} />
          </div>
          <h2 className={styles.title}>VELoop Administration</h2>
          <p className={styles.subtitle}>
            Authorized management access & security controls
          </p>
        </div>

        {/* Global Error Banner */}
        {apiError && (
          <div className={styles.errorAlert} role="alert">
            <AlertCircle size={18} className={styles.errorIcon} />
            <span>{apiError}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className={styles.form} noValidate>
          <InputField
            label="Admin Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@veloop.io"
            leftIcon={Mail}
            error={errors.email}
            required
            autoComplete="username"
          />

          <InputField
            label="Security Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            leftIcon={Lock}
            error={errors.password}
            required
            autoComplete="current-password"
            rightElement={
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />

          <Button
            type="submit"
            variant="gold"
            size="lg"
            loading={loading}
            className={styles.submitBtn}
          >
            Authenticate & Access Console
          </Button>
        </form>

        {/* Dev-only Demo Credentials Box */}
        <div className={styles.demoBox}>
          <div className={styles.demoTop}>
            <div className={styles.demoTitle}>
              <KeyRound size={15} />
              <span>Development Demo Credentials</span>
            </div>
            <button
              type="button"
              className={styles.fillBtn}
              onClick={fillDemoCreds}
            >
              Autofill
            </button>
          </div>
          <div className={styles.demoCreds}>
            <div><strong>Email:</strong> <code>admin@veloop.io</code></div>
            <div><strong>Password:</strong> <code>Admin@2026</code></div>
          </div>
          <p className={styles.demoDisclaimer}>
            * Demonstration mode only. Never deployed to production environments.
          </p>
        </div>

        {/* Back Link */}
        <div className={styles.cardFooter}>
          <Link to="/user-profile" className={styles.backLink}>
            <ArrowLeft size={15} />
            <span>Return to User Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
