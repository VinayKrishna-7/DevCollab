import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ size = 24, text = 'Loading...', fullPage = false }) {
  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '2rem' }}>
      <Loader2 size={size} className="spin-icon" style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
      {text && <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{text}</span>}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  if (fullPage) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {content}
      </div>
    );
  }

  return content;
}
