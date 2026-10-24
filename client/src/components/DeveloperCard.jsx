import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Target, Clock } from 'lucide-react';
import UserAvatar from './UserAvatar.jsx';
import StatusBadge from './StatusBadge.jsx';
import SkillBadge from './SkillBadge.jsx';

export default function DeveloperCard({ developer, matchScore }) {
  const profile = developer.profile || {};
  const displayName = profile.displayName || developer.username;
  const headline = profile.headline || 'Software Developer';
  const score = matchScore ?? developer.matchScore;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {score !== undefined && (
        <div style={{
          backgroundColor: score >= 75 ? 'var(--success-light)' : 'var(--bg-muted)',
          borderBottom: `1px solid ${score >= 75 ? 'var(--success-border)' : 'var(--border-light)'}`,
          padding: '0.45rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: score >= 75 ? 'var(--success-text)' : 'var(--text-secondary)'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Target size={14} /> Match Fit
          </span>
          <span>{score}% Compatibility</span>
        </div>
      )}

      <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
          <UserAvatar user={developer} size="lg" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Link to={`/developers/${developer.username}`} style={{ color: 'inherit' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-main)' }}>
                {displayName}
              </h3>
            </Link>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>@{developer.username}</p>
            <p style={{
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.3
            }}>
              {headline}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
          <span className="badge badge-neutral">
            {profile.experienceLevel || 'BEGINNER'}
          </span>
          <StatusBadge status={profile.availability || 'AVAILABLE'} />
          {profile.weeklyHours && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <Clock size={12} /> {profile.weeklyHours}h/wk
            </span>
          )}
        </div>

        {profile.location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            <MapPin size={13} /> {profile.location}
          </div>
        )}

        <div style={{ marginTop: 'auto' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            Skills
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {(developer.skills || []).slice(0, 5).map((s, idx) => (
              <SkillBadge key={idx} skill={s} />
            ))}
            {(developer.skills || []).length > 5 && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                +{developer.skills.length - 5}
              </span>
            )}
            {(!developer.skills || developer.skills.length === 0) && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No skills listed yet</span>
            )}
          </div>
        </div>
      </div>

      <div className="card-footer" style={{ textAlign: 'center' }}>
        <Link to={`/developers/${developer.username}`} className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
          View Profile
        </Link>
      </div>
    </div>
  );
}
