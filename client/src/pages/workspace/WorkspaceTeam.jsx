import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import { Users, UserMinus, LogOut, Shield, User } from 'lucide-react';
import api from '../../api/client.js';
import UserAvatar from '../../components/UserAvatar.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import SkeletonLoader from '../../components/SkeletonLoader.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function WorkspaceTeam() {
  const { project, isOwner, refreshProject } = useOutletContext();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Remove member confirm
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);

  // Leave project confirm
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/memberships/projects/${project.id}/members`);
      setMembers(res.data || []);
    } catch (err) {
      toast.error('Failed to load team roster');
    } finally {
      setLoading(false);
    }
  }, [project.id, toast]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleRemoveMember = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await api.delete(`/memberships/projects/${project.id}/members/${removeTarget.userId}`);
      toast.success('Member removed from team');
      setRemoveTarget(null);
      fetchMembers();
      refreshProject();
    } catch (err) {
      toast.error(err.message || 'Failed to remove member');
    } finally {
      setRemoving(false);
    }
  };

  const handleLeaveProject = async () => {
    setLeaving(true);
    try {
      await api.post(`/memberships/projects/${project.id}/leave`);
      toast.info('You have left the project team.');
      navigate(`/projects/${project.slug}`);
    } catch (err) {
      toast.error(err.message || 'Could not leave project');
    } finally {
      setLeaving(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Team Roster ({members.length} / {project.desiredTeamSize})
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Active collaborators with workspace access to tasks, discussions, and project resources.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {isOwner && (
            <Link to={`/projects/${project.id}/applications`} className="btn btn-secondary btn-sm">
              <Users size={15} /> Review Join Requests
            </Link>
          )}

          {!isOwner && (
            <button onClick={() => setLeaveModalOpen(true)} className="btn btn-danger btn-sm">
              <LogOut size={15} /> Leave Project
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <SkeletonLoader count={3} height="80px" />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
              <tr>
                <th style={{ padding: '0.85rem 1.25rem' }}>Collaborator</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Role</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Experience</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Joined Date</th>
                {isOwner && <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const profile = m.user.profile || {};
                const displayName = profile.displayName || m.user.username;
                const isProjectOwner = m.role === 'OWNER';

                return (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <UserAvatar user={m.user} size="md" />
                        <div>
                          <Link to={`/developers/${m.user.username}`} style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                            {displayName}
                          </Link>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{m.user.username}</div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '1rem 1.25rem' }}>
                      {isProjectOwner ? (
                        <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Shield size={12} /> Project Owner
                        </span>
                      ) : (
                        <span className="badge badge-neutral">Team Member</span>
                      )}
                    </td>

                    <td style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)' }}>
                      {profile.experienceLevel || 'Beginner'}
                    </td>

                    <td style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)' }}>
                      {new Date(m.joinedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>

                    {isOwner && (
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        {!isProjectOwner && (
                          <button
                            onClick={() => setRemoveTarget(m)}
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--danger)' }}
                            title="Remove member"
                          >
                            <UserMinus size={15} /> Remove
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Remove Member Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemoveMember}
        title="Remove Member from Team"
        message={`Are you sure you want to remove ${removeTarget?.user?.username} from this project? Their active tasks will be unassigned and their private workspace access will be revoked immediately.`}
        confirmText="Remove Member"
        danger
        loading={removing}
      />

      {/* Leave Project Confirmation */}
      <ConfirmDialog
        isOpen={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
        onConfirm={handleLeaveProject}
        title="Leave Project Team"
        message="Are you sure you want to leave this project team? You will lose access to the private workspace immediately."
        confirmText="Confirm Leave"
        danger
        loading={leaving}
      />
    </div>
  );
}
