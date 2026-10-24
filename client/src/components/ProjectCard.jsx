import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Bookmark, Target, Calendar } from 'lucide-react';
import StatusBadge from './StatusBadge.jsx';
import SkillBadge from './SkillBadge.jsx';

export default function ProjectCard({ project, onBookmarkToggle }) {
  const memberCount = project._count?.members ?? (project.members?.length || 1);
  const isBookmarked = project.isBookmarked;
  const matchScore = project.matchScore;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {/* Match Score Indicator (if provided from recommendation system) */}
      {matchScore !== undefined && (
        <div style={{
          backgroundColor: matchScore >= 75 ? 'var(--success-light)' : 'var(--bg-muted)',
          borderBottom: `1px solid ${matchScore >= 75 ? 'var(--success-border)' : 'var(--border-light)'}`,
          padding: '0.45rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: matchScore >= 75 ? 'var(--success-text)' : 'var(--text-secondary)'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Target size={14} /> Match Fit
          </span>
          <span>{matchScore}% Compatibility</span>
        </div>
      )}

      <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: 'var(--primary)',
              backgroundColor: 'var(--primary-light)',
              padding: '0.15rem 0.5rem',
              borderRadius: '4px'
            }}>
              {project.category ? project.category.replace(/_/g, ' ') : 'General'}
            </span>
            <StatusBadge status={project.recruitmentStatus} />
          </div>

          {onBookmarkToggle && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onBookmarkToggle(project.id);
              }}
              style={{ color: isBookmarked ? 'var(--primary)' : 'var(--text-muted)', padding: '0.2rem' }}
              aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark project'}
            >
              <Bookmark size={18} fill={isBookmarked ? 'var(--primary)' : 'none'} />
            </button>
          )}
        </div>

        <Link to={`/projects/${project.slug}`} style={{ color: 'inherit' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.5rem', lineHeight: 1.3, color: 'var(--text-main)' }}>
            {project.title}
          </h3>
        </Link>

        <p style={{
          color: 'var(--text-muted)',
          fontSize: '0.875rem',
          lineHeight: 1.5,
          marginBottom: '1rem',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          flex: 1
        }}>
          {project.summary}
        </p>

        {/* Required Skills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1.25rem' }}>
          {(project.skills || []).slice(0, 4).map((s, idx) => (
            <SkillBadge key={idx} skill={s} />
          ))}
          {(project.skills || []).length > 4 && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
              +{project.skills.length - 4} more
            </span>
          )}
        </div>

        {/* Bottom meta */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border-light)',
          fontSize: '0.8125rem',
          color: 'var(--text-muted)'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Users size={15} color="var(--text-secondary)" />
            <span>{memberCount} / {project.desiredTeamSize} members</span>
          </span>

          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Calendar size={14} />
            <span>{new Date(project.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
