import React from 'react';
import { Search, X } from 'lucide-react';

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  onClear,
  className = ''
}) {
  return (
    <div style={{ position: 'relative', width: '100%' }} className={className}>
      <Search
        size={18}
        color="var(--text-muted)"
        style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="form-input"
        style={{ paddingLeft: '2.5rem', paddingRight: value ? '2.25rem' : '0.85rem' }}
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
