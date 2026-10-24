import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Github,
  Linkedin,
  Globe,
  Briefcase,
  FolderGit2,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  Edit
} from 'lucide-react';
import api from '../api/client.js';
import UserAvatar from '../components/UserAvatar.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import SkillBadge from '../components/SkillBadge.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorState from '../components/ErrorState.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function DeveloperProfile() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();

  const [developer, setDeveloper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/users/${username}`);
      setDeveloper(res.data);
    } catch (err) {
      setError(err.message || 'Developer profile not found');
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) return <LoadingSpinner fullPage text="Loading developer profile..." />;
  if (error || !developer) return <ErrorState message={error || 'Profile not found'} onRetry={fetchProfile} />;

  const profile = developer.profile || {};
  const isSelf = currentUser?.id === developer.id;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header Profile Card */}
      <div className="card" style={{ padding: '2.5rem 2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <UserAvatar user={developer} size="xl" />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {profile.displayName || developer.username}
                </h1>
                <span className="badge badge-neutral">@{developer.username}</span>
              </div>

              <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '0.75rem' }}>
                {profile.headline || 'Full-Stack Software Developer'}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {profile.location && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <MapPin size={15} /> {profile.location}
                  </span>
                )}
                <span className="badge badge-primary">{profile.experienceLevel || 'BEGINNER'}</span>
                <StatusBadge status={profile.availability || 'AVAILABLE'} />
                {profile.weeklyHours && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={15} /> {profile.weeklyHours} hrs/week
                  </span>
                )}
              </div>
            </div>
          </div>

          <div>
            {isSelf && (
              <Link to="/profile/edit" className="btn btn-secondary">
                <Edit size={16} /> Edit Profile
              </Link>
            )}
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div style={{ marginTop: '1.75rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem' }}>
              {profile.bio}
            </p>
          </div>
        )}

        {/* Social / Portfolio Links */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
          {profile.githubUrl && (
            <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
              <Github size={15} /> GitHub
            </a>
          )}
          {profile.linkedinUrl && (
            <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
              <Linkedin size={15} /> LinkedIn
            </a>
          )}
          {profile.portfolioUrl && (
            <a href={profile.portfolioUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
              <Globe size={15} /> Portfolio Website
            </a>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Technical Skills */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-main)' }}>
            Technical Skills ({developer.skills?.length || 0})
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(developer.skills || []).map((userSkill) => (
              <div
                key={userSkill.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '6px'
                }}
              >
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  {userSkill.skill.name}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                    {userSkill.proficiency}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {userSkill.yearsOfExperience} {userSkill.yearsOfExperience === 1 ? 'year' : 'years'}
                  </span>
                </div>
              </div>
            ))}

            {(!developer.skills || developer.skills.length === 0) && (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No skills listed yet.</span>
            )}
          </div>
        </div>

        {/* Areas of Interest & Projects */}
        <div>
          {/* Areas of Interest */}
          <div className="card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-main)' }}>
              Collaboration Interests
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {(profile.areasOfInterest || []).map((interest, idx) => (
                <span key={idx} className="badge badge-info" style={{ padding: '0.3rem 0.7rem' }}>
                  {interest}
                </span>
              ))}
              {(!profile.areasOfInterest || profile.areasOfInterest.length === 0) && (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No interests specified.</span>
              )}
            </div>
          </div>

          {/* Owned Projects */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>
              Projects
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(developer.ownedProjects || []).map((p) => (
                <div key={p.id} style={{ padding: '0.75rem', border: '1px solid var(--border-light)', borderRadius: '6px' }}>
                  <Link to={`/projects/${p.slug}`} style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                    {p.title}
                  </Link>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{p.summary}</p>
                </div>
              ))}

              {(!developer.ownedProjects || developer.ownedProjects.length === 0) && (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No public projects published yet.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
