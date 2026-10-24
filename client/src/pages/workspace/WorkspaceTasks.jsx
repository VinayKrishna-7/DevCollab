import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, LayoutGrid, List, Search, Filter, Trash2, Calendar, User } from 'lucide-react';
import api from '../../api/client.js';
import TaskCard from '../../components/TaskCard.jsx';
import Modal from '../../components/Modal.jsx';
import FormField from '../../components/FormField.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import UserAvatar from '../../components/UserAvatar.jsx';
import SkeletonLoader from '../../components/SkeletonLoader.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const COLUMNS = [
  { id: 'TODO', title: 'To Do', color: 'var(--text-muted)' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'var(--primary)' },
  { id: 'IN_REVIEW', title: 'In Review', color: 'var(--warning)' },
  { id: 'DONE', title: 'Done', color: 'var(--success)' },
  { id: 'BLOCKED', title: 'Blocked', color: 'var(--danger)' }
];

export default function WorkspaceTasks() {
  const { project } = useOutletContext();
  const { user } = useAuth();
  const toast = useToast();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('board'); // 'board' or 'list'

  // Filters
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');

  // Create Task Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newTaskData, setNewTaskData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    status: 'TODO',
    assigneeId: '',
    dueDate: ''
  });

  // Delete Confirm Dialog state
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/tasks/projects/${project.id}`);
      setTasks(res.data || []);
    } catch (err) {
      toast.error('Failed to load project tasks');
    } finally {
      setLoading(false);
    }
  }, [project.id, toast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleStatusChange = async (taskId, newStatus) => {
    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      toast.success('Task status updated');
    } catch (err) {
      toast.error('Failed to update task status');
      fetchTasks();
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskData.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...newTaskData,
        assigneeId: newTaskData.assigneeId || null,
        dueDate: newTaskData.dueDate ? new Date(newTaskData.dueDate).toISOString() : null
      };

      const res = await api.post(`/tasks/projects/${project.id}`, payload);
      setTasks(prev => [res.data, ...prev]);
      toast.success('Task created successfully');
      setCreateModalOpen(false);
      setNewTaskData({
        title: '',
        description: '',
        priority: 'MEDIUM',
        status: 'TODO',
        assigneeId: '',
        dueDate: ''
      });
    } catch (err) {
      toast.error(err.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      await api.delete(`/tasks/${deleteTargetId}`);
      setTasks(prev => prev.filter(t => t.id !== deleteTargetId));
      toast.success('Task deleted');
      setDeleteTargetId(null);
    } catch (err) {
      toast.error('Failed to delete task');
    } finally {
      setDeleting(false);
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (search && !task.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (priorityFilter && task.priority !== priorityFilter) return false;
    if (assigneeFilter && task.assigneeId !== assigneeFilter) return false;
    return true;
  });

  return (
    <div>
      {/* Action Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ width: '220px' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter tasks..."
              className="form-input"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
            />
          </div>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="form-select"
            style={{ width: '130px', padding: '0.45rem 0.65rem', fontSize: '0.85rem' }}
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>

          {/* Assignee filter */}
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="form-select"
            style={{ width: '150px', padding: '0.45rem 0.65rem', fontSize: '0.85rem' }}
          >
            <option value="">All Members</option>
            {(project.members || []).map(m => (
              <option key={m.userId} value={m.userId}>
                {m.user.profile?.displayName || m.user.username}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* View mode toggle */}
          <div style={{ display: 'flex', border: '1px solid var(--border-light)', borderRadius: '6px', overflow: 'hidden' }}>
            <button
              onClick={() => setViewMode('board')}
              className="btn btn-sm"
              style={{
                borderRadius: 0,
                backgroundColor: viewMode === 'board' ? 'var(--primary)' : 'var(--bg-card)',
                color: viewMode === 'board' ? '#ffffff' : 'var(--text-secondary)'
              }}
              aria-label="Board view"
            >
              <LayoutGrid size={15} /> Board
            </button>
            <button
              onClick={() => setViewMode('list')}
              className="btn btn-sm"
              style={{
                borderRadius: 0,
                backgroundColor: viewMode === 'list' ? 'var(--primary)' : 'var(--bg-card)',
                color: viewMode === 'list' ? '#ffffff' : 'var(--text-secondary)'
              }}
              aria-label="List view"
            >
              <List size={15} /> List
            </button>
          </div>

          <button onClick={() => setCreateModalOpen(true)} className="btn btn-primary btn-sm">
            <Plus size={16} /> Add Task
          </button>
        </div>
      </div>

      {loading ? (
        <SkeletonLoader count={4} height="200px" />
      ) : filteredTasks.length === 0 && tasks.length === 0 ? (
        <EmptyState
          title="No tasks yet"
          message="Keep the team aligned by creating tasks, setting priorities, and assigning responsibilities."
          action={
            <button onClick={() => setCreateModalOpen(true)} className="btn btn-primary">
              <Plus size={16} /> Create First Task
            </button>
          }
        />
      ) : viewMode === 'board' ? (
        /* Kanban Board View */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, minmax(260px, 1fr))',
          gap: '1rem',
          overflowX: 'auto',
          paddingBottom: '1rem'
        }}>
          {COLUMNS.map((col) => {
            const colTasks = filteredTasks.filter(t => t.status === col.id);
            return (
              <div
                key={col.id}
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-light)',
                  padding: '1rem',
                  minHeight: '500px',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1rem',
                  paddingBottom: '0.5rem',
                  borderBottom: `2px solid ${col.color}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.875rem' }}>
                    <span>{col.title}</span>
                    <span style={{
                      backgroundColor: 'var(--bg-muted)',
                      color: 'var(--text-secondary)',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem'
                    }}>
                      {colTasks.length}
                    </span>
                  </div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {colTasks.map(task => (
                    <div key={task.id} style={{ position: 'relative' }}>
                      <TaskCard
                        task={task}
                        onStatusChange={handleStatusChange}
                      />
                    </div>
                  ))}
                  {colTasks.length === 0 && (
                    <div style={{
                      textAlign: 'center',
                      padding: '2rem 1rem',
                      color: 'var(--text-muted)',
                      fontSize: '0.8rem',
                      border: '1px dashed var(--border-light)',
                      borderRadius: '8px'
                    }}>
                      Empty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
              <tr>
                <th style={{ padding: '0.85rem 1rem' }}>Task</th>
                <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                <th style={{ padding: '0.85rem 1rem' }}>Priority</th>
                <th style={{ padding: '0.85rem 1rem' }}>Assignee</th>
                <th style={{ padding: '0.85rem 1rem' }}>Due Date</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {t.title}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <select
                      value={t.status}
                      onChange={(e) => handleStatusChange(t.id, e.target.value)}
                      className="form-select"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="IN_REVIEW">In Review</option>
                      <option value="DONE">Done</option>
                      <option value="BLOCKED">Blocked</option>
                    </select>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <StatusBadge status={t.priority} />
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    {t.assignee ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <UserAvatar user={t.assignee} size="sm" />
                        <span>{t.assignee.profile?.displayName || t.assignee.username}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>
                    )}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                    {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    <button
                      onClick={() => setDeleteTargetId(t.id)}
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--danger)' }}
                      aria-label="Delete task"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Task Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create Workspace Task">
        <form onSubmit={handleCreateTask}>
          <FormField label="Task Title" name="title" required>
            <input
              type="text"
              value={newTaskData.title}
              onChange={(e) => setNewTaskData(prev => ({ ...prev, title: e.target.value }))}
              className="form-input"
              placeholder="e.g. Implement authentication middleware"
              required
            />
          </FormField>

          <FormField label="Description" name="description">
            <textarea
              rows={3}
              value={newTaskData.description}
              onChange={(e) => setNewTaskData(prev => ({ ...prev, description: e.target.value }))}
              className="form-textarea"
              placeholder="Add implementation notes, acceptance criteria, or links..."
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormField label="Priority" name="priority">
              <select
                value={newTaskData.priority}
                onChange={(e) => setNewTaskData(prev => ({ ...prev, priority: e.target.value }))}
                className="form-select"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </FormField>

            <FormField label="Initial Status" name="status">
              <select
                value={newTaskData.status}
                onChange={(e) => setNewTaskData(prev => ({ ...prev, status: e.target.value }))}
                className="form-select"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="BLOCKED">Blocked</option>
              </select>
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormField label="Assign To Member" name="assigneeId">
              <select
                value={newTaskData.assigneeId}
                onChange={(e) => setNewTaskData(prev => ({ ...prev, assigneeId: e.target.value }))}
                className="form-select"
              >
                <option value="">Unassigned</option>
                {(project.members || []).map(m => (
                  <option key={m.userId} value={m.userId}>
                    {m.user.profile?.displayName || m.user.username} {m.role === 'OWNER' ? '(Owner)' : ''}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Due Date" name="dueDate">
              <input
                type="date"
                value={newTaskData.dueDate}
                onChange={(e) => setNewTaskData(prev => ({ ...prev, dueDate: e.target.value }))}
                className="form-input"
              />
            </FormField>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button type="button" onClick={() => setCreateModalOpen(false)} className="btn btn-secondary" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete Task"
        danger
        loading={deleting}
      />
    </div>
  );
}
