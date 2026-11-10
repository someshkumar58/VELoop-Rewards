import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';
import styles from './ErrorState.module.css';

const ErrorState = ({
  title = 'Failed to load data',
  message = 'An unexpected network error occurred while communicating with the backend API.',
  onRetry = null,
  className = '',
}) => {
  return (
    <div className={`${styles.container} ${className}`} role="alert">
      <div className={styles.iconWrapper}>
        <AlertCircle size={32} />
      </div>
      <h4 className={styles.title}>{title}</h4>
      <p className={styles.message}>{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          onClick={onRetry}
          className={styles.retryBtn}
        >
          Retry Request
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
