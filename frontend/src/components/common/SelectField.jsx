import React from 'react';
import styles from './Form.module.css';

const SelectField = ({
  label,
  id,
  value,
  onChange,
  options = [],
  error = '',
  helperText = '',
  required = false,
  disabled = false,
  className = '',
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`${styles.formGroup} ${className}`}>
      {label && (
        <label htmlFor={selectId} className={styles.label}>
          {label} {required && <span className={styles.required}>*</span>}
        </label>
      )}

      <div className={`${styles.inputWrapper} ${error ? styles.hasError : ''} ${disabled ? styles.disabled : ''}`}>
        <select
          id={selectId}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={styles.select}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div className={styles.errorText} role="alert">
          {error}
        </div>
      ) : helperText ? (
        <div className={styles.helperText}>{helperText}</div>
      ) : null}
    </div>
  );
};

export default SelectField;
