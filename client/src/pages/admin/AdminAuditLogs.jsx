import React, { useState, useEffect, useCallback } from 'react';
import { ListOrdered, Clock, Shield } from 'lucide-react';
import api from '../../api/client.js';
import Pagination from '../../components/Pagination.jsx';
import SkeletonLoader from '../../components/SkeletonLoader.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchLogs = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/audit-logs?page=${p}&limit=25`);
      setLogs(res.data || []);
      if (res.meta?.pagination) {
        setPagination(res.meta.pagination);
      }
    } catch (err) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLogs(page);
  }, [fetchLogs, page]);

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
          Administrative Audit Trail
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Immutable log of all administrative actions, suspensions, skill modifications, and report resolutions.
        </p>
      </div>

      {loading ? (
        <SkeletonLoader count={5} height="70px" />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={ListOrdered}
          title="No audit entries"
          message="Administrative events will be logged here as actions occur."
        />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
              <tr>
                <th style={{ padding: '0.85rem 1.25rem' }}>Action</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Admin Actor</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Target Type</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Details / Metadata</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    <span className="badge badge-primary">{log.action}</span>
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', fontWeight: 500, color: 'var(--text-main)' }}>
                    @{log.actor?.username || 'admin'}
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    <span className="badge badge-neutral">{log.targetType}</span>
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {log.metadata || '—'}
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {new Date(log.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(p) => setPage(p)}
            totalItems={pagination.total}
          />
        </div>
      )}
    </div>
  );
}
