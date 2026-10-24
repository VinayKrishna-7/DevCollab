import React, { useState, useEffect } from 'react';
import { KeyRound, ShieldAlert, AlertTriangle, Monitor, ShieldCheck, LogOut, CheckCircle2 } from 'lucide-react';
import api from '../api/client.js';
import FormField from '../components/FormField.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import SkeletonLoader from '../components/SkeletonLoader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const toast = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Active Sessions
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [revokingOthers, setRevokingOthers] = useState(false);

  // Deactivate
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const fetchSessions = async () => {
    try {
      const res = await api.get('/auth/sessions');
      setSessions(res.data || []);
    } catch (err) {
      // Handled silently
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevokeOthers = async () => {
    setRevokingOthers(true);
    try {
      await api.post('/auth/sessions/revoke-others');
      toast.success('Signed out of all other devices successfully');
      await fetchSessions();
    } catch (err) {
      toast.error('Failed to revoke other sessions');
    } finally {
      setRevokingOthers(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeactivateAccount = async () => {
    setDeactivating(true);
    try {
      await api.post('/auth/deactivate');
      toast.info('Your account has been deactivated.');
      logout();
    } catch (err) {
      toast.error(err.message || 'Failed to deactivate account');
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
          Account Settings
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Manage your credentials, password security, and account status.
        </p>
      </div>

      {/* Change Password Card */}
      <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <KeyRound size={20} color="var(--primary)" />
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Change Password
          </h2>
        </div>

        <form onSubmit={handlePasswordChange}>
          <FormField label="Current Password" name="currentPassword" required>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="form-input"
              placeholder="••••••••"
              required
            />
          </FormField>

          <FormField label="New Password" name="newPassword" required hint="At least 8 characters">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="form-input"
              placeholder="••••••••"
              required
            />
          </FormField>

          <FormField label="Confirm New Password" name="confirmPassword" required>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-input"
              placeholder="••••••••"
              required
            />
          </FormField>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
            <button type="submit" className="btn btn-primary" disabled={passwordLoading}>
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Login Sessions & Remembered Devices */}
      <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={20} color="var(--primary)" />
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Active Sessions & Saved Login
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Devices and browsers where your account is currently remembered
              </p>
            </div>
          </div>

          {sessions.length > 1 && (
            <button
              onClick={handleRevokeOthers}
              disabled={revokingOthers}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.8rem' }}
            >
              <LogOut size={14} /> {revokingOthers ? 'Signing out...' : 'Sign Out Other Devices'}
            </button>
          )}
        </div>

        {sessionsLoading ? (
          <SkeletonLoader count={2} height="65px" />
        ) : sessions.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No session data available.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {sessions.map((s) => (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-subtle)',
                  border: s.isCurrent ? '1px solid var(--primary-border)' : '1px solid var(--border-light)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <Monitor size={18} color={s.isCurrent ? 'var(--primary)' : 'var(--text-muted)'} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>
                        {s.userAgent?.includes('Mozilla') ? (s.userAgent.split(' ')[0] || 'Web Browser') : 'Web Browser'}
                      </strong>
                      {s.isCurrent && (
                        <span className="badge badge-primary" style={{ fontSize: '0.7rem', padding: '0.1rem 0.45rem' }}>
                          Current Device
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      IP: {s.ipAddress || '127.0.0.1'} &bull; Logged in: {new Date(s.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })} &bull; Active until: {new Date(s.expiresAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--success)', fontSize: '0.75rem', fontWeight: 500 }}>
                  <CheckCircle2 size={14} /> Remembered
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danger Zone: Account Deactivation */}
      <div className="card" style={{ padding: '2rem', borderColor: 'var(--danger-border)', backgroundColor: 'var(--danger-light)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <AlertTriangle size={20} color="var(--danger)" />
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--danger-text)' }}>
            Danger Zone
          </h2>
        </div>

        <p style={{ fontSize: '0.875rem', color: 'var(--danger-text)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
          Deactivating your account immediately invalidates active sessions and suspends your profile. Your owned projects and historical contributions will be preserved.
        </p>

        <button
          onClick={() => setDeactivateModalOpen(true)}
          className="btn btn-danger"
        >
          Deactivate Account
        </button>
      </div>

      {/* Confirm Deactivation */}
      <ConfirmDialog
        isOpen={deactivateModalOpen}
        onClose={() => setDeactivateModalOpen(false)}
        onConfirm={handleDeactivateAccount}
        title="Deactivate Account"
        message="Are you sure you want to deactivate your DevCollab account? You will be signed out immediately."
        confirmText="Deactivate"
        danger
        loading={deactivating}
      />
    </div>
  );
}
