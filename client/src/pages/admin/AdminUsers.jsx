import React, { useState, useEffect, useCallback } from 'react';
import { Users, Search, Shield, Ban, CheckCircle2 } from 'lucide-react';
import api from '../../api/client.js';
import UserAvatar from '../../components/UserAvatar.jsx';
import Modal from '../../components/Modal.jsx';
import FormField from '../../components/FormField.jsx';
import Pagination from '../../components/Pagination.jsx';
import SkeletonLoader from '../../components/SkeletonLoader.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Suspend modal state
  const [suspendModalTarget, setSuspendModalTarget] = useState(null);
  const [suspendReason, setSuspendReason] = useState('Violation of platform community standards');
  const [processing, setProcessing] = useState(false);

  const toast = useToast();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', page);
      params.set('limit', 20);

      const res = await api.get(`/admin/users?${params.toString()}`);
      setUsers(res.data || []);
      if (res.meta?.pagination) {
        setPagination(res.meta.pagination);
      }
    } catch (err) {
      toast.error('Failed to load user directory');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, page, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleSuspension = async (targetUser, shouldSuspend) => {
    setProcessing(true);
    try {
      await api.patch(`/admin/users/${targetUser.id}/status`, {
        isSuspended: shouldSuspend,
        reason: shouldSuspend ? suspendReason : null
      });

      toast.success(shouldSuspend ? 'User suspended and sessions terminated' : 'User account reactivated');
      setSuspendModalTarget(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Action failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
          User Account Management
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Inspect user accounts, manage platform roles, and suspend malicious users.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by username, email, or display name..."
          className="form-input"
          style={{ flex: 1, minWidth: '220px' }}
        />

        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="form-select"
          style={{ width: '140px' }}
        >
          <option value="">All Roles</option>
          <option value="USER">User</option>
          <option value="ADMIN">Admin</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="form-select"
          style={{ width: '150px' }}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <SkeletonLoader count={4} height="80px" />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
              <tr>
                <th style={{ padding: '0.85rem 1.25rem' }}>User</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Email</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Role</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Status</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Activity</th>
                <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSuspended = u.isSuspended;
                const isAdmin = u.role === 'ADMIN';

                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <UserAvatar user={u} size="md" />
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{u.profile?.displayName || u.username}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{u.username}</div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)' }}>
                      {u.email}
                    </td>

                    <td style={{ padding: '1rem 1.25rem' }}>
                      {isAdmin ? (
                        <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Shield size={12} /> Admin
                        </span>
                      ) : (
                        <span className="badge badge-neutral">User</span>
                      )}
                    </td>

                    <td style={{ padding: '1rem 1.25rem' }}>
                      {isSuspended ? (
                        <span className="badge badge-danger">Suspended</span>
                      ) : (
                        <span className="badge badge-success">Active</span>
                      )}
                    </td>

                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {u._count?.ownedProjects || 0} projects &bull; {u._count?.memberships || 0} teams
                    </td>

                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      {!isAdmin && (
                        isSuspended ? (
                          <button
                            onClick={() => handleToggleSuspension(u, false)}
                            className="btn btn-secondary btn-sm"
                            style={{ color: 'var(--success)' }}
                          >
                            <CheckCircle2 size={14} /> Reactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSuspendModalTarget(u);
                              setSuspendReason('Violation of platform community standards');
                            }}
                            className="btn btn-ghost btn-sm"
                            style={{ color: '#ef4444' }}
                          >
                            <Ban size={14} /> Suspend
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}
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

      {/* Suspend Confirmation Modal */}
      <Modal
        isOpen={Boolean(suspendModalTarget)}
        onClose={() => setSuspendModalTarget(null)}
        title={`Suspend Account: @${suspendModalTarget?.username}`}
      >
        <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>
          Suspending this account will immediately destroy all active user sessions and block future authentication attempts.
        </p>

        <FormField label="Reason for Suspension" name="suspendReason" required>
          <input
            type="text"
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
            className="form-input"
            required
          />
        </FormField>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button type="button" onClick={() => setSuspendModalTarget(null)} className="btn btn-secondary" disabled={processing}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleToggleSuspension(suspendModalTarget, true)}
            className="btn btn-danger"
            disabled={processing}
          >
            {processing ? 'Suspending...' : 'Confirm Suspension'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
