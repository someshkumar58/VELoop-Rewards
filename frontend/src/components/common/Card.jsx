import React from 'react';
import styles from './Card.module.css';

const Card = ({
  children,
  title,
  subtitle,
  icon: Icon,
  action,
  footer,
  hover = false,
  glow = null, // 'gold' | 'blue' | 'purple'
  className = '',
  bodyClassName = '',
  ...props
}) => {
  const glowClass = glow ? styles[`glow-${glow}`] : '';

  return (
    <div
      className={`${styles.card} ${hover ? styles.cardHover : ''} ${glowClass} ${className}`}
      {...props}
    >
      {(title || subtitle || action || Icon) && (
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            {Icon && (
              <div className={styles.iconContainer}>
                <Icon size={18} />
              </div>
            )}
            <div>
              {title && <h3 className={styles.title}>{title}</h3>}
              {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>
          </div>
          {action && <div className={styles.action}>{action}</div>}
        </div>
      )}

      <div className={`${styles.body} ${bodyClassName}`}>
        {children}
      </div>

      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
};

export default Card;
