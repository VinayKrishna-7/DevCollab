import React, { useState, useEffect } from 'react';
import {
  Users,
  FolderGit2,
  CheckSquare,
  FileCheck2,
  ShieldAlert,
  TrendingUp,
  Activity
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import api from '../../api/client.js';
import SkeletonLoader from '../../components/SkeletonLoader.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    async function loadAdminData() {
      setLoading(true);
      try {
        const res = await api.get('/admin/dashboard');
        setData(res.data);
      } catch (err) {
        toast.error('Failed to load admin analytics');
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, [toast]);

  if (loading) return <SkeletonLoader count={4} height="120px" />;
  if (!data) return <div>No admin data available.</div>;

  const { metrics, categoryDistribution } = data;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
          Platform Analytics & Administration
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Real-time metrics computed directly from active platform records.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Total Developers</span>
            <Users size={18} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)' }}>{metrics.totalUsers}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: '0.25rem', fontWeight: 500 }}>
            +{metrics.newUsersPastMonth} in last 30 days
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Total Projects</span>
            <FolderGit2 size={18} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)' }}>{metrics.totalProjects}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {metrics.recruitingProjects} Recruiting &bull; {metrics.inProgressProjects} Active
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Join Requests</span>
            <FileCheck2 size={18} color="var(--warning)" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)' }}>{metrics.totalJoinRequests}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--warning)', marginTop: '0.25rem', fontWeight: 500 }}>
            {metrics.pendingJoinRequests} pending review
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Workspace Tasks</span>
            <CheckSquare size={18} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)' }}>{metrics.totalTasks}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {metrics.completedTasks} completed
          </div>
        </div>
      </div>

      {/* Chart: Projects by Category */}
      <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-main)' }}>
          Projects Distribution by Category
        </h2>

        {categoryDistribution.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No project category data recorded yet.</p>
        ) : (
          <div style={{ width: '100%', height: '320px' }}>
            <ResponsiveContainer>
              <BarChart data={categoryDistribution} margin={{ top: 10, right: 20, left: -10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                <XAxis dataKey="category" angle={-25} textAnchor="end" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-main)' }}
                  labelStyle={{ color: 'var(--text-muted)' }}
                />
                <Bar dataKey="count" name="Projects" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Pending Moderation Notice if any */}
      {metrics.pendingReports > 0 && (
        <div className="card" style={{
          padding: '1.25rem 1.5rem',
          backgroundColor: 'var(--warning-light)',
          borderColor: 'var(--warning-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldAlert size={22} color="var(--warning)" />
            <div>
              <strong style={{ color: 'var(--text-main)' }}>{metrics.pendingReports} Flagged Content Report{metrics.pendingReports > 1 ? 's' : ''}</strong>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Reports awaiting administrative review and resolution.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
