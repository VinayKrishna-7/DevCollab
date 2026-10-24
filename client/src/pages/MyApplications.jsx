import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FileCheck2, ArrowRight, RotateCcw } from 'lucide-react';
import api from '../api/client.js';
import StatusBadge from '../components/StatusBadge.jsx';
import SkeletonLoader from '../components/SkeletonLoader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [withdrawTargetId, setWithdrawTargetId] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const toast = useToast();

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/applications/me?status=${statusFilter}` : '/applications/me';
      const res = await api.get(url);
      setApplications(res.data || []);
    } catch (err) {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, toast]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleWithdrawConfirm = async () => {
    if (!withdrawTargetId) return;
    setWithdrawing(true);
    try {
      await api.patch(`/applications/${withdrawTargetId}/withdraw`);
      toast.info('Application withdrawn');
      setWithdrawTargetId(null);
      fetchApplications();
    } catch (err) {
      toast.error(err.message || 'Failed to withdraw application');
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            My Submitted Applications
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Track the status of your join requests to project teams.
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="form-select"
          style={{ width: '160px' }}
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="REJECTED">Rejected</option>
          <option value="WITHDRAWN">Withdrawn</option>
        </select>
      </div>

      {loading ? (
        <SkeletonLoader count={3} height="120px" />
      ) : applications.length === 0 ? (
        <EmptyState
          icon={FileCheck2}
          title="No applications found"
          message="You have no applications matching the selected criteria. Explore recruiting projects to get started!"
          action={
            <Link to="/explore/projects" className="btn btn-primary">
              Explore Projects
            </Link>
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {applications.map((app) => {
            const project = app.project;

            return (
              <div
                key={app.id}
                className="card"
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1.25rem'
                }}
              >
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span className="badge badge-primary">{project.category?.replace(/_/g, ' ')}</span>
                    <StatusBadge status={app.status} />
                  </div>

                  <Link to={`/projects/${project.slug}`} style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {project.title}
                  </Link>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontStyle: 'italic', backgroundColor: 'var(--bg-subtle)', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                    "{app.introductoryMessage}"
                  </p>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    Applied on {new Date(app.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {app.status === 'ACCEPTED' && (
                    <Link to={`/projects/${project.slug}/workspace`} className="btn btn-primary btn-sm">
                      Go to Workspace <ArrowRight size={14} />
                    </Link>
                  )}

                  {app.status === 'PENDING' && (
                    <button
                      onClick={() => setWithdrawTargetId(app.id)}
                      className="btn btn-secondary btn-sm"
                    >
                      Withdraw Request
                    </button>
                  )}

                  <Link to={`/projects/${project.slug}`} className="btn btn-ghost btn-sm">
                    View Project
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Withdraw Dialog */}
      <ConfirmDialog
        isOpen={Boolean(withdrawTargetId)}
        onClose={() => setWithdrawTargetId(null)}
        onConfirm={handleWithdrawConfirm}
        title="Withdraw Join Request"
        message="Are you sure you want to withdraw your application? You will need to submit a new request if you change your mind."
        confirmText="Withdraw"
        danger
        loading={withdrawing}
      />
    </div>
  );
}
