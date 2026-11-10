import React from 'react';
import styles from './ProgressBar.module.css';

const ProgressBar = ({
  value = 0,
  max = 100,
  percentage = null,
  customPercentage = null,
  color = 'gold', // 'gold' | 'blue' | 'purple' | 'success'
  height = 8,
  showLabel = false,
  labelText = '',
  className = '',
}) => {
  // Support both 'percentage' and 'customPercentage' props
  const inputPct = customPercentage !== null ? customPercentage : percentage;

  // Robust calculation sanitization: prevents NaN, negatives, division by zero, and > 100%
  let calculated = 0;
  if (inputPct !== null && !isNaN(Number(inputPct))) {
    calculated = Number(inputPct);
  } else if (Number(max) > 0 && !isNaN(Number(value)) && !isNaN(Number(max))) {
    calculated = Math.round((Number(value) / Number(max)) * 100);
  }

  const pct = Math.min(100, Math.max(0, isNaN(calculated) ? 0 : calculated));
  const colorClass = styles[color] || styles.gold;

  return (
    <div className={`${styles.wrapper} ${className}`}>
      {showLabel && (
        <div className={styles.labelRow}>
          <span className={styles.label}>{labelText}</span>
          <span className={styles.percentage}>{pct}%</span>
        </div>
      )}
      <div
        className={styles.track}
        style={{ height: `${height}px` }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div
          className={`${styles.fill} ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
