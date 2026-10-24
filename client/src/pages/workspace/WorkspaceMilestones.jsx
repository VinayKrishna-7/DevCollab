import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Flag, Plus, CheckCircle2, Clock, Trash2, Calendar } from 'lucide-react';
import api from '../../api/client.js';
import Modal from '../../components/Modal.jsx';
import FormField from '../../components/FormField.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import SkeletonLoader from '../../components/SkeletonLoader.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function WorkspaceMilestones() {
  const { project } = useOutletContext();
  const toast = useToast();

  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    description: '',
    dueDate: '',
    status: 'UPCOMING'
  });

  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchMilestones = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/milestones/projects/${project.id}`);
      setMilestones(res.data || []);
    } catch (err) {
      toast.error('Failed to load milestones');
    } finally {
      setLoading(false);
    }
  }, [project.id, toast]);

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    if (!newMilestone.title.trim()) {
      toast.error('Title is required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...newMilestone,
        dueDate: newMilestone.dueDate ? new Date(newMilestone.dueDate).toISOString() : null
      };

      const res = await api.post(`/milestones/projects/${project.id}`, payload);
      setMilestones(prev => [...prev, res.data]);
      toast.success('Milestone created');
      setCreateModalOpen(false);
      setNewMilestone({ title: '', description: '', dueDate: '', status: 'UPCOMING' });
    } catch (err) {
      toast.error(err.message || 'Failed to create milestone');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (milestoneId, nextStatus) => {
    try {
      const res = await api.patch(`/milestones/${milestoneId}`, { status: nextStatus });
      setMilestones(prev => prev.map(m => m.id === milestoneId ? res.data : m));
      toast.success('Milestone status updated');
    } catch (err) {
      toast.error('Failed to update milestone');
    }
  };

  const handleDeleteMilestone = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      await api.delete(`/milestones/${deleteTargetId}`);
      setMilestones(prev => prev.filter(m => m.id !== deleteTargetId));
      toast.success('Milestone deleted');
      setDeleteTargetId(null);
    } catch (err) {
      toast.error('Failed to delete milestone');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Project Milestones & Roadmap
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            High-level delivery goals and deadlines for the project.
          </p>
        </div>

        <button onClick={() => setCreateModalOpen(true)} className="btn btn-primary btn-sm">
          <Plus size={16} /> Add Milestone
        </button>
      </div>

      {loading ? (
        <SkeletonLoader count={3} height="100px" />
      ) : milestones.length === 0 ? (
        <EmptyState
          icon={Flag}
          title="No milestones yet"
          message="Set roadmap milestones to chart the project's progress."
          action={
            <button onClick={() => setCreateModalOpen(true)} className="btn btn-primary">
              <Plus size={16} /> Add First Milestone
            </button>
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {milestones.map((m) => {
            const isCompleted = m.status === 'COMPLETED';

            return (
              <div
                key={m.id}
                className="card"
                style={{
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '1.5rem',
                  borderLeft: `4px solid ${isCompleted ? 'var(--success)' : 'var(--primary)'}`
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                    <h3 style={{
                      fontSize: '1.05rem',
                      fontWeight: 600,
                      color: isCompleted ? 'var(--text-muted)' : 'var(--text-main)',
                      textDecoration: isCompleted ? 'line-through' : 'none'
                    }}>
                      {m.title}
                    </h3>
                    <StatusBadge status={m.status} />
                  </div>

                  {m.description && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                      {m.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {m.dueDate && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Calendar size={13} /> Due: {new Date(m.dueDate).toLocaleDateString()}
                      </span>
                    )}
                    {m.completedAt && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--success)' }}>
                        <CheckCircle2 size={13} /> Completed on {new Date(m.completedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <select
                    value={m.status}
                    onChange={(e) => handleStatusChange(m.id, e.target.value)}
                    className="form-select"
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                  >
                    <option value="UPCOMING">Upcoming</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>

                  <button
                    onClick={() => setDeleteTargetId(m.id)}
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--danger)' }}
                    aria-label="Delete milestone"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create Project Milestone">
        <form onSubmit={handleCreateMilestone}>
          <FormField label="Milestone Title" name="title" required>
            <input
              type="text"
              value={newMilestone.title}
              onChange={(e) => setNewMilestone(prev => ({ ...prev, title: e.target.value }))}
              className="form-input"
              placeholder="e.g. M1: Production API Deployment"
              required
            />
          </FormField>

          <FormField label="Description" name="description">
            <textarea
              rows={3}
              value={newMilestone.description}
              onChange={(e) => setNewMilestone(prev => ({ ...prev, description: e.target.value }))}
              className="form-textarea"
              placeholder="Key targets, deliverables, or criteria for completion..."
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormField label="Target Due Date" name="dueDate">
              <input
                type="date"
                value={newMilestone.dueDate}
                onChange={(e) => setNewMilestone(prev => ({ ...prev, dueDate: e.target.value }))}
                className="form-input"
              />
            </FormField>

            <FormField label="Status" name="status">
              <select
                value={newMilestone.status}
                onChange={(e) => setNewMilestone(prev => ({ ...prev, status: e.target.value }))}
                className="form-select"
              >
                <option value="UPCOMING">Upcoming</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </FormField>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button type="button" onClick={() => setCreateModalOpen(false)} className="btn btn-secondary" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Milestone'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteMilestone}
        title="Delete Milestone"
        message="Are you sure you want to delete this milestone?"
        confirmText="Delete"
        danger
        loading={deleting}
      />
    </div>
  );
}
