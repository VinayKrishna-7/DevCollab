import React from 'react';
import Modal from './Modal.jsx';
import { AlertCircle } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false,
  loading = false
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="450px">
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        {danger && <AlertCircle size={24} color="var(--danger)" style={{ flexShrink: 0, marginTop: '2px' }} />}
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.5 }}>{message}</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
          disabled={loading}
        >
          {loading ? 'Processing...' : confirmText}
        </button>
      </div>
    </Modal>
  );
}
