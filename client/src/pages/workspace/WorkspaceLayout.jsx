import React, { useState, useEffect, useCallback } from 'react';
import { useParams, NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Flag,
  MessageSquare,
  Activity,
  ArrowLeft,
  ExternalLink,
  Settings
} from 'lucide-react';
import api from '../../api/client.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';

export default function WorkspaceLayout() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { joinProject, leaveProject } = useSocket();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProject = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/projects/${slug}`);
      setProject(res.data);

      // Join socket room
      if (res.data?.id) {
        joinProject(res.data.id);
      }
    } catch (err) {
      setError(err.message || 'Access denied to project workspace.');
    } finally {
      setLoading(false);
    }
  }, [slug, joinProject]);

  useEffect(() => {
    fetchProject();
    return () => {
      if (project?.id) {
        leaveProject(project.id);
      }
    };
  }, [fetchProject]);

  if (loading) return <LoadingSpinner fullPage text="Loading project workspace..." />;
  if (error || !project) return <ErrorState message={error || 'Could not access workspace.'} onRetry={fetchProject} />;

  const isOwner = user && project.ownerId === user.id;

  return (
    <div>
      {/* Top Workspace Header */}
      <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link to={`/projects/${project.slug}`} style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}>
              <ArrowLeft size={16} /> Public Page
            </Link>
            <span style={{ color: 'var(--border-light)' }}>/</span>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              {project.title}
            </h1>
            <StatusBadge status={project.recruitmentStatus} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {isOwner && (
              <Link to={`/projects/${project.id}/edit`} className="btn btn-secondary btn-sm">
                <Settings size={14} /> Project Settings
              </Link>
            )}
            {isOwner && (
              <Link to={`/projects/${project.id}/applications`} className="btn btn-secondary btn-sm">
                Join Requests ({project._count?.joinRequests || 0})
              </Link>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingTop: '0.5rem' }}>
          <NavLink
            to={`/projects/${project.slug}/workspace`}
            end
            className={({ isActive }) => `btn btn-sm ${isActive ? 'btn-primary' : 'btn-ghost'}`}
          >
            <LayoutDashboard size={15} /> Overview
          </NavLink>

          <NavLink
            to={`/projects/${project.slug}/workspace/tasks`}
            className={({ isActive }) => `btn btn-sm ${isActive ? 'btn-primary' : 'btn-ghost'}`}
          >
            <CheckSquare size={15} /> Tasks
          </NavLink>

          <NavLink
            to={`/projects/${project.slug}/workspace/team`}
            className={({ isActive }) => `btn btn-sm ${isActive ? 'btn-primary' : 'btn-ghost'}`}
          >
            <Users size={15} /> Team ({project.members?.length || 1})
          </NavLink>

          <NavLink
            to={`/projects/${project.slug}/workspace/milestones`}
            className={({ isActive }) => `btn btn-sm ${isActive ? 'btn-primary' : 'btn-ghost'}`}
          >
            <Flag size={15} /> Milestones
          </NavLink>

          <NavLink
            to={`/projects/${project.slug}/workspace/discussions`}
            className={({ isActive }) => `btn btn-sm ${isActive ? 'btn-primary' : 'btn-ghost'}`}
          >
            <MessageSquare size={15} /> Discussions
          </NavLink>

          <NavLink
            to={`/projects/${project.slug}/workspace/activity`}
            className={({ isActive }) => `btn btn-sm ${isActive ? 'btn-primary' : 'btn-ghost'}`}
          >
            <Activity size={15} /> Activity
          </NavLink>
        </div>
      </div>

      {/* Child tab view outlet */}
      <Outlet context={{ project, isOwner, refreshProject: fetchProject }} />
    </div>
  );
}
