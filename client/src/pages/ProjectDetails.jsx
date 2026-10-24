import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Calendar,
  Bookmark,
  Github,
  ExternalLink,
  Target,
  Clock,
  ArrowRight,
  ShieldAlert,
  Send
} from 'lucide-react';
import api from '../api/client.js';
import StatusBadge from '../components/StatusBadge.jsx';
import SkillBadge from '../components/SkillBadge.jsx';
import UserAvatar from '../components/UserAvatar.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorState from '../components/ErrorState.jsx';
import Modal from '../components/Modal.jsx';
import FormField from '../components/FormField.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function ProjectDetails() {
  const { slug } = useParams();
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Application Modal state
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [introductoryMessage, setIntroductoryMessage] = useState('');
  const [applying, setApplying] = useState(false);

  // Report Modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('SPAM');
  const [reportExplanation, setReportExplanation] = useState('');
  const [reporting, setReporting] = useState(false);

  const fetchProjectDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/projects/${slug}`);
      setProject(res.data);

      // If user is authenticated and not owner, fetch match breakdown
      if (isAuthenticated && user && res.data.ownerId !== user.id) {
        try {
          const matchRes = await api.get(`/recommendations/projects/${res.data.id}/match/${user.id}`);
          setMatchData(matchRes.data);
        } catch (e) {
          // ignore match fetch failure
        }
      }
    } catch (err) {
      setError(err.message || 'Could not load project');
    } finally {
      setLoading(false);
    }
  }, [slug, isAuthenticated, user]);

  useEffect(() => {
    fetchProjectDetails();
  }, [fetchProjectDetails]);

  const handleBookmarkToggle = async () => {
    if (!isAuthenticated) {
      toast.info('Please sign in to bookmark projects');
      return;
    }

    try {
      const res = await api.post(`/projects/${project.id}/bookmark`);
      setProject(prev => ({ ...prev, isBookmarked: res.data?.bookmarked }));
      toast.success(res.data?.bookmarked ? 'Project bookmarked' : 'Bookmark removed');
    } catch (err) {
      toast.error('Failed to toggle bookmark');
    }
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!introductoryMessage.trim() || introductoryMessage.length < 10) {
      toast.error('Introductory message must be at least 10 characters.');
      return;
    }

    setApplying(true);
    try {
      const res = await api.post(`/applications/projects/${project.id}`, { introductoryMessage });
      toast.success('Your application has been submitted to the project owner!');
      setApplyModalOpen(false);
      setIntroductoryMessage('');
      setProject(prev => ({ ...prev, userApplication: res.data }));
    } catch (err) {
      toast.error(err.message || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  const handleWithdrawApplication = async () => {
    if (!project.userApplication) return;
    try {
      await api.patch(`/applications/${project.userApplication.id}/withdraw`);
      toast.info('Application withdrawn');
      setProject(prev => ({ ...prev, userApplication: { ...prev.userApplication, status: 'WITHDRAWN' } }));
    } catch (err) {
      toast.error('Failed to withdraw application');
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setReporting(true);
    try {
      await api.post('/reports', {
        targetType: 'PROJECT',
        projectId: project.id,
        reason: reportReason,
        explanation: reportExplanation
      });
      toast.success('Report submitted for administrator review.');
      setReportModalOpen(false);
      setReportExplanation('');
    } catch (err) {
      toast.error(err.message || 'Failed to submit report');
    } finally {
      setReporting(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage text="Loading project details..." />;
  if (error || !project) return <ErrorState message={error || 'Project not found'} onRetry={fetchProjectDetails} />;

  const isOwner = user && project.ownerId === user.id;
  const isMember = user && project.members?.some(m => m.userId === user.id);
  const hasPendingApp = project.userApplication?.status === 'PENDING';
  const memberCount = project.members?.length || 1;
  const isTeamFull = memberCount >= project.desiredTeamSize;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Match Banner if available */}
      {matchData && (
        <div style={{
          backgroundColor: matchData.score >= 70 ? 'var(--success-light)' : 'var(--bg-muted)',
          border: `1px solid ${matchData.score >= 70 ? 'var(--success-border)' : 'var(--border-light)'}`,
          borderRadius: '10px',
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: matchData.score >= 70 ? 'var(--success-text)' : 'var(--text-main)', marginBottom: '0.25rem' }}>
              <Target size={18} />
              <span>Skill Match: {matchData.score}% Compatibility</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
              {matchData.explanation}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {matchData.matchedSkills.map((s, idx) => (
              <span key={idx} className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                ✓ {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main Header Card */}
      <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              <span className="badge badge-primary">{project.category.replace(/_/g, ' ')}</span>
              <StatusBadge status={project.recruitmentStatus} />
              <span className="badge badge-neutral">{project.collaborationType.replace(/_/g, ' ')}</span>
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {project.title}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={handleBookmarkToggle}
              className="btn btn-secondary"
              aria-label="Bookmark"
            >
              <Bookmark size={18} fill={project.isBookmarked ? 'var(--primary)' : 'none'} color={project.isBookmarked ? 'var(--primary)' : 'currentColor'} />
              {project.isBookmarked ? 'Saved' : 'Bookmark'}
            </button>

            <button
              onClick={() => setReportModalOpen(true)}
              className="btn btn-ghost"
              style={{ color: 'var(--text-muted)' }}
              title="Report Project"
            >
              <ShieldAlert size={18} />
            </button>
          </div>
        </div>

        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.75rem' }}>
          {project.summary}
        </p>

        {/* Action Bar */}
        <div style={{
          backgroundColor: 'var(--bg-subtle)',
          border: '1px solid var(--border-light)',
          borderRadius: '8px',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Users size={16} /> Team: <strong style={{ color: 'var(--text-main)' }}>{memberCount} / {project.desiredTeamSize}</strong>
            </span>
            {project.expectedDuration && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={16} /> Duration: <strong style={{ color: 'var(--text-main)' }}>{project.expectedDuration}</strong>
              </span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={16} /> Created: <strong style={{ color: 'var(--text-main)' }}>{new Date(project.createdAt).toLocaleDateString()}</strong>
            </span>
          </div>

          <div>
            {isOwner ? (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Link to={`/projects/${project.id}/applications`} className="btn btn-secondary">
                  Review Applications ({project._count?.joinRequests || 0})
                </Link>
                <Link to={`/projects/${project.slug}/workspace`} className="btn btn-primary">
                  Go to Workspace <ArrowRight size={16} />
                </Link>
              </div>
            ) : isMember ? (
              <Link to={`/projects/${project.slug}/workspace`} className="btn btn-primary">
                Open Team Workspace <ArrowRight size={16} />
              </Link>
            ) : hasPendingApp ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="badge badge-warning" style={{ padding: '0.4rem 0.8rem' }}>
                  Application Pending Review
                </span>
                <button onClick={handleWithdrawApplication} className="btn btn-secondary btn-sm">
                  Withdraw
                </button>
              </div>
            ) : project.recruitmentStatus !== 'RECRUITING' ? (
              <span className="badge badge-neutral" style={{ padding: '0.4rem 0.8rem' }}>
                Recruitment Closed
              </span>
            ) : isTeamFull ? (
              <span className="badge badge-neutral" style={{ padding: '0.4rem 0.8rem' }}>
                Team Capacity Reached
              </span>
            ) : (
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    navigate('/login');
                  } else {
                    setApplyModalOpen(true);
                  }
                }}
                className="btn btn-primary btn-lg"
              >
                Apply to Join Team
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Description & Sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div>
          {/* Detailed Description */}
          <div className="card" style={{ padding: '1.75rem', marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>
              About the Project
            </h2>
            <div style={{ color: 'var(--text-main)', lineHeight: 1.7, fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>
              {project.description}
            </div>
          </div>

          {/* Links */}
          {(project.repoUrl || project.demoUrl) && (
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.75rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>External Resources</h3>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {project.repoUrl && (
                  <a href={project.repoUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                    <Github size={15} /> Source Repository <ExternalLink size={12} />
                  </a>
                )}
                {project.demoUrl && (
                  <a href={project.demoUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                    Live Demo <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Skills & Team Members */}
        <div>
          {/* Required Skills */}
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.85rem', color: 'var(--text-main)' }}>
              Required Technical Skills
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              {(project.skills || []).map((s, idx) => (
                <SkillBadge key={idx} skill={s} />
              ))}
              {(!project.skills || project.skills.length === 0) && (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No specific skills specified.</span>
              )}
            </div>
          </div>

          {/* Team Roster */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>
              Current Team ({memberCount})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Owner */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <UserAvatar user={project.owner} size="md" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link to={`/developers/${project.owner.username}`} style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    {project.owner.profile?.displayName || project.owner.username}
                  </Link>
                  <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 500 }}>Project Creator & Owner</div>
                </div>
              </div>

              {/* Members */}
              {(project.members || [])
                .filter(m => m.userId !== project.ownerId)
                .map(m => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <UserAvatar user={m.user} size="md" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link to={`/developers/${m.user.username}`} style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        {m.user.profile?.displayName || m.user.username}
                      </Link>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Team Member</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Apply to Join Modal */}
      <Modal isOpen={applyModalOpen} onClose={() => setApplyModalOpen(false)} title={`Apply to Join: ${project.title}`}>
        <form onSubmit={handleApplySubmit}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Introduce yourself to the project owner. Describe your relevant technical skills, past experience, and how much time you can dedicate.
          </p>

          <FormField label="Application Message" name="introductoryMessage" required>
            <textarea
              id="introductoryMessage"
              rows={5}
              value={introductoryMessage}
              onChange={(e) => setIntroductoryMessage(e.target.value)}
              className="form-textarea"
              placeholder="Hi! I saw you are looking for a developer with experience in React and Node.js. I've built several full-stack apps and would love to help architect..."
              required
            />
          </FormField>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button type="button" onClick={() => setApplyModalOpen(false)} className="btn btn-secondary" disabled={applying}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={applying}>
              <Send size={15} /> {applying ? 'Submitting...' : 'Send Application'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Report Modal */}
      <Modal isOpen={reportModalOpen} onClose={() => setReportModalOpen(false)} title="Report Project Listing">
        <form onSubmit={handleReportSubmit}>
          <FormField label="Reason for report" name="reportReason" required>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="form-select"
            >
              <option value="SPAM">Spam or misleading listing</option>
              <option value="INAPPROPRIATE">Inappropriate or offensive content</option>
              <option value="HARASSMENT">Harassment or abusive behavior</option>
              <option value="OTHER">Other violation</option>
            </select>
          </FormField>

          <FormField label="Details / Explanation" name="reportExplanation">
            <textarea
              rows={4}
              value={reportExplanation}
              onChange={(e) => setReportExplanation(e.target.value)}
              className="form-textarea"
              placeholder="Please provide any additional context..."
            />
          </FormField>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" onClick={() => setReportModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-danger" disabled={reporting}>
              {reporting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
