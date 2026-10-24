import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, ArrowRight, AlertCircle, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Logo from '../components/Logo.jsx';

export default function Login() {
  const [emailOrUsername, setEmailOrUsername] = useState(() => {
    return localStorage.getItem('devcollab_remember_login') || '';
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('devcollab_remember_me') !== 'false';
  });
  const [savedAccounts, setSavedAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    try {
      const raw = localStorage.getItem('devcollab_saved_accounts');
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          setSavedAccounts(list);
          if (!localStorage.getItem('devcollab_remember_login') && list.length > 0) {
            setEmailOrUsername(list[0].email || list[0].username);
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const handleSelectAccount = (account) => {
    const identifier = account.email || account.username;
    setEmailOrUsername(identifier);
    setErrorMessage('');
  };

  const handleClearSaved = (e) => {
    e.preventDefault();
    setEmailOrUsername('');
    localStorage.removeItem('devcollab_remember_login');
    localStorage.removeItem('devcollab_saved_accounts');
    setSavedAccounts([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const identifier = emailOrUsername.trim();
    if (!identifier || !password) {
      setErrorMessage('Please fill in both email/username and password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    if (rememberMe) {
      localStorage.setItem('devcollab_remember_login', identifier);
      localStorage.setItem('devcollab_remember_me', 'true');

      try {
        const raw = localStorage.getItem('devcollab_saved_accounts');
        const list = raw ? JSON.parse(raw) : [];
        const isEmail = identifier.includes('@');
        const filtered = list.filter(
          (a) =>
            a.username?.toLowerCase() !== identifier.toLowerCase() &&
            a.email?.toLowerCase() !== identifier.toLowerCase()
        );
        filtered.unshift({
          username: isEmail ? identifier.split('@')[0] : identifier,
          email: isEmail ? identifier : null,
          displayName: identifier,
          savedAt: new Date().toISOString()
        });
        localStorage.setItem('devcollab_saved_accounts', JSON.stringify(filtered.slice(0, 5)));
        setSavedAccounts(filtered.slice(0, 5));
      } catch (err) {
        // ignore
      }
    } else {
      localStorage.removeItem('devcollab_remember_login');
      localStorage.setItem('devcollab_remember_me', 'false');
    }

    const res = await login(identifier, password, rememberMe);
    setLoading(false);

    if (res.success) {
      navigate(from, { replace: true });
    } else {
      setErrorMessage(res.error?.message || 'Invalid email/username or password. Please try again.');
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 140px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      backgroundColor: 'var(--bg-main)'
    }}>
      <div style={{ maxWidth: '440px', width: '100%' }}>
        <div className="card" style={{
          padding: '1.75rem 2rem',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-md)',
          borderRadius: '12px'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <Link to="/" style={{ display: 'inline-flex', marginBottom: '0.65rem' }}>
              <Logo size={40} />
            </Link>
            <h1 style={{
              fontSize: '1.45rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              letterSpacing: '-0.02em',
              marginBottom: '0.2rem'
            }}>
              Sign in to DevCollab
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Enter your credentials to access your account
            </p>
          </div>

          {/* Saved Account Bar */}
          {savedAccounts.length > 0 && (
            <div style={{
              marginBottom: '1rem',
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.78rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden' }}>
                <UserCheck size={15} color="var(--primary)" style={{ flexShrink: 0 }} />
                <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Saved: <strong style={{ color: 'var(--text-main)' }}>{savedAccounts[0].displayName || savedAccounts[0].username}</strong>
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                {savedAccounts.length > 1 ? (
                  savedAccounts.slice(0, 3).map((acc, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectAccount(acc)}
                      className={`badge ${emailOrUsername === (acc.email || acc.username) ? 'badge-primary' : 'badge-neutral'}`}
                      style={{ cursor: 'pointer', fontSize: '0.72rem', padding: '0.12rem 0.4rem' }}
                      title={`Switch to ${acc.username}`}
                    >
                      @{acc.username}
                    </button>
                  ))
                ) : (
                  <button
                    type="button"
                    onClick={handleClearSaved}
                    style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textDecoration: 'underline', cursor: 'pointer' }}
                    title="Clear saved login"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Error Alert Box */}
          {errorMessage && (
            <div style={{
              backgroundColor: 'var(--danger-light)',
              color: 'var(--danger-text)',
              border: '1px solid var(--danger-border)',
              padding: '0.6rem 0.85rem',
              borderRadius: '6px',
              fontSize: '0.8125rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.45rem'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} method="POST" action="#" autoComplete="on">
            {/* Email or Username */}
            <div style={{ marginBottom: '0.85rem' }}>
              <label htmlFor="username" className="form-label" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-main)' }}>
                Email or Username <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <User
                  size={16}
                  color="var(--text-muted)"
                  style={{
                    position: 'absolute',
                    left: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none'
                  }}
                />
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  className="form-input"
                  placeholder="name@example.com or username"
                  required
                  style={{
                    paddingLeft: '2.5rem',
                    height: '40px',
                    fontSize: '0.875rem',
                    borderRadius: '8px',
                    width: '100%'
                  }}
                />
              </div>
            </div>

            {/* Password with Show/Hide Toggle */}
            <div style={{ marginBottom: '0.85rem' }}>
              <label htmlFor="password" className="form-label" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-main)' }}>
                Password <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  color="var(--text-muted)"
                  style={{
                    position: 'absolute',
                    left: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none'
                  }}
                />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  placeholder="••••••••"
                  required
                  style={{
                    paddingLeft: '2.5rem',
                    paddingRight: '2.5rem',
                    height: '40px',
                    fontSize: '0.875rem',
                    borderRadius: '8px',
                    width: '100%'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0.65rem 0 1.15rem' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                userSelect: 'none'
              }}>
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{
                    accentColor: 'var(--primary)',
                    width: '15px',
                    height: '15px',
                    cursor: 'pointer',
                    borderRadius: '4px'
                  }}
                />
                <span>Remember me on this device</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                height: '42px',
                fontSize: '0.9rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                borderRadius: '8px'
              }}
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div style={{
            textAlign: 'center',
            marginTop: '1.25rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-light)',
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)'
          }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ fontWeight: 600, color: 'var(--primary)' }}>
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
