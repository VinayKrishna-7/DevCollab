import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Logo from '../components/Logo.jsx';

export default function Register() {
  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (fieldErrors[e.target.name]) {
      setFieldErrors((prev) => ({ ...prev, [e.target.name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setFieldErrors({});

    const res = await register(formData);
    setLoading(false);

    if (res.success) {
      // Remember login immediately upon account creation
      const identifier = formData.email.trim() || formData.username.trim();
      localStorage.setItem('devcollab_remember_login', identifier);
      localStorage.setItem('devcollab_remember_me', 'true');

      // Add to saved accounts list for instant one-click switching/login
      try {
        const raw = localStorage.getItem('devcollab_saved_accounts');
        const list = raw ? JSON.parse(raw) : [];
        const filtered = list.filter(
          (a) =>
            a.username?.toLowerCase() !== formData.username.trim().toLowerCase() &&
            a.email?.toLowerCase() !== formData.email.trim().toLowerCase()
        );
        filtered.unshift({
          username: formData.username.trim(),
          email: formData.email.trim(),
          displayName: formData.displayName.trim() || formData.username.trim(),
          savedAt: new Date().toISOString()
        });
        localStorage.setItem('devcollab_saved_accounts', JSON.stringify(filtered.slice(0, 5)));
      } catch (err) {
        // ignore
      }

      navigate('/dashboard', { replace: true });
    } else {
      setErrorMessage(res.error?.message || 'Registration failed');
      if (res.error?.details) {
        const errorMap = {};
        for (const detail of res.error.details) {
          errorMap[detail.field] = detail.message;
        }
        setFieldErrors(errorMap);
      }
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
      <div style={{ maxWidth: '520px', width: '100%' }}>
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
              Join DevCollab
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Create an account to build projects and collaborate with developers
            </p>
          </div>

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

          {/* Registration Form */}
          <form onSubmit={handleSubmit} method="POST" action="#" autoComplete="on">
            {/* 2-column row: Full Name & Username */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.85rem',
              marginBottom: '0.85rem'
            }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="displayName" className="form-label" style={{ fontSize: '0.8125rem', marginBottom: '0.25rem' }}>
                  Full Name
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
                    id="displayName"
                    name="displayName"
                    type="text"
                    autoComplete="name"
                    value={formData.displayName}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Alex Rivera"
                    style={{ paddingLeft: '2.5rem', height: '40px', fontSize: '0.875rem', borderRadius: '8px' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="username" className="form-label" style={{ fontSize: '0.8125rem', marginBottom: '0.25rem' }}>
                  Username <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    pointerEvents: 'none'
                  }}>
                    @
                  </span>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="username"
                    required
                    style={{ paddingLeft: '2.25rem', height: '40px', fontSize: '0.875rem', borderRadius: '8px' }}
                  />
                </div>
                {fieldErrors.username && (
                  <span className="form-error" style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
                    {fieldErrors.username}
                  </span>
                )}
              </div>
            </div>

            {/* Email Address */}
            <div className="form-group" style={{ marginBottom: '0.85rem' }}>
              <label htmlFor="email" className="form-label" style={{ fontSize: '0.8125rem', marginBottom: '0.25rem' }}>
                Email Address <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
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
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="alex@example.com"
                  required
                  style={{ paddingLeft: '2.5rem', height: '40px', fontSize: '0.875rem', borderRadius: '8px' }}
                />
              </div>
              {fieldErrors.email && (
                <span className="form-error" style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
                  {fieldErrors.email}
                </span>
              )}
            </div>

            {/* Password */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="password" className="form-label" style={{ fontSize: '0.8125rem', marginBottom: '0.25rem' }}>
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
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="At least 8 characters"
                  required
                  style={{
                    paddingLeft: '2.5rem',
                    paddingRight: '2.5rem',
                    height: '40px',
                    fontSize: '0.875rem',
                    borderRadius: '8px'
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
              {fieldErrors.password && (
                <span className="form-error" style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
                  {fieldErrors.password}
                </span>
              )}
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
                <span>Creating account...</span>
              ) : (
                <>
                  <span>Create Account</span>
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
            Already have an account?{' '}
            <Link to="/login" style={{ fontWeight: 600, color: 'var(--primary)' }}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
