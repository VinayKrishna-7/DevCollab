import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FolderGit2, Plus, Users, ArrowRight } from 'lucide-react';
import api from '../api/client.js';
import StatusBadge from '../components/StatusBadge.jsx';
import SkeletonLoader from '../components/SkeletonLoader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function MyProjects() {
  const [tab, setTab] = useState('owned'); // 'owned' or 'joined'
  const [ownedProjects, setOwnedProjects] = useState([]);
  const [joinedProjects, setJoinedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    async function loadProjects() {
      setLoading(true);
      try {
        const [ownedRes, joinedRes] = await Promise.all([
          api.get('/projects/me/owned'),
          api.get('/projects/me/joined')
        ]);
        setOwnedProjects(ownedRes.data || []);
        setJoinedProjects(joinedRes.data || []);
      } catch (err) {
        toast.error('Failed to load your projects');
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, [toast]);

  const currentList = tab === 'owned' ? ownedProjects : joinedProjects;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            My Projects & Teams
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Manage the software projects you own and collaborative teams you have joined.
          </p>
        </div>

        <Link to="/projects/new" className="btn btn-primary">
          <Plus size={16} /> Create Project
        </Link>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setTab('owned')}
          className={`btn btn-sm ${tab === 'owned' ? 'btn-primary' : 'btn-ghost'}`}
        >
          Owned Projects ({ownedProjects.length})
        </button>
        <button
          onClick={() => setTab('joined')}
          className={`btn btn-sm ${tab === 'joined' ? 'btn-primary' : 'btn-ghost'}`}
        >
          Joined Teams ({joinedProjects.length})
        </button>
      </div>

      {loading ? (
        <SkeletonLoader count={3} height="120px" />
      ) : currentList.length === 0 ? (
        <EmptyState
          icon={FolderGit2}
          title={tab === 'owned' ? 'No projects created yet' : 'Not a member of any projects yet'}
          message={tab === 'owned' ? 'Publish a project listing to find teammates.' : 'Browse open recruiting projects and apply to join!'}
          action={
            tab === 'owned' ? (
              <Link to="/projects/new" className="btn btn-primary">
                <Plus size={16} /> Create Project
              </Link>
            ) : (
              <Link to="/explore/projects" className="btn btn-primary">
                Browse Projects
              </Link>
            )
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {currentList.map((p) => {
            const memberCount = p._count?.members || p.members?.length || 1;
            const applicantCount = p._count?.joinRequests || 0;

            return (
              <div
                key={p.id}
                className="card"
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1.25rem'
                }}
              >
                <div style={{ flex: 1, minWidth: '260px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-primary">{p.category?.replace(/_/g, ' ')}</span>
                    <StatusBadge status={p.recruitmentStatus} />
                  </div>

                  <Link to={`/projects/${p.slug}`} style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {p.title}
                  </Link>

                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem', marginBottom: '0.75rem', maxWidth: '600px' }}>
                    {p.summary}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Users size={14} /> {memberCount} / {p.desiredTeamSize} members
                    </span>
                    {tab === 'owned' && applicantCount > 0 && (
                      <span className="badge badge-warning">
                        {applicantCount} pending join request{applicantCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {tab === 'owned' && (
                    <Link to={`/projects/${p.id}/applications`} className="btn btn-secondary btn-sm">
                      Applications ({applicantCount})
                    </Link>
                  )}

                  <Link to={`/projects/${p.slug}/workspace`} className="btn btn-primary btn-sm">
                    Workspace <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
