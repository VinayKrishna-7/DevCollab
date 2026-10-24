import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems
}) {
  if (totalPages <= 1) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1.25rem 0',
      borderTop: '1px solid var(--border-light)',
      marginTop: '1.5rem',
      flexWrap: 'wrap',
      gap: '1rem'
    }}>
      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        Page <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{currentPage}</span> of{' '}
        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{totalPages}</span>
        {totalItems !== undefined && ` (${totalItems} total results)`}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="btn btn-secondary btn-sm"
          style={{ opacity: currentPage <= 1 ? 0.5 : 1 }}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} /> Previous
        </button>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="btn btn-secondary btn-sm"
          style={{ opacity: currentPage >= totalPages ? 0.5 : 1 }}
          aria-label="Next page"
        >
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
