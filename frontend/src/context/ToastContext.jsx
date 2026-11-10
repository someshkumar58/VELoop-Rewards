import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import styles from './Toast.module.css';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    const newToast = { id, message, type, duration };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className={styles.toastContainer} aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => {
          let Icon = Info;
          let typeClass = styles.info;
          if (toast.type === 'success') {
            Icon = CheckCircle;
            typeClass = styles.success;
          } else if (toast.type === 'warning') {
            Icon = AlertTriangle;
            typeClass = styles.warning;
          } else if (toast.type === 'error') {
            Icon = XCircle;
            typeClass = styles.error;
          }

          return (
            <div key={toast.id} className={`${styles.toast} ${typeClass}`}>
              <div className={styles.iconWrapper}>
                <Icon size={18} />
              </div>
              <div className={styles.message}>{toast.message}</div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => removeToast(toast.id)}
                aria-label="Dismiss toast"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
