import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, CheckCircle2, XCircle, Clock } from 'lucide-react';
import api from '../../api/client.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import Modal from '../../components/Modal.jsx';
import FormField from '../../components/FormField.jsx';
import SkeletonLoader from '../../components/SkeletonLoader.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [loading, setLoading] = useState(true);

  // Review modal state
  const [activeReport, setActiveReport] = useState(null);
  const [reviewAction, setReviewAction] = useState('RESOLVED');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toast = useToast();

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/reports/admin?status=${statusFilter}` : '/reports/admin';
      const res = await api.get(url);
      setReports(res.data || []);
    } catch (err) {
      toast.error('Failed to load moderation reports');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, toast]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleResolveReport = async (e) => {
    e.preventDefault();
    if (!activeReport) return;
    setSubmitting(true);

    try {
      await api.patch(`/reports/admin/${activeReport.id}`, {
        status: reviewAction,
        notes: reviewNotes
      });

      toast.success(`Report marked as ${reviewAction.toLowerCase()}`);
      setActiveReport(null);
      setReviewNotes('');
      fetchReports();
    } catch (err) {
      toast.error(err.message || 'Failed to update report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
            Content Moderation Reports
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Review flagged project listings and user reports.
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="form-select"
          style={{ width: '160px' }}
        >
          <option value="PENDING">Pending Review</option>
          <option value="RESOLVED">Resolved</option>
          <option value="DISMISSED">Dismissed</option>
          <option value="">All Reports</option>
        </select>
      </div>

      {loading ? (
        <SkeletonLoader count={3} height="120px" />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="No reports in queue"
          message="No content reports matching the selected status."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {reports.map((r) => (
            <div key={r.id} className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span className="badge badge-danger">{r.reason}</span>
                    <span className="badge badge-neutral">{r.targetType}</span>
                    <StatusBadge status={r.status} />
                  </div>

                  {r.project && (
                    <div style={{ marginTop: '0.25rem' }}>
                      Reported Project:{' '}
                      <Link to={`/projects/${r.project.slug}`} style={{ fontWeight: 600, color: 'var(--primary)' }}>
                        {r.project.title}
                      </Link>
                    </div>
                  )}
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Clock size={13} /> {new Date(r.createdAt).toLocaleDateString()}
                </div>
              </div>

              {r.explanation && (
                <p style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-secondary)',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-light)',
                  padding: '0.75rem 1rem',
                  borderRadius: '6px',
                  marginBottom: '1rem'
                }}>
                  "{r.explanation}"
                </p>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>Reported by: @{r.reporter?.username} ({r.reporter?.email})</span>

                {r.status === 'PENDING' && (
                  <button
                    onClick={() => {
                      setActiveReport(r);
                      setReviewAction('RESOLVED');
                      setReviewNotes('');
                    }}
                    className="btn btn-secondary btn-sm"
                  >
                    Moderate & Resolve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      <Modal
        isOpen={Boolean(activeReport)}
        onClose={() => setActiveReport(null)}
        title="Moderate Report"
      >
        <form onSubmit={handleResolveReport}>
          <FormField label="Moderation Action" name="reviewAction" required>
            <select
              value={reviewAction}
              onChange={(e) => setReviewAction(e.target.value)}
              className="form-select"
            >
              <option value="RESOLVED">Resolve (Action Taken / Validated)</option>
              <option value="DISMISSED">Dismiss (False Alarm / No Action)</option>
            </select>
          </FormField>

          <FormField label="Resolution Notes" name="reviewNotes">
            <textarea
              rows={3}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="form-textarea"
              placeholder="Notes on resolution (e.g. project investigated, owner warned, or dismissed as benign)..."
            />
          </FormField>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button type="button" onClick={() => setActiveReport(null)} className="btn btn-secondary" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Submit Resolution'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
