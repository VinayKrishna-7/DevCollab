import React from 'react';
import { Calendar, AlertCircle, User } from 'lucide-react';
import StatusBadge from './StatusBadge.jsx';
import UserAvatar from './UserAvatar.jsx';

export default function TaskCard({ task, onStatusChange, onClick }) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

  return (
    <div
      className="card"
      style={{
        padding: '1rem',
        marginBottom: '0.75rem',
        cursor: onClick ? 'pointer' : 'default',
        borderLeft: `4px solid ${
          task.priority === 'URGENT' ? 'var(--danger)' :
          task.priority === 'HIGH' ? 'var(--warning)' :
          task.priority === 'MEDIUM' ? 'var(--primary)' : 'var(--text-muted)'
        }`
      }}
      onClick={onClick}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <h4 style={{
          fontSize: '0.9375rem',
          fontWeight: 600,
          color: task.status === 'DONE' ? 'var(--text-muted)' : 'var(--text-main)',
          textDecoration: task.status === 'DONE' ? 'line-through' : 'none',
          lineHeight: 1.3
        }}>
          {task.title}
        </h4>
        <StatusBadge status={task.priority} />
      </div>

      {task.description && (
        <p style={{
          fontSize: '0.8125rem',
          color: 'var(--text-muted)',
          marginBottom: '0.75rem',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {task.description}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border-light)' }}>
        {/* Assignee */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {task.assignee ? (
            <>
              <UserAvatar user={task.assignee} size="sm" />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {task.assignee.profile?.displayName || task.assignee.username}
              </span>
            </>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <User size={13} /> Unassigned
            </span>
          )}
        </div>

        {/* Due date and overdue flag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}>
          {task.dueDate && (
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              color: isOverdue ? 'var(--danger)' : 'var(--text-muted)',
              fontWeight: isOverdue ? 600 : 400
            }}>
              {isOverdue ? <AlertCircle size={13} color="var(--danger)" /> : <Calendar size={13} />}
              <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </span>
          )}
        </div>
      </div>

      {/* Quick Status Selector */}
      {onStatusChange && (
        <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-light)' }} onClick={(e) => e.stopPropagation()}>
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value)}
            className="form-select"
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', height: '28px' }}
          >
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="DONE">Done</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </div>
      )}
    </div>
  );
}
