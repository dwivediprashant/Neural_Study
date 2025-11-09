import { useEffect } from 'react';

import styles from './ToastStack.module.css';

const Toast = ({ id, message, tone, onDismiss, duration = 4000 }) => {
  useEffect(() => {
    if (!duration) return undefined;
    const timer = setTimeout(() => onDismiss(id), duration);
    return () => clearTimeout(timer);
  }, [duration, id, onDismiss]);

  return (
    <div className={`${styles.toast} ${styles[`toast${tone}`]}`} role="status">
      <span className={styles.message}>{message}</span>
      <button type="button" className={styles.dismissButton} onClick={() => onDismiss(id)} aria-label="Dismiss notification">
        ×
      </button>
    </div>
  );
};

Toast.defaultProps = {
  tone: 'info',
  duration: 4000,
};

const ToastStack = ({ toasts, onDismiss }) => {
  if (!toasts?.length) return null;

  return (
    <div className={styles.stack}>
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

ToastStack.defaultProps = {
  toasts: [],
};

export default ToastStack;
