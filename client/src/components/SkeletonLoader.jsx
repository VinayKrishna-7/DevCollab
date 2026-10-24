import React from 'react';

export default function SkeletonLoader({ count = 3, height = '4rem', className = '' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }} className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            height,
            backgroundColor: 'var(--border-light)',
            borderRadius: '8px',
            animation: 'pulse 1.5s ease-in-out infinite'
          }}
        />
      ))}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
