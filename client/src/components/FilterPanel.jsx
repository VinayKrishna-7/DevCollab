import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';

export default function FilterPanel({ filters, onFilterChange, onReset, options = {} }) {
  return (
    <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', backgroundColor: 'var(--bg-card)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
          <Filter size={16} color="var(--primary)" />
          <span>Filters</span>
        </div>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}
          >
            <RotateCcw size={13} /> Reset Filters
          </button>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem'
      }}>
        {options.categories && (
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Category
            </label>
            <select
              value={filters.category || ''}
              onChange={(e) => onFilterChange('category', e.target.value)}
              className="form-select"
            >
              <option value="">All Categories</option>
              {options.categories.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        )}

        {options.statuses && (
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Recruitment Status
            </label>
            <select
              value={filters.recruitmentStatus || ''}
              onChange={(e) => onFilterChange('recruitmentStatus', e.target.value)}
              className="form-select"
            >
              <option value="">All Statuses</option>
              {options.statuses.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        )}

        {options.experienceLevels && (
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Experience Level
            </label>
            <select
              value={filters.experienceLevel || ''}
              onChange={(e) => onFilterChange('experienceLevel', e.target.value)}
              className="form-select"
            >
              <option value="">Any Experience</option>
              {options.experienceLevels.map((lvl) => (
                <option key={lvl.value} value={lvl.value}>{lvl.label}</option>
              ))}
            </select>
          </div>
        )}

        {options.availabilities && (
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Availability
            </label>
            <select
              value={filters.availability || ''}
              onChange={(e) => onFilterChange('availability', e.target.value)}
              className="form-select"
            >
              <option value="">Any Availability</option>
              {options.availabilities.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>
        )}

        {options.sortOptions && (
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Sort By
            </label>
            <select
              value={filters.sort || 'newest'}
              onChange={(e) => onFilterChange('sort', e.target.value)}
              className="form-select"
            >
              {options.sortOptions.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
