import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, Calendar, FolderGit2 } from 'lucide-react';
import api from '../api/client.js';
import StatusBadge from '../components/StatusBadge.jsx';
import SkeletonLoader from '../components/SkeletonLoader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    async function loadTasks() {
      setLoading(true);
      try {
        const res = await api.get('/tasks/me');
        setTasks(res.data || []);
      } catch (err) {
        toast.error('Failed to load your assigned tasks');
      } finally {
        setLoading(false);
      }
    }
    loadTasks();
  }, [toast]);

  const handleStatusChange = async (taskId, nextStatus) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: nextStatus });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: nextStatus } : t));
      toast.success('Task status updated');
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const filteredTasks = statusFilter ? tasks.filter(t => t.status === statusFilter) : tasks;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            My Assigned Tasks ({tasks.length})
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            All tasks currently assigned to you across your active team workspaces.
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="form-select"
          style={{ width: '160px' }}
        >
          <option value="">All Statuses</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="DONE">Done</option>
          <option value="BLOCKED">Blocked</option>
        </select>
      </div>

      {loading ? (
        <SkeletonLoader count={4} height="80px" />
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks found"
          message={statusFilter ? 'No tasks match the selected status filter.' : 'You have no assigned tasks at the moment.'}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredTasks.map((t) => (
            <div
              key={t.id}
              className="card"
              style={{
                padding: '1.25rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                borderLeft: `4px solid ${
                  t.priority === 'URGENT' ? 'var(--danger)' :
                  t.priority === 'HIGH' ? 'var(--warning)' :
                  t.priority === 'MEDIUM' ? 'var(--primary)' : 'var(--text-muted)'
                }`
              }}
            >
              <div style={{ flex: 1, minWidth: '260px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <Link
                    to={`/projects/${t.project.slug}/workspace/tasks`}
                    style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <FolderGit2 size={13} /> {t.project.title}
                  </Link>
                  <StatusBadge status={t.priority} />
                </div>

                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: t.status === 'DONE' ? 'var(--text-muted)' : 'var(--text-main)',
                  textDecoration: t.status === 'DONE' ? 'line-through' : 'none'
                }}>
                  {t.title}
                </h3>

                {t.dueDate && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.35rem' }}>
                    <Calendar size={13} /> Due: {new Date(t.dueDate).toLocaleDateString()}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <select
                  value={t.status}
                  onChange={(e) => handleStatusChange(t.id, e.target.value)}
                  className="form-select"
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="DONE">Done</option>
                  <option value="BLOCKED">Blocked</option>
                </select>

                <Link to={`/projects/${t.project.slug}/workspace/tasks`} className="btn btn-secondary btn-sm">
                  View Board
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
