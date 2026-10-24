import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client.js';
import ProjectCard from '../components/ProjectCard.jsx';
import SearchInput from '../components/SearchInput.jsx';
import FilterPanel from '../components/FilterPanel.jsx';
import Pagination from '../components/Pagination.jsx';
import SkeletonLoader from '../components/SkeletonLoader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Compass } from 'lucide-react';

const CATEGORIES = [
  { value: 'WEB_DEVELOPMENT', label: 'Web Development' },
  { value: 'MOBILE_DEVELOPMENT', label: 'Mobile Development' },
  { value: 'AI_ML', label: 'AI & Machine Learning' },
  { value: 'DATA_SCIENCE', label: 'Data Science' },
  { value: 'DEVTOOLS', label: 'Developer Tools' },
  { value: 'GAME_DEVELOPMENT', label: 'Game Development' },
  { value: 'CYBERSECURITY', label: 'Cybersecurity' },
  { value: 'OPEN_SOURCE', label: 'Open Source' }
];

const STATUSES = [
  { value: 'RECRUITING', label: 'Recruiting' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' }
];

const EXPERIENCE_LEVELS = [
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
  { value: 'EXPERT', label: 'Expert' }
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'updated', label: 'Recently Updated' },
  { value: 'team-size', label: 'Largest Team Size' }
];

export default function ExploreProjects() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Sync state with URL params
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const recruitmentStatus = searchParams.get('status') || '';
  const experiencePreference = searchParams.get('experience') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      if (recruitmentStatus) params.set('recruitmentStatus', recruitmentStatus);
      if (experiencePreference) params.set('experiencePreference', experiencePreference);
      if (sort) params.set('sort', sort);
      params.set('page', page);
      params.set('limit', 12);

      const res = await api.get(`/projects?${params.toString()}`);
      setProjects(res.data || []);
      if (res.meta?.pagination) {
        setPagination(res.meta.pagination);
      }
    } catch (err) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [search, category, recruitmentStatus, experiencePreference, sort, page, toast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const updateParam = (key, val) => {
    const next = new URLSearchParams(searchParams);
    if (val) {
      next.set(key, val);
    } else {
      next.delete(key);
    }
    next.set('page', '1'); // reset page on filter change
    setSearchParams(next);
  };

  const handlePageChange = (newPage) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', newPage.toString());
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const handleBookmarkToggle = async (projectId) => {
    if (!isAuthenticated) {
      toast.info('Please sign in to bookmark projects');
      return;
    }

    try {
      const res = await api.post(`/projects/${projectId}/bookmark`);
      const isNowBookmarked = res.data?.bookmarked;

      setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
          return { ...p, isBookmarked: isNowBookmarked };
        }
        return p;
      }));

      toast.success(isNowBookmarked ? 'Project bookmarked' : 'Bookmark removed');
    } catch (err) {
      toast.error('Could not update bookmark');
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
          Explore Software Projects
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
          Discover collaborative software projects, review required skill sets, and join passionate teams.
        </p>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '1.25rem' }}>
        <SearchInput
          value={search}
          onChange={(val) => updateParam('search', val)}
          onClear={() => updateParam('search', '')}
          placeholder="Search projects by title, summary, description, or technology (e.g. React, Python, Go)..."
        />
      </div>

      {/* Filter Panel */}
      <FilterPanel
        filters={{ category, recruitmentStatus, experienceLevel: experiencePreference, sort }}
        onFilterChange={(key, val) => {
          if (key === 'recruitmentStatus') updateParam('status', val);
          else if (key === 'experienceLevel') updateParam('experience', val);
          else updateParam(key, val);
        }}
        onReset={handleResetFilters}
        options={{
          categories: CATEGORIES,
          statuses: STATUSES,
          experienceLevels: EXPERIENCE_LEVELS,
          sortOptions: SORT_OPTIONS
        }}
      />

      {/* Results Grid */}
      {loading ? (
        <SkeletonLoader count={6} height="220px" className="grid-cols-3" />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="No projects found"
          message="No projects match your current search and filter criteria. Try broadening your filters."
          action={
            <button onClick={handleResetFilters} className="btn btn-secondary">
              Reset All Filters
            </button>
          }
        />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
            {projects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onBookmarkToggle={handleBookmarkToggle}
              />
            ))}
          </div>

          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            totalItems={pagination.total}
          />
        </>
      )}
    </div>
  );
}
