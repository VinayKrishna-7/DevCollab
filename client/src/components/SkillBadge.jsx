import React from 'react';

export default function SkillBadge({ skill, matched = false, proficiency, onRemove }) {
  const name = typeof skill === 'string' ? skill : (skill?.skill?.name || skill?.name || '');

  return (
    <span className={`skill-badge ${matched ? 'skill-badge-matched' : ''}`}>
      <span>{name}</span>
      {proficiency && (
        <span style={{ fontSize: '0.7rem', opacity: 0.75, borderLeft: '1px solid currentColor', paddingLeft: '0.3rem' }}>
          {proficiency[0]}
        </span>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          style={{ marginLeft: '0.25rem', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1 }}
          aria-label={`Remove ${name}`}
        >
          &times;
        </button>
      )}
    </span>
  );
}
