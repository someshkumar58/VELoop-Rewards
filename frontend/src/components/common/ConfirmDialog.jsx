import React from 'react';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import styles from './ConfirmDialog.module.css';

const ConfirmDialog = ({
  isOpen = false,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed with this operation?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'gold', // 'gold' | 'danger' | 'primary'
  loading = false,
  iconType = 'warning', // 'warning' | 'info' | 'success'
}) => {
  let Icon = AlertTriangle;
  let iconClass = styles.warning;
  if (iconType === 'info') {
    Icon = Info;
    iconClass = styles.info;
  } else if (iconType === 'success') {
    Icon = CheckCircle;
    iconClass = styles.success;
  } else if (confirmVariant === 'danger') {
    iconClass = styles.danger;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="480px"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>
            {confirmText}
          </Button>
        </>
      }
    >
      <div className={styles.dialogBody}>
        <div className={`${styles.iconWrap} ${iconClass}`}>
          <Icon size={28} />
        </div>
        <p className={styles.messageText}>{message}</p>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
