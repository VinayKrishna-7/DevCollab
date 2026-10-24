import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import Logo from './Logo.jsx';

export default function PublicLayout() {
  const { isAuthenticated, user } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <div className="public-layout">
      <header className="public-navbar">
        <div className="public-nav-container">
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center' }}>
            <Logo size={32} showText={true} />
          </Link>

          <nav style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <Link to="/explore/projects" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Projects
            </Link>
            <Link to="/explore/developers" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Developers
            </Link>

            <button
              onClick={toggleTheme}
              className="btn-theme-toggle"
              title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              {isDark ? <Sun size={19} className="theme-icon-sun" /> : <Moon size={19} className="theme-icon-moon" />}
            </button>

            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-primary btn-sm">
                Dashboard
              </Link>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Link to="/login" className="btn btn-ghost btn-sm">
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Get Started
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="public-content">
        <Outlet />
      </main>

      <footer className="public-footer">
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            DevCollab &copy; {new Date().getFullYear()} &middot; Developer collaboration & projects
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <Link to="/explore/projects">Projects</Link>
            <Link to="/explore/developers">Developers</Link>
            {isAuthenticated ? (
              <Link to="/dashboard">Dashboard</Link>
            ) : (
              <Link to="/login">Sign In</Link>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
