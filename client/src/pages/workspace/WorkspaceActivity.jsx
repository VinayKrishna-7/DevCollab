import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Activity, Clock } from 'lucide-react';
import api from '../../api/client.js';
import UserAvatar from '../../components/UserAvatar.jsx';
import Pagination from '../../components/Pagination.jsx';
import SkeletonLoader from '../../components/SkeletonLoader.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function WorkspaceActivity() {
  const { project } = useOutletContext();
  const toast = useToast();

  const [activities, setActivities] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const fetchActivity = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/activity/projects/${project.id}?page=${page}&limit=20`);
      setActivities(res.data || []);
      if (res.meta?.pagination) {
        setPagination(res.meta.pagination);
      }
    } catch (err) {
      toast.error('Failed to load project activity');
    } finally {
      setLoading(false);
    }
  }, [project.id, toast]);

  useEffect(() => {
    fetchActivity(1);
  }, [fetchActivity]);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>
          Project Activity Feed
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Chronological record of project modifications, team changes, tasks, and milestone deliveries.
        </p>
      </div>

      {loading ? (
        <SkeletonLoader count={5} height="70px" />
      ) : activities.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No activity yet"
          message="Activity will appear here as your team collaborates on tasks and milestones."
        />
      ) : (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {activities.map((act) => {
              const actorName = act.actor?.profile?.displayName || act.actor?.username || 'System';

              return (
                <div
                  key={act.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    paddingBottom: '1.25rem',
                    borderBottom: '1px solid var(--border-light)'
                  }}
                >
                  <UserAvatar user={act.actor} size="md" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      <strong>{actorName}</strong>{' '}
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {act.action.replace(/_/g, ' ').toLowerCase()}
                      </span>
                    </div>

                    {act.metadata && (
                      <div style={{
                        marginTop: '0.35rem',
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)',
                        fontFamily: 'monospace',
                        backgroundColor: 'var(--bg-subtle)',
                        border: '1px solid var(--border-light)',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        display: 'inline-block'
                      }}>
                        {act.metadata}
                      </div>
                    )}

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={12} />
                      <span>{new Date(act.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(p) => fetchActivity(p)}
            totalItems={pagination.total}
          />
        </div>
      )}
    </div>
  );
}
