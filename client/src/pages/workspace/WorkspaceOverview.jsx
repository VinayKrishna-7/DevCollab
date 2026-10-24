import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { CheckSquare, Users, Flag, Activity, ArrowRight, Clock, Plus } from 'lucide-react';
import api from '../../api/client.js';
import UserAvatar from '../../components/UserAvatar.jsx';
import SkeletonLoader from '../../components/SkeletonLoader.jsx';

export default function WorkspaceOverview() {
  const { project, isOwner } = useOutletContext();
  const [tasks, setTasks] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOverview() {
      try {
        const [taskRes, msRes, actRes] = await Promise.all([
          api.get(`/tasks/projects/${project.id}`),
          api.get(`/milestones/projects/${project.id}`),
          api.get(`/activity/projects/${project.id}?limit=6`)
        ]);
        setTasks(taskRes.data || []);
        setMilestones(msRes.data || []);
        setActivities(actRes.data || []);
      } catch (err) {
        // handled
      } finally {
        setLoading(false);
      }
    }
    loadOverview();
  }, [project.id]);

  if (loading) return <SkeletonLoader count={4} height="100px" />;

  const doneTasks = tasks.filter(t => t.status === 'DONE').length;
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const totalTasks = tasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const upcomingMilestone = milestones.find(m => m.status !== 'COMPLETED' && m.status !== 'CANCELLED');

  return (
    <div>
      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.5rem' }}>
            Task Progress
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)' }}>{progressPercent}%</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>({doneTasks}/{totalTasks} tasks)</span>
          </div>
          <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-muted)', borderRadius: '9999px', overflow: 'hidden' }}>
            <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: 'var(--success)' }} />
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.5rem' }}>
            In Progress Tasks
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary)' }}>{inProgressTasks}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Active team focus</div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.5rem' }}>
            Team Roster
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {project.members?.length || 1} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ {project.desiredTeamSize}</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {project.members?.length >= project.desiredTeamSize ? 'Full capacity' : 'Open positions'}
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.5rem' }}>
            Next Milestone
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {upcomingMilestone ? upcomingMilestone.title : 'All Milestones Complete'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {upcomingMilestone?.dueDate ? `Due ${new Date(upcomingMilestone.dueDate).toLocaleDateString()}` : 'No date set'}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Left Column: Recent Activity Feed */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)' }}>
              <Activity size={18} color="var(--primary)" />
              <span>Recent Team Activity</span>
            </div>
            <Link to={`/projects/${project.slug}/workspace/activity`} style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
              Full audit feed &rarr;
            </Link>
          </div>

          {activities.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem 0' }}>
              No recent activity recorded.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {activities.map((act) => (
                <div key={act.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.875rem' }}>
                  <UserAvatar user={act.actor} size="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div>
                      <strong style={{ color: 'var(--text-main)' }}>{act.actor?.profile?.displayName || act.actor?.username || 'System'}</strong>{' '}
                      <span style={{ color: 'var(--text-secondary)' }}>{act.action.replace(/_/g, ' ').toLowerCase()}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      {new Date(act.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Quick Team Summary */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Team Members</h3>
            <Link to={`/projects/${project.slug}/workspace/team`} style={{ fontSize: '0.8125rem' }}>
              View Roster
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {(project.members || []).map((m) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <UserAvatar user={m.user} size="sm" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {m.user.profile?.displayName || m.user.username}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: m.role === 'OWNER' ? 'var(--primary)' : 'var(--text-muted)' }}>
                    {m.role === 'OWNER' ? 'Project Owner' : 'Member'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)' }}>
            <Link to={`/projects/${project.slug}/workspace/tasks`} className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
              Manage Tasks & Board
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
