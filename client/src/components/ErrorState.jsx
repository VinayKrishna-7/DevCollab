import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorState({ title = 'Something went wrong', message = 'Could not load data. Please try again.', onRetry }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '3rem 1.5rem',
      backgroundColor: 'var(--danger-light)',
      border: '1px solid var(--danger-border)',
      borderRadius: '10px',
      margin: '1.5rem 0'
    }}>
      <AlertTriangle size={36} color="var(--danger)" style={{ margin: '0 auto 0.75rem' }} />
      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--danger-text)', marginBottom: '0.5rem' }}>{title}</h3>
      <p style={{ color: 'var(--danger-text)', fontSize: '0.875rem', maxWidth: '400px', margin: '0 auto 1.25rem' }}>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-secondary" style={{ borderColor: 'var(--danger-border)', color: 'var(--danger-text)' }}>
          <RefreshCw size={15} /> Try Again
        </button>
      )}
    </div>
  );
}
