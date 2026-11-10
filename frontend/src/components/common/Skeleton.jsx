import React from 'react';
import styles from './Skeleton.module.css';

const Skeleton = ({
  variant = 'text', // 'text' | 'rect' | 'circle'
  width,
  height,
  className = '',
  style = {},
}) => {
  const customStyles = {
    ...style,
    width: width || (variant === 'circle' ? '40px' : '100%'),
    height: height || (variant === 'circle' ? '40px' : variant === 'text' ? '16px' : '100px'),
  };

  return (
    <div
      className={`${styles.skeleton} ${styles[variant]} ${className}`}
      style={customStyles}
      aria-hidden="true"
    />
  );
};

export default Skeleton;
