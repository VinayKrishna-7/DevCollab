import React, { useState, useEffect } from 'react';
import { Bookmark, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import ProjectCard from '../components/ProjectCard.jsx';
import SkeletonLoader from '../components/SkeletonLoader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function MyBookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    async function loadBookmarks() {
      setLoading(true);
      try {
        const res = await api.get('/projects/me/bookmarks');
        setBookmarks(res.data || []);
      } catch (err) {
        toast.error('Failed to load bookmarks');
      } finally {
        setLoading(false);
      }
    }
    loadBookmarks();
  }, [toast]);

  const handleBookmarkToggle = async (projectId) => {
    try {
      await api.delete(`/projects/${projectId}/bookmark`);
      setBookmarks(prev => prev.filter(p => p.id !== projectId));
      toast.info('Bookmark removed');
    } catch (err) {
      toast.error('Failed to remove bookmark');
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
          Saved Bookmarks ({bookmarks.length})
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Quick access to the software projects you have bookmarked.
        </p>
      </div>

      {loading ? (
        <SkeletonLoader count={3} height="200px" className="grid-cols-3" />
      ) : bookmarks.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No bookmarked projects"
          message="Save interesting software ideas to keep an eye on recruitment updates."
          action={
            <Link to="/explore/projects" className="btn btn-primary">
              <Compass size={16} /> Explore Projects
            </Link>
          }
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {bookmarks.map((p) => (
            <ProjectCard
              key={p.id}
              project={{ ...p, isBookmarked: true }}
              onBookmarkToggle={handleBookmarkToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
