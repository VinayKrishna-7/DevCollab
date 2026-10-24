import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  Users,
  FolderGit2,
  FileCheck2,
  Bookmark,
  CheckSquare,
  Settings,
  ShieldAlert,
  Sliders,
  PlusCircle,
  BarChart3,
  ListOrdered
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Logo from './Logo.jsx';

export default function Sidebar() {
  const { isAdmin } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <NavLink to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <Logo size={28} showText={true} textStyle={{ color: '#ffffff', fontSize: '1.125rem' }} />
        </NavLink>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-title">Menu</div>
        <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/explore/projects" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Compass size={18} />
          <span>Explore Projects</span>
        </NavLink>

        <NavLink to="/explore/developers" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Users size={18} />
          <span>Developers</span>
        </NavLink>

        <div className="sidebar-section-title">My Workspace</div>
        <NavLink to="/projects/new" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} style={{ color: '#38bdf8' }}>
          <PlusCircle size={18} />
          <span>New Project</span>
        </NavLink>

        <NavLink to="/my/projects" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <FolderGit2 size={18} />
          <span>My Projects</span>
        </NavLink>

        <NavLink to="/my/applications" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <FileCheck2 size={18} />
          <span>My Applications</span>
        </NavLink>

        <NavLink to="/my/tasks" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <CheckSquare size={18} />
          <span>Assigned Tasks</span>
        </NavLink>

        <NavLink to="/my/bookmarks" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Bookmark size={18} />
          <span>Bookmarks</span>
        </NavLink>

        <NavLink to="/settings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Settings size={18} />
          <span>Settings</span>
        </NavLink>

        {/* Administration Section */}
        {isAdmin && (
          <>
            <div className="sidebar-section-title" style={{ color: '#f59e0b' }}>Administration</div>
            <NavLink to="/admin" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <BarChart3 size={18} />
              <span>Admin Metrics</span>
            </NavLink>
            <NavLink to="/admin/users" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Users size={18} />
              <span>User Control</span>
            </NavLink>
            <NavLink to="/admin/reports" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <ShieldAlert size={18} />
              <span>Moderation Reports</span>
            </NavLink>
            <NavLink to="/admin/skills" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Sliders size={18} />
              <span>Skills Catalog</span>
            </NavLink>
            <NavLink to="/admin/audit-logs" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <ListOrdered size={18} />
              <span>Audit Logs</span>
            </NavLink>
          </>
        )}
      </nav>
    </aside>
  );
}
