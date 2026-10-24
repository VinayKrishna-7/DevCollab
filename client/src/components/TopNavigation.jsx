import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, User, Settings, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import UserAvatar from './UserAvatar.jsx';

export default function TopNavigation() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="top-nav">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          Welcome back, <strong style={{ color: 'var(--text-main)', fontWeight: 700 }}>{user?.profile?.displayName || user?.username}</strong>
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <button
          onClick={toggleTheme}
          className="btn-theme-toggle"
          title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
          {isDark ? <Sun size={19} className="theme-icon-sun" /> : <Moon size={19} className="theme-icon-moon" />}
        </button>

        <Link to="/projects/new" className="btn btn-primary btn-sm">
          <Plus size={16} /> New Project
        </Link>

        {/* User profile dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none' }}
            aria-expanded={dropdownOpen}
          >
            <UserAvatar user={user} size="sm" />
          </button>

          {dropdownOpen && (
            <div
              className="top-nav-dropdown"
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                width: '200px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.25)',
                padding: '0.5rem 0',
                zIndex: 50
              }}
              onClick={() => setDropdownOpen(false)}
            >
              <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>{user?.profile?.displayName || user?.username}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{user?.username}</div>
              </div>

              <Link
                to="/profile"
                className="dropdown-menu-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.55rem 1rem',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)'
                }}
              >
                <User size={15} /> Your Profile
              </Link>

              <Link
                to="/settings"
                className="dropdown-menu-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.55rem 1rem',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)'
                }}
              >
                <Settings size={15} /> Settings
              </Link>

              <div style={{ borderTop: '1px solid var(--border-light)', marginTop: '0.25rem' }}>
                <button
                  onClick={logout}
                  className="dropdown-menu-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    width: '100%',
                    padding: '0.55rem 1rem',
                    fontSize: '0.85rem',
                    color: 'var(--danger)',
                    textAlign: 'left'
                  }}
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
