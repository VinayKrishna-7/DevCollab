import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';

// Layouts & Guards
import PublicLayout from './components/PublicLayout.jsx';
import AppLayout from './components/AppLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import WorkspaceLayout from './pages/workspace/WorkspaceLayout.jsx';

// Public Pages
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ExploreProjects from './pages/ExploreProjects.jsx';
import ExploreDevelopers from './pages/ExploreDevelopers.jsx';
import ProjectDetails from './pages/ProjectDetails.jsx';
import DeveloperProfile from './pages/DeveloperProfile.jsx';

// Authenticated Pages
import Dashboard from './pages/Dashboard.jsx';
import ProfileEdit from './pages/ProfileEdit.jsx';
import MyProjects from './pages/MyProjects.jsx';
import MyApplications from './pages/MyApplications.jsx';
import MyBookmarks from './pages/MyBookmarks.jsx';
import MyTasks from './pages/MyTasks.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import CreateProject from './pages/CreateProject.jsx';
import EditProject from './pages/EditProject.jsx';
import ProjectApplications from './pages/ProjectApplications.jsx';

// Workspace Child Pages
import WorkspaceOverview from './pages/workspace/WorkspaceOverview.jsx';
import WorkspaceTasks from './pages/workspace/WorkspaceTasks.jsx';
import WorkspaceTeam from './pages/workspace/WorkspaceTeam.jsx';
import WorkspaceMilestones from './pages/workspace/WorkspaceMilestones.jsx';
import WorkspaceDiscussions from './pages/workspace/WorkspaceDiscussions.jsx';
import WorkspaceActivity from './pages/workspace/WorkspaceActivity.jsx';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminReports from './pages/admin/AdminReports.jsx';
import AdminSkills from './pages/admin/AdminSkills.jsx';
import AdminAuditLogs from './pages/admin/AdminAuditLogs.jsx';

// Fallback Pages
import NotFound from './pages/NotFound.jsx';
import Forbidden from './pages/Forbidden.jsx';

function SelfProfileRedirect() {
  const { user } = useAuth();
  if (user) {
    return <Navigate to={`/developers/${user.username}`} replace />;
  }
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/explore/projects" element={<ExploreProjects />} />
        <Route path="/explore/developers" element={<ExploreDevelopers />} />
        <Route path="/projects/:slug" element={<ProjectDetails />} />
        <Route path="/developers/:username" element={<DeveloperProfile />} />
        <Route path="/forbidden" element={<Forbidden />} />
      </Route>

      {/* Authenticated Application Pages */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<SelfProfileRedirect />} />
        <Route path="/profile/edit" element={<ProfileEdit />} />
        <Route path="/my/projects" element={<MyProjects />} />
        <Route path="/my/applications" element={<MyApplications />} />
        <Route path="/my/bookmarks" element={<MyBookmarks />} />
        <Route path="/my/tasks" element={<MyTasks />} />
        <Route path="/settings" element={<SettingsPage />} />

        {/* Project Owner Management */}
        <Route path="/projects/new" element={<CreateProject />} />
        <Route path="/projects/:id/edit" element={<EditProject />} />
        <Route path="/projects/:id/applications" element={<ProjectApplications />} />

        {/* Project Workspace Routes */}
        <Route path="/projects/:slug/workspace" element={<WorkspaceLayout />}>
          <Route index element={<WorkspaceOverview />} />
          <Route path="tasks" element={<WorkspaceTasks />} />
          <Route path="team" element={<WorkspaceTeam />} />
          <Route path="milestones" element={<WorkspaceMilestones />} />
          <Route path="discussions" element={<WorkspaceDiscussions />} />
          <Route path="activity" element={<WorkspaceActivity />} />
        </Route>

        {/* Admin Section (Protected by adminOnly flag) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute adminOnly>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute adminOnly>
              <AdminReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/skills"
          element={
            <ProtectedRoute adminOnly>
              <AdminSkills />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/audit-logs"
          element={
            <ProtectedRoute adminOnly>
              <AdminAuditLogs />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
