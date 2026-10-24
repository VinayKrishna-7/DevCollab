import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Target,
  FolderGit2,
  FileCheck2,
  CheckSquare,
  Plus,
  ArrowRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import TaskCard from '../components/TaskCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import SkeletonLoader from '../components/SkeletonLoader.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function Dashboard() {
  const { user } = useAuth();

  const [recommendedProjects, setRecommendedProjects] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [ownedProjects, setOwnedProjects] = useState([]);
  const [completionPercentage, setCompletionPercentage] = useState(70);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [recRes, appRes, taskRes, ownedRes, profileRes] = await Promise.all([
          api.get('/recommendations/projects'),
          api.get('/applications/me'),
          api.get('/tasks/me'),
          api.get('/projects/me/owned'),
          api.get('/users/me')
        ]);

        setRecommendedProjects(recRes.data || []);
        setMyApplications(appRes.data?.slice(0, 5) || []);
        setAssignedTasks(taskRes.data?.filter(t => t.status !== 'DONE').slice(0, 5) || []);
        setOwnedProjects(ownedRes.data?.slice(0, 3) || []);
        if (profileRes.data?.completionPercentage !== undefined) {
          setCompletionPercentage(profileRes.data.completionPercentage);
        }
      } catch (err) {
        // Handled gracefully
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      setAssignedTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (err) {
      // ignore
    }
  };

  if (loading) {
    return (
      <div>
        <SkeletonLoader count={4} height="120px" />
      </div>
    );
  }

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Developer Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
            Overview of your active projects, team join requests, and personalized recommendations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/explore/projects" className="btn btn-secondary">
            Browse Projects
          </Link>
          <Link to="/projects/new" className="btn btn-primary">
            <Plus size={16} /> New Project
          </Link>
        </div>
      </div>

      {/* Profile Completion Widget */}
      {completionPercentage < 100 && (
        <div className="card" style={{
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          backgroundColor: 'var(--primary-light)',
          borderColor: 'var(--primary-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
              Profile Completion: {completionPercentage}%
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
              Complete your bio, technical skills, and availability to receive higher-accuracy team recommendations.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '120px', height: '8px', backgroundColor: 'var(--bg-muted)', borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{ width: `${completionPercentage}%`, height: '100%', backgroundColor: 'var(--primary)' }} />
            </div>
            <Link to="/profile/edit" className="btn btn-primary btn-sm">
              Complete Profile
            </Link>
          </div>
        </div>
      )}

      {/* Recommendations Section */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={20} color="var(--primary)" />
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)' }}>Recommended For You</h2>
          </div>
          <Link to="/explore/projects" style={{ fontSize: '0.875rem', fontWeight: 500 }}>
            View all projects &rarr;
          </Link>
        </div>

        {recommendedProjects.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No matching projects right now"
            message="Check back soon as new projects are published, or update your technical skills in your profile."
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
            {recommendedProjects.slice(0, 3).map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </div>

      {/* Grid: My Tasks & Applications */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
        {/* Assigned Tasks */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)' }}>
              <CheckSquare size={18} color="var(--primary)" />
              <span>My Assigned Tasks ({assignedTasks.length})</span>
            </div>
            <Link to="/my/tasks" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
              View all
            </Link>
          </div>

          {assignedTasks.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem 0' }}>
              You have no pending tasks assigned.
            </p>
          ) : (
            <div>
              {assignedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={handleTaskStatusChange}
                />
              ))}
            </div>
          )}
        </div>

        {/* My Applications */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.1rem' }}>
              <FileCheck2 size={18} color="var(--warning)" />
              <span>Active Applications ({myApplications.length})</span>
            </div>
            <Link to="/my/applications" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
              View all
            </Link>
          </div>

          {myApplications.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem 0' }}>
              You haven't submitted any applications yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {myApplications.map((app) => (
                <div
                  key={app.id}
                  style={{
                    padding: '0.85rem',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <Link to={`/projects/${app.project.slug}`} style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      {app.project.title}
                    </Link>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Submitted {new Date(app.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <StatusBadge status={app.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
