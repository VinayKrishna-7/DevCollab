import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, CheckCircle2, XCircle, Target, ArrowLeft, MessageSquare } from 'lucide-react';
import api from '../api/client.js';
import UserAvatar from '../components/UserAvatar.jsx';
import SkillBadge from '../components/SkillBadge.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import SkeletonLoader from '../components/SkeletonLoader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function ProjectApplications() {
  const { id } = useParams();
  const toast = useToast();

  const [applications, setApplications] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('PENDING'); // 'PENDING' or 'REVIEWED'

  // Action states
  const [actionTarget, setActionTarget] = useState(null); // { app, action: 'accept' | 'reject' }
  const [processing, setProcessing] = useState(false);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const [appRes, projRes] = await Promise.all([
        api.get(`/applications/projects/${id}`),
        api.get(`/projects/me/owned`)
      ]);
      setApplications(appRes.data || []);
      const current = (projRes.data || []).find(p => p.id === id);
      setProject(current);
    } catch (err) {
      toast.error('Failed to load project applications');
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleActionConfirm = async () => {
    if (!actionTarget) return;
    const { app, action } = actionTarget;
    setProcessing(true);

    try {
      if (action === 'accept') {
        await api.patch(`/applications/${app.id}/accept`);
        toast.success(`Application accepted! ${app.applicant.username} is now on the team.`);
      } else {
        await api.patch(`/applications/${app.id}/reject`);
        toast.info('Application rejected.');
      }
      setActionTarget(null);
      fetchApplications();
    } catch (err) {
      toast.error(err.message || `Failed to ${action} application`);
    } finally {
      setProcessing(false);
    }
  };

  const pendingApps = applications.filter(a => a.status === 'PENDING');
  const reviewedApps = applications.filter(a => a.status !== 'PENDING');
  const currentList = activeTab === 'PENDING' ? pendingApps : reviewedApps;

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        {project && (
          <Link to={`/projects/${project.slug}/workspace`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <ArrowLeft size={16} /> Back to Workspace
          </Link>
        )}
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          Candidate Applications {project ? `for "${project.title}"` : ''}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Evaluate applicant skills and estimated compatibility scores before accepting them onto your team.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`btn btn-sm ${activeTab === 'PENDING' ? 'btn-primary' : 'btn-ghost'}`}
        >
          Pending Review ({pendingApps.length})
        </button>
        <button
          onClick={() => setActiveTab('REVIEWED')}
          className={`btn btn-sm ${activeTab === 'REVIEWED' ? 'btn-primary' : 'btn-ghost'}`}
        >
          Reviewed History ({reviewedApps.length})
        </button>
      </div>

      {loading ? (
        <SkeletonLoader count={3} height="180px" />
      ) : currentList.length === 0 ? (
        <EmptyState
          icon={Users}
          title={activeTab === 'PENDING' ? 'No pending applications' : 'No reviewed applications'}
          message={activeTab === 'PENDING' ? 'New join requests will appear here when developers apply.' : 'Reviewed candidates will appear here.'}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {currentList.map((app) => {
            const dev = app.applicant;
            const profile = dev.profile || {};
            const score = app.matchScore;

            return (
              <div key={app.id} className="card" style={{ padding: '1.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <UserAvatar user={dev} size="lg" />
                    <div>
                      <Link to={`/developers/${dev.username}`} style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {profile.displayName || dev.username}
                      </Link>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>@{dev.username} &bull; {profile.experienceLevel}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {score !== undefined && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        backgroundColor: score >= 75 ? 'var(--success-light)' : 'var(--bg-muted)',
                        color: score >= 75 ? 'var(--success-text)' : 'var(--text-secondary)',
                        border: `1px solid ${score >= 75 ? 'var(--success-border)' : 'var(--border-light)'}`
                      }}>
                        <Target size={14} /> {score}% Match
                      </span>
                    )}
                    <StatusBadge status={app.status} />
                  </div>
                </div>

                {/* Match Details if available */}
                {app.matchDetails?.explanation && (
                  <div style={{
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '6px',
                    padding: '0.65rem 0.85rem',
                    fontSize: '0.8125rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '1rem'
                  }}>
                    <strong>Match Breakdown:</strong> {app.matchDetails.explanation}
                  </div>
                )}

                {/* Introductory Message */}
                <div style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '8px',
                  padding: '1rem 1.25rem',
                  marginBottom: '1.25rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    <MessageSquare size={13} /> Applicant Introduction:
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
                    "{app.introductoryMessage}"
                  </p>
                </div>

                {/* Skills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1.25rem' }}>
                  {(dev.skills || []).map((s, idx) => (
                    <SkillBadge key={idx} skill={s} />
                  ))}
                </div>

                {/* Actions for PENDING */}
                {app.status === 'PENDING' && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
                    <button
                      onClick={() => setActionTarget({ app, action: 'reject' })}
                      className="btn btn-secondary"
                    >
                      <XCircle size={16} /> Reject
                    </button>
                    <button
                      onClick={() => setActionTarget({ app, action: 'accept' })}
                      className="btn btn-primary"
                    >
                      <CheckCircle2 size={16} /> Accept to Team
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Action Dialog */}
      <ConfirmDialog
        isOpen={Boolean(actionTarget)}
        onClose={() => setActionTarget(null)}
        onConfirm={handleActionConfirm}
        title={actionTarget?.action === 'accept' ? 'Accept Application' : 'Reject Application'}
        message={
          actionTarget?.action === 'accept'
            ? `Accept ${actionTarget?.app.applicant.username} as an active team member? They will immediately receive access to the private workspace.`
            : `Are you sure you want to decline ${actionTarget?.app.applicant.username}'s application?`
        }
        confirmText={actionTarget?.action === 'accept' ? 'Accept Candidate' : 'Reject Candidate'}
        danger={actionTarget?.action === 'reject'}
        loading={processing}
      />
    </div>
  );
}
