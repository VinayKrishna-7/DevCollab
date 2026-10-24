import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Compass, Users, PlusCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Logo from '../components/Logo.jsx';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      navigate(`/explore/projects?search=${encodeURIComponent(query)}`);
    } else {
      navigate('/explore/projects');
    }
  };

  const handleTagClick = (tag) => {
    navigate(`/explore/projects?search=${encodeURIComponent(tag)}`);
  };

  const popularTags = ['React', 'TypeScript', 'Node.js', 'Python', 'AI / ML', 'PostgreSQL', 'Open Source'];

  return (
    <div style={{
      minHeight: 'calc(100vh - 140px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 1.5rem',
      backgroundColor: 'var(--bg-main)'
    }}>
      <div style={{
        maxWidth: '820px',
        width: '100%',
        textAlign: 'center',
        margin: '0 auto'
      }}>
        {/* DevCollab Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.75rem' }}>
          <Logo size={60} />
        </div>

        {/* Title & Introduction Tagline */}
        <h1 style={{
          fontSize: 'clamp(2.75rem, 5.5vw, 3.6rem)',
          fontWeight: 800,
          color: 'var(--text-main)',
          lineHeight: 1.15,
          letterSpacing: '-0.035em',
          marginBottom: '1.25rem'
        }}>
          Find developers. Build software together.
        </h1>

        <p style={{
          fontSize: 'clamp(1.15rem, 2.2vw, 1.35rem)',
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
          maxWidth: '660px',
          margin: '0 auto 2.75rem'
        }}>
          DevCollab connects engineers to discover projects, assemble teams, and build real-world software.
        </p>

        {/* Minimal Search Bar */}
        <form onSubmit={handleSearch} style={{
          maxWidth: '580px',
          margin: '0 auto 1.75rem',
          display: 'flex',
          gap: '0.5rem'
        }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={20}
              color="var(--text-muted)"
              style={{
                position: 'absolute',
                left: '1.15rem',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none'
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects by title, skill, or topic..."
              className="form-input"
              style={{
                paddingLeft: '3rem',
                height: '52px',
                fontSize: '1rem',
                borderRadius: '8px',
                width: '100%'
              }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ height: '52px', padding: '0 1.75rem', fontSize: '1rem', fontWeight: 600 }}>
            Search
          </button>
        </form>

        {/* Direct Action Links */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.85rem',
          flexWrap: 'wrap',
          marginBottom: '2.25rem'
        }}>
          <Link
            to="/explore/projects"
            className="btn btn-secondary btn-lg"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Compass size={18} /> Explore Projects
          </Link>
          <Link
            to="/explore/developers"
            className="btn btn-secondary btn-lg"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Users size={18} /> Browse Developers
          </Link>
          {isAuthenticated && (
            <Link
              to="/projects/new"
              className="btn btn-primary btn-lg"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <PlusCircle size={18} /> Post a Project
            </Link>
          )}
        </div>

        {/* Popular Tags */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap',
          fontSize: '0.875rem',
          color: 'var(--text-muted)'
        }}>
          <span style={{ marginRight: '0.25rem', fontWeight: 500 }}>Popular:</span>
          {popularTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleTagClick(tag)}
              className="badge badge-neutral"
              style={{
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                padding: '0.3rem 0.65rem',
                border: '1px solid var(--border-light)',
                background: 'var(--bg-subtle)'
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
