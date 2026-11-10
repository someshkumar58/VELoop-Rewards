import React, { forwardRef } from 'react';
import styles from './Form.module.css';

const InputField = forwardRef(({
  label,
  id,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  error = '',
  helperText = '',
  required = false,
  disabled = false,
  leftIcon: LeftIcon = null,
  rightElement = null,
  className = '',
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`${styles.formGroup} ${className}`}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label} {required && <span className={styles.required}>*</span>}
        </label>
      )}

      <div className={`${styles.inputWrapper} ${error ? styles.hasError : ''} ${disabled ? styles.disabled : ''}`}>
        {LeftIcon && (
          <span className={styles.leftIcon}>
            <LeftIcon size={16} />
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`${styles.input} ${LeftIcon ? styles.withLeftIcon : ''} ${rightElement ? styles.withRightElement : ''}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />

        {rightElement && (
          <div className={styles.rightElement}>
            {rightElement}
          </div>
        )}
      </div>

      {error ? (
        <div id={`${inputId}-error`} className={styles.errorText} role="alert">
          {error}
        </div>
      ) : helperText ? (
        <div className={styles.helperText}>{helperText}</div>
      ) : null}
    </div>
  );
});

InputField.displayName = 'InputField';

export default InputField;
