import React from 'react';
import styles from './Badge.module.css';

const Badge = ({
  children,
  variant = 'info', // 'success' | 'warning' | 'error' | 'info' | 'gold' | 'purple' | 'silver'
  dot = false,
  size = 'md', // 'sm' | 'md'
  className = '',
}) => {
  // Auto-detect variant if matching common status words
  let computedVariant = variant;
  if (typeof children === 'string') {
    const val = children.toLowerCase();
    if (val.includes('active') || val.includes('approved') || val.includes('completed') || val.includes('verified')) {
      computedVariant = 'success';
    } else if (val.includes('pending') || val.includes('review') || val.includes('flagged')) {
      computedVariant = 'warning';
    } else if (val.includes('suspend') || val.includes('reject') || val.includes('failed')) {
      computedVariant = 'error';
    }
  }

  const variantClass = styles[computedVariant] || styles.info;
  const sizeClass = styles[size] || styles.md;

  return (
    <span className={`${styles.badge} ${variantClass} ${sizeClass} ${className}`}>
      {dot && <span className={styles.dot} />}
      {children}
    </span>
  );
};

export default Badge;
